import sql from 'mssql';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';

let modulePool;

export default async function setupEventReportModule(app, context) {
    const { config, middleware } = context;
    const { isAuthenticated } = middleware;
    // ... (rest of setup) ...



    const __dirname = path.dirname(new URL(import.meta.url).pathname);

    console.log('Loading EventManagement module...');
    const dbConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        port: parseInt(process.env.DB_PORT),
        database: context.moduleConfig.database || 'EventManagement',
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };
    try {
        modulePool = await new sql.ConnectionPool(dbConfig).connect();
        console.log('✓ Connected to EventManagement database');
    } catch (err) {
        console.error('✗ EventManagement DB Connection Failed:', err);
    }
    const checkModuleEnabled = (req, res, next) => {
        if (config.module_event_management_enabled === false) {
            return res.status(403).json({ error: 'Event Management module is disabled for this tenant.' });
        }
        next();
    };
    // 2.5 API: Get User Permissions (Frontend Helper)
    app.get('/api/event-management/permissions', isAuthenticated, checkModuleEnabled, (req, res) => {
        const roleId = req.session.moduleRoles['event-management'] || 4; // Default to Viewer if unknown
        const userId = req.session.username || req.session.userId; // Prefer username as stored in CreatedBy

        res.json({
            roleId: roleId,
            canCreate: roleId === 1 || roleId === 2 || roleId === 3,
            canEditAll: roleId === 1 || roleId === 2,
            canDeleteAll: roleId === 1 || roleId === 2,
            isViewer: roleId === 4,
            currentUser: userId
        });
    });

    // 3. API: List Reports
    app.get('/api/event-management', isAuthenticated, checkModuleEnabled, async (req, res) => {
        if (!modulePool) return res.status(500).json({ error: 'Database not connected' });
        try {
            const result = await modulePool.request().execute('sp_EventReport_List');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching reports:', err);
            res.status(500).json({ error: 'Failed to fetch reports' });
        }
    });

    // 4. API: Get Single Report by ID
    app.get('/api/event-management/:id', isAuthenticated, checkModuleEnabled, async (req, res) => {
        if (!modulePool) return res.status(500).json({ error: 'Database not connected' });
        const { id } = req.params;
        try {
            const result = await modulePool.request()
                .input('Id', sql.Int, id)
                .execute('sp_EventReport_GetFull');

            // Result Sets: 0=Report, 1=Issues, 2=Damaged, 3=Missing, 4=Suggestions
            if (result.recordsets[0].length === 0) return res.status(404).json({ error: 'Report not found' });

            const report = result.recordsets[0][0];
            report.Issues = result.recordsets[1];
            report.DamagedItems = result.recordsets[2];
            report.MissingItems = result.recordsets[3];
            report.Suggestions = result.recordsets[4][0] || {};

            res.json(report);
        } catch (err) {
            console.error('Error fetching report:', err);
            res.status(500).json({ error: 'Failed to fetch report' });
        }
    });

    // 5. API: Save Report (Create - POST)
    app.post('/api/event-management', isAuthenticated, checkModuleEnabled, async (req, res) => {
        const roleId = req.session.moduleRoles['event-management'] || 4;
        if (roleId === 4) return res.status(403).json({ error: 'Viewers cannot create reports.' });

        await handleSaveReport(req, res, modulePool);
    });

    // 6. API: Update Report (Update - PUT)
    app.put('/api/event-management/:id', isAuthenticated, checkModuleEnabled, async (req, res) => {
        const roleId = req.session.moduleRoles['event-management'] || 4;
        if (roleId === 4) return res.status(403).json({ error: 'Viewers cannot update reports.' });

        // Normal Editor (3) check
        if (roleId === 3) {
            // Must fetch report first to check ownership
            try {
                const checkRes = await modulePool.request()
                    .input('Id', sql.Int, req.params.id)
                    .query("SELECT CreatedBy FROM EventReports WHERE Id = @Id"); // Direct query for speed

                if (checkRes.recordset.length === 0) return res.status(404).json({ error: 'Report not found' });

                const reportOwner = checkRes.recordset[0].CreatedBy;
                const currentUser = req.session.username; // Assuming CreatedBy stores username

                if (reportOwner !== currentUser) {
                    return res.status(403).json({ error: 'You can only edit your own reports.' });
                }
            } catch (e) {
                console.error("Permission check error:", e);
                return res.status(500).json({ error: 'Permission check failed' });
            }
        }

        await handleSaveReport(req, res, modulePool, req.params.id);
    });

    // 7. API: Delete Report (DELETE)
    app.delete('/api/event-management/:id', isAuthenticated, checkModuleEnabled, async (req, res) => {
        if (!modulePool) return res.status(500).json({ error: 'Database not connected' });

        const roleId = req.session.moduleRoles['event-management'] || 4;
        if (roleId === 4) return res.status(403).json({ error: 'Viewers cannot delete reports.' });

        const reportId = req.params.id;

        // Normal Editor (3) check
        if (roleId === 3) {
            try {
                const checkRes = await modulePool.request()
                    .input('Id', sql.Int, reportId)
                    .query("SELECT CreatedBy FROM EventReports WHERE Id = @Id");

                if (checkRes.recordset.length === 0) return res.status(404).json({ error: 'Report not found' });

                const reportOwner = checkRes.recordset[0].CreatedBy;
                const currentUser = req.session.username;

                if (reportOwner !== currentUser) {
                    return res.status(403).json({ error: 'You can only delete your own reports.' });
                }
            } catch (e) {
                return res.status(500).json({ error: 'Permission check failed' });
            }
        }

        try {
            await executeWithRetry(modulePool, async (transaction) => {
                const delReq = new sql.Request(transaction);
                delReq.input('Id', sql.Int, reportId);
                await delReq.execute('sp_EventReport_Delete');
            });

            res.json({ success: true, message: 'Report deleted successfully' });

        } catch (err) {
            console.error('Error deleting report:', err);
            res.status(500).json({ error: 'Failed to delete report' });
        }
    });

    // --- DAMAGED ITEMS API (Merged) ---

    // Admin/Super Editor Check Middleware for Damaged Items
    const checkAdminOrSuper = (req, res, next) => {
        // Use 'event-management' role for access control as they are now merged
        const roleId = req.session.moduleRoles['event-management'] || 4;
        if (roleId === 1 || roleId === 2) {
            next();
        } else {
            return res.status(403).json({ error: 'Access Denied. Admins and Super Editors only.' });
        }
    };

    // API: Get Permissions for Damaged Items Page
    app.get('/api/damaged-items/permissions', isAuthenticated, checkModuleEnabled, (req, res) => {
        // Use event-management role
        const roleId = req.session.moduleRoles['event-management'] || 4;
        res.json({
            roleId: roleId,
            canAccess: roleId === 1 || roleId === 2,
            canEdit: roleId === 1 || roleId === 2,
            currentUser: req.session.username
        });
    });

    // API: Export Items to Excel
    app.get('/api/damaged-items/export', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const result = await modulePool.request().execute('sp_DamagedItems_List');
            const items = result.recordset;

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Damaged Items');

            worksheet.columns = [
                { header: 'ID', key: 'Id', width: 10 },
                { header: 'Date', key: 'ReportDate', width: 15 }, // Using the new ReportDate column
                { header: 'Event', key: 'EventName', width: 30 },
                { header: 'Item Code', key: 'ItemCode', width: 20 },
                { header: 'Description', key: 'Description', width: 50 },
                { header: 'Status', key: 'Status', width: 15 },
                { header: 'Reported By', key: 'ReportedBy', width: 20 }
            ];

            // Style headers
            worksheet.getRow(1).font = { bold: true };

            items.forEach(item => {
                worksheet.addRow({
                    Id: item.Id,
                    ReportDate: item.ReportDate, // Helper might format this? Excel handles dates.
                    EventName: item.EventName,
                    ItemCode: item.ItemCode,
                    Description: item.Description,
                    Status: item.Status,
                    ReportedBy: item.ReportedBy
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=DamagedItems_Export.xlsx');

            await workbook.xlsx.write(res);
            res.end();

        } catch (err) {
            console.error('Error exporting damaged items:', err);
            res.status(500).json({ error: 'Failed to export items' });
        }
    });

    // API: List Items
    app.get('/api/damaged-items', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const result = await modulePool.request().execute('sp_DamagedItems_List');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching damaged items:', err);
            res.status(500).json({ error: 'Failed to fetch items' });
        }
    });

    app.post('/api/damaged-items', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const { reportId, itemCode, description, status } = req.body;
            const request = modulePool.request();
            request.input('ReportId', sql.Int, reportId || null);
            request.input('ItemCode', sql.NVarChar(50), itemCode);
            request.input('Description', sql.NVarChar, description);
            request.input('Status', sql.NVarChar(50), status);

            await request.execute('sp_DamagedItems_Add');
            res.json({ success: true });
        } catch (err) {
            console.error('Error adding damaged item:', err);
            res.status(500).json({ error: 'Failed to add item ' + err.message });
        }
    });

    app.put('/api/damaged-items/:id', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const { reportId, itemCode, description, status } = req.body;
            const request = modulePool.request();
            request.input('Id', sql.Int, req.params.id);
            request.input('ReportId', sql.Int, reportId || null);
            request.input('ItemCode', sql.NVarChar(50), itemCode);
            request.input('Description', sql.NVarChar, description);
            request.input('Status', sql.NVarChar(50), status);

            await request.execute('sp_DamagedItems_Update');
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating damaged item:', err);
            res.status(500).json({ error: 'Failed to update item' });
        }
    });

    app.delete('/api/damaged-items/:id', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const request = modulePool.request();
            request.input('Id', sql.Int, req.params.id);
            await request.execute('sp_DamagedItems_Delete');
            res.json({ success: true });
        } catch (err) {
            console.error('Error deleting damaged item:', err);
            res.status(500).json({ error: 'Failed to delete item' });
        }
    });

    // --- MISSING ITEMS API ---

    // API: Export Missing Items
    app.get('/api/missing-items/export', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const result = await modulePool.request().execute('sp_MissingItems_List');
            const items = result.recordset;

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Missing Items');

            worksheet.columns = [
                { header: 'ID', key: 'Id', width: 10 },
                { header: 'Date', key: 'ReportDate', width: 15 },
                { header: 'Event', key: 'EventName', width: 30 },
                { header: 'Item Code', key: 'ItemCode', width: 20 },
                { header: 'Description', key: 'Description', width: 50 },
                { header: 'Status', key: 'Status', width: 15 },
                { header: 'Reported By', key: 'ReportedBy', width: 20 }
            ];
            worksheet.getRow(1).font = { bold: true };

            items.forEach(item => {
                worksheet.addRow({
                    Id: item.Id,
                    ReportDate: item.ReportDate,
                    EventName: item.EventName,
                    ItemCode: item.ItemCode,
                    Description: item.Description,
                    Status: item.Status,
                    ReportedBy: item.ReportedBy
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=MissingItems_Export.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        } catch (err) {
            console.error('Error exporting missing items:', err);
            res.status(500).json({ error: 'Failed to export items' });
        }
    });

    // API: Permissions
    app.get('/api/missing-items/permissions', isAuthenticated, checkModuleEnabled, (req, res) => {
        const roleId = req.session.moduleRoles['event-management'] || 4;
        res.json({
            roleId: roleId,
            canAccess: roleId === 1 || roleId === 2,
            canEdit: roleId === 1 || roleId === 2,
            currentUser: req.session.username
        });
    });

    // API: CRUD
    app.get('/api/missing-items', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const result = await modulePool.request().execute('sp_MissingItems_List');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching missing items:', err);
            res.status(500).json({ error: 'Failed to fetch items' });
        }
    });

    app.post('/api/missing-items', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const { reportId, itemCode, description, status } = req.body;
            const request = modulePool.request();
            request.input('ReportId', sql.Int, reportId || null);
            request.input('ItemCode', sql.NVarChar(50), itemCode);
            request.input('Description', sql.NVarChar, description);
            request.input('Status', sql.NVarChar(50), status);

            await request.execute('sp_MissingItems_Add');
            res.json({ success: true });
        } catch (err) {
            console.error('Error adding missing item:', err);
            res.status(500).json({ error: 'Failed to add item ' + err.message });
        }
    });

    app.put('/api/missing-items/:id', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const { itemCode, description, status } = req.body;
            const request = modulePool.request();
            request.input('Id', sql.Int, req.params.id);
            request.input('ItemCode', sql.NVarChar(50), itemCode);
            request.input('Description', sql.NVarChar, description);
            request.input('Status', sql.NVarChar(50), status);

            await request.execute('sp_MissingItems_Update');
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating missing item:', err);
            res.status(500).json({ error: 'Failed to update item' });
        }
    });

    app.delete('/api/missing-items/:id', isAuthenticated, checkModuleEnabled, checkAdminOrSuper, async (req, res) => {
        try {
            const request = modulePool.request();
            request.input('Id', sql.Int, req.params.id);
            await request.execute('sp_MissingItems_Delete');
            res.json({ success: true });
        } catch (err) {
            console.error('Error deleting missing item:', err);
            res.status(500).json({ error: 'Failed to delete item' });
        }
    });
}

// Helper Function to handle both Create and Update
async function handleSaveReport(req, res, pool, updateId = null) {
    if (!pool) return res.status(500).json({ error: 'Database not connected' });

    const submission = req.body;
    const { section1, section2, section3, section4, section5, section6 } = submission;

    if (!section1) return res.status(400).json({ error: 'Missing General Details (Section 1)' });

    try {
        let finalReportId = updateId;

        await executeWithRetry(pool, async (transaction) => {
            const request = new sql.Request(transaction);

            if (updateId) {
                // UPDATE Logic
                await request
                    .input('Id', sql.Int, updateId)
                    .input('EventName', sql.NVarChar, section1.eventName)
                    .input('Location', sql.NVarChar, section1.location)
                    .input('DateFrom', sql.Date, section1.dateFrom)
                    .input('DateTo', sql.Date, section1.dateTo)
                    .input('ManagerName', sql.NVarChar, section1.manager)
                    .input('Summary', sql.NVarChar, section1.summary)
                    .input('ServicesProvided', sql.NVarChar, section1.servicesProvided)
                    .input('Status', sql.NVarChar, submission.Status || 'Draft')
                    .input('FinalNotes', sql.NVarChar, section6?.notes || null)
                    .execute('sp_EventReport_Update');

                // Clear existing child records
                const delReq = new sql.Request(transaction);
                delReq.input('ReportId', sql.Int, updateId);
                await delReq.execute('sp_EventReport_ClearChildren');

            } else {
                // INSERT Logic
                // FORCE CreatedBy from Session
                const creator = req.session.username || 'Unknown';

                const reportResult = await request
                    .input('EventName', sql.NVarChar, section1.eventName)
                    .input('Location', sql.NVarChar, section1.location)
                    .input('DateFrom', sql.Date, section1.dateFrom)
                    .input('DateTo', sql.Date, section1.dateTo)
                    .input('ManagerName', sql.NVarChar, section1.manager)
                    .input('Summary', sql.NVarChar, section1.summary)
                    .input('ServicesProvided', sql.NVarChar, section1.servicesProvided)
                    .input('Status', sql.NVarChar, submission.Status || 'Draft')
                    .input('FinalNotes', sql.NVarChar, section6?.notes || null)
                    .input('CreatedBy', sql.NVarChar, creator) // Use enforced creator
                    .output('NewId', sql.Int)
                    .execute('sp_EventReport_Create');

                finalReportId = reportResult.output.NewId;
            }

            // --- Reused Child Insert Logic --- (Scoped to transaction)
            const currentReportId = finalReportId;

            // B. Insert Issues
            if (section2 && Array.isArray(section2) && section2.length > 0) {
                for (const issue of section2) {
                    const issueReq = new sql.Request(transaction);
                    await issueReq
                        .input('ReportId', sql.Int, currentReportId)
                        .input('Problem', sql.NVarChar, issue.problem)
                        .input('Impact', sql.NVarChar, issue.impact)
                        .input('Solution', sql.NVarChar, issue.solution || null)
                        .input('PreventiveActions', sql.NVarChar, issue.preventive || null)
                        .input('Notes', sql.NVarChar, issue.notes || null)
                        .execute('sp_EventReport_AddIssue');
                }
            }

            // C. Insert Damaged Items
            if (section3 && Array.isArray(section3) && section3.length > 0) {
                for (const item of section3) {
                    const itemReq = new sql.Request(transaction);
                    await itemReq
                        .input('ReportId', sql.Int, currentReportId)
                        .input('ItemCode', sql.NVarChar, item.code || null)
                        .input('Description', sql.NVarChar, item.description)
                        .input('Status', sql.NVarChar, item.status)
                        .execute('sp_EventReport_AddDamagedItem');
                }
            }

            // D. Insert Missing Items
            if (section4 && Array.isArray(section4) && section4.length > 0) {
                for (const item of section4) {
                    const itemReq = new sql.Request(transaction);
                    await itemReq
                        .input('ReportId', sql.Int, currentReportId)
                        .input('ItemCode', sql.NVarChar, item.code || null)
                        .input('Description', sql.NVarChar, item.description)
                        .input('Status', sql.NVarChar, item.status || 'Missing')
                        .execute('sp_EventReport_AddMissingItem');
                }
            }

            // E. Insert Suggestions
            if (section5) {
                const suggReq = new sql.Request(transaction);
                await suggReq
                    .input('ReportId', sql.Int, currentReportId)
                    .input('Logistics', sql.NVarChar, section5.logistics || null)
                    .input('Operations', sql.NVarChar, section5.operations || null)
                    .input('Communication', sql.NVarChar, section5.communication || null)
                    .input('Materials', sql.NVarChar, section5.materials || null)
                    .input('Software', sql.NVarChar, section5.software || null)
                    .execute('sp_EventReport_AddSuggestion');
            }
        });

        res.json({ success: true, reportId: finalReportId, message: updateId ? 'Report updated successfully' : 'Report submitted successfully' });

    } catch (err) {
        console.error('Error saving report:', err);
        res.status(500).json({ error: 'Failed to save report', details: err.message });
    }
}

// Helper to Retry Transactions on Deadlock (Error 1205)
async function executeWithRetry(pool, operation, maxRetries = 3) {
    let attempts = 0;
    while (attempts < maxRetries) {
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            await operation(transaction);
            await transaction.commit();
            return; // Success
        } catch (err) {
            if (transaction) {
                try { await transaction.rollback(); } catch (e) { /* ignore rollback error */ }
            }

            if (err.number === 1205) { // Deadlock
                attempts++;
                console.warn(`Deadlock detected. Retrying transaction (Attempt ${attempts}/${maxRetries})...`);
                if (attempts === maxRetries) throw err; // Max retries reached
                await new Promise(r => setTimeout(r, 500 * attempts)); // Backoff
            } else {
                throw err; // Other error
            }
        }
    }
}


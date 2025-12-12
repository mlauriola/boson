import sql from 'mssql';
import path from 'path';
import fs from 'fs';

let modulePool;

export default async function setupEventReportModule(app, context) {
    const { config, middleware } = context;
    const { isAuthenticated } = middleware;
    const __dirname = path.dirname(new URL(import.meta.url).pathname);

    console.log('Loading EventReport module...');

    // 1. Setup DEDICATED DB Connection
    const dbConfig = {
        server: process.env.DB_SERVER || 'localhost',
        database: 'EventReport', // Dedicated Database
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT) || 1433,
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        connectionTimeout: 30000
    };

    try {
        modulePool = await new sql.ConnectionPool(dbConfig).connect();
        console.log('✓ Connected to EventReport database');
    } catch (err) {
        console.error('✗ EventReport DB Connection Failed:', err);
    }

    // 2. Middleware: Check Tenant Flag
    const checkModuleEnabled = (req, res, next) => {
        // Verifies if the Tenant has the flag `module_event_report_enabled` active in the Core configuration
        if (config.module_event_report_enabled === false) {
            return res.status(403).json({ error: 'Event Report module is disabled for this tenant.' });
        }
        next();
    };

    // 3. API: List Reports
    app.get('/api/event-reports', isAuthenticated, checkModuleEnabled, async (req, res) => {
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
    app.get('/api/event-reports/:id', isAuthenticated, checkModuleEnabled, async (req, res) => {
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
    app.post('/api/event-reports', isAuthenticated, checkModuleEnabled, async (req, res) => {
        await handleSaveReport(req, res, modulePool);
    });

    // 6. API: Update Report (Update - PUT)
    app.put('/api/event-reports/:id', isAuthenticated, checkModuleEnabled, async (req, res) => {
        await handleSaveReport(req, res, modulePool, req.params.id);
    });

    // 7. API: Delete Report (DELETE)
    app.delete('/api/event-reports/:id', isAuthenticated, checkModuleEnabled, async (req, res) => {
        if (!modulePool) return res.status(500).json({ error: 'Database not connected' });

        const reportId = req.params.id;

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
                    .input('CreatedBy', sql.NVarChar, submission.CreatedBy || 'Unknown')
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


import express from 'express';
import sql from 'mssql';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import XLSX from 'xlsx';
import archiver from 'archiver';
import COLUMN_CONFIG from './column-config.js';
import { generateExcelExport } from './excel-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export default function setupCommonCodesModule(app, context) {
    const { pool, middleware, utils } = context;
    const { isAuthenticated, isAdministrator, isAdministratorOrSuperEditor } = middleware;
    const { readMaintenanceConfig } = utils;

    console.log('Loading Common Codes module...');

    // ============= COMMON CODES API =============

    // ==================== TABLE LIST MANAGEMENT (administrators and super editors) ====================

    // GET /api/tablelist - Get all tables from _TableList (for administration)
    app.get('/api/tablelist', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const result = await pool.request().execute('sp_TableList_GetAll');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error retrieving table list:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // PUT /api/tablelist/:code - Update table configuration
    app.put('/api/tablelist/:code', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const { code } = req.params;
            const { HasToBeManaged, LongDescription } = req.body;

            // Validate HasToBeManaged
            if (HasToBeManaged !== 0 && HasToBeManaged !== 1 && HasToBeManaged !== 2) {
                return res.status(400).json({ error: 'HasToBeManaged must be 0, 1, or 2' });
            }

            // Update using stored procedure
            const result = await pool.request()
                .input('Code', sql.Int, parseInt(code))
                .input('HasToBeManaged', sql.Int, HasToBeManaged)
                .input('LongDescription', sql.NVarChar, LongDescription || null)
                .execute('sp_TableList_Update');

            res.json({
                success: true,
                message: result.recordset[0].message
            });
        } catch (err) {
            console.error('Error updating table configuration:', err);
            res.status(500).json({ error: err.message || 'Server error' });
        }
    });

    // ============= PUBLIC READ-ONLY API (no authentication required) =============

    // Middleware to block /api/commoncodes/* during maintenance or ViewCommonCodes restriction
    app.use('/api/commoncodes/*', (req, res, next) => {
        const config = readMaintenanceConfig();

        // If user is authenticated, always allow (for CommonCodes.html - authenticated page)
        if (req.session && req.session.userId) {
            return next();
        }

        // For non-authenticated users (ViewCommonCodes.html - public page):

        // Block if maintenance mode is active
        if (config.enabled) {
            return res.status(503).json({
                error: 'Service unavailable',
                message: config.message || 'The system is currently under maintenance. We\'ll be back shortly.'
            });
        }

        // Block if ViewCommonCodes restriction is active
        if (config.viewCommonCodesRestricted && config.viewCommonCodesRestricted.enabled) {
            return res.status(503).json({
                error: 'Service unavailable',
                message: config.viewCommonCodesRestricted.message || 'This page is temporarily unavailable to the public.'
            });
        }

        // Allow request to proceed
        next();
    });

    // GET /api/commoncodes/tables - Get list of tables from _TableList (public version)
    app.get('/api/commoncodes/tables', async (req, res) => {
        try {
            const result = await pool.request()
                .execute('sp_GetTableList');

            res.json(result.recordset);
        } catch (err) {
            console.error('Error retrieving tables list:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET /api/commoncodes/data/:spName - Execute GetAll stored procedure (public version)
    app.get('/api/commoncodes/data/:spName', async (req, res) => {
        try {
            const { spName } = req.params;
            const { offset = 0, limit = 100 } = req.query;

            // Validate SP name to prevent SQL injection
            const validPrefixes = ['sp_CC_', 'sp_MP_', 'sp_Organisation_', 'sp_FunctionCategory_', 'sp_Support_'];
            const hasValidPrefix = validPrefixes.some(prefix => spName.startsWith(prefix));
            const validSuffixes = ['_GetAll', '_GetAll_Published', 'GetByTypeIF'];
            const hasValidSuffix = validSuffixes.some(suffix => spName.endsWith(suffix));

            if (!spName || !hasValidPrefix || !hasValidSuffix) {
                return res.status(400).json({ error: 'Invalid stored procedure name' });
            }

            // Check if pagination is requested (offset or limit provided)
            const usePagination = req.query.offset !== undefined || req.query.limit !== undefined;

            if (usePagination) {
                // Execute with pagination using wrapper query
                const offsetValue = parseInt(offset) || 0;
                const limitValue = parseInt(limit) || 100;

                // First get total count
                const countResult = await pool.request()
                    .execute(spName);
                const totalCount = countResult.recordset.length;

                // Then get paginated results
                // Since we can't use CTE with EXEC directly, we need to use a different approach
                // Get all results and slice in memory (for now - can be optimized with stored proc modification later)
                const allResults = countResult.recordset;
                const paginatedResults = allResults.slice(offsetValue, offsetValue + limitValue);

                res.json({
                    data: paginatedResults,
                    totalCount: totalCount,
                    offset: offsetValue,
                    limit: limitValue,
                    hasMore: (offsetValue + limitValue) < totalCount
                });
            } else {
                // Legacy behavior: return all results
                const result = await pool.request()
                    .execute(spName);

                res.json(result.recordset);
            }
        } catch (err) {
            console.error('Error executing stored procedure:', err);
            res.status(500).json({ error: 'Server error', message: err.message });
        }
    });

    // GET /api/commoncodes/genders-by-discipline/:disciplineCode - Get valid genders for a discipline
    app.get('/api/commoncodes/genders-by-discipline/:disciplineCode', isAuthenticated, async (req, res) => {
        try {
            const { disciplineCode } = req.params;

            // Validate discipline code
            if (!disciplineCode) {
                return res.status(400).json({ error: 'Discipline code is required' });
            }

            const result = await pool.request()
                .input('Discipline', sql.NVarChar, disciplineCode)
                .execute('sp_DisciplineGender_GetGendersByDiscipline');

            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching genders by discipline:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET /api/commoncodes/events-by-discipline-gender/:disciplineCode/:genderCode - Get valid events for discipline and gender
    app.get('/api/commoncodes/events-by-discipline-gender/:disciplineCode/:genderCode', isAuthenticated, async (req, res) => {
        try {
            const { disciplineCode, genderCode } = req.params;

            // Validate parameters
            if (!disciplineCode || !genderCode) {
                return res.status(400).json({ error: 'Discipline code and Gender code are required' });
            }

            const result = await pool.request()
                .input('Discipline', sql.NVarChar, disciplineCode)
                .input('Gender', sql.NVarChar, genderCode)
                .execute('sp_Event_GetEventsByDisciplineGender');

            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching events by discipline and gender:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET /api/commoncodes/phases-by-discipline-gender-event/:disciplineCode/:genderCode/:eventCode - Get valid phases for discipline, gender, and event
    app.get('/api/commoncodes/phases-by-discipline-gender-event/:disciplineCode/:genderCode/:eventCode', isAuthenticated, async (req, res) => {
        try {
            const { disciplineCode, genderCode, eventCode } = req.params;

            // Validate parameters
            if (!disciplineCode || !genderCode || !eventCode) {
                return res.status(400).json({ error: 'Discipline code, Gender code, and Event code are required' });
            }

            const result = await pool.request()
                .input('Discipline', sql.NVarChar, disciplineCode)
                .input('Gender', sql.NVarChar, genderCode)
                .input('Event', sql.NVarChar, eventCode)
                .execute('sp_Phase_GetPhasesByDisciplineGenderEvent');

            res.json(result.recordset);
        } catch (err) {
            console.error('Error fetching phases by discipline, gender, and event:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET /api/commoncodes/structure/:tableName - Get table structure with column info and primary keys
    app.get('/api/commoncodes/structure/:tableName', isAuthenticated, async (req, res) => {
        try {
            const { tableName } = req.params;

            // Validate table name to prevent SQL injection
            if (!tableName || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
                return res.status(400).json({ error: 'Invalid table name' });
            }

            // Get column information including primary keys
            const result = await pool.request()
                .input('tableName', sql.NVarChar, tableName)
                .execute('sp_GetTableStructure');

            res.json({ columns: result.recordset });
        } catch (err) {
            console.error('Error retrieving table structure:', err);
            res.status(500).json({ error: 'Server error', message: err.message });
        }
    });

    // POST /api/commoncodes/create - Execute Create stored procedure
    app.post('/api/commoncodes/create', isAuthenticated, async (req, res) => {
        try {
            const { spName, data } = req.body;

            // Validate SP name
            if (!spName || !spName.startsWith('sp_CC_') || !spName.endsWith('_Create')) {
                return res.status(400).json({ error: 'Invalid stored procedure name' });
            }

            // Extract table name from SP name (sp_CC_TableName_Create -> TableName)
            const tableName = spName.replace('sp_CC_', '').replace('_Create', '');

            // Clean user input (remove system-managed columns)
            const cleanedData = COLUMN_CONFIG.cleanUserInput(data, tableName);

            // Populate auto-filled columns (UserId, ODF_Incoming, etc.) - use 'create' operation
            const populatedData = COLUMN_CONFIG.populateAutoFields(cleanedData, req.session, tableName, 'create');

            const request = pool.request();

            // Add parameters dynamically
            Object.keys(populatedData).forEach(key => {
                // UserId is INT, CheckOraLegale is BIT, other fields are NVarChar
                if (key === 'UserId') {
                    request.input(key, sql.Int, populatedData[key]);
                } else if (key === 'CheckOraLegale') {
                    request.input(key, sql.Bit, populatedData[key]);
                } else {
                    request.input(key, sql.NVarChar, populatedData[key]);
                }
            });

            const result = await request.execute(spName);

            // Check if there was an error
            if (result.recordset[0] && result.recordset[0].Result === -1) {
                return res.status(400).json({ error: result.recordset[0].ErrorMessage });
            }

            res.status(201).json(result.recordset[0]);
        } catch (err) {
            console.error('Error creating record:', err);

            // Check for primary key violation
            if (err.number === 2627 || err.number === 2601) {
                return res.status(409).json({
                    error: 'A record with this primary key already exists. Please use different values for the primary key fields.'
                });
            }

            res.status(500).json({ error: 'Server error', message: err.message });
        }
    });

    // PUT /api/commoncodes/update - Execute Update stored procedure
    app.put('/api/commoncodes/update', isAuthenticated, async (req, res) => {
        try {
            const { spName, data } = req.body;

            // Validate SP name
            if (!spName || !spName.startsWith('sp_CC_') || !spName.endsWith('_Update')) {
                return res.status(400).json({ error: 'Invalid stored procedure name' });
            }

            // Extract table name from SP name (sp_CC_TableName_Update -> TableName)
            const tableName = spName.replace('sp_CC_', '').replace('_Update', '');

            // Clean user input (remove system-managed columns)
            const cleanedData = COLUMN_CONFIG.cleanUserInput(data, tableName);

            // Populate auto-filled columns (tvdescription, etc.) - use 'update' operation
            const populatedData = COLUMN_CONFIG.populateAutoFields(cleanedData, req.session, tableName, 'update');

            const request = pool.request();

            // Add parameters dynamically
            Object.keys(populatedData).forEach(key => {
                // CheckOraLegale is BIT, other fields are NVarChar
                if (key === 'CheckOraLegale') {
                    request.input(key, sql.Bit, populatedData[key]);
                } else {
                    request.input(key, sql.NVarChar, populatedData[key]);
                }
            });

            const result = await request.execute(spName);

            // Check if there was an error
            if (result.recordset[0] && result.recordset[0].Result === -1) {
                return res.status(404).json({ error: result.recordset[0].ErrorMessage });
            }

            res.json(result.recordset[0]);
        } catch (err) {
            console.error('Error updating record:', err);

            // Check for primary key violation
            if (err.number === 2627 || err.number === 2601) {
                return res.status(409).json({
                    error: 'A record with this primary key already exists. Please use different values for the primary key fields.'
                });
            }

            res.status(500).json({ error: 'Server error', message: err.message });
        }
    });

    // DELETE /api/commoncodes/delete - Execute Delete stored procedure
    app.delete('/api/commoncodes/delete', isAuthenticated, async (req, res) => {
        try {
            const { spName, data } = req.body;

            // Validate SP name
            if (!spName || !spName.startsWith('sp_CC_') || !spName.endsWith('_Delete')) {
                return res.status(400).json({ error: 'Invalid stored procedure name' });
            }

            const request = pool.request();

            // Add parameters dynamically
            Object.keys(data).forEach(key => {
                // CheckOraLegale is BIT, handle as Bit type
                if (key === 'CheckOraLegale') {
                    request.input(key, sql.Bit, data[key]);
                } else {
                    request.input(key, sql.NVarChar, data[key]);
                }
            });

            const result = await request.execute(spName);

            // Check if there was an error
            if (result.recordset[0] && result.recordset[0].Result === -1) {
                return res.status(404).json({ error: result.recordset[0].ErrorMessage });
            }

            res.json(result.recordset[0]);
        } catch (err) {
            console.error('Error deleting record:', err);
            res.status(500).json({ error: 'Server error', message: err.message });
        }
    });

    // GET /api/commoncodes/export/:tableName - Export table data to Excel
    app.get('/api/commoncodes/export/:tableName', isAuthenticated, async (req, res) => {
        try {
            const { tableName } = req.params;

            // Get actual table columns from database (not from SP which may include JOIN columns)
            const columnsRequest = pool.request();
            columnsRequest.input('TableName', sql.NVarChar, tableName);
            const columnsResult = await columnsRequest.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @TableName
        ORDER BY ORDINAL_POSITION
      `);
            const dbColumns = columnsResult.recordset;

            // Filter out only log columns - export all real table columns
            const exportColumns = dbColumns.filter(col => {
                const colName = col.COLUMN_NAME;
                // Exclude only system/log columns
                if (['UserId', 'Data_Ins', 'Data_upd'].includes(colName)) return false;
                return true;
            }).map(col => col.COLUMN_NAME);

            // Get data from the table directly (not from GetAll SP to avoid JOINs)
            const dataRequest = pool.request();
            const query = `SELECT ${exportColumns.map(c => `[${c}]`).join(', ')} FROM [${tableName}] ORDER BY ${exportColumns.slice(0, 3).map(c => `[${c}]`).join(', ')}`;

            const dataResult = await dataRequest.query(query);
            const data = dataResult.recordset;

            // Create Excel workbook
            const worksheet = XLSX.utils.json_to_sheet(data, { header: exportColumns });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

            // Generate buffer
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            // Set headers for download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${tableName}_export_${new Date().toISOString().slice(0, 10)}.xlsx"`);
            res.send(excelBuffer);
        } catch (err) {
            console.error('Error exporting to Excel:', err);
            res.status(500).json({ error: 'Export failed', message: err.message });
        }
    });

    // Helper function to get published version release
    async function getPublishedVersionRelease(pool) {
        const result = await pool.request().query(`
      SELECT TOP 1 Release
      FROM _Version
      WHERE Published = 1
      ORDER BY Code DESC
    `);
        return result.recordset.length > 0 ? result.recordset[0].Release : null;
    }

    // HEAD /api/commoncodes/download-dt-codes - Check if DT_CODES file exists
    app.head('/api/commoncodes/download-dt-codes', async (req, res) => {
        try {
            const versionRelease = await getPublishedVersionRelease(pool);
            if (!versionRelease) {
                return res.status(404).end();
            }

            const exportDir = path.resolve(__dirname, process.env.DT_CODES_EXPORT_DIR || '../Download');
            const zipFileName = `DT_CODESVersion${versionRelease}_Export.zip`;
            const zipFilePath = path.join(exportDir, zipFileName);

            if (fs.existsSync(zipFilePath)) {
                const stat = fs.statSync(zipFilePath);
                res.setHeader('Content-Length', stat.size);
                res.setHeader('Content-Type', 'application/zip');
                res.status(200).end();
            } else {
                res.status(404).end();
            }
        } catch (err) {
            res.status(500).end();
        }
    });

    // GET /api/commoncodes/download-dt-codes - Download DT_CODES ZIP file
    app.get('/api/commoncodes/download-dt-codes', async (req, res) => {
        try {
            const versionRelease = await getPublishedVersionRelease(pool);
            if (!versionRelease) {
                return res.status(404).json({
                    error: 'No published version found. Please publish a version first to generate the export.'
                });
            }

            const exportDir = path.resolve(__dirname, process.env.DT_CODES_EXPORT_DIR || '../Download');
            const zipFileName = `DT_CODESVersion${versionRelease}_Export.zip`;
            const zipFilePath = path.join(exportDir, zipFileName);

            // Check if ZIP file exists
            if (!fs.existsSync(zipFilePath)) {
                return res.status(404).json({
                    error: 'DT_CODES export file not found. Please publish a version first to generate the export.'
                });
            }

            // Get file stats for content-length
            const stat = fs.statSync(zipFilePath);

            // Set headers for download
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

            // Stream the file
            const fileStream = fs.createReadStream(zipFilePath);
            fileStream.pipe(res);

            fileStream.on('error', (err) => {
                console.error('Error streaming file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error downloading file' });
                }
            });

        } catch (err) {
            console.error('Error downloading DT_CODES:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Download failed',
                    message: err.message
                });
            }
        }
    });

    // GET /api/commoncodes/download-excel - Download Excel export file
    app.get('/api/commoncodes/download-excel', async (req, res) => {
        try {
            const versionRelease = await getPublishedVersionRelease(pool);
            if (!versionRelease) {
                return res.status(404).json({
                    error: 'No published version found. Please publish a version first to generate the export.'
                });
            }

            const downloadsDir = path.resolve(__dirname, process.env.EXCEL_EXPORT_DIR || '../Download');
            const excelFileName = `EXCELVersion${versionRelease}_Export.xlsx`;
            const excelFilePath = path.join(downloadsDir, excelFileName);

            // Check if Excel file exists
            if (!fs.existsSync(excelFilePath)) {
                return res.status(404).json({
                    error: 'Excel export file not found. Please publish a version first to generate the export.'
                });
            }

            // Get file stats for content-length
            const stat = fs.statSync(excelFilePath);

            // Set headers for download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Disposition', `attachment; filename="${excelFileName}"`);

            // Stream the file
            const fileStream = fs.createReadStream(excelFilePath);
            fileStream.pipe(res);

            fileStream.on('error', (err) => {
                console.error('Error streaming file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error downloading file' });
                }
            });

        } catch (err) {
            console.error('Error downloading Excel:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Download failed',
                    message: err.message
                });
            }
        }
    });

    // POST /api/commoncodes/import - Import Excel file and sync with database
    app.post('/api/commoncodes/import/:tableName', isAuthenticated, upload.single('file'), async (req, res) => {
        try {
            const { tableName } = req.params;
            const userId = req.session.userId;

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Parse Excel file
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const importedData = XLSX.utils.sheet_to_json(worksheet);

            // Get current data from database
            const dataRequest = pool.request();

            // Get table structure to identify primary keys
            const structureRequest = pool.request();
            structureRequest.input('TableName', sql.NVarChar, tableName);
            const structureResult = await structureRequest.execute('sp_GetTableStructure');
            const columns = structureResult.recordset;

            // Get primary key columns
            const pkQuery = `
        SELECT cu.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE cu
          ON tc.CONSTRAINT_NAME = cu.CONSTRAINT_NAME
        WHERE tc.TABLE_NAME = @TableName
          AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
        ORDER BY cu.ORDINAL_POSITION
      `;
            const pkRequest = pool.request();
            pkRequest.input('TableName', sql.NVarChar, tableName);
            const pkResult = await pkRequest.query(pkQuery);
            const primaryKeys = pkResult.recordset.map(row => row.COLUMN_NAME);

            // Get editable columns (exclude only system/log columns)
            const editableColumns = columns.filter(col => {
                const colName = col.COLUMN_NAME;
                // Exclude only system/log columns
                if (['UserId', 'Data_Ins', 'Data_upd'].includes(colName)) return false;
                return true;
            }).map(col => col.COLUMN_NAME);

            // Get current database data
            const currentDataQuery = `SELECT ${editableColumns.map(c => `[${c}]`).join(', ')} FROM [${tableName}]`;
            const currentDataResult = await dataRequest.query(currentDataQuery);
            const currentData = currentDataResult.recordset;

            // Build a map of current data by PK
            const currentDataMap = new Map();
            currentData.forEach(row => {
                const pkKey = primaryKeys.map(pk => row[pk]).join('|');
                currentDataMap.set(pkKey, row);
            });

            // Track changes
            const stats = {
                inserted: 0,
                updated: 0,
                deleted: 0,
                unchanged: 0,
                errors: []
            };

            // Get SP names from _TableList
            const spRequest = pool.request();
            spRequest.input('TableName', sql.NVarChar, tableName);
            const spResult = await spRequest.query(`SELECT SP_Create, SP_Update, SP_Delete FROM _TableList WHERE RefTable = @TableName`);
            const createSP = spResult.recordset[0]?.SP_Create;
            const updateSP = spResult.recordset[0]?.SP_Update;
            const deleteSP = spResult.recordset[0]?.SP_Delete;

            // Process imported rows (inserts and updates)
            const importedKeys = new Set();
            for (const importedRow of importedData) {
                const pkKey = primaryKeys.map(pk => importedRow[pk]).join('|');
                importedKeys.add(pkKey);

                const currentRow = currentDataMap.get(pkKey);

                // New row - INSERT
                if (!currentRow) {
                    try {
                        const createRequest = pool.request();

                        // Add UserId
                        createRequest.input('UserId', sql.Int, userId);

                        // Add all editable columns as parameters with correct types
                        editableColumns.forEach(col => {
                            // Skip UserId as we already added it
                            if (col === 'UserId') return;

                            const columnInfo = columns.find(c => c.COLUMN_NAME === col);
                            const value = importedRow[col] == null ? null : importedRow[col];

                            // Determine SQL type based on column data type
                            let sqlType = sql.NVarChar;
                            if (columnInfo) {
                                switch (columnInfo.DATA_TYPE.toLowerCase()) {
                                    case 'int':
                                        sqlType = sql.Int;
                                        break;
                                    case 'bit':
                                        sqlType = sql.Bit;
                                        break;
                                    case 'datetime':
                                        sqlType = sql.DateTime;
                                        break;
                                    case 'decimal':
                                    case 'numeric':
                                        sqlType = sql.Decimal;
                                        break;
                                    default:
                                        sqlType = sql.NVarChar;
                                }
                            }

                            createRequest.input(col, sqlType, value);
                        });

                        await createRequest.execute(createSP);
                        stats.inserted++;
                    } catch (err) {
                        stats.errors.push(`Insert failed for key ${pkKey}: ${err.message}`);
                    }
                    continue;
                }

                // Check if row has changes
                let hasChanges = false;
                for (const col of editableColumns) {
                    // Normalize values for comparison (handle null, undefined, empty strings)
                    const currentVal = currentRow[col] == null ? '' : String(currentRow[col]).trim();
                    const importedVal = importedRow[col] == null ? '' : String(importedRow[col]).trim();

                    if (currentVal !== importedVal) {
                        hasChanges = true;
                        break;
                    }
                }

                if (hasChanges) {
                    // Update the row
                    try {
                        const updateRequest = pool.request();

                        // Add all editable columns as parameters with correct types
                        editableColumns.forEach(col => {
                            const value = importedRow[col] == null ? null : importedRow[col];
                            const columnInfo = columns.find(c => c.COLUMN_NAME === col);

                            // Determine SQL type based on column data type
                            let sqlType = sql.NVarChar;
                            if (columnInfo) {
                                switch (columnInfo.DATA_TYPE.toLowerCase()) {
                                    case 'int':
                                        sqlType = sql.Int;
                                        break;
                                    case 'bit':
                                        sqlType = sql.Bit;
                                        break;
                                    case 'datetime':
                                        sqlType = sql.DateTime;
                                        break;
                                    case 'decimal':
                                    case 'numeric':
                                        sqlType = sql.Decimal;
                                        break;
                                    default:
                                        sqlType = sql.NVarChar;
                                }
                            }

                            updateRequest.input(col, sqlType, value);
                        });

                        await updateRequest.execute(updateSP);
                        stats.updated++;
                    } catch (err) {
                        stats.errors.push(`Update failed for key ${pkKey}: ${err.message}`);
                    }
                } else {
                    stats.unchanged++;
                }
            }

            // Find deleted rows (in DB but not in import)
            for (const [pkKey, currentRow] of currentDataMap.entries()) {
                if (!importedKeys.has(pkKey)) {
                    // Delete this row
                    try {
                        const deleteRequest = pool.request();

                        // Add primary key parameters
                        primaryKeys.forEach(pk => {
                            deleteRequest.input(pk, sql.NVarChar, currentRow[pk]);
                        });

                        await deleteRequest.execute(deleteSP);
                        stats.deleted++;
                    } catch (err) {
                        stats.errors.push(`Delete failed for key ${pkKey}: ${err.message}`);
                    }
                }
            }

            res.json({
                success: true,
                stats: stats
            });
        } catch (err) {
            console.error('Error importing from Excel:', err);
            res.status(500).json({ error: 'Import failed', message: err.message });
        }
    });

    // GET /api/commoncodes/verify-rsc - Verify RSC code structure and length (admin only)
    app.get('/api/commoncodes/verify-rsc', isAdministrator, async (req, res) => {
        try {
            const result = await pool.request().execute('sp_VerifyRSCCodes');
            res.json({
                success: true,
                lengthVerification: result.recordsets[0],
                structureVerification: result.recordsets[1]
            });
        } catch (err) {
            console.error('Error verifying RSC codes:', err);
            res.status(500).json({ error: 'Verification failed', message: err.message });
        }
    });

    // GET /api/commoncodes/rsc-error-details - Get detailed error information for RSC codes (admin only)
    app.get('/api/commoncodes/rsc-error-details', isAdministrator, async (req, res) => {
        try {
            const { tableName, errorType } = req.query;

            if (!tableName || !errorType) {
                return res.status(400).json({ error: 'Missing required parameters: tableName and errorType' });
            }

            const result = await pool.request()
                .input('TableName', sql.NVarChar(100), tableName)
                .input('ErrorType', sql.NVarChar(50), errorType)
                .execute('sp_GetRSCErrorDetails');

            res.json({
                success: true,
                tableName,
                errorType,
                errors: result.recordset
            });
        } catch (err) {
            console.error('Error getting RSC error details:', err);
            res.status(500).json({ error: 'Failed to get error details', message: err.message });
        }
    });

    // GET /api/integrity/check - Check data integrity
    app.get('/api/integrity/check', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const result = await pool.request().execute('sp_CheckDataIntegrity');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error checking data integrity:', err);
            res.status(500).json({ error: 'Server error', message: err.message });
        }
    });

    // GET /api/logs - Get activity logs
    app.get('/api/logs', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const { startDate, endDate, userId, tableOperation, offset = 0, limit = 100 } = req.query;

            const request = pool.request();

            if (startDate) request.input('StartDate', sql.DateTime, new Date(startDate));
            else request.input('StartDate', sql.DateTime, null);

            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                request.input('EndDate', sql.DateTime, endDateTime);
            } else request.input('EndDate', sql.DateTime, null);

            if (userId) request.input('UsrCode', sql.Int, parseInt(userId));
            else request.input('UsrCode', sql.Int, null);

            if (tableOperation) request.input('TableOperation', sql.NVarChar, tableOperation);
            else request.input('TableOperation', sql.NVarChar, null);

            const usePagination = req.query.offset !== undefined || req.query.limit !== undefined;

            if (usePagination) {
                const offsetValue = parseInt(offset) || 0;
                const limitValue = parseInt(limit) || 100;

                const result = await request.execute('sp_GetLogs');
                const totalCount = result.recordset.length;
                const paginatedResults = result.recordset.slice(offsetValue, offsetValue + limitValue);

                res.json({
                    data: paginatedResults,
                    totalCount: totalCount,
                    offset: offsetValue,
                    limit: limitValue,
                    hasMore: (offsetValue + limitValue) < totalCount
                });
            } else {
                const result = await request.execute('sp_GetLogs');
                res.json(result.recordset);
            }
        } catch (err) {
            console.error('Error retrieving logs:', err);
            res.status(500).json({ error: 'Server error', message: err.message });
        }
    });

    // ============= VERSIONING API (Moved to Common Codes) =============
    // ... (Versioning endpoints here) ...
    // For brevity, I'll assume Versioning is part of Common Codes as per the plan.
    // I need to copy the versioning endpoints too.

    // GET /api/versions - Get all versions
    app.get('/api/versions', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const result = await pool.request().execute('sp_Version_GetAll');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error retrieving versions:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET /api/version/published - Get published version
    app.get('/api/version/published', async (req, res) => {
        try {
            const result = await pool.request().execute('sp_Version_GetPublished');
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'No published version found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            console.error('Error retrieving published version:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET /api/version/working - Get working version
    app.get('/api/version/working', isAuthenticated, async (req, res) => {
        try {
            const result = await pool.request()
                .query('SELECT TOP 1 Code, Release, DateUpd, Description FROM _Version ORDER BY Code DESC');

            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'No working version found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            console.error('Error retrieving working version:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // GET /api/versions/:code - Get version by code
    app.get('/api/versions/:code', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const { code } = req.params;
            const result = await pool.request()
                .input('Code', sql.Int, parseInt(code))
                .execute('sp_Version_GetById');

            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Version not found' });
            }
            res.json(result.recordset[0]);
        } catch (err) {
            console.error('Error retrieving version:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // POST /api/versions - Create new version
    app.post('/api/versions', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const { Release, Description, Message } = req.body;
            const UserId = req.session.userId;

            const result = await pool.request()
                .input('Release', sql.NVarChar(40), Release)
                .input('Description', sql.NVarChar(4000), Description || null)
                .input('File_Excel', sql.NVarChar(510), null)
                .input('File_ODF', sql.NVarChar(510), null)
                .input('Message', sql.NVarChar(sql.MAX), Message || null)
                .input('UserId', sql.Int, UserId)
                .execute('sp_Version_Create');

            res.json({
                success: true,
                message: result.recordset[0].message,
                newCode: result.recordset[0].NewCode,
                version: result.recordset[0].Version
            });
        } catch (err) {
            console.error('Error creating version:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // PUT /api/versions/:code - Update version
    app.put('/api/versions/:code', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const { code } = req.params;
            const { Release, Description, Message } = req.body;
            const UserId = req.session.userId;

            const result = await pool.request()
                .input('Code', sql.Int, parseInt(code))
                .input('Release', sql.NVarChar(40), Release)
                .input('Description', sql.NVarChar(4000), Description || null)
                .input('File_Excel', sql.NVarChar(510), null)
                .input('File_ODF', sql.NVarChar(510), null)
                .input('Message', sql.NVarChar(sql.MAX), Message || null)
                .input('UserId', sql.Int, UserId)
                .execute('sp_Version_Update');

            res.json({ success: true, message: result.recordset[0].message });
        } catch (err) {
            console.error('Error updating version:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // DELETE /api/versions/:code - Delete version
    app.delete('/api/versions/:code', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const { code } = req.params;
            const result = await pool.request()
                .input('Code', sql.Int, parseInt(code))
                .execute('sp_Version_Delete');

            res.json({ success: true, message: result.recordset[0].message });
        } catch (err) {
            console.error('Error deleting version:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // POST /api/versions/delete-multiple - Delete multiple versions
    app.post('/api/versions/delete-multiple', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const { codes } = req.body;
            if (!codes || codes.length === 0) return res.status(400).json({ error: 'No versions selected' });

            let deletedCount = 0;
            let errors = [];

            for (const code of codes) {
                try {
                    await pool.request()
                        .input('Code', sql.Int, parseInt(code))
                        .execute('sp_Version_Delete');
                    deletedCount++;
                } catch (err) {
                    errors.push(`Error deleting version ${code}: ${err.message}`);
                }
            }

            res.json({
                success: true,
                message: `${deletedCount} of ${codes.length} version(s) deleted`,
                errors: errors
            });
        } catch (err) {
            console.error('Error deleting multiple versions:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // POST /api/versions/:code/publish - Publish a version
    app.post('/api/versions/:code/publish', isAdministratorOrSuperEditor, async (req, res) => {
        try {
            const { code } = req.params;
            const { release } = req.body;
            const UserId = req.session.userId;

            console.log(`Publishing version - Code: ${code}, Release: ${release}`);

            // Step 1: Publish the version
            const result = await pool.request()
                .input('Code', sql.Int, parseInt(code))
                .input('UserId', sql.Int, UserId)
                .execute('sp_Version_Publish');

            console.log('✓ Version published successfully');

            // Step 2: Export DT_CODES (published data)
            const exportDir = path.resolve(__dirname, process.env.DT_CODES_EXPORT_DIR || '../Download');
            const exportPrefix = process.env.DT_CODES_PREFIX || 'DT_CODES_';
            const exportPath = path.join(exportDir, exportPrefix);

            if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

            const request = pool.request();
            request.timeout = 120000;
            await request
                .input('FilePath', sql.VarChar(255), exportPath)
                .execute('MP_S_Export_DT_CODES_Published');

            // Step 3: Create ZIP
            const zipFileName = `DT_CODESVersion${release}_Export.zip`;
            const zipFilePath = path.join(exportDir, zipFileName);
            const xmlFiles = fs.readdirSync(exportDir).filter(file => file.endsWith('.xml'));

            if (xmlFiles.length > 0) {
                const output = fs.createWriteStream(zipFilePath);
                const archive = archiver('zip', { zlib: { level: 9 } });

                await new Promise((resolve, reject) => {
                    output.on('close', resolve);
                    archive.on('error', reject);
                    archive.pipe(output);
                    xmlFiles.forEach(file => archive.file(path.join(exportDir, file), { name: file }));
                    archive.finalize();
                });

                xmlFiles.forEach(file => fs.unlinkSync(path.join(exportDir, file)));
            }

            // Step 4: Generate Excel
            let excelGenerated = false;
            let excelFileName = null;
            let excelError = null;

            try {
                const versionResult = await pool.request()
                    .input('Code', sql.Int, parseInt(code))
                    .execute('sp_Version_GetById');
                const versionDescription = versionResult.recordset[0]?.Description || '';
                const excelPath = await generateExcelExport(pool, parseInt(code), release, versionDescription);
                excelFileName = path.basename(excelPath);
                excelGenerated = true;
            } catch (excelErr) {
                console.error('⚠ Warning: Excel generation failed:', excelErr.message);
                excelError = excelErr.message;
            }

            res.json({
                success: true,
                message: result.recordset[0].message,
                dtCodesExported: true,
                zipFileName: zipFileName,
                excelGenerated: excelGenerated,
                excelFileName: excelFileName,
                excelError: excelError
            });
        } catch (err) {
            console.error('Error publishing version:', err);
            res.status(500).json({ error: err.message || 'Server error' });
        }
    });
}

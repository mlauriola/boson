import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sql from 'mssql';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename}_${timestamp}${ext}`);
    }
});

const upload = multer({ storage: storage });

// Local pool for Competition Management
let schedulePool;

async function getSchedulePool() {
    if (schedulePool) return schedulePool;

    // Read config manually or reuse env if possible.
    // Assuming same credentials, different DB.
    const config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        database: 'CompetitionManagement', // Dedicated DB
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    };

    try {
        schedulePool = await new sql.ConnectionPool(config).connect();
        console.log('CompetitionManagement DB connected');
        return schedulePool;
    } catch (err) {
        console.error('Failed to connect to CompetitionManagement DB', err);
        throw err;
    }
}

export default function (app, globalPool) { // globalPool is ignored for DB ops, used for shared auth maybe?

    // API: Upload Schedule
    app.post('/api/schedule/upload', upload.single('file'), async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = new ExcelJS.Workbook();
        let transaction;
        let pool;

        try {
            pool = await getSchedulePool();
            await workbook.xlsx.readFile(req.file.path);

            // Start Transaction on local pool
            transaction = new sql.Transaction(pool);
            await transaction.begin();

            const request = new sql.Request(transaction);

            // 1. Create Version
            const versionResult = await request
                .input('VersionName', sql.NVarChar, req.body.versionName || req.file.originalname)
                .input('FileName', sql.NVarChar, req.file.filename)
                .input('CreatedBy', sql.NVarChar, req.session?.username || 'System')
                .output('NewId', sql.Int)
                .execute('sp_Schedule_CreateVersion');

            const versionId = versionResult.output.NewId;

            // 2. Process Sheets
            // We assume sheets with name pattern DD.MM.YY contain data, or just process likely candidates.
            // Based on example: Data starts Row 4. Headers Row 3.

            for (const worksheet of workbook.worksheets) {
                // Heuristic: Skip "Instructions", "Overview", etc. 
                // Checks if sheet name has a digit or simple filter.
                // For now, let's process ALL sheets that have data in Row 4.
                if (worksheet.name.toLowerCase().includes('instruction')) continue;

                // Iterate Rows (Start from 4)
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber < 4) return;

                    // SKIP empty rows based on critical column (e.g. Session ID at index 11 or Activity at 7)
                    // Row values are 1-based arrays.
                    const rowVals = row.values; // index 0 is undefined/null usually.
                    if (!rowVals[7] && !rowVals[11]) return; // Skip if no Activity AND no SessionID

                    // Extract Data
                    // Mapping based on previous analysis:
                    // 4: Start, 5: Duration, 6: Finish (Time objects)
                    // 7: Activity
                    // 8: Location
                    // 9: Location Code
                    // 10: Venue
                    // 11: Session ID
                    // 12: RSC

                    const startTime = rowVals[4] ? rowVals[4].toString() : null;
                    const endTime = rowVals[6] ? rowVals[6].toString() : null;
                    const activity = rowVals[7];
                    const loc = rowVals[8];
                    const locCode = rowVals[9];
                    const venue = rowVals[10];
                    const sessionId = rowVals[11]; // Session ID
                    const rsc = rowVals[12];

                    // Insert Session
                    // We need a NEW Request for each execution inside loop? Yes.
                    // But we can reuse the transaction object.
                    // Note: In mssql, you can reuse the request object if you reset params, or create new one.
                    // Creating new one is safest.

                    // We can't await inside forEach easily unless we use for...of loop or Promise.all.
                    // Converting to for loop for async/await support.
                });
            }

            // Using standard for loop for async support
            for (const worksheet of workbook.worksheets) {
                if (worksheet.name.toLowerCase().includes('instruction')) continue;

                // Get rows first to iterate standardly
                const rows = worksheet.getRows(4, worksheet.actualRowCount);
                if (!rows) continue;

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const rowVals = row.values;

                    // Indexing in ExcelJS values array:
                    // formatted values are better? row.model.cells...
                    // Let's stick to values. values[1] is Col A.

                    // Map (Adjusted for 1-based index if using row.values directly)
                    // If Row 1 in Excel is Index 1 in values.
                    const activity = rowVals[7];
                    const sessionId = rowVals[11];

                    if (!activity && !sessionId) continue;

                    const itemReq = new sql.Request(transaction);
                    // Careful with large loops strings.
                    await itemReq
                        .input('VersionId', sql.Int, versionId)
                        .input('SheetName', sql.NVarChar, worksheet.name)
                        .input('StartTime', sql.NVarChar, rowVals[4] ? String(rowVals[4]) : null)
                        .input('EndTime', sql.NVarChar, rowVals[6] ? String(rowVals[6]) : null)
                        .input('Activity', sql.NVarChar, activity ? String(activity) : null)
                        .input('Location', sql.NVarChar, rowVals[8] ? String(rowVals[8]) : null)
                        .input('LocationCode', sql.NVarChar, rowVals[9] ? String(rowVals[9]) : null)
                        .input('Venue', sql.NVarChar, rowVals[10] ? String(rowVals[10]) : null)
                        .input('SessionCode', sql.NVarChar, sessionId ? String(sessionId) : null)
                        .input('RSC', sql.NVarChar, rowVals[12] ? String(rowVals[12]) : null)
                        .input('RowIndex', sql.Int, row.number)
                        .execute('sp_Schedule_AddSession');
                }
            }

            await transaction.commit();
            res.json({ success: true, versionId: versionId, message: 'Schedule imported successfully' });

        } catch (err) {
            console.error('Import Error:', err);
            if (transaction) await transaction.rollback();
            res.status(500).json({ error: 'Import failed', details: err.message });
        }
    });

    // API: Get Versions
    app.get('/api/schedule/versions', async (req, res) => {
        try {
            const pool = await getSchedulePool();
            const result = await pool.request().execute('sp_Schedule_GetVersions');
            res.json(result.recordset);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API: Get Active Version Sessions
    app.get('/api/schedule/active', async (req, res) => {
        try {
            const pool = await getSchedulePool();

            // First get the active version ID
            const versionResult = await pool.request()
                .query("SELECT TOP 1 Id FROM ScheduleVersions WHERE Status = 1 ORDER BY UploadDate DESC");

            if (versionResult.recordset.length === 0) {
                return res.json([]); // No active version
            }

            const versionId = versionResult.recordset[0].Id;

            // Then get sessions for that version
            const sessionsResult = await pool.request()
                .input('VersionId', sql.Int, versionId)
                .execute('sp_Schedule_GetSessionsByVersion');

            res.json(sessionsResult.recordset);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API: Get Sessions by Specific Version
    app.get('/api/schedule/versions/:id', async (req, res) => {
        try {
            const pool = await getSchedulePool();
            const result = await pool.request()
                .input('VersionId', sql.Int, req.params.id)
                .execute('sp_Schedule_GetSessionsByVersion');
            res.json(result.recordset);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API: Update Version Name
    app.put('/api/schedule/versions/:id', async (req, res) => {
        try {
            const { versionName } = req.body;
            if (!versionName) return res.status(400).json({ error: 'Version name is required' });

            const pool = await getSchedulePool();
            await pool.request()
                .input('VersionId', sql.Int, req.params.id)
                .input('VersionName', sql.NVarChar, versionName)
                .execute('sp_Schedule_UpdateVersion');
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API: Set Active Version
    app.post('/api/schedule/versions/:id/active', async (req, res) => {
        try {
            const pool = await getSchedulePool();
            await pool.request()
                .input('VersionId', sql.Int, req.params.id)
                .execute('sp_Schedule_SetActiveVersion');
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API: Delete Version
    app.delete('/api/schedule/versions/:id', async (req, res) => {
        try {
            const pool = await getSchedulePool();
            await pool.request()
                .input('VersionId', sql.Int, req.params.id)
                .execute('sp_Schedule_DeleteVersion');
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API: Download Specific Version File
    app.get('/api/schedule/download/:filename', (req, res) => {
        const fileName = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', fileName);
        const friendlyName = req.query.name || fileName;

        if (fs.existsSync(filePath)) {
            const downloadName = friendlyName.toLowerCase().endsWith('.xlsx')
                ? friendlyName
                : `${friendlyName}.xlsx`;
            res.download(filePath, downloadName);
        } else {
            res.status(404).json({ error: 'File not found on server' });
        }
    });

    // API: Download Template
    app.get('/api/schedule/template', (req, res) => {
        const templatePath = path.join(__dirname, '../examples/DCAS_AQU_FINAL.xlsx');
        if (fs.existsSync(templatePath)) {
            res.download(templatePath, 'Competition_Schedule_Template.xlsx');
        } else {
            res.status(404).json({ error: 'Template file not found' });
        }
    });
}

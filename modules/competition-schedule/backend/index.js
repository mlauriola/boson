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
            // Based on example: Data starts Row 4. Headers Row 3.

            const dateRegex = /^\d{2}\.\d{2}\.\d{2}$/; // Format: DD.MM.YY

            for (const worksheet of workbook.worksheets) {
                // Skip hidden sheets
                if (worksheet.state !== 'visible') continue;

                // Strict Filter: Only allow sheets named as Dates (e.g., 29.07.22)
                // User instruction: "considera solo i tab che hanno una data come nome"
                if (!dateRegex.test(worksheet.name.trim())) continue;

                // Headers (Row 3) - Iterate 1 to MAX Column Index
                const headerRow = worksheet.getRow(3);
                const headers = {};

                // Find true max column index (cellCount is just count of objects, not max index)
                let maxCol = 0;
                headerRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
                    if (colNum > maxCol) maxCol = colNum;
                });
                // Fallback if empty?
                if (maxCol === 0) maxCol = headerRow.cellCount || 20;

                const usedHeaders = new Map(); // Track frequency

                for (let c = 1; c <= maxCol; c++) {
                    const cell = headerRow.getCell(c);
                    const val = cell.value;
                    // Simple text extraction for header
                    let text = '';
                    if (val) {
                        if (typeof val === 'object' && 'richText' in val) {
                            text = val.richText.map(t => t.text).join('');
                        } else if (typeof val === 'object' && 'text' in val) {
                            text = val.text;
                        } else if (typeof val === 'object' && 'result' in val) {
                            text = String(val.result);
                        } else {
                            text = String(val);
                        }
                    }

                    let headerName = text.trim() || `Col${c}`;

                    // Ensure Uniqueness
                    if (usedHeaders.has(headerName)) {
                        const count = usedHeaders.get(headerName) + 1;
                        usedHeaders.set(headerName, count);
                        headerName = `${headerName}_${count}`;
                    } else {
                        usedHeaders.set(headerName, 1);
                    }

                    headers[c] = headerName;
                }

                // Helper to get text from a cell (handling merges and types)
                const getCellText = (cell) => {
                    const val = cell.value;
                    if (!val) return '';
                    if (typeof val === 'object') {
                        if ('result' in val) return val.result;
                        if ('text' in val) return val.text;
                        if ('richText' in val) return val.richText.map(t => t.text).join('');
                    }
                    return String(val).trim();
                };

                // 1. Extract Sheet Title from Row 1
                // 1. Extract Sheet Title from Row 1
                const titleRow = worksheet.getRow(1);
                let sheetTitle = worksheet.name; // Fallback

                // Robust scan of first row (like headers)
                const titleMaxCol = titleRow.cellCount || 20;

                for (let c = 1; c <= titleMaxCol; c++) {
                    // Stop if we found a long title (heuristic: longer than sheet name + 5 chars?)
                    // Or just take the first meaningful string that isn't the sheet name? 
                    // User says B1 has the title.
                    // Simple logic: Take THE FIRST non-empty string that is NOT the sheet name.
                    // If we haven't found a better title yet:
                    if (sheetTitle === worksheet.name) {
                        const cell = titleRow.getCell(c);
                        // Check master if merged
                        const effectiveCell = cell.isMerged && cell.master ? cell.master : cell;
                        const text = getCellText(effectiveCell);

                        if (text && text.length > 0 && text !== worksheet.name) {
                            sheetTitle = text;
                            break; // Found it, stop scanning
                        }
                    }
                }

                // 2. Get rows starting from 4 (Data) - User confirmed Data starts at 4.
                const rows = worksheet.getRows(4, worksheet.actualRowCount);
                if (!rows) continue;

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];

                    // Helper: Resolve Excel Color (ARGB or Theme)
                    const resolveExcelColor = (colorObj) => {
                        if (!colorObj) return null;

                        // 1. Handle ARGB
                        if (colorObj.argb) {
                            let argb = colorObj.argb;
                            return (argb.length === 8) ? ('#' + argb.substring(2)) : ('#' + argb);
                        }

                        // 2. Handle Theme
                        if ('theme' in colorObj) {
                            // Standard Office 2013+ Theme Palette
                            const themeColors = [
                                'FFFFFF', // 0: White / Light 1
                                '000000', // 1: Black / Dark 1
                                'E7E6E6', // 2: Light Gray / Light 2
                                '44546A', // 3: Dark Blue-Gray / Dark 2
                                '4472C4', // 4: Blue / Accent 1  (Was 5B9BD5)
                                'ED7D31', // 5: Orange / Accent 2
                                'A5A5A5', // 6: Gray / Accent 3
                                'FFC000', // 7: Gold / Accent 4
                                '5B9BD5', // 8: Blue / Accent 5  (Was 4472C4)
                                '70AD47'  // 9: Green / Accent 6
                            ];

                            let hex = themeColors[colorObj.theme] || 'FFFFFF';

                            // Apply Tint if present
                            if (colorObj.tint !== undefined) {
                                const tint = colorObj.tint;
                                // Convert Hex to RGB
                                let r = parseInt(hex.substring(0, 2), 16);
                                let g = parseInt(hex.substring(2, 4), 16);
                                let b = parseInt(hex.substring(4, 6), 16);

                                if (tint > 0) {
                                    // Lighten: value + (255 - value) * tint
                                    r = Math.round(r + (255 - r) * tint);
                                    g = Math.round(g + (255 - g) * tint);
                                    b = Math.round(b + (255 - b) * tint);
                                } else {
                                    // Darken: value * (1 + tint)
                                    r = Math.round(r * (1 + tint));
                                    g = Math.round(g * (1 + tint));
                                    b = Math.round(b * (1 + tint));
                                }
                                // Back to Hex
                                hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                            }
                            return '#' + hex;
                        }

                        return null;
                    };

                    // Helper to get simple value
                    const getVal = (cellVal) => {
                        if (cellVal instanceof Date) return cellVal.toISOString(); // Handle Date objects directly

                        if (cellVal && typeof cellVal === 'object') {
                            // Prioritize calculated result for formulas
                            if ('result' in cellVal) {
                                let res = cellVal.result;
                                if (res instanceof Date) return res.toISOString();
                                return res;
                            }
                            if ('text' in cellVal) return cellVal.text;     // Hyperlink
                            if ('richText' in cellVal) return cellVal.richText.map(t => t.text).join(''); // Rich Text
                        }
                        return cellVal;
                    };

                    const rowVals = row.values;

                    // Permissive Filter: Keep row if it has ANY meaningful values.
                    if (!row.hasValues && !rowVals.some(v => v !== null && v !== undefined && String(v).trim() !== '')) continue;
                    // Note: row.hasValues might be false if only styles exist? Check.
                    // Actually, if row has no values but HAS colors, we might want to keep it?
                    // User said "colora anche singole celle". Assuming they have text.
                    // If empty cell has color, it won't be in `rowVals` as a value, but `row.getCell` works.
                    // Let's keep existing filter for now, usually colored cells have content or context.

                    // Legacy Column Mapping (still needed for DB columns)
                    const activity = getVal(rowVals[7]);
                    const sessionId = getVal(rowVals[11]);

                    // Construct JSON Data with Styles
                    const rowJson = {};

                    // Iterate generic headers
                    Object.keys(headers).forEach(colIdx => {
                        // Get exact cell to reuse getVal logic and get Style
                        // row.getCell(colIdx) is reliable.
                        const cell = row.getCell(Number(colIdx));
                        const val = getVal(cell.value);

                        // Background
                        const fill = cell.fill;
                        const bg = (fill && fill.type === 'pattern' && fill.fgColor) ? resolveExcelColor(fill.fgColor) : null;

                        // Font Color
                        const font = cell.font;
                        const color = (font && font.color) ? resolveExcelColor(font.color) : null;

                        // Store complex object
                        rowJson[headers[colIdx]] = {
                            v: (val !== undefined && val !== null) ? val : null,
                            bg: bg,
                            c: color // 'c' for color (font)
                        };
                    });

                    const jsonDataString = JSON.stringify(rowJson);

                    const itemReq = new sql.Request(transaction);
                    // Careful with large loops strings.
                    await itemReq
                        .input('VersionId', sql.Int, versionId)
                        .input('SheetName', sql.NVarChar, worksheet.name)
                        .input('StartTime', sql.NVarChar, rowVals[4] ? String(getVal(rowVals[4])) : null)
                        .input('EndTime', sql.NVarChar, rowVals[6] ? String(getVal(rowVals[6])) : null)
                        .input('Activity', sql.NVarChar, activity ? String(activity) : null)
                        .input('Location', sql.NVarChar, rowVals[8] ? String(getVal(rowVals[8])) : null)
                        .input('LocationCode', sql.NVarChar, rowVals[9] ? String(getVal(rowVals[9])) : null)
                        .input('Venue', sql.NVarChar, rowVals[10] ? String(getVal(rowVals[10])) : null)
                        .input('SessionCode', sql.NVarChar, sessionId ? String(sessionId) : null)
                        .input('RSC', sql.NVarChar, rowVals[12] ? String(getVal(rowVals[12])) : null)
                        .input('RowIndex', sql.Int, row.number)
                        .input('JsonData', sql.NVarChar(sql.MAX), jsonDataString)
                        .input('SheetTitle', sql.NVarChar, sheetTitle) // Add Missing Parameter
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

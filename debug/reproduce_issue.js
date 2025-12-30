import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// REPLICATED LOGIC FROM index.js
const getVal = (cellVal) => {
    if (cellVal instanceof Date) return cellVal.toISOString();

    if (cellVal && typeof cellVal === 'object') {
        if ('result' in cellVal) {
            let res = cellVal.result;
            if (res instanceof Date) return res.toISOString();
            return res;
        }
        if ('text' in cellVal) return cellVal.text;
        if ('richText' in cellVal) return cellVal.richText.map(t => t.text).join('');
    }
    return cellVal;
};

const getBgColor = (cell) => {
    const fill = cell.fill;
    // Strict check used in index.js:
    if (!fill || fill.type !== 'pattern' || !fill.fgColor) return null;

    if (fill.fgColor.argb) {
        let argb = fill.fgColor.argb;
        return (argb.length === 8) ? ('#' + argb.substring(2)) : ('#' + argb);
    }

    if ('theme' in fill.fgColor) {
        const themeColors = [
            'FFFFFF', '000000', 'E7E6E6', '44546A', '4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47'
        ];

        let hex = themeColors[fill.fgColor.theme] || 'FFFFFF';

        if (fill.fgColor.tint !== undefined) {
            const tint = fill.fgColor.tint;
            let r = parseInt(hex.substring(0, 2), 16);
            let g = parseInt(hex.substring(2, 4), 16);
            let b = parseInt(hex.substring(4, 6), 16);

            if (tint > 0) {
                r = Math.round(r + (255 - r) * tint);
                g = Math.round(g + (255 - g) * tint);
                b = Math.round(b + (255 - b) * tint);
            } else {
                r = Math.round(r * (1 + tint));
                g = Math.round(g * (1 + tint));
                b = Math.round(b * (1 + tint));
            }
            hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        }
        return '#' + hex;
    }
    return null;
};

async function run() {
    const uploadsDir = path.join(__dirname, 'modules/competition-schedule/uploads');
    const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.xlsx'));
    const latestFile = files.map(f => ({ name: f, time: fs.statSync(path.join(uploadsDir, f)).mtime.getTime() })).sort((a, b) => b.time - a.time)[0].name;

    console.log(`Processing: ${latestFile}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(uploadsDir, latestFile));

    const sheet = workbook.worksheets.find(ws => ws.name.includes('29.07.22')) || workbook.worksheets[0];

    // Headers Scan (Row 3)
    const headerRow = sheet.getRow(3);
    const headers = {};
    let maxCol = 0;
    headerRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        if (colNum > maxCol) maxCol = colNum;
    });
    if (maxCol === 0) maxCol = headerRow.cellCount;

    for (let c = 1; c <= maxCol; c++) {
        headers[c] = `Col${c}`; // Simplified
    }

    // Checking Row 4, Col 3 (where issue is reported)
    const row4 = sheet.getRow(4);
    const cellC = row4.getCell(3);
    const cellB = row4.getCell(2);

    console.log('--- COL 3 (Issue) ---');
    console.log('Raw Value:', JSON.stringify(cellC.value));
    console.log('Raw Fill:', JSON.stringify(cellC.fill));
    console.log('Extracted Val:', getVal(cellC.value));
    console.log('Extracted Bg:', getBgColor(cellC));

    console.log('--- COL 2 (Working) ---');
    console.log('Raw Fill:', JSON.stringify(cellB.fill));
    console.log('Extracted Bg:', getBgColor(cellB));

}

run();

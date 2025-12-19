import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugExcel() {
    // Path logic from index.js
    const uploadsDir = path.join(__dirname, 'modules/competition-schedule/uploads');

    if (!fs.existsSync(uploadsDir)) {
        console.log(`Uploads dir not found at ${uploadsDir}`);
        return;
    }

    const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.xlsx'));

    if (files.length === 0) {
        console.log("No Excel files found.");
        return;
    }

    // Get latest file
    const latestFile = files.map(f => ({ name: f, time: fs.statSync(path.join(uploadsDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time)[0].name;

    console.log(`Analyzing: ${latestFile}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(uploadsDir, latestFile));

    // Find specific sheet requested by user
    const sheetNameTarget = '29.07.22';
    const sheet = workbook.worksheets.find(ws => ws.name.includes(sheetNameTarget)) || workbook.worksheets[0];
    console.log(`Sheet Name: ${sheet.name}`);

    // Verify Column B (Col 2) and Column C (Col 3) Data in Row 4 to 25
    console.log('--- Data Analysis Rows 4-25 ---');
    for (let rIdx = 4; rIdx <= 25; rIdx++) {
        const row = sheet.getRow(rIdx);

        const cellB = row.getCell(2); // Col B
        const cellC = row.getCell(3); // Col C

        // Helper to safe stringify
        const safeVal = (c) => c.value ? (typeof c.value === 'object' ? JSON.stringify(c.value) : c.value) : 'NULL';

        console.log(`R${rIdx} [B]: Val=${safeVal(cellB)} | Color=${JSON.stringify(cellB.fill?.fgColor)}`);
        console.log(`R${rIdx} [C]: Val=${safeVal(cellC)} | Color=${JSON.stringify(cellC.fill?.fgColor)}`);
    }

    console.log('--- Row 1 Title Scan ---');
    const row1 = sheet.getRow(1);
    for (let c = 1; c <= 10; c++) {
        const cell = row1.getCell(c);
        console.log(`Col ${c} [${cell.address}]: Val=${JSON.stringify(cell.value)} Types=${typeof cell.value} Merged=${cell.isMerged} Master=${cell.master?.address}`);
    }

    console.log('--- Row 3 (Headers) Analysis ---');
    const row3 = sheet.getRow(3);
    let maxCol = 0;
    row3.eachCell({ includeEmpty: true }, (cell, colNum) => {
        if (colNum > maxCol) maxCol = colNum;
    });
    if (maxCol === 0) maxCol = row3.cellCount;

    console.log(`Max Col: ${maxCol}`);
    for (let c = 1; c <= maxCol; c++) {
        const cell = row3.getCell(c);
        console.log(`Header Col ${c}: ${cell.value}`);
    }
}

debugExcel();

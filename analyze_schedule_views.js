import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeViews() {
    const filePath = path.join(__dirname, 'modules/competition-schedule/examples/G2026_Competition Schedule_CSWG_091025.xlsx');

    if (!fs.existsSync(filePath)) {
        console.error('Example file not found!');
        return;
    }

    console.log(`Analyzing: ${path.basename(filePath)}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // Analyze first 2 sheets
    const sheetsToAnalyze = workbook.worksheets.slice(0, 2);

    for (const sheet of sheetsToAnalyze) {
        console.log(`\n=== SHEET: ${sheet.name} ===`);

        // Check first few rows to find headers
        for (let r = 1; r <= 5; r++) {
            const row = sheet.getRow(r);
            const values = [];
            row.eachCell((cell, col) => {
                values.push(`[${cell.address}] ${cell.value}`);
            });
            if (values.length > 0) {
                console.log(`Row ${r}:`, values.join(' | '));
            }
        }

        console.log(`\n-- Dimension Analysis --`);
        console.log(`RowCount: ${sheet.rowCount}, ColCount: ${sheet.columnCount}`);

        // Sample Data Row (e.g., Row 10)
        const sampleRow = sheet.getRow(10);
        const sampleVals = [];
        sampleRow.eachCell((cell) => sampleVals.push(cell.value));
        console.log(`Sample Row 10:`, JSON.stringify(sampleVals));
    }
}

analyzeViews();

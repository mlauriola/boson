import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeExcel() {
    const filePath = path.join(__dirname, 'modules/competition-schedule/examples/DCAS_AQU_FINAL.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    console.log('--- Analysis of DCAS_AQU_FINAL.xlsx ---');

    workbook.worksheets.forEach(sheet => {
        console.log(`\nSheet: ${sheet.name}`);
        // Assuming headers are in row 3 based on previous analysis
        const headerRow = sheet.getRow(3);
        const headers = [];
        headerRow.eachCell((cell, colNumber) => {
            headers.push({ col: colNumber, val: cell.value });
        });

        console.log('Headers (Row 3):');
        headers.forEach(h => console.log(`  Col ${h.col}: ${h.val}`));

        // Sample Data (Row 4)
        const sampleRow = sheet.getRow(4);
        console.log('Sample Row 4 (First 5 non-empty):');
        let count = 0;
        sampleRow.eachCell((cell, colNumber) => {
            if (count < 5) {
                console.log(`  Col ${colNumber}: ${cell.value}`);
                count++;
            }
        });
    });
}

analyzeExcel().catch(console.error);

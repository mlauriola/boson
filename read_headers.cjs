const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();
const filename = 'c:\\microplus-bos\\modules\\competition-schedule\\examples\\DCAS_AQU_FINAL.xlsx';

workbook.xlsx.readFile(filename).then(function () {
    const worksheet = workbook.getWorksheet('29.07.22');
    if (!worksheet) {
        console.error('Sheet 29.07.22 not found');
        return;
    }
    console.log('Worksheet Name:', worksheet.name);
    for (let i = 1; i <= 10; i++) {
        const row = worksheet.getRow(i).values;
        console.log(`Row ${i}:`, JSON.stringify(row));
    }
}).catch(err => {
    console.error('Error reading file:', err);
});

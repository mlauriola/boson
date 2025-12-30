const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();
const filename = 'c:\\microplus-bos\\modules\\competition-schedule\\examples\\DCAS_AQU_FINAL.xlsx';

workbook.xlsx.readFile(filename).then(function () {
    const worksheet = workbook.worksheets[0];
    const headers = worksheet.getRow(1).values;
    // ExcelJS row values are 1-based, so index 0 is usually empty or specific.
    // .values returns an array where index 1 is column A.
    console.log('Headers:', JSON.stringify(headers));
}).catch(err => {
    console.error('Error reading file:', err);
});

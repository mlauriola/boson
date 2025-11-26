import ExcelJS from 'exceljs';
import sql from 'mssql';
import path from 'path';
import fs from 'fs';
import { stripHtml } from 'string-strip-html';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Excel file from published version data
 * @param {object} pool - SQL connection pool
 * @param {number} versionCode - Version code from _Version table
 * @param {string} release - Release number (e.g., "1.0", "2.0")
 * @param {string} description - Version description
 * @returns {Promise<string>} - Path to generated Excel file
 */
async function generateExcelExport(pool, versionCode, release, description) {
  try {
    console.log(`[Excel Generator] Starting Excel generation for version ${release}`);

    // Paths
    const templatePath = path.join(__dirname, '..', 'templates', 'CG2026_Template.xlsx');
    const downloadsDir = path.resolve(__dirname, process.env.EXCEL_EXPORT_DIR || '../Download');
    const outputFilename = `EXCELVersion${release}_Export.xlsx`;
    const outputPath = path.join(downloadsDir, outputFilename);

    // Verify template exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    // Ensure Download directory exists
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Load template workbook
    console.log('[Excel Generator] Loading template workbook');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // Get tables to export (IdRole_View=5 AND HasToBeManaged!=2)
    console.log('[Excel Generator] Querying table list');
    const tableListResult = await pool.request()
      .query(`
        SELECT Code, Description, RefTable, RefFoglioExcel
        FROM _TableList
        WHERE IdRole_View = 5 AND HasToBeManaged != 2
        ORDER BY Code
      `);

    const tables = tableListResult.recordset;
    console.log(`[Excel Generator] Found ${tables.length} tables to export`);

    // Update Version sheet
    const versionSheet = workbook.getWorksheet('Version');
    if (versionSheet) {
      console.log('[Excel Generator] Updating Version sheet');
      // Find Release cell and update it
      // Assuming Release is in a specific cell - adjust as needed
      // For now, we'll add version info to the first few rows
      versionSheet.getCell('A2').value = release;
      versionSheet.getCell('B2').value = description ? stripHtml(description).result : '';
      versionSheet.getCell('C2').value = new Date();
    }

    // Process each table
    for (const table of tables) {
      try {
        console.log(`[Excel Generator] Processing table: ${table.Description} (Code: ${table.Code}, Sheet: ${table.RefFoglioExcel})`);

        // Get data from stored procedure
        const dataResult = await pool.request()
          .input('Code', sql.Int, table.Code)
          .execute('sp_GetPublishedTableDataForExcel');

        const data = dataResult.recordset;
        console.log(`[Excel Generator]   Retrieved ${data.length} rows`);

        if (data.length === 0) {
          console.log(`[Excel Generator]   Skipping ${table.RefFoglioExcel} - no data`);
          continue;
        }

        // Find worksheet by RefFoglioExcel
        const worksheet = workbook.getWorksheet(table.RefFoglioExcel);
        if (!worksheet) {
          console.log(`[Excel Generator]   Warning: Sheet "${table.RefFoglioExcel}" not found in template, skipping`);
          continue;
        }

        // Get column headers from Excel (row 1)
        const headerRow = worksheet.getRow(1);
        const excelColumns = [];
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (cell.value) {
            excelColumns.push({
              name: cell.value.toString().trim(),
              colNumber: colNumber
            });
          }
        });

        console.log(`[Excel Generator]   Excel has ${excelColumns.length} columns`);

        // Match columns between Excel headers and DB result columns
        const columnMapping = [];
        const dbColumns = Object.keys(data[0]);

        for (const excelCol of excelColumns) {
          // Case-insensitive match
          const dbColumn = dbColumns.find(
            dbCol => dbCol.toLowerCase() === excelCol.name.toLowerCase()
          );
          if (dbColumn) {
            columnMapping.push({
              excelCol: excelCol.colNumber,
              dbColumn: dbColumn
            });
          }
        }

        console.log(`[Excel Generator]   Matched ${columnMapping.length} columns`);

        if (columnMapping.length === 0) {
          console.log(`[Excel Generator]   Warning: No matching columns found for ${table.RefFoglioExcel}, skipping`);
          continue;
        }

        // Clear existing data (keep header row)
        const existingRowCount = worksheet.rowCount;
        if (existingRowCount > 1) {
          // Delete rows starting from row 2
          worksheet.spliceRows(2, existingRowCount - 1);
        }

        // Write data rows
        let rowNumber = 2; // Start after header
        for (const row of data) {
          const excelRow = worksheet.getRow(rowNumber);

          for (const mapping of columnMapping) {
            let value = row[mapping.dbColumn];

            // Handle null/undefined
            if (value === null || value === undefined) {
              value = '';
            }
            // Strip HTML tags if value is string
            else if (typeof value === 'string') {
              value = stripHtml(value).result;
            }
            // Format dates
            else if (value instanceof Date) {
              // Keep as Date object for Excel formatting
              value = value;
            }

            excelRow.getCell(mapping.excelCol).value = value;
          }

          excelRow.commit();
          rowNumber++;
        }

        console.log(`[Excel Generator]   Wrote ${data.length} rows to ${table.RefFoglioExcel}`);

      } catch (tableError) {
        // Non-blocking error for individual tables
        console.error(`[Excel Generator] Error processing table ${table.Description}:`, tableError.message);
        // Continue with next table
      }
    }

    // Save workbook
    console.log(`[Excel Generator] Saving workbook to ${outputPath}`);
    await workbook.xlsx.writeFile(outputPath);

    console.log('[Excel Generator] Excel generation completed successfully');
    return outputPath;

  } catch (error) {
    console.error('[Excel Generator] Fatal error:', error);
    throw error;
  }
}

export { generateExcelExport };

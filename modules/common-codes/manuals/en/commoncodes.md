# Common Codes Management

## Overview

The Common Codes Management page is the central hub for managing all reference data tables used throughout the system. This includes disciplines, venues, organizations, event units, and many other code tables that standardize data across the application.

## Purpose

Common Codes are used to:

- Standardize data entry across the system
- Ensure data consistency and integrity
- Support multi-language descriptions and codes
- Maintain versioning and audit trails

## Key Features

### Table Selection

- A dropdown menu displays all manageable tables in the system
- Tables are loaded from the `_TableList` configuration
- Each table has a short description shown in the dropdown
- After selection, a longer description appears below explaining the table's purpose

### Data Grid

The data grid displays all records from the selected table with the following capabilities:

#### Viewing Data
- All records are displayed in a sortable table
- Primary key columns are highlighted
- System columns (UserId, Data_Ins, Data_upd) are automatically populated
- Foreign key relationships show descriptions instead of codes

#### Column Filtering

Each column header includes a filter icon that allows you to filter data by specific values:

1. **Opening the Filter**: Click the filter icon (funnel) next to any column name
2. **Filter Dropdown**: A dropdown appears showing all unique values in that column
3. **Selecting Values**:
   - Click checkboxes to select which values to show
   - "Select All" checkbox toggles all values on/off
   - Selected values are displayed, all others are hidden
4. **Active Filters**: Columns with active filters show a filled filter icon
5. **Clearing Filters**:
   - Click the filter icon again and select "Clear Filter" option
   - Or click "Select All" to show all values again
6. **Multiple Column Filters**: You can apply filters to multiple columns simultaneously
7. **Filter Persistence**: Filters remain active until explicitly cleared or you switch tables

**Use Case:** Quickly narrow down data to specific categories, codes, or values without scrolling through the entire dataset

#### Selecting Records
- Click any checkbox to select individual records
- Use the header checkbox to select/deselect all records
- Selected count is displayed on the "Delete Selected" button
- Multiple records can be selected for bulk deletion

### Adding Records

1. Click the "Add Record" button
2. A modal form appears with fields for all editable columns
3. Fill in the required fields (marked with asterisks)
4. System fields like UserId are automatically populated
5. Click "Save" to create the record
6. The new record appears in the grid immediately

**Note:** Primary keys and system-managed fields are automatically handled.

### Editing Records

1. Click the Edit button next to any record
2. A modal form appears pre-filled with current values
3. Primary key fields are disabled (cannot be changed)
4. Modify any editable fields as needed
5. Click "Save" to update the record
6. Changes are reflected immediately in the grid

### Cloning Records

1. Select exactly one record using the checkbox
2. Click the "Clone Record" button
3. A modal form appears with all values copied from the selected record
4. Primary key fields are empty (new unique values must be provided)
5. Modify fields as needed
6. Click "Save" to create the cloned record

**Use Case:** Quickly create similar records without re-entering all data.

### Deleting Records

#### Single Record Deletion
- Click the Delete icon (trash) next to any record
- Confirm the deletion in the prompt
- Record is permanently removed

#### Multiple Record Deletion
- Select multiple records using checkboxes
- Click "Delete Selected" button
- Confirm bulk deletion in the prompt
- All selected records are removed

**Warning:** Deletions cannot be undone. Ensure records are not referenced by other tables before deleting.

### Excel Export

1. Select a table from the dropdown
2. Click the "Export" button
3. An Excel file is generated containing:
   - All visible columns
   - All records from the current table
   - Proper column headers
4. File downloads automatically with format: `[TableName]_export_[timestamp].xlsx`

**Use Case:** Share data with external stakeholders, create backups, or perform analysis in Excel.

### Excel Import

1. Click the "Import" button
2. Select an Excel file from your computer
3. The system validates:
   - Column names match the table structure
   - Required fields are present
   - Data types are correct
   - No duplicate primary keys
4. Valid records are imported
5. A summary shows successful imports and any errors

**Important Import Rules:**
- First row must contain column headers matching database column names
- Primary keys must be unique
- System columns (UserId, Data_Ins, Data_upd) are automatically managed
- Invalid rows are skipped with error messages

## Best Practices

### Data Entry
- Always provide meaningful descriptions
- Use consistent naming conventions
- Verify codes are unique before saving
- Check for existing similar records before adding new ones

### Bulk Operations
- Export data before performing bulk deletions
- Review all selected records before confirming deletion
- Use import feature to restore data if needed

### Data Integrity
- Check foreign key relationships before deleting records
- Use the Data Integrity page to verify relationships
- Coordinate with other users before making major changes

### Versioning
- All changes are tracked in the versioning system
- Records are linked to the current working version
- Published versions are read-only snapshots

## Troubleshooting

### Cannot Save Record
- **Required fields missing**: Fill in all fields marked with asterisk (*)
- **Duplicate primary key**: Choose a different code/ID
- **Invalid data format**: Check field requirements (numbers, dates, length)
- **Foreign key violation**: Referenced record must exist in related table

### Import Fails
- **Column mismatch**: Ensure Excel headers match exact column names
- **Data type error**: Verify dates, numbers are in correct format
- **Missing required field**: All required columns must have values
- **Duplicate keys**: Remove duplicate primary keys from import file

### Record Won't Delete
- **Foreign key constraint**: Record is referenced by other tables
- **Insufficient permissions**: Only Super Editors and Administrators can delete
- **System-protected record**: Some records cannot be deleted

### Dropdown Not Showing Options
- **Empty lookup table**: Related table has no records
- **Permission issue**: User may not have access to view related table
- **Database connection**: Check system status

### Missing Records in Grid
- **Active column filter**: Check if any column has a filled filter icon
- **Clear all filters**: Click each active filter and select "Clear Filter"
- **Verify data exists**: Switch to another table and back to refresh
- **Check search filter**: Ensure global search bar is empty

## Related Pages

- **Versioning**: Manage versions and publish reference data
- **Data Integrity**: Check for orphaned records and relationship issues
- **Table List**: Configure which tables appear in Common Codes
- **Activity Logs**: View audit trail of all changes

## Tips

1. Use the **Clone** feature to speed up data entry for similar records
2. **Export** data regularly as backups before major changes
3. Use **Ctrl+F** browser search to quickly find records in large tables
4. The **Select All** checkbox has three states: none, all, and partial selection
5. Sort columns by clicking on column headers
6. Hover over truncated text to see full content in tooltip
7. Use **column filters** to quickly narrow down large datasets to specific values
8. Combine multiple column filters to create complex queries without writing SQL
9. Remember to **clear filters** before exporting if you want the complete dataset

## Support

For additional assistance:
- Contact the system administrator
- Check the Activity Logs for detailed error messages
- Export data before making significant changes
- Coordinate with other users for complex operations

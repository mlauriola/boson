# Table List Configuration

## Overview

The Table List page allows administrators to configure which Common Codes tables are visible in the application interface. It provides centralized control over table visibility and descriptions displayed to users throughout the system.

## Purpose

This page manages:

- Which tables appear in Common Codes dropdown menus
- Short and long descriptions for each table
- Visibility control for end users
- Table metadata and documentation

## Key Features

### Search Functionality

Located at the top of the page:

- **Search Bar**: Type to filter tables by description or table name
- **Real-time Filtering**: Results update as you type
- **Clear Button**: Quickly reset search and show all tables
- **Case-insensitive**: Searches work regardless of capitalization

### Table List Display

The main grid shows all tables registered in the system:

| Column | Description |
|--------|-------------|
| **Description** | Short name displayed in dropdown menus |
| **Table Name** | Actual database table name (read-only) |
| **Visibility** | Whether table appears in Common Codes interface |
| **Long Description** | Detailed explanation of table purpose |
| **Actions** | Edit button to modify table configuration |

### Sorting

Click any column header to sort:

- **Ascending**: Click once
- **Descending**: Click again
- **Reset**: Click a third time
- **Sort Icon**: Shows current sort direction

### Visual Indicators

Rows in the table list use color coding to quickly identify visibility status:

- **Normal (white background)**: Visible tables - shown in interface and included in XML
- **Gray background**: Hidden tables - not shown in interface but included in XML
- **Light red background**: Excluded tables - not shown in interface and excluded from XML

**Tooltips**: Hover over the Visibility column to see a detailed explanation of each status

## Managing Table Configurations

### Editing Table Visibility

1. Locate the table in the list (use search if needed)
2. Click the **Edit** button (pencil icon) in the Actions column
3. A modal opens with the table configuration

### Edit Modal Fields

**Read-Only Fields** (cannot be changed):
- **Description**: Short table name
- **Table Name**: Database table identifier

**Editable Fields**:

#### Visibility *
- **Visible**: Table appears in Common Codes dropdown and is included in XML exports
- **Hidden**: Table does not appear in Common Codes interface but is still included in XML exports
- **Excluded**: Table is hidden from interface AND excluded from DT_Codes XML generation

**Use Cases for Each Option:**

**Visible:**
- Active reference data tables
- Tables requiring regular user management
- Published data for external consumption

**Hidden:**
- System tables not meant for direct user editing
- Tables managed through specialized interfaces
- Internal lookup tables still needed in exports

**Excluded:**
- Test or development tables
- Deprecated tables no longer needed in exports
- Tables with incomplete or draft data
- Internal configuration tables not relevant to DT_Codes

#### Long Description
- Detailed explanation of what the table contains
- Displayed when table is selected in Common Codes
- Helps users understand the table's purpose
- Supports multi-line text

### Saving Changes

1. Modify the **Visibility** dropdown and/or **Long Description**
2. Click **"Save Changes"** button
3. Success message confirms update
4. Changes take effect immediately
5. All users see updated visibility and descriptions

### Canceling Changes

- Click **Cancel** button or **X** in modal header
- Click outside the modal overlay
- Press **ESC** key
- No changes are saved

## Understanding Table Visibility

### Visible Tables

When a table is set to **Visible**:

- Appears in **Common Codes** dropdown menu
- Users can view, add, edit, and delete records
- Included in **Excel exports**
- **Included in DT_Codes XML generation**
- Subject to versioning and publishing
- Shown in **Data Integrity** checks
- Appears in **Activity Logs**
- Row displays with normal styling

### Hidden Tables

When a table is set to **Hidden**:

- Does NOT appear in Common Codes dropdown
- **Still included in DT_Codes XML exports**
- Data still exists in database
- Still tracked in versioning system
- Can be made visible again at any time
- Activity logs retain history
- Administrators can still access via direct database queries
- Row displays with gray background in Table List

### Excluded Tables

When a table is set to **Excluded**:

- Does NOT appear in Common Codes dropdown
- **Excluded from DT_Codes XML generation**
- Not included in published data exports
- Data still exists in database
- Still tracked in versioning system
- Can be changed to Visible or Hidden at any time
- Activity logs retain history
- Useful for development, testing, or deprecated tables
- Row displays with light red background in Table List

## Best Practices

### When to Set Tables as Visible

1. **Active Reference Data**: Currently used lookup tables
2. **Frequently Updated**: Tables with ongoing data maintenance
3. **User-Managed**: Tables that users need to edit directly
4. **Published Content**: Tables included in public exports and XML generation

### When to Set Tables as Hidden

1. **System Tables**: Internal configuration tables still needed in exports
2. **Specialized Access**: Tables requiring custom interfaces but needed in XML
3. **Non-User Editable**: Tables managed programmatically but included in DT_Codes
4. **Technical Tables**: Backend data structures needed for complete exports

### When to Exclude Tables from XML

1. **Test Tables**: Tables used for development or testing purposes
2. **Work in Progress**: Tables being populated before public release
3. **Deprecated Data**: Old tables no longer in active use or needed in exports
4. **Draft Content**: Tables with incomplete or unvalidated data
5. **Internal Use Only**: Configuration tables not relevant to DT_Codes generation

### Description Guidelines

**Short Description (Read-only):**
- Keep concise (appears in dropdown)
- Use title case
- Avoid abbreviations

**Long Description (Editable):**
- Explain the table's purpose clearly
- Mention key fields or relationships
- Provide usage context
- Include any special notes or warnings
- Use complete sentences

**Example Good Long Description:**
```
Defines the disciplines (sports) included in the Commonwealth Games.
Each discipline has a unique 3-character code (e.g., SWM for Swimming).
This table is referenced by many other tables including Event, EventUnit,
and competition results. Changes should be coordinated with technical commission.
```

## Common Workflows

### Making a New Table Visible

**Scenario:** A new lookup table has been created and populated

1. Navigate to **Table List** page
2. Search for the new table name
3. Click **Edit** on the table row
4. Change **Visibility** to **Visible**
5. Add comprehensive **Long Description**
6. Click **Save Changes**
7. Verify table appears in Common Codes dropdown

### Hiding a Deprecated Table

**Scenario:** An old table is no longer needed but data must be retained

1. Search for the table in Table List
2. Click **Edit**
3. Change **Visibility** to **Hidden**
4. Update **Long Description** to note it's deprecated
5. Click **Save Changes**
6. Verify table no longer appears in Common Codes
7. Row will display with gray background

### Excluding a Table from XML Export

**Scenario:** A test table should not be included in DT_Codes XML generation

1. Search for the table in Table List
2. Click **Edit**
3. Change **Visibility** to **Excluded**
4. Update **Long Description** to explain why it's excluded
5. Click **Save Changes**
6. Verify table does not appear in Common Codes
7. Row will display with light red background
8. Table will be skipped during XML export generation

### Updating Table Documentation

**Scenario:** Improve table descriptions for better user guidance

1. Use search to find tables with unclear descriptions
2. Click **Edit** on each table
3. Enhance **Long Description** with:
   - Clear purpose statement
   - Key field explanations
   - Usage guidelines
   - Related tables
4. Save each update
5. Review descriptions in Common Codes interface

## Troubleshooting

### Table Not Appearing in Common Codes

**Possible Causes:**
1. Visibility set to "Hidden" - check Table List settings
2. No records in table - empty tables may not display
3. Cache issue - refresh browser or clear cache
4. User permission issue - check role-based access

**Solution:** Edit table in Table List, ensure Visibility is "Visible"

### Cannot Find Table in List

**Possible Causes:**
1. Search filter active - click Clear Search
2. Sorting hiding results - reset sort order
3. Table not registered in system - contact administrator

**Solution:** Clear all filters and scroll through complete list

### Changes Not Taking Effect

**Possible Causes:**
1. Browser cache - hard refresh (Ctrl+F5)
2. Session issue - log out and log back in
3. Database update delay - wait a few seconds and refresh

**Solution:** Perform hard refresh or restart browser

### Long Description Not Displaying

**Possible Causes:**
1. Description empty or whitespace only
2. Special characters causing display issues
3. Description field not saved properly

**Solution:** Re-edit table and ensure description contains visible text

## Related Pages

- **Common Codes**: Main interface affected by visibility settings
- **Activity Logs**: Records all table configuration changes
- **Data Integrity**: Uses table list for validation scope
- **Versioning**: Table visibility affects published exports

## Support

For questions about table configuration or visibility:
- Check Activity Logs for recent changes
- Coordinate with other administrators before hiding active tables
- Contact system administrator for adding new tables to the system
- Review database schema documentation for table relationships

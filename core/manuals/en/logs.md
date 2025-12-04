# Activity Logs

## Overview

The Activity Logs page provides a comprehensive audit trail of all data modifications made in the Common Codes system. It tracks who changed what data, when, and what the old and new values were, ensuring complete transparency and accountability.

## Purpose

Activity Logs enable:

- Tracking all data changes across all Common Codes tables
- Auditing who made which modifications
- Reviewing historical data values (before and after)
- Investigating data issues or discrepancies
- Compliance and accountability requirements
- Rollback support by identifying previous values

## Key Features

### Filter Section

Located at the top of the page, allows filtering logs by multiple criteria:

#### Start Date
- Select beginning date for log search
- Uses date picker for easy selection
- Leave empty to search from beginning of records

#### End Date
- Select ending date for log search
- Uses date picker for easy selection
- Leave empty to search to most recent records

#### User Filter
- Dropdown showing all users who made changes
- Select specific user to see only their changes
- **"-- All Users --"** shows changes by everyone
- Useful for reviewing specific editor's work

#### Operation Filter
- Filter by type of database operation
- Options:
  - **INSERT**: New records created
  - **UPDATE**: Existing records modified
  - **DELETE**: Records removed
- **"-- All Operations --"**: Shows all operation types

#### Filter Actions

**Apply Filters Button**
- Click to execute search with current filter settings
- Refreshes log table with filtered results
- Loading indicator shows while searching

**Clear Filters Button**
- Resets all filter fields to defaults
- Clears date ranges
- Resets user and operation to "All"
- Refreshes table with all logs

### Activity Log Table

The main grid displays all log entries matching filter criteria:

| Column | Description |
|--------|-------------|
| **ID** | Unique log entry identifier |
| **Date/Time** | When the change occurred (sortable) |
| **User** | Username of person who made the change |
| **Table** | Which Common Codes table was affected |
| **Operation** | INSERT, UPDATE, or DELETE |
| **Old Value** | Data before change (JSON format) |
| **New Value** | Data after change (JSON format) |

### Sorting

Click any column header to sort:

- **First Click**: Sort ascending
- **Second Click**: Sort descending
- **Third Click**: Reset to default (most recent first)
- **Sort Icon**: Indicates current sort direction

**Default Sort:** Most recent changes shown first (descending by Date/Time)

## Understanding Log Entries

### Operation Types

**INSERT**
- **Old Value**: Empty (record didn't exist before)
- **New Value**: Complete new record data
- **Use Case**: Track when new reference data added

**UPDATE**
- **Old Value**: Previous field values
- **New Value**: Updated field values
- **Use Case**: See exactly what changed and by whom

**DELETE**
- **Old Value**: Complete deleted record data
- **New Value**: Empty (record no longer exists)
- **Use Case**: Recover accidentally deleted data

## Common Use Cases

### Finding When Data Changed

**Scenario:** Need to know when a specific Discipline was modified

1. Click **Clear Filters** to reset
2. Select date range if known (optional)
3. Leave **User** as "All Users"
4. Leave **Operation** as "All Operations"
5. Click **Apply Filters**
6. Scroll through results or sort by **Table** column
7. Look for Discipline table entries
8. Review Date/Time and New Value to find the change

### Tracking a User's Changes

**Scenario:** Review all changes made by a specific editor

1. Click **Clear Filters**
2. Select date range (e.g., last week)
3. Select specific user from **User** dropdown
4. Leave **Operation** as "All Operations"
5. Click **Apply Filters**
6. Review complete list of user's modifications
7. Sort by **Table** or **Date/Time** as needed

### Finding Deleted Records

**Scenario:** A Venue record was accidentally deleted, need to recover it

1. Click **Clear Filters**
2. Select approximate date range when deletion occurred
3. Select **DELETE** from **Operation** filter
4. Click **Apply Filters**
5. Sort by **Table** to find Venue entries
6. Locate the deleted record in results
7. Copy values from **Old Value** column
8. Navigate to Common Codes and recreate record

### Investigating Data Discrepancy

**Scenario:** Event codes don't match expected format, need to find when they changed

1. Select date range around when issue noticed
2. Leave **User** and **Operation** as "All"
3. Click **Apply Filters**
4. Sort by **Table** and locate Event entries
5. Review **UPDATE** operations on Event table
6. Compare Old Value vs New Value to find problematic changes
7. Note user who made changes for follow-up

### Compliance Audit

**Scenario:** Need to generate report of all changes in a specific period

1. Set **Start Date** to beginning of audit period
2. Set **End Date** to end of audit period
3. Leave **User** and **Operation** as "All"
4. Click **Apply Filters**
5. Review complete change history
6. Export or screenshot results for audit documentation
7. Sort by different columns to analyze patterns

### Verifying Change Was Made

**Scenario:** Confirm that a correction was applied to data

1. Select date range covering when fix was made
2. Select the user who made the fix (if known)
3. Select **UPDATE** operation
4. Click **Apply Filters**
5. Find the table and record in results
6. Verify **New Value** contains the corrected data
7. Note timestamp for records

## Best Practices

### Regular Log Reviews

**Weekly Review:**
- Check logs for unexpected changes
- Verify all edits were authorized
- Identify training needs based on error patterns
- Ensure data quality standards maintained

**Pre-Publication Review:**
- Review all changes since last publication
- Verify critical table modifications
- Confirm no unauthorized edits
- Document changes for release notes

### Using Logs for Training

**Identify Common Mistakes:**
1. Filter by new user
2. Look for DELETE then INSERT patterns (editing mistakes)
3. Review UPDATE operations with minimal changes (inefficiency)
4. Use examples in training sessions

### Data Recovery

**Best Practices for Recovery:**
1. Find DELETE log entry with exact data
2. Copy Old Value JSON carefully
3. Navigate to Common Codes page
4. Select affected table
5. Click Add Record
6. Manually re-enter values from Old Value
7. Verify foreign key relationships still valid

**Warning:** Recovered data may have different primary key if auto-generated.

### Performance Considerations

**Large Date Ranges:**
- Logs can contain thousands of entries
- Use narrower date ranges for faster results
- Filter by user or table when possible
- Sort strategically to find entries quickly

## Troubleshooting

### No Results Shown

**Possible Causes:**
- Filters too restrictive (date range too narrow)
- Selected user made no changes in period
- Operation filter excludes relevant entries

**Solutions:**
- Click **Clear Filters** and start over
- Expand date range
- Change user to "All Users"
- Try "All Operations"

### Too Many Results

**Possible Causes:**
- Date range too wide
- No filters applied
- Very active editing period

**Solutions:**
- Narrow date range
- Add user filter
- Add operation filter
- Add table-specific search if available

### Cannot Read Old/New Values

**Possible Causes:**
- JSON format unfamiliar
- Values truncated in display
- Complex nested data

**Solutions:**
- Copy value and paste into JSON formatter
- Use browser zoom to see more content
- Look for specific field names in JSON
- Expand browser window for more space

### Slow Loading

**Possible Causes:**
- Large result set
- Server performance
- Network latency

**Solutions:**
- Reduce date range
- Add more filters to narrow results
- Be patient with initial load
- Contact administrator if persistent

## Related Pages

- **Common Codes**: Main interface where logged changes occur
- **User Management**: See who has access to make changes
- **Versioning**: Logs track changes within each version
- **Data Integrity**: Use logs to investigate integrity issues

## Support

For Activity Logs questions:
- Contact administrator for clarification on log entries
- Review JSON format documentation for complex data
- Coordinate with team on data recovery procedures
- Report any missing or suspicious log entries immediately
- Use logs as evidence for data governance discussions

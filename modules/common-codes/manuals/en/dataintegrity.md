# Data Integrity Check

## Overview

The Data Integrity Check page is a diagnostic tool that verifies referential integrity across all Common Codes tables by identifying orphan records where foreign key references point to non-existent values in lookup tables.

## Purpose

Data Integrity checks ensure:

- All foreign key relationships are valid
- No orphan records exist in the database
- Lookup table references are complete and correct
- Data quality is maintained before publication
- Referential integrity constraints are satisfied

## What Are Orphan Records?

**Orphan records** are data entries that reference non-existent parent records. These occur when:

- A foreign key value points to a deleted or missing lookup table entry
- Data was imported without validating references
- Lookup tables were modified after child records created
- Migration or synchronization errors occurred

### Example of Orphan Records

**Scenario:** EventUnit table references Discipline table

| Table | EventUnit (Child) | → | Discipline (Parent) |
|-------|------------------|---|---------------------|
| **Valid** | EventUnit.Discipline = "SWM" | → | Discipline.Code = "SWM" ✓ |
| **Orphan** | EventUnit.Discipline = "XYZ" | → | Discipline.Code = "XYZ" ✗ (doesn't exist) |

The EventUnit record with Discipline "XYZ" is an **orphan** because "XYZ" doesn't exist in the Discipline table.

## Key Features

### Check Integrity Button

Click the **"Check Data Integrity"** button to start the verification:

1. **Database Scan**: System examines all tables with foreign key relationships
2. **Reference Validation**: Checks each foreign key against parent table
3. **Orphan Detection**: Identifies records with invalid references
4. **Results Generation**: Compiles summary and detailed error reports
5. **Display**: Shows results with severity indicators

**Duration:** 10-60 seconds depending on database size

### Verification Results

After the check completes, the page displays:

#### Summary Cards

**Total Issues Found**
- **Critical**: Total number of orphan records detected
- **Color**: Red for errors, Green for no issues
- **Count**: Exact number of referential integrity violations

**Tables Affected**
- Count of tables containing orphan records
- Only tables with issues are shown
- Green if all tables are clean

**Relationships Checked**
- Total number of foreign key relationships examined
- Shows scope of integrity check
- Informational only

#### Detailed Results Table

For each table with orphan records:

| Column | Description |
|--------|-------------|
| **Table Name** | Child table containing orphans |
| **Referenced Table** | Parent table being referenced |
| **Column** | Foreign key column with invalid values |
| **Severity** | Criticality level of the issue |
| **Orphan Count** | Number of invalid references found |
| **Details** | Link to view specific orphan records |

### Severity Levels

| Level | Color | Badge | Meaning |
|-------|-------|-------|---------|
| **Critical** | Red | `CRITICAL` | Data cannot be published, must be fixed |
| **High** | Yellow | `HIGH` | Serious issue, should be fixed soon |
| **Medium** | Blue | `MEDIUM` | Moderate issue, fix when possible |
| **Low** | Green | `LOW` | Minor issue, low priority |

**Note:** Most orphan records are classified as **Critical** because they violate database constraints.

### Orphan Records Details Modal

Clicking **"View Details"** on any table row shows:

**Modal Contents:**
- **Table and Column**: Which field has invalid references
- **Referenced Table**: Parent table that should contain values
- **Orphan Records List**: Table showing each problem record

**Orphan Record Fields:**
- **Primary Key**: Identifies the specific problem record
- **Invalid Value**: The foreign key value that doesn't exist
- **Record Preview**: Additional fields for context

**Actions:**
- Review each orphan record
- Note primary keys for correction
- Export list for batch processing

## Understanding Foreign Key Relationships

### Common Relationships in the System

| Child Table | Foreign Key Column | → | Parent Table | Parent Key Column |
|-------------|-------------------|---|--------------|-------------------|
| EventUnit | Discipline | → | Discipline | Code |
| EventUnit | Venue | → | Venue | Code |
| Event | Discipline | → | Discipline | Code |
| Session | Venue | → | Venue | Code |
| Phase | EventUnit | → | EventUnit | Code |

### Cascade Effects

Fixing orphan records may have cascade effects:

1. **Direct Fix**: Update foreign key to valid parent value
2. **Parent Creation**: Add missing parent record if appropriate
3. **Record Deletion**: Remove child record if no longer needed
4. **Relationship Review**: Verify all related records

## Fixing Orphan Records

### Step-by-Step Fix Process

1. **Run Integrity Check**: Click "Check Data Integrity"
2. **Review Summary**: Note number and severity of issues
3. **Examine Details**: Click "View Details" for each affected table
4. **Document Orphans**: Note primary keys and invalid values
5. **Determine Fix Strategy**:
   - **Update foreign key** to valid value
   - **Add missing parent** record
   - **Delete orphan** if no longer relevant
6. **Apply Fixes**: Use Common Codes page to make corrections
7. **Re-run Check**: Verify all issues resolved
8. **Repeat if Needed**: Until zero issues found

### Fix Strategy Decision Tree

```
Is the referenced value supposed to exist?
├─ YES → Add missing parent record to lookup table
│         Then re-run check
└─ NO → Should the child record exist?
         ├─ YES → Update foreign key to correct existing value
         │         Then re-run check
         └─ NO → Delete the orphan child record
                   Then re-run check
```

### Example Fix Scenario

**Problem Found:**
- Table: EventUnit
- Column: Discipline
- Referenced Table: Discipline
- Orphan Count: 3
- Invalid Values: "ATH", "TEN", "CYC"

**Investigation:**
1. Check if "ATH", "TEN", "CYC" should exist in Discipline table
2. Confirm these are Athletics, Tennis, Cycling
3. Realize Discipline table is incomplete

**Solution:**
1. Navigate to Common Codes page
2. Select Discipline table
3. Add records:
   - Code: ATH, Description: Athletics
   - Code: TEN, Description: Tennis
   - Code: CYC, Description: Cycling
4. Return to Data Integrity page
5. Re-run check
6. Verify 3 orphans resolved

## Best Practices

### Before Publication

**Always run Data Integrity check before publishing:**
1. Run check on working version
2. Fix all Critical and High severity issues
3. Document remaining Medium/Low issues
4. Re-run check to confirm clean
5. Proceed with publication

### After Data Import

**Verify imported data immediately:**
1. Complete Excel import on Common Codes page
2. Navigate to Data Integrity page
3. Run integrity check
4. Fix any orphans introduced by import
5. Confirm clean before continuing

### Regular Maintenance

**Schedule periodic checks:**
- Weekly during active data entry
- Daily during pre-event preparation
- After major data updates
- Before each publication
- After bulk delete operations

### Coordination with Team

**Communicate about fixes:**
1. Note who is fixing which orphans
2. Avoid simultaneous edits on same tables
3. Document fix decisions
4. Update team on completion
5. Re-run check after all fixes applied

## Common Orphan Causes

### Deleted Parent Records

**Cause:** Parent record deleted but children still reference it
**Example:** Venue deleted but Sessions still reference it
**Prevention:** Check dependencies before deleting lookup table entries

### Incomplete Lookup Tables

**Cause:** Lookup table not fully populated
**Example:** Some Discipline codes used but not defined
**Prevention:** Complete all lookup tables before child data entry

### Data Import Errors

**Cause:** Excel import with invalid foreign key values
**Example:** Imported EventUnits with non-existent Venue codes
**Prevention:** Validate import file against lookup tables first

### Typos in Data Entry

**Cause:** Manual entry error in foreign key field
**Example:** Typed "SWN" instead of "SWM" for Swimming
**Prevention:** Use dropdown menus for foreign key fields

### Migration Issues

**Cause:** Database migration or synchronization problems
**Example:** Parent table data not migrated completely
**Prevention:** Verify referential integrity after migrations

## Troubleshooting

### Check Takes Too Long

**Possible Causes:**
- Large database with many relationships
- Server performance issues
- Network latency

**Solutions:**
- Run during off-peak hours
- Contact administrator for optimization
- Be patient, check is thorough

### No Issues Shown But Problems Exist

**Possible Causes:**
- Check not completed
- JavaScript error preventing display
- Browser cache issue

**Solutions:**
- Refresh page and re-run check
- Check browser console for errors
- Try different browser
- Clear cache and cookies

### Cannot Fix Orphans

**Possible Causes:**
- Permission denied - need Super Editor or Administrator role
- Table locked by another user
- Validation errors in fix attempt

**Solutions:**
- Verify user role and permissions
- Coordinate with team on table access
- Review validation messages carefully

### Orphans Keep Reappearing

**Possible Causes:**
- Multiple users editing simultaneously
- Automated process creating orphans
- Incomplete fix (didn't fix all occurrences)

**Solutions:**
- Coordinate data entry timing
- Fix all orphans in batch
- Check for automated integrations
- Contact administrator

### Details Modal Won't Open

**Possible Causes:**
- Too many orphans (performance issue)
- JavaScript error
- Browser compatibility

**Solutions:**
- Limit orphan details to manageable number
- Check browser console for errors
- Try different browser
- Export results for external analysis

## No Issues Found

**Success Screen:**

When no integrity issues exist:
- **Green checkmark icon** displayed
- **"No integrity issues found"** message
- **Summary**: All relationships validated successfully
- **Action**: Ready to proceed with publication

This is the ideal state before publishing a version.

## Permissions

- **Page Access**: Administrator and Super Editor
- **Run Check**: Administrator and Super Editor
- **View Results**: Administrator and Super Editor
- **Fix Issues**: Requires permissions on affected tables (Common Codes access)

## Technical Notes

- Integrity check runs via `/api/dataintegrity/check` endpoint
- Examines foreign key constraints in `_TableList` metadata
- Uses database queries to identify missing parent records
- Results cached temporarily for quick re-display
- Check runs on current working version only
- Does not modify data, only reports issues

## Related Pages

- **Common Codes**: Fix orphan records by editing data
- **Versioning**: Ensure integrity before publishing versions
- **RSC Codes**: Another type of data validation check
- **Activity Logs**: Track who fixed orphan records

## Support

For data integrity questions:
- Review referential integrity documentation
- Coordinate fixes with data team
- Contact administrator for complex issues
- Export orphan details for offline analysis
- Check Activity Logs for recent changes affecting relationships

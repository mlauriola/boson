# Versioning Management

## Overview

The Versioning Management page controls the version lifecycle of Common Codes data, allowing administrators to create working versions, manage version metadata, and publish versions for public access. This is the central hub for release management.

## Purpose

Versioning enables:

- Creating snapshots of Common Codes data at specific points in time
- Maintaining separate working and published versions
- Publishing stable releases to public-facing interfaces
- Synchronizing data with external public databases
- Importing data from public databases when creating new versions
- Tracking version history and authorship
- Managing release notes and export files

## Key Concepts

### Version Types

**Working Version (Unpublished)**
- Active version being edited in back office
- Changes made in Common Codes affect this version
- Not visible to public users
- Can be edited, updated, and modified freely
- Only ONE working version exists at a time

**Published Version**
- Stable, read-only snapshot visible to public
- Displayed on ViewCommonCodes public page
- Available for Excel and ODF exports
- Cannot be edited (data is frozen)
- Multiple published versions can exist in history

### Version Status Indicators

The Status column displays one of four possible values that describe the version's current state:

| Status | Color | Meaning |
|--------|-------|---------|
| **PUBLISHED/WORKING** | Purple | This version is both published (visible to public) AND the current working version (editable). This occurs when you publish the most recently created version. |
| **PUBLISHED** | Purple | This version is published and visible to public, but is not the current working version. This is a historical published version. |
| **WORKING VERSION** | Cyan | This is the current working version being edited in the back office. It is not yet published and not visible to public users. |
| **ARCHIVE** | Gray | Historical version that is neither published nor the working version. These are previous snapshots kept for record-keeping. |

**Important Notes:**
- Only ONE version can have "PUBLISHED" or "PUBLISHED/WORKING" status at a time (the currently published version)
- Only ONE version can be the "WORKING VERSION" at a time (the most recently created version)
- When you create a new version, the previous working version becomes "ARCHIVE"
- When you publish a different version, the previous published version becomes either "WORKING VERSION" (if it's the latest) or "ARCHIVE"

## Key Features

### Search Functionality

Located at the top of the page:

- **Search Bar**: Filter versions by release name, author, or description
- **Real-time Filtering**: Results update as you type
- **Clear Button**: Reset search and show all versions
- **Case-insensitive**: Works regardless of capitalization

### Version List Display

The main grid shows all versions in the system:

| Column | Description |
|--------|-------------|
| **Radio Button** | Select version for publication |
| **Code** | System-generated version identifier |
| **Status** | PUBLISHED/WORKING, PUBLISHED, WORKING VERSION, or ARCHIVE |
| **Release** | Version name (e.g., "Release 1.0") |
| **Date Updated** | Last modification timestamp |
| **Author** | User who created the version |
| **Description** | Brief version summary |
| **Actions** | Edit and Delete buttons |

### Sorting

Click column headers to sort:

- **First Click**: Sort ascending
- **Second Click**: Sort descending
- **Third Click**: Reset to default
- **Sort Icon**: Shows current direction

## Managing Versions

### Creating a New Version

1. Click the **"Add Version"** button
2. Fill in the Add New Version form:

**Required Fields**:
- **Release**: Version name (e.g., "Release 2.0", "Pre-Games Update")

**Optional Fields**:
- **Description**: Brief summary of changes
- **Release Message**: Rich-text message for public display
- **Import data from Public Database**: Checkbox option (see below)

3. Click **"Add Version"**
4. Confirmation modal appears explaining impact
5. Click **"Yes, Create Version"** to confirm

**What Happens:**
- New version becomes the WORKING version
- All previous working data copied to new version (unless Import option is selected)
- New version has status "WORKING VERSION" (cyan)
- Previous working version becomes "ARCHIVE"
- Users immediately start editing new version
- Public still sees previously published version

**Important:** Creating a version does NOT publish it. The new version is a working copy.

### Import from Public Database Option

When creating a new version, you can optionally check **"Import data from Public Database"**:

**Purpose:**
- Initialize the new version with data from the public Common Codes database
- Useful when starting fresh from an external data source
- Replaces the default behavior of copying from the previous working version

**How It Works:**
1. Check the "Import data from Public Database" checkbox
2. The label shows which database will be used (configured in CC_SYNC_DATABASE)
3. Create the version
4. System copies all Common Codes tables from the public database
5. Progress modal shows import status with table count

**Use Cases:**
- Starting a new event edition from a master database
- Synchronizing back office with an external data source
- Resetting to a known clean state from the public database

**Important Notes:**
- This replaces ALL data in the new working version
- Previous back office changes not in the public database will be lost
- The import is performed during version creation, not after
- If import fails, the version is still created but may have incomplete data

### Editing Version Metadata

1. Locate the version in the list
2. Click the **Edit** button (pencil icon)
3. Edit Version modal opens

**Read-Only Fields**:
- **Release**: Cannot be changed after creation
- **Published**: Shows publication status
- **Author**: Original creator

**Editable Fields**:
- **Description**: Update version summary
- **Release Message**: Update public-facing release notes

4. Click **"Update Version"** to save changes

**Note:** You can edit metadata of any version, but you can only edit DATA in the working version.

### Release Message Editor

The Release Message uses a rich-text editor (Quill.js):

- **Formatting**: Bold, italic, underline, strikethrough
- **Lists**: Bulleted and numbered lists
- **Headings**: Different heading levels
- **Links**: Hyperlinks to external resources
- **Alignment**: Left, center, right, justify
- **Colors**: Text and background colors

**Use Case:** Announce what changed in this version, notable additions, corrections, or important notes for data consumers.

### Deleting a Version

1. Click the **Delete** button (trash icon)
2. Delete Version modal appears with warnings
3. Review warnings carefully:
   - All data associated with this version will be permanently lost
   - Version removed from history
   - Action cannot be undone
4. Click **"Yes, Delete Version"** to confirm

**Important Restrictions:**
- Cannot delete currently published version (unpublish first)
- Cannot delete working version if it's the only version
- Deletion is permanent and unrecoverable

## Publishing Workflow

### Understanding Publication

Publishing a version:
- Makes version data visible on ViewCommonCodes public page
- Freezes version data (no further edits)
- Generates Excel and ODF export files
- Updates release notes display
- Automatically unpublishes previous version

### Publishing an Archive Version

1. Select the archive version using its radio button
2. Click the **"Publish"** button in header actions
3. Confirmation modal appears
4. Click **"Yes, Publish Version"**
5. Publication progress modal shows tasks:
   - Activating publication flag
   - Generating release notes
   - Generating DT_CODES export
   - Generating Excel export
   - Syncing to Public Database
6. Progress bar shows completion
7. Each task shows success (green checkmark) or warning (yellow) status
8. Status changes to "PUBLISHED" (purple)
9. Previous published version changes to "ARCHIVE" or "WORKING VERSION" (if it's the latest)

### Publishing the Working Version

1. Select the working version (cyan status showing "WORKING VERSION")
2. Click **"Publish"** button
3. **Special warning modal** appears:
   - Publishing working version means current work-in-progress goes public
   - Front-end users see changes immediately
   - Any incomplete work becomes public
4. Click **"Yes, Continue"** if ready
5. Publication confirmation modal appears
6. Click **"Yes, Publish Version"**
7. Publication process executes
8. Working version status changes to "PUBLISHED/WORKING" (purple)
9. Previous published version (if any) becomes "ARCHIVE"

**Use Case:** Final release after all editing complete and verified.

### Publication Tasks

During publication, the system executes five tasks shown in a progress modal:

1. **Sets Publication Flag**
   - Updates database to mark version as published
   - Unpublishes previous version

2. **Generates Release Notes**
   - Compiles modified tables list
   - Formats release message for display

3. **Generates DT_CODES Export**
   - Exports all tables in ODF XML format
   - Creates ZIP file with all XML files
   - Downloadable from ViewCommonCodes page

4. **Generates Excel Export**
   - Creates Excel workbook from template
   - Populates all Common Codes tables
   - One worksheet per table
   - Downloadable from ViewCommonCodes page

5. **Syncs to Public Database**
   - Copies all Common Codes data to the public database
   - Public database is configured via CC_SYNC_DATABASE in the .env file
   - Ensures external systems have access to the latest published data
   - Shows number of tables synchronized upon completion

**Duration:** Typically 30-60 seconds depending on data size and number of tables.

**Note:** Steps 4 (Excel) and 5 (Public DB Sync) are non-blocking. If either fails, the publication will still succeed, but warnings will be displayed in the progress modal.

## Export Files

### Excel File

- Complete workbook with all published tables
- One worksheet per table based on RefFoglioExcel from _TableList
- Column headers match database column names
- Only visible tables included (IdRole_View=5 AND HasToBeManaged!=2)
- Generated from CG2026_Template.xlsx template
- Generated automatically on publication
- Downloadable from ViewCommonCodes page "Excel" button

**File Name Format:** `EXCELVersion{Release}_Export.xlsx`
**Example:** `EXCELVersion1.0_Export.xlsx`

**Table Selection:**
- Only tables configured as visible in _TableList
- Tables with HasToBeManaged=2 (Excluded) are skipped
- Empty tables are skipped

**Column Matching:**
- Only columns that exist in both Excel template and database are populated
- Column names must match exactly (case-insensitive)
- HTML tags are stripped from text fields

### DT_CODES File (ODF XML)

- ODF Common Codes Definition compliant format
- All tables exported as individual XML files
- All XML files combined into single ZIP archive
- Used by ODF-compliant systems
- Generated automatically on publication
- Downloadable from ViewCommonCodes page "DT_CODES" button

**File Name Format:** `DT_CODESVersion{Release}_Export.zip`
**Example:** `DT_CODESVersion1.0_Export.zip`

**Contents:** ZIP archive containing multiple .xml files (one per table)

## Common Workflows

### Standard Release Cycle

1. **Start Work**: Create new version "Release 2.0"
2. **Edit Data**: Make changes in Common Codes page
3. **Verify Data**: Run Data Integrity and RSC checks
4. **Test**: Review data thoroughly
5. **Prepare Metadata**: Edit version, add release message
6. **Publish**: Publish working version when ready
7. **System Auto-Creates**: New working version for next cycle

### Pre-Event Data Freeze

**Scenario:** Lock data before competition starts

1. Verify working version is clean
2. Publish working version
3. New working version created but not edited
4. Public sees frozen published data
5. After event, resume editing new working version

### Rollback to Previous Version

**Scenario:** Current published version has errors

1. Locate correct historical version
2. Select via radio button
3. Click "Publish"
4. Previous good version becomes published
5. Erroneous version becomes historical
6. Fix data in working version for future

### Version Cleanup

**Scenario:** Too many old versions cluttering list

1. Identify versions no longer needed
2. Ensure not published or working
3. Delete old historical versions
4. Keep significant milestone versions for history

## Best Practices

### Version Naming

**Good Names:**
- "Release 1.0" - Clear version number
- "Pre-Games Update" - Context-specific
- "Post-Swimming Corrections" - Descriptive change

**Poor Names:**
- "Version 1" - Too generic
- "Test" - Not descriptive
- "New" - Meaningless over time

### Release Messages

**Should Include:**
- Summary of what changed
- Number of tables modified
- Important corrections or additions
- Known issues or limitations
- Contact information for questions

**Example:**
```
Release 2.0 - Pre-Games Update

This release includes:
- Updated venue information with finalized locations
- Corrected discipline codes for aquatics events
- Added 15 new event units for team sports
- Fixed RSC code format errors in athletics

5 tables were modified in this release.

For questions, contact data@games2026.com
```

### Publication Timing

**Best Times to Publish:**
- After thorough data verification
- During low-traffic periods
- Before major milestones or events
- After stakeholder approval

**Avoid Publishing:**
- During active data entry
- Without data integrity checks
- With known errors or issues
- During competition hours

## Public Database Configuration

The system can synchronize Common Codes with an external public database. This is configured in the backend `.env` file:

```
CC_SYNC_DATABASE=CCDefinition_ICS2025_BAKU
```

### Two-Way Synchronization

**During Publication (Export):**
- When you publish a version, data is automatically copied TO the public database
- All Common Codes tables are synchronized
- External systems can read the latest published data

**During Version Creation (Import):**
- When creating a new version with "Import from Public Database" checked
- Data is copied FROM the public database into the new working version
- Useful for initializing from an external master source

### Configuration

The public database name is displayed in the UI:
- In the Add Version modal, under the import checkbox
- Shows the currently configured database name

**To change the public database:**
1. Edit the `.env` file in the backend folder
2. Update `CC_SYNC_DATABASE` to the desired database name
3. Restart the server for changes to take effect

**Requirements:**
- The public database must exist on the same SQL Server instance
- Tables must have compatible schemas
- The server must have appropriate permissions

## Troubleshooting

### Cannot Create Version

**Possible Causes:**
- Working version already exists - there can only be one
- Permission denied - check user role
- Database error - contact administrator

### Publication Fails

**Possible Causes:**
- Data integrity errors - run Data Integrity check first
- RSC code validation failures - run RSC verification
- Export file generation error - check file paths and permissions
- Server timeout - large dataset may need optimization

**Solution:** Review error message, fix underlying issues, try again

### Public Database Sync Fails

**Possible Causes:**
- Public database does not exist - check CC_SYNC_DATABASE setting
- Database connection error - verify SQL Server connectivity
- Permission denied - check database user permissions
- Schema mismatch - tables must have compatible structures

**Solution:**
- Verify the database name in .env is correct
- Check that the database exists on the SQL Server
- Publication will still succeed even if sync fails (non-blocking)

### Working Version Missing

**Cause:** Accidentally deleted or none created yet
**Solution:** Create new version - system requires at least one working version

### Release Notes Not Displaying

**Possible Causes:**
- Message field empty - edit version and add content
- HTML formatting issues - check Quill editor output
- Publication not complete - wait for publication to finish

### Export Files Not Generating

**Possible Causes:**
- File path incorrect - check paths in version metadata
- Permissions issue - server may lack write access
- Server storage full - contact administrator

**Solution:** Edit version metadata with correct paths and re-publish

## Related Pages

- **Common Codes**: Edit data in working version
- **View Common Codes**: Public display of published version
- **Data Integrity**: Verify data before publication
- **RSC Codes**: Validate RSC fields before publication
- **Activity Logs**: Track version creation and publication history

## Support

For versioning questions:
- Review version lifecycle documentation
- Coordinate publication timing with team
- Run integrity checks before publishing
- Contact administrator for publication issues
- Check Activity Logs for version history

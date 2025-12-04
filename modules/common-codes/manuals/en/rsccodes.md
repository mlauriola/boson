# RSC Code Verification

## Overview

The RSC Code Verification page is an administrative tool for validating that all Result System Code (RSC) fields in the database are correctly populated according to the ODF Common Codes Definition specifications.

## Purpose

RSC codes are critical identifiers used to uniquely identify competition results information. This page ensures:

- All RSC fields follow the correct 34-character format
- Each component (Discipline, Gender, Event, Phase, Unit) is valid
- Data integrity is maintained across all tables
- ODF compliance is verified before publication

## What is an RSC Code?

The **Result System Code (RSC)** is a 34-character code that uniquely identifies information regarding the results of competitions. The code structure is hierarchical and follows this exact format:

### RSC Structure (34 characters total)

```
Position:  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34
           D  D  D  G  E  E  E  E  E  E  E  E  E  E  E  E  E  E  E  E  E  E  P  P  P  P  U  U  U  U  U  U  U  U
```

### Components Breakdown

| Component | Positions | Length | Description | Example |
|-----------|-----------|--------|-------------|---------|
| **D** - Discipline | 1-3 | 3 chars | Sport discipline code | `SWM` (Swimming), `ATH` (Athletics) |
| **G** - Gender | 4 | 1 char | Gender category | `M` (Men), `W` (Women), `X` (Mixed) |
| **E** - Event | 5-22 | 18 chars | Event type + modifiers | Event code padded with spaces |
| **P** - Phase | 23-26 | 4 chars | Competition phase | `FNL-` (Final), `SEMI` (Semi-final) |
| **U** - Unit | 27-34 | 8 chars | Unit and sub-unit | Match, heat, or group number |

### RSC Code Examples

**Example 1: Swimming Men's 100m Freestyle Final**
```
SWM M 100MFREESTYLE    FNL- FINAL
└─┬─┘ │ └──────┬─────┘ └─┬─ └──┬───
  D   G    E (18)        P    U (8)
```

**Example 2: Athletics Women's 4x100m Relay Semi-Final Heat 2**
```
ATH W 4X100MRELAY      SEMI HEAT2
└─┬─┘ │ └──────┬─────┘ └─┬─ └──┬───
  D   G    E (18)        P    U (8)
```

## Key Features

### Verification Process

Click the **"Verify RSC Codes"** button to start the verification process:

1. **Database Scan**: System scans all tables with RSC fields
2. **Format Validation**: Checks 34-character length and structure
3. **Component Validation**: Verifies each component against lookup tables
4. **Error Detection**: Identifies invalid, missing, or malformed codes
5. **Results Display**: Shows summary and detailed error reports

### Verification Results

After verification completes, the page displays:

#### Summary Cards

- **Total Tables Checked**: Number of tables with RSC fields examined
- **Tables with Errors**: Count of tables containing invalid codes
- **Total Errors Found**: Total number of RSC validation failures

#### Detailed Results Table

For each table with issues:

- **Table Name**: Which table contains errors
- **Status**: Overall validation status (Success/Error)
- **Error Count**: Number of invalid RSC codes found
- **Details Link**: Click to see specific error details

### Error Details Modal

Clicking "View Details" on any table shows:

- **RSC Value**: The actual invalid RSC code found
- **Error Type**: What validation rule failed
- **Primary Key**: Identifies the specific record
- **Recommendations**: Suggested fixes or corrections

## Common RSC Errors

### Format Errors

**Length Issues**
- RSC code not exactly 34 characters
- Missing padding spaces
- Truncated components

**Example:**
```
SWM M 100MFREE FNL  (Only 18 chars - INVALID)
```

### Component Errors

**Invalid Discipline Code**
- Discipline not in Discipline table
- Typo in discipline abbreviation
- Incorrect 3-character format

**Example:**
```
SWI M 100MFREESTYLE    FNL- FINAL    (SWI invalid - should be SWM)
```

**Invalid Gender Code**
- Gender not M, W, or X
- Empty gender field
- Incorrect character

**Example:**
```
SWM F 100MFREESTYLE    FNL- FINAL    (F invalid - should be W)
```

**Invalid Event Code**
- Event not found in Event table
- Incorrect padding
- Missing event type

**Invalid Phase Code**
- Phase not in Phase table
- Incorrect 4-character format
- Missing trailing spaces/dashes

**Invalid Unit Code**
- Unit format incorrect
- Invalid unit type
- Missing padding

## Best Practices

### Before Verification

1. **Check lookup tables** first: Discipline, Gender, Event, Phase, Unit tables must be complete
2. **Review recent changes**: Check Activity Logs for recent RSC field updates
3. **Backup data**: Export tables before making corrections
4. **Coordinate with team**: Notify other editors of verification timing

### After Verification

1. **Review all errors**: Don't ignore any validation failures
2. **Fix systematically**: Address one table at a time
3. **Re-verify**: Run verification again after corrections
4. **Document changes**: Use descriptive update notes

### Correction Workflow

1. **Export error report**: Save verification results
2. **Identify pattern**: Look for systematic errors
3. **Correct in Common Codes**: Use admin interface to fix records
4. **Verify again**: Ensure all errors resolved
5. **Update activity log**: Document corrections made

## Troubleshooting

### All Tables Showing Errors

**Cause**: Lookup tables (Discipline, Event, Phase, Unit) may be incomplete
**Solution**:
- Check that reference tables are populated
- Verify discipline codes match ODF standards
- Ensure all required phases and units are defined

### Specific Table Always Fails

**Cause**: Systematic data entry error or migration issue
**Solution**:
- Review table structure and RSC field definitions
- Check if RSC codes were imported correctly
- Verify foreign key relationships to lookup tables

### RSC Codes Changed After Publication

**Cause**: Manual edits to published version data
**Solution**:
- Verify changes in unpublished working version
- Re-publish with corrected RSC codes
- Update exported ODF files

### Verification Takes Too Long

**Cause**: Large dataset or server performance
**Solution**:
- Run verification during off-peak hours
- Contact system administrator for performance optimization
- Consider table-by-table verification if available

## Related Pages

- **Common Codes**: Fix invalid RSC field values
- **Activity Logs**: Review who made RSC field changes
- **Versioning**: Ensure corrected codes are in working version
- **Data Integrity**: Check for orphan lookup table references

## Support

For RSC code questions or ODF specification clarification:
- Consult ODF Common Codes Definition documentation
- Contact the data integrity administrator
- Review competition format specifications
- Check with technical commission for sport-specific rules

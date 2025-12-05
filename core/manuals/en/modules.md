# Module Management

## Overview

The Module Management page provides administrators with control over the system's modular architecture. You can view the status of all installed modules and enable or disable them as needed to tailor the system's functionality.

## Purpose

This page enables administrators to:

- View a list of all system modules.
- Distinguish between Core (system) and Standard modules.
- Enable or disable specific modules.
- View role-based access requirements for each module.

## Key Features

### Module List

The main table displays all available modules:

| Column | Description |
|--------|-------------|
| **Module Name** | The system identifier for the module. Includes badges for **System** (Core) vs **Module** (Standard). |
| **Description** | A brief explanation of the module's purpose. |
| **Path** | The file path where the module resides (useful for debugging). |
| **Role Access** | Which user roles have permission to access this module. |
| **Status** | A toggle switch indicating if the module is active (Blue) or inactive (Gray). |

### Core vs. Standard Modules

- **System (Core) Modules**: These are essential for the basic operation of the BOS (e.g., User Management, Authentication). They appear with a grey `System` badge and cannot be disabled. The toggle switch will be locked.
- **Standard Modules**: Optional features (e.g., Specific Sport Modules). These appear with a `Module` badge and can be toggled on or off.

### Making Changes

1.  **Toggle Modules**: Click the switch in the "Status" column to enable or disable a module.
2.  **Modified Indicator**: When you change a switch, a yellow "Modified" badge will appear next to the module name, indicating pending changes.
3.  **Save Changes Button**: The "Save Changes" button at the top becomes active only when there are unsaved modifications.

### Saving and Server Restart

**Important:** Changing the active modules configuration requires a server update.

1.  Click **"Save Changes"**.
2.  A **Confirmation Modal** will appear, listing exactly which modules will be enabled or disabled.
3.  Review the changes carefully.
4.  Click **"Confirm & Restart"**.
5.  The system will save the configuration and may perform a quick restart to load the new module map. The page will reload automatically.

## details on Status Badges

- **Modified**: Indicates the local state differs from the saved state. You must save to apply.
- **System**: Indicates a protected core component.
- **Module**: Indicates a standard, manageable component.

## Troubleshooting

### "Save Changes" is Disabled
- This is normal if you haven't toggled any switches yet. The button only enables when there is a change to save.

### Toggle is Stuck/Disabled
- Check if the module is marked as "System". Core system modules cannot be disabled to prevent breaking the application.

### Error Saving
- If you receive an error message upon saving, check the browser console for details.
- Ensure the server process has write permissions to the configuration files.

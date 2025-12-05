# User Management

## Overview

The User Management page allows administrators to create, edit, and manage user accounts for the back office system. This is the central interface for controlling access and permissions.

## Purpose

User Management enables:

- Creating new user accounts with appropriate roles
- Editing user information and permissions
- Managing passwords and recovery settings
- Controlling role-based access
- Multi-user deletion for cleanup operations

## Key Features

### Search Functionality

Located at the top of the page:

- **Search Bar**: Filter users by username, email, or phone
- **Real-time Filtering**: Results update as you type
- **Clear Button**: Reset search and show all users
- **Case-insensitive**: Works regardless of capitalization

### User List Display

The main grid displays all registered users:

| Column | Description |
|--------|-------------|
| **Checkbox** | Select users for bulk deletion |
| **Username** | Unique login identifier |
| **Referent** | Person's full name or reference |
| **Email** | Contact email address |
| **Phone** | Contact phone number |
| **Role** | User's permission level |
| **Recovery** | Password recovery status/counter |
| **Actions** | Edit and Delete buttons |

### Sorting

Click column headers to sort:

- **First Click**: Sort ascending
- **Second Click**: Sort descending
- **Third Click**: Reset to default order
- **Sort Icon**: Indicates current sort direction

## User Roles

The system has three predefined roles with different permission levels:

### 1. ADMINISTRATOR (Role ID: 1)

**Full System Access:**
- Complete CRUD operations on all data tables
- User management (create, edit, delete users)
- Data version control
- Table configuration
- Data integrity checks
- Activity log access
- Maintenance mode control

**Use Case:** System managers, technical administrators

### 2. SUPER EDITOR (Role ID: 2)

**Data Management Access:**
- Full CRUD operations on data tables
- Data version control
- Data integrity checks
- Activity log viewing
- Cannot manage users or system settings

**Use Case:** Data managers, content editors, coordinators

### 3. NORMAL EDITOR (Role ID: 3)

**Read-Only Access:**
- View data only
- Cannot add, edit, or delete records
- Cannot manage versions
- Cannot access administrative functions
- Activity log viewing only

**Use Case:** Observers, quality assurance, reporting staff

## Managing Users

### Adding a New User

1. Click the **"Add User"** button
2. Fill in the Add New User form:

**Required Fields** (marked with *):
- **Username**: Unique login identifier (cannot be changed later)
- **Password**: Initial password for the user
- **Email**: Valid email address
- **Role**: Select appropriate permission level

**Optional Fields**:
- **Referent**: User's full name or department
- **Phone**: Contact phone number

3. Click **"Create"** to add the user
4. Success message confirms user creation
5. User can immediately log in with provided credentials

**Important Notes:**
- Usernames must be unique
- Passwords should follow security best practices
- Email is required for password recovery
- Users cannot change their own username

### Editing an Existing User

1. Locate the user in the list (use search if needed)
2. Click the **Edit** button (pencil icon)
3. Edit User modal opens with current values

**Read-Only Fields:**
- **ID**: System-generated user identifier
- **Username**: Cannot be changed after creation

**Editable Fields:**
- **New Password**: Leave blank to keep current password
- **Referent**: Update user's full name
- **Email**: Update contact email (required)
- **Phone**: Update contact phone
- **Role**: Change user's permission level
- **Recovery**: Reset password recovery counter
- **Recovery OTP**: Manage one-time password for recovery

4. Click **"Update"** to save changes
5. Changes take effect immediately
6. User may need to re-login if role changed

### Deleting Users

#### Single User Deletion

1. Click the **Delete** button (trash icon) next to the user
2. Confirm deletion in the prompt
3. User is permanently removed from the system

**Warning:** Deletion cannot be undone. User will lose access immediately.

#### Multiple User Deletion

1. Select users using checkboxes in the first column
2. Click **"Select All"** checkbox in header to select/deselect all
3. **"Delete Selected"** button shows count of selected users
4. Click **"Delete Selected (N)"** button
5. Confirm bulk deletion in the prompt
6. All selected users are removed permanently

**Use Case:** Cleaning up test accounts, removing inactive users, batch operations

## Password Management

### Initial Password

- Set when creating user account
- User should change on first login (recommended)
- Should meet security requirements
- Never reuse passwords

### Changing User Password

**As Administrator:**
1. Edit the user
2. Enter new password in **"New Password"** field
3. Click **"Update"**
4. User must use new password on next login

**Leave Blank to Keep Current:**
- If password field is empty, existing password unchanged
- Useful when updating only other user information

### Password Recovery

**Recovery Counter:**
- Tracks number of password reset requests
- Increments with each recovery attempt
- Can be manually reset to 0 by administrators

**Recovery OTP:**
- One-time password for account recovery
- System-generated when user requests password reset
- Can be manually cleared by administrators

## Best Practices

### User Creation

1. **Use descriptive usernames**: Prefer firstname.lastname format
2. **Strong initial passwords**: At least 8 characters, mixed case, numbers
3. **Accurate email addresses**: Required for password recovery
4. **Appropriate roles**: Grant minimum necessary permissions
5. **Complete referent field**: Helps identify users later

### Role Assignment

1. **Start with lowest permission**: Upgrade if needed
2. **Limit administrators**: Only assign to trusted personnel
3. **Review periodically**: Ensure roles still appropriate
4. **Document changes**: Note why roles were changed

### Account Maintenance

1. **Regular audits**: Review user list periodically
2. **Remove inactive accounts**: Delete users who no longer need access
3. **Update contact information**: Keep emails and phones current
4. **Monitor recovery counters**: High counts may indicate security issues

### Security Guidelines

1. **Never share passwords**: Each user must have unique credentials
2. **Change default passwords**: Users should change initial password
3. **Revoke access immediately**: Delete accounts for departed staff
4. **Use bulk operations carefully**: Double-check before mass deletion

## Common Workflows

### Onboarding a New Team Member

1. Click **"Add User"**
2. Create username (e.g., john.smith)
3. Generate strong temporary password
4. Enter referent name (e.g., "John Smith - Data Team")
5. Add email and phone
6. Assign **NORMAL EDITOR** role initially
7. Save and share credentials securely
8. Upgrade to SUPER EDITOR after training if needed

### Promoting a User

1. Search for user by name or username
2. Click **Edit**
3. Change **Role** to higher permission level
4. Click **Update**
5. Notify user of new permissions

### Handling Departed Staff

1. Search for user account
2. Click **Delete** button
3. Confirm deletion
4. Account removed immediately
5. Review Activity Logs for user's recent changes

### Batch User Cleanup

1. Use search to filter inactive or test users
2. Select checkboxes for users to remove
3. Verify selection count
4. Click **"Delete Selected"**
5. Confirm bulk deletion
6. Users removed permanently

## Troubleshooting

### Cannot Create User - Username Already Exists

**Cause:** Username must be unique
**Solution:** Choose different username or check if user already exists

### User Cannot Login

**Possible Causes:**
1. Incorrect password - reset user's password
2. Account deleted - recreate account if needed
3. Case-sensitive username - verify exact capitalization

### Permission Denied Errors

**Cause:** User's role lacks required permissions
**Solution:** Edit user and upgrade to SUPER EDITOR or ADMINISTRATOR role

### Cannot Delete User

**Possible Causes:**
1. User is currently logged in - ask user to log out
2. System protection - contact system administrator
3. Permission issue - ensure you're logged in as ADMINISTRATOR

### Email Not Received

**Possible Causes:**
1. Incorrect email address - edit user and fix email
2. Email in spam folder - check user's spam
3. Email server issue - contact system administrator

## Related Pages

- **Activity Logs**: Review user actions and changes
- **Change Password**: Users can change their own password
- **Profile**: Users can update their own contact information
- **Login**: Authentication entry point

## Support

For user management questions:
- Review user creation requirements with team lead
- Coordinate role assignments with project manager
- Contact system administrator for technical issues
- Check Activity Logs for recent user-related changes

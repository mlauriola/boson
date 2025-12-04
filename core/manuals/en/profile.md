# My Profile

## Overview

The My Profile page allows users to view and update their personal information including contact details and referent information. This is a self-service page where any authenticated user can manage their own profile data.

## Purpose

This page enables users to:

- View their username and account information
- Update contact email address
- Update phone number
- Update referent/contact person name
- Keep their profile information current

## Key Features

### Profile Form

The profile form contains the following fields:

#### Username (Read-only)
- Your login username
- Cannot be changed after account creation
- Displayed with gray background to indicate non-editable field

#### Referent
- Name of referent or contact person
- Optional field
- Can be updated at any time
- Useful for organizational tracking

#### Email *
- Your contact email address
- **Required field** (marked with asterisk)
- Must be valid email format
- Used for:
  - Password recovery
  - System notifications
  - Administrative contact

#### Phone
- Contact phone number
- Optional field
- Free-text format
- Can include country code or extension

### Update Profile Button

Located at the bottom right of the form:
- Click to save changes
- Validates required fields before submitting
- Shows success or error message after submission
- Updates take effect immediately

## Updating Your Profile

### Steps to Update

1. Navigate to **My Profile** from the sidebar menu
2. Review current information displayed in the form
3. Modify any editable fields as needed:
   - Update **Referent** name if changed
   - Update **Email** address if changed
   - Update **Phone** number if changed
4. Click **"Update Profile"** button
5. Success message confirms changes saved
6. New information is immediately available system-wide

### Field Validation

**Email Requirement:**
- Cannot be empty
- Must contain valid email format (example@domain.com)
- System prevents submission if email invalid

**Optional Fields:**
- Referent and Phone can be left empty
- No format validation on phone field
- Free-text entry allowed

## Common Use Cases

### Updating Email Address

**Scenario:** You changed your work email and need to update the system

1. Go to **My Profile**
2. Click in the **Email** field
3. Delete old email address
4. Type new email address
5. Click **"Update Profile"**
6. Confirmation message appears
7. New email now used for password recovery

**Important:** Make sure the new email is accessible before changing, as password recovery emails will be sent there.

### Adding Contact Phone

**Scenario:** You want to add a phone number for administrator contact

1. Navigate to **My Profile**
2. Find the **Phone** field
3. Enter your phone number (any format accepted)
4. Examples:
   - `+44 141 123 4567`
   - `0141 123 4567`
   - `ext. 1234`
5. Click **"Update Profile"**
6. Phone number now visible to administrators

### Updating Referent Information

**Scenario:** Your organizational referent changed

1. Go to **My Profile**
2. Update **Referent** field with new name
3. Click **"Update Profile"**
4. New referent recorded in system

## Best Practices

### Email Address

**Recommendations:**
- Use work email for official accounts
- Ensure email is actively monitored
- Update immediately if email changes
- Test password recovery after updating email

**Avoid:**
- Personal emails for organizational accounts
- Shared mailbox addresses
- Temporary or disposable email addresses

### Phone Number

**Recommendations:**
- Include country/area code for clarity
- Add extension if applicable
- Use consistent format across organization
- Keep updated if number changes

**Example Formats:**
- International: `+44 141 555 1234`
- National: `0141 555 1234`
- With extension: `+44 141 555 1234 ext. 567`

### Regular Updates

- Review profile information quarterly
- Update immediately when contact details change
- Verify email is still valid
- Check that referent information is current

## Troubleshooting

### Cannot Update Profile

**Possible Causes:**
- Email field empty - email is required
- Invalid email format - check for typos
- Network connection issue - check internet
- Session expired - log out and log back in

**Solution:** Ensure email field contains valid email address

### Changes Not Saving

**Possible Causes:**
- Form validation error - check for error messages
- Clicking outside form instead of Update button
- Browser cache issue - hard refresh page
- Server error - contact administrator

**Solution:** Click the "Update Profile" button and wait for confirmation message

### Email Not Working for Password Recovery

**Possible Causes:**
- Email address has typo - verify spelling
- Email in spam folder - check spam/junk
- Old email still cached - log out and back in
- Email server issue - contact IT support

**Solution:** Verify email address is correct, try updating profile again

### Success Message Not Appearing

**Possible Causes:**
- Page scrolled down - scroll to top to see message
- Message timing - may disappear after a few seconds
- Browser issue - refresh page to verify changes

**Solution:** Refresh page and check if changes were saved

## Related Pages

- **Change Password**: Update your account password
- **Users** (Administrators only): Manage other user accounts
- **Activity Logs**: View history of profile changes

## Support

For profile-related questions:
- Verify email address is accurate and accessible
- Contact administrator if unable to update profile
- Request account review if username needs correction
- Report any technical issues to system support

# Change Password

## Overview

The Change Password page allows authenticated users to update their account password. This is a security feature that enables users to maintain strong password hygiene and update credentials when needed.

## Purpose

This page enables users to:

- Change their current password
- Set a new secure password
- Maintain account security
- Update password after security incidents
- Comply with password expiration policies

## Key Features

### Password Change Form

The form contains three password fields:

#### Current Password *
- Your existing account password
- **Required field** for verification
- Must match current password on file
- Security measure to prevent unauthorized changes
- Eye icon button to show/hide password

#### New Password *
- Your desired new password
- **Required field**
- Must meet password requirements:
  - Minimum 8 characters long
  - Must contain letters and numbers
- Eye icon button to show/hide password

#### Confirm New Password *
- Re-enter new password for verification
- **Required field**
- Must exactly match New Password field
- Prevents typos in password entry
- Eye icon button to show/hide password

### Password Visibility Toggle

Each password field has an eye icon button:
- Click to **show** password (plain text)
- Click again to **hide** password (dots)
- Helps verify typing accuracy
- Prevents shoulder surfing when hidden

### Change Password Button

Located at the bottom right:
- Validates all fields before submission
- Checks password requirements
- Shows success or error message
- Automatically logs out after successful change (on some systems)

## Password Requirements

### Minimum Length
- At least **8 characters** long
- Longer passwords are more secure
- Recommended: 12+ characters

### Complexity
- Must contain **letters** (A-Z, a-z)
- Must contain **numbers** (0-9)
- Mix of uppercase and lowercase recommended
- Special characters allowed but not required

### Best Practices
- Avoid common words or phrases
- Don't reuse old passwords
- Don't use personal information (name, birthday)
- Don't use sequential patterns (123456, abcdef)
- Use unique password for this account

## Changing Your Password

### Steps to Change Password

1. Navigate to **Change Password** from sidebar menu
2. Enter your **Current Password**
   - Type carefully or use eye icon to verify
3. Enter your **New Password**
   - Ensure it meets requirements (8+ characters, letters + numbers)
   - Use eye icon to verify typing if needed
4. Enter **Confirm New Password**
   - Type exact same password as New Password field
5. Click **"Change Password"** button
6. Wait for confirmation message
7. If successful, you may be logged out (log in with new password)

### Field Validation

The form validates:

**Current Password:**
- Cannot be empty
- Must match your current password in database
- Error shown if incorrect

**New Password:**
- Cannot be empty
- Must be at least 8 characters
- Must contain both letters and numbers
- Cannot be same as current password

**Confirm Password:**
- Cannot be empty
- Must exactly match New Password field
- Error shown if mismatch

## Common Use Cases

### Routine Password Update

**Scenario:** You want to update your password for security reasons

1. Go to **Change Password**
2. Enter current password
3. Think of a strong new password:
   - Example: `Games2026SecurePW`
   - Mix letters, numbers, and case
4. Enter new password in both fields
5. Click **"Change Password"**
6. Success message appears
7. Use new password for future logins

### Password Compromised

**Scenario:** You suspect someone may know your password

1. **Immediately** navigate to **Change Password**
2. Enter current password
3. Create a completely new, unique password
4. Ensure new password is not related to old one
5. Submit change
6. Notify administrator if suspicious activity detected
7. Log back in with new password

### Forgot Current Password

**Scenario:** You cannot remember your current password

**Solution:** You cannot use Change Password page
- Use **"Forgot Password"** link on login page instead
- Follow password recovery process
- Check email for recovery code
- Set new password through recovery flow

### Password Doesn't Meet Requirements

**Scenario:** Form rejects your new password

**Common Issues:**
- **"Too short"**: Must be 8+ characters
  - Change `pass123` to `password123`
- **"Must contain letters and numbers"**: Add both
  - Change `password` to `password123`
  - Change `12345678` to `games12345`
- **"Passwords don't match"**: Retype carefully
  - Use eye icon to verify both fields match

## Troubleshooting

### Current Password Incorrect

**Error:** "Current password is incorrect"

**Possible Causes:**
- Typo in current password entry
- Caps Lock is on
- Using old password that was already changed
- Password was reset by administrator

**Solutions:**
- Use eye icon to verify current password spelling
- Check Caps Lock key
- Try your most recent password
- If still failing, use Forgot Password recovery
- Contact administrator if locked out

### Passwords Don't Match

**Error:** "Passwords do not match"

**Cause:** New Password and Confirm Password fields contain different values

**Solution:**
- Use eye icon on both fields to compare visually
- Retype both new password fields carefully
- Copy-paste same password to both fields (not recommended for security)
- Ensure no trailing spaces

### Password Too Weak

**Error:** "Password must be at least 8 characters" or "Password must contain letters and numbers"

**Solution:**
- Make password longer (add more characters)
- Add numbers if only letters: `password` → `password123`
- Add letters if only numbers: `12345678` → `games2026`
- Combine letters and numbers throughout

### Cannot Change to Same Password

**Error:** "New password must be different from current password"

**Cause:** New password is identical to current password

**Solution:**
- Choose a different password
- Modify current password slightly (not recommended)
- Create entirely new password (recommended)

### Page Not Responding

**Possible Causes:**
- Network connection lost
- Session expired
- Server error

**Solutions:**
- Check internet connection
- Refresh page and try again
- Log out and log back in
- Contact administrator if persistent

### Changed Password But Cannot Login

**Possible Causes:**
- Typing new password incorrectly
- Caps Lock on during login
- Password cached in browser
- System hasn't updated yet

**Solutions:**
- Type new password carefully at login
- Check Caps Lock key is off
- Clear browser cache and cookies
- Wait 1-2 minutes and try again
- Use Forgot Password if still unable to login

## Security Best Practices

### Strong Password Guidelines

**Do:**
- Use 12+ characters when possible
- Mix uppercase and lowercase letters
- Include numbers throughout (not just at end)
- Consider using passphrases: `Glasgow2026SecureData`
- Change password every 90 days
- Use unique password for this account

**Don't:**
- Use dictionary words alone
- Use personal information (name, birthday, address)
- Use sequential patterns (abc123, 123456)
- Reuse passwords from other accounts
- Share password with anyone
- Write password down in accessible location

### When to Change Password

**Immediately change if:**
- You shared password with someone
- You suspect account compromise
- You logged in on public/shared computer
- Password was exposed in data breach
- Administrator requests password reset

**Regularly change:**
- Every 90 days as best practice
- Before and after major events
- After role or responsibility change
- When leaving for extended period

### After Changing Password

**Remember to:**
- Update password in any saved credentials
- Update password manager if used
- Make note of new password securely
- Test login with new password immediately
- Update mobile apps if applicable

## Related Pages

- **My Profile**: Update email and contact information
- **Login**: Enter credentials to access system
- **Forgot Password**: Recover account if password forgotten
- **Users** (Administrators only): Manage user accounts

## Support

For password-related issues:
- Use **Forgot Password** recovery if current password unknown
- Contact administrator if locked out of account
- Report suspicious activity immediately
- Request password reset from administrator if needed
- Ensure email address in profile is current for recovery

# Reset Password (Password Recovery)

## Overview

The Reset Password page is part of the password recovery workflow, allowing users who have forgotten their password to create a new one. This page is accessed after successfully verifying the OTP (One-Time Password) code sent via email.

## Purpose

This page enables users to:

- Create a new password after forgetting the old one
- Complete the password recovery process
- Regain access to their account without administrator intervention
- Set a secure new password meeting system requirements

## Access Path

This page is reached through the password recovery flow:

1. **Login Page** → Click "Forgot Password" link
2. **Forgot Password Page** → Enter username/email, receive OTP via email
3. **Verify OTP Page** → Enter 6-digit code from email
4. **Reset Password Page** → Set new password (you are here)
5. **Login Page** → Log in with new password

**Note:** You cannot access this page directly. You must complete the OTP verification step first.

## Key Features

### Session Verification

When the page loads:
- Verifies you completed OTP verification
- Checks for valid recovery session
- Redirects to Forgot Password if session expired
- Security measure to prevent unauthorized password resets

### Password Reset Form

The form contains two password fields:

#### New Password *
- Your desired new password
- **Required field**
- Must meet password requirements:
  - Minimum 8 characters long
  - Must contain letters and numbers (validation indicator below form)
- Eye icon button to show/hide password
- Real-time validation feedback

#### Confirm Password *
- Re-enter new password for verification
- **Required field**
- Must exactly match New Password field
- Eye icon button to show/hide password
- Real-time validation feedback

### Password Requirements Indicator

Live validation checklist below password fields:
- **Length requirement**: "Be at least 8 characters long"
  - Turns green with checkmark ✓ when met
- **Match requirement**: "Match in both fields"
  - Turns green with checkmark ✓ when passwords match
- Visual feedback helps ensure valid password before submission

### Password Visibility Toggle

Each password field has an eye icon button:
- Click to **show** password (plain text)
- Click again to **hide** password (dots)
- Helps verify accurate typing
- Prevents errors in password entry

### Reset Password Button

Located at the bottom of the form:
- Validates all requirements before submission
- Shows loading spinner during processing
- Displays success or error message
- Redirects to login page after successful reset

## Password Requirements

### Minimum Length
- At least **8 characters** long
- Longer passwords provide better security
- Recommended: 12+ characters

### Complexity
- Must contain **letters** (A-Z, a-z)
- Must contain **numbers** (0-9)
- Mix of uppercase and lowercase recommended
- Special characters allowed but not required

### Best Practices
- Avoid common words or phrases
- Don't reuse previous passwords
- Don't use personal information (name, birthday)
- Don't use sequential patterns (123456, abcdef)
- Create a unique, memorable password

## Resetting Your Password

### Steps to Reset Password

1. Arrive at Reset Password page (after OTP verification)
2. Read the confirmation message: "Code Verified! You can now set a new password"
3. Enter your **New Password**
   - Type carefully or use eye icon to verify
   - Watch requirements checklist for green checkmarks
4. Enter **Confirm Password**
   - Type exact same password
   - Verify both match using eye icons if needed
5. Verify both requirements show green checkmarks:
   - ✓ Be at least 8 characters long
   - ✓ Match in both fields
6. Click **"Reset Password"** button
7. Loading spinner appears during processing
8. Success message: "Password reset successfully! Redirecting to login..."
9. Automatic redirect to login page (2 seconds)
10. Log in with your new password

### Field Validation

Real-time validation provides feedback:

**New Password:**
- Length indicator turns green at 8+ characters
- Must contain both letters and numbers
- Cannot be empty

**Confirm Password:**
- Match indicator turns green when passwords identical
- Updates as you type
- Cannot be empty

### Visual Feedback

The requirements section provides live feedback:
- **Gray text**: Requirement not yet met
- **Green text with ✓**: Requirement satisfied
- Both must be green before submitting

## Common Use Cases

### Successful Password Reset

**Scenario:** Standard password recovery flow

1. Complete OTP verification step
2. Arrive at Reset Password page
3. Think of strong new password: `Glasgow2026Data`
4. Enter password in New Password field
5. Watch length indicator turn green ✓
6. Re-enter same password in Confirm Password field
7. Watch match indicator turn green ✓
8. Click "Reset Password"
9. Wait for success message
10. Redirected to login automatically
11. Log in with new password

### Password Too Short

**Scenario:** Attempting password shorter than 8 characters

**Example:** Trying password `game26`

**Result:**
- Length requirement stays gray (not green)
- Form prevents submission
- Error message: "Password must be at least 8 characters long"

**Solution:**
- Add more characters: `game2026` (8 characters minimum)
- Better: `glasgow2026` (12 characters, more secure)

### Passwords Don't Match

**Scenario:** Typo in one of the password fields

**Example:**
- New Password: `Glasgow2026`
- Confirm Password: `Glasgow206` (missing last digit)

**Result:**
- Match requirement stays gray (not green)
- Form prevents submission
- Error message: "Passwords do not match"

**Solution:**
- Use eye icons to reveal both passwords
- Compare visually
- Retype confirm password carefully

### Session Expired

**Scenario:** Took too long on reset page or closed browser

**Result:**
- Page redirects to Forgot Password automatically
- Message: "Session expired. Please start over."

**Solution:**
- Start recovery process again
- Request new OTP code
- Complete verification quickly
- Set password immediately after OTP verification

## Troubleshooting

### Automatic Redirect to Forgot Password

**Cause:** Recovery session not found or expired

**Possible Reasons:**
- Did not complete OTP verification step
- Session expired (took too long)
- Closed browser and returned to page
- Tried to access page directly without OTP

**Solution:**
- Return to Forgot Password page
- Enter username/email again
- Check email for new OTP code
- Verify OTP code
- Proceed to Reset Password page

### Password Rejected

**Error:** "Password must be at least 8 characters long"

**Solution:**
- Make password 8 or more characters
- Example: `pass123` → `password123`

**Error:** "Password must contain letters and numbers"

**Solution:**
- Add numbers to letter-only password: `password` → `password123`
- Add letters to number-only password: `12345678` → `glasgow26`

### Passwords Don't Match

**Error:** "Passwords do not match"

**Solution:**
- Click eye icons on both fields
- Verify both passwords visually
- Check for extra spaces
- Retype both fields carefully
- Use copy-paste as last resort (not recommended)

### Reset Button Not Working

**Possible Causes:**
- Requirements not met (not green checkmarks)
- Network connection issue
- JavaScript error in browser

**Solutions:**
- Ensure both requirement indicators are green
- Check internet connection
- Refresh page (will restart recovery flow)
- Try different browser
- Contact administrator if persistent

### Password Reset Fails

**Error:** "Failed to reset password" or similar

**Possible Causes:**
- OTP code expired or already used
- Database error on server
- Network timeout

**Solutions:**
- Start recovery process over
- Request new OTP code
- Try again with fresh session
- Contact administrator if repeated failures

### Cannot Login After Reset

**Scenario:** Password reset successful but login fails

**Possible Causes:**
- Typing new password incorrectly at login
- Caps Lock is on
- Password cached in browser from before
- Database not updated yet

**Solutions:**
- Type password carefully at login
- Check Caps Lock is off
- Clear browser cache
- Wait 1-2 minutes and try again
- Use Forgot Password again if still unable to login
- Contact administrator for help

## Security Best Practices

### Creating a Strong Password

**Good Password Examples:**
- `Glasgow2026Data` (mixed case, includes numbers)
- `CommonCodes2026!` (mixed case, numbers, special char)
- `SecureGames26` (meaningful but not obvious)

**Poor Password Examples:**
- `password` (too common)
- `12345678` (sequential numbers)
- `username123` (contains username)
- `glasgow` (dictionary word, no numbers)

### After Resetting Password

**Important Steps:**
- Log in immediately to verify new password works
- Update password in any saved credentials
- Update password manager if used
- Keep new password secure and private
- Don't share password with anyone

### Preventing Future Lockouts

**Recommendations:**
- Store password securely (password manager recommended)
- Don't write password on paper near computer
- Ensure profile email is current (for recovery)
- Change password regularly but memorably
- Don't reuse passwords from other systems

## Recovery Flow Summary

Complete password recovery workflow:

1. **Forgot Password** → Enter username/email
2. **Email Received** → Contains 6-digit OTP code
3. **Verify OTP** → Enter code from email
4. **Reset Password** → Set new password (this page)
5. **Login** → Access account with new password

**Important:** Each step must be completed in order. You cannot skip steps or go backwards.

## Related Pages

- **Forgot Password**: Start password recovery process
- **Verify OTP**: Enter recovery code from email
- **Login**: Access system after password reset
- **Change Password**: Change password when logged in

## Support

For password recovery issues:
- Ensure you have access to email address on file
- Check spam folder for OTP codes
- Complete recovery steps in order without delays
- Contact administrator if OTP not received
- Request manual password reset from administrator if recovery fails
- Verify profile email is correct before attempting recovery

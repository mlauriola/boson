# Maintenance

## Overview

The Maintenance page allows administrators to manage system-wide maintenance settings and scheduled maintenance notifications. This page provides control over maintenance mode and allows you to communicate planned maintenance windows to users.

## Purpose

This page enables administrators to:

- Enable or disable active maintenance mode
- Customize maintenance messages for users
- Schedule maintenance notifications in advance
- Display informational banners about upcoming maintenance
- Restrict access to the system during maintenance periods
- Control ViewCommonCodes page availability

## Key Features

### Current Status Indicator

Located at the top of the page:

- **System Status: Online** - System is operating normally (green indicator)
- **System Status: Maintenance Mode Active** - System is in maintenance mode (red indicator)
- Real-time display of current maintenance state
- Visible to administrators at all times

### Active Maintenance Mode

**Purpose:** Temporarily restrict system access to administrators only during maintenance periods.

**Key Settings:**

- **Enable Maintenance Mode**: Toggle checkbox to activate or deactivate
- **Message for Users**: Custom message displayed to non-admin users attempting to log in
- **Estimated End Time**: Optional datetime field for expected completion time
- **Save Changes**: Button to apply maintenance mode settings

**How it Works:**
- When enabled, only users with Administrator role can access the system
- All other users see the custom maintenance message instead of the login page
- Administrators can access all system features normally during maintenance
- System immediately enters or exits maintenance mode upon saving

**Default Message:**
```
The system is currently under maintenance. We'll be back shortly.
```

### Scheduled Maintenance Notification

**Purpose:** Inform users in advance about planned maintenance activities without blocking access.

**Key Settings:**

- **Show Scheduled Maintenance Banner**: Toggle checkbox to display or hide notification
- **Banner Message**: Information text shown to all logged-in users
- **Maintenance Start Time**: When the maintenance will begin (required)
- **Maintenance End Time**: When the maintenance is expected to complete (required)
- **Show Banner Until**: Optional datetime to automatically hide the banner
- **Save Scheduled Maintenance**: Button to apply notification settings

**How it Works:**
- Displays a yellow banner at the top of all pages for logged-in users
- Users can still access and use the system normally
- Banner automatically disappears after the "Show Until" time
- Does not restrict access or functionality
- Useful for advance warnings before activating maintenance mode

**Default Message:**
```
Scheduled maintenance: the system will not be accessible during the indicated period.
```

### ViewCommonCodes Restriction

**Purpose:** Temporarily restrict access to the ViewCommonCodes page for all users including administrators.

**Key Settings:**

- **Enable ViewCommonCodes Restriction**: Toggle checkbox to activate or deactivate
- **Message for Users**: Custom message displayed on the restricted page
- **Save ViewCommonCodes Restriction**: Button to apply restriction settings

**How it Works:**
- When enabled, ViewCommonCodes page shows only header and custom message
- No one (including administrators) can access the full functionality
- Other pages remain fully accessible
- Useful for data update periods or quality checks
- Page returns to normal when restriction is disabled

**Default Message:**
```
This page is temporarily unavailable to the public.
```

## Managing Maintenance

### Activating Maintenance Mode

**Steps:**

1. Navigate to **Maintenance** page from Administration menu
2. Check the **"Enable Maintenance Mode"** checkbox
3. Enter a custom message in **"Message for Users"** field (optional)
4. Optionally set **"Estimated End Time"** for user information
5. Click **"Save Changes"** button
6. Confirmation message appears
7. System immediately enters maintenance mode
8. Non-admin users are locked out

**Example Use Case:**
```
Message: The system is undergoing scheduled database maintenance.
Expected to be back online by 14:00 GMT.
Estimated End Time: 2025-01-15 14:00
```

### Deactivating Maintenance Mode

**Steps:**

1. Log in as Administrator (only role with access during maintenance)
2. Navigate to **Maintenance** page
3. Uncheck the **"Enable Maintenance Mode"** checkbox
4. Click **"Save Changes"** button
5. System returns to normal operation
6. All users can now access the system

**Important:** Always verify system is ready before deactivating maintenance mode.

### Scheduling Maintenance Notification

**Steps:**

1. Go to **Maintenance** page
2. Check **"Show Scheduled Maintenance Banner"** checkbox
3. Enter informative message in **"Banner Message"** field
4. Set **"Maintenance Start Time"** (when maintenance begins)
5. Set **"Maintenance End Time"** (when maintenance completes)
6. Optionally set **"Show Banner Until"** (when to stop showing banner)
7. Click **"Save Scheduled Maintenance"** button
8. Banner appears immediately to all logged-in users
9. Users see notification on every page until specified end time

**Example Use Case:**
```
Message: Scheduled maintenance on Sunday, January 15, 2025 from 02:00 to 06:00 GMT.
The system will be unavailable during this time. Please save your work before 02:00 GMT.
Start Time: 2025-01-15 02:00
End Time: 2025-01-15 06:00
Show Until: 2025-01-15 08:00
```

### Restricting ViewCommonCodes

**Steps:**

1. Navigate to **Maintenance** page
2. Scroll to **ViewCommonCodes Restriction** section
3. Check **"Enable ViewCommonCodes Restriction"** checkbox
4. Enter custom message in **"Message for Users"** field (optional)
5. Click **"Save ViewCommonCodes Restriction"** button
6. ViewCommonCodes page is now restricted
7. Users see only header and message when accessing page

**To Remove Restriction:**

1. Return to **Maintenance** page
2. Uncheck **"Enable ViewCommonCodes Restriction"** checkbox
3. Click **"Save ViewCommonCodes Restriction"** button
4. ViewCommonCodes returns to normal operation

## Common Use Cases

### Planned Database Maintenance

**Scenario:** Database administrator needs exclusive access for schema updates

**Steps:**

1. Schedule notification 48 hours in advance
   - Banner message: "Scheduled database maintenance Sunday 02:00-06:00 GMT"
   - Start/End times set appropriately
2. One hour before maintenance:
   - Remind users via email or announcement
3. At maintenance time:
   - Enable Maintenance Mode
   - Message: "Database maintenance in progress. Expected completion: 06:00 GMT"
4. Perform maintenance work
5. Verify system functionality
6. Disable Maintenance Mode
7. Disable scheduled notification banner

### Emergency Hotfix

**Scenario:** Critical bug requires immediate system access restriction

**Steps:**

1. Enable Maintenance Mode immediately
2. Message: "Emergency maintenance to resolve critical issue. Updates to follow."
3. Apply hotfix and test
4. Disable Maintenance Mode as soon as safe
5. Consider post-maintenance notification about what was fixed

### Temporary ViewCommonCodes Restriction

**Scenario:** Data quality review requires restricting ViewCommonCodes access

**Steps:**

1. Enable ViewCommonCodes Restriction
2. Message: "ViewCommonCodes is temporarily unavailable for data quality verification."
3. Perform quality checks and updates
4. Verify data integrity
5. Disable ViewCommonCodes Restriction
6. Normal access restored

### Weekend Upgrade Window

**Scenario:** Major system upgrade planned for low-traffic weekend

**Steps:**

1. Week before: Add scheduled notification
   - "Major system upgrade Saturday 20:00 through Sunday 08:00"
2. Day before: Send email reminder
3. Saturday 20:00: Enable Maintenance Mode
4. Perform upgrade, test thoroughly
5. Sunday 08:00: Disable Maintenance Mode
6. Monday: Remove scheduled notification banner
7. Monitor system and user feedback

## Best Practices

### Planning Maintenance

**Communication:**
- Notify users at least 24-48 hours in advance using scheduled maintenance banner
- Send additional email notifications for major maintenance
- Choose off-peak hours (evenings, weekends) when possible
- Provide clear estimated completion times

**Scheduling:**
- Review system usage patterns before scheduling
- Avoid maintenance during critical business periods
- Allow buffer time in estimates for unexpected issues
- Schedule backup verification before maintenance

**Testing:**
- Test maintenance mode activation on non-production system first
- Verify administrator access works during maintenance
- Prepare rollback plan if issues arise
- Document maintenance procedures for consistency

### Writing Effective Messages

**Active Maintenance Messages:**

Good Examples:
```
The system is undergoing scheduled database maintenance.
Expected to be back online by 14:00 GMT. Thank you for your patience.
```

```
Emergency maintenance to resolve login issues.
We apologize for the inconvenience and expect to restore service shortly.
```

Poor Examples:
```
Down for maintenance.
```
(Too vague, no timeline)

```
System is broken, working on it.
```
(Unprofessional, doesn't inspire confidence)

**Scheduled Notification Messages:**

Good Examples:
```
Scheduled maintenance Sunday, January 15, 2025 from 02:00 to 06:00 GMT.
The system will be unavailable during this time. Please save your work before 02:00 GMT.
```

```
System upgrade planned for Saturday evening 18:00-22:00.
Save any in-progress work before 18:00. New features available after maintenance.
```

Poor Examples:
```
Maintenance this weekend.
```
(No specific times)

```
Don't use the system on Sunday morning.
```
(Informal, unclear timeframe)

### Security Considerations

**Access Control:**
- Only grant Administrator role to trusted personnel
- Log out all administrators after completing maintenance
- Verify no unauthorized access during maintenance
- Review Activity Logs after maintenance completion

**Data Protection:**
- Back up system before major maintenance
- Test backup restoration process regularly
- Verify data integrity after maintenance
- Document all changes made during maintenance window

### Monitoring

**During Maintenance:**
- Keep Activity Logs open to monitor administrator actions
- Watch for any unexpected errors or issues
- Test critical functionality before disabling maintenance mode
- Verify all services are running correctly

**After Maintenance:**
- Monitor user login success rates
- Check Activity Logs for unusual patterns
- Verify scheduled notification auto-hides correctly
- Gather user feedback on system performance

## Troubleshooting

### Maintenance Mode Won't Disable

**Possible Causes:**
- Browser cache showing old state
- Session expired
- Server error preventing update
- Lost administrator privileges

**Solutions:**
1. Hard refresh browser (Ctrl+F5)
2. Log out and log back in
3. Check Current Status indicator at top of page
4. Verify you're logged in as Administrator
5. Contact system support if issue persists

### Users Still See Maintenance Message

**Possible Causes:**
- Maintenance mode still active
- User browser cache
- User session started before deactivation
- Scheduled notification still showing

**Solutions:**
1. Verify maintenance mode is disabled (check Current Status)
2. Wait 1-2 minutes for cache to clear
3. Ask users to refresh browser (Ctrl+F5)
4. Ask users to log out and back in
5. Check if scheduled notification is still active

### Scheduled Notification Doesn't Appear

**Possible Causes:**
- "Show Scheduled Maintenance Banner" not checked
- Start time hasn't been reached yet
- "Show Until" time has already passed
- User hasn't logged in since notification enabled

**Solutions:**
1. Verify checkbox is checked
2. Confirm current time is between Start and Show Until times
3. Check date/time fields are correct (not in past)
4. Ask users to log out and log back in
5. Review browser console for JavaScript errors

### Cannot Save Changes

**Possible Causes:**
- Not logged in as Administrator
- Session expired
- Network connectivity issue
- Required fields missing (Start/End times)

**Solutions:**
1. Verify you have Administrator role
2. Log out and log back in
3. Check internet connection
4. Ensure all required fields are filled
5. Check browser console for errors

### Scheduled Notification Not Auto-Hiding

**Possible Causes:**
- "Show Until" time not set
- "Show Until" time is in future
- User needs to refresh page
- Banner manually disabled

**Solutions:**
1. Check "Show Until" field has appropriate datetime
2. Verify current time has passed "Show Until" time
3. Ask users to refresh page or log out/in
4. Manually disable notification if needed

### ViewCommonCodes Still Accessible

**Possible Causes:**
- Restriction not enabled
- Browser cache showing old page
- Different page being accessed (not ViewCommonCodes)
- Changes not saved

**Solutions:**
1. Verify "Enable ViewCommonCodes Restriction" is checked
2. Confirm changes were saved (look for success message)
3. Hard refresh ViewCommonCodes page (Ctrl+F5)
4. Navigate directly to ViewCommonCodes URL
5. Check browser console for errors

## Related Pages

- **Users**: Manage user accounts and roles (Administrator access required)
- **Activity Logs**: Review maintenance-related actions and changes
- **ViewCommonCodes**: Page that can be restricted via maintenance settings
- **Login**: Page users see during maintenance mode

## Support

For maintenance-related questions:
- Coordinate maintenance windows with project manager
- Notify all users before major maintenance
- Document maintenance procedures and lessons learned
- Contact system administrator for technical issues
- Review Activity Logs for post-maintenance verification

// Maintenance.js - Client-side logic for Maintenance Management

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize MessageManager
  MessageManager.init('messageArea');

  // Help button event listener
  const helpBtn = document.getElementById('helpBtn');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = window.ACTIVE_PAGE || 'maintenance';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  // Check authentication
  await checkAuth();

  // Load current settings
  await loadSettings();

  // Setup event listeners
  setupEventListeners();
});

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch('/api/check-auth');
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = '/login.html';
      return;
    }

    // Check if first login - redirect to home (will show modal)
    if (data.firstLogin === -1 || data.firstLogin === true) {
      window.location.href = '/index.html';
      return;
    }

    // Check if user is administrator (roleId = 1)
    if (data.roleId !== 1) {
      window.location.href = '/index.html';
      return;
    }

    // Update sidebar menu visibility based on role
    if (typeof updateSidebarMenuVisibility === 'function') {
      updateSidebarMenuVisibility(data.roleId);
    }

  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = '/login.html';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Show/hide maintenance details when checkbox is toggled
  document.getElementById('maintenanceEnabled').addEventListener('change', function () {
    const details = document.getElementById('maintenanceDetails');
    details.style.display = this.checked ? 'block' : 'none';
  });

  // Show/hide scheduled maintenance details when checkbox is toggled
  document.getElementById('scheduledEnabled').addEventListener('change', function () {
    const details = document.getElementById('scheduledDetails');
    details.style.display = this.checked ? 'block' : 'none';
  });


}

// Load current settings
async function loadSettings() {
  try {
    const response = await fetch('/api/maintenance');
    const data = await response.json();

    if (response.ok) {
      // Update status badge
      updateStatusBadge(data.enabled);

      // Populate maintenance mode fields
      document.getElementById('maintenanceEnabled').checked = data.enabled;
      document.getElementById('maintenanceMessage').value = data.message || '';

      if (data.estimatedEndTime) {
        // Convert to datetime-local format
        const date = new Date(data.estimatedEndTime);
        document.getElementById('estimatedEndTime').value = formatDateTimeLocal(date);
      }

      // Show/hide maintenance details based on enabled status
      document.getElementById('maintenanceDetails').style.display = data.enabled ? 'block' : 'none';

      // Populate scheduled maintenance fields
      if (data.scheduled) {
        document.getElementById('scheduledEnabled').checked = data.scheduled.enabled || false;
        document.getElementById('scheduledMessage').value = data.scheduled.message || '';

        if (data.scheduled.startTime) {
          const startDate = new Date(data.scheduled.startTime);
          document.getElementById('scheduledStartTime').value = formatDateTimeLocal(startDate);
        }

        if (data.scheduled.endTime) {
          const endDate = new Date(data.scheduled.endTime);
          document.getElementById('scheduledEndTime').value = formatDateTimeLocal(endDate);
        }

        if (data.scheduled.showUntil) {
          const showUntilDate = new Date(data.scheduled.showUntil);
          document.getElementById('scheduledShowUntil').value = formatDateTimeLocal(showUntilDate);
        }

        // Show/hide scheduled details based on enabled status
        document.getElementById('scheduledDetails').style.display = data.scheduled.enabled ? 'block' : 'none';
      }


    } else {
      showMessage('Error loading settings', 'error');
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showMessage('Error loading settings', 'error');
  }
}

// Update status badge
function updateStatusBadge(isInMaintenance) {
  const statusDiv = document.getElementById('currentStatus');

  if (isInMaintenance) {
    statusDiv.innerHTML = `
      <div class="status-badge offline">
        MAINTENANCE MODE ACTIVE - System Offline
      </div>
    `;
  } else {
    statusDiv.innerHTML = `
      <div class="status-badge online">
        System Online - Normal Operation
      </div>
    `;
  }
}

// Save maintenance settings
async function saveMaintenanceSettings() {
  try {
    const enabled = document.getElementById('maintenanceEnabled').checked;
    const message = document.getElementById('maintenanceMessage').value;
    const estimatedEndTime = document.getElementById('estimatedEndTime').value;

    // Get current config first
    const currentResponse = await fetch('/api/maintenance');
    const currentConfig = await currentResponse.json();

    // Update maintenance settings
    const config = {
      ...currentConfig,
      enabled: enabled,
      message: message || 'The system is currently under maintenance. We\'ll be back shortly.',
      estimatedEndTime: estimatedEndTime ? new Date(estimatedEndTime).toISOString() : null
    };

    const response = await fetch('/api/maintenance', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    const data = await response.json();

    if (response.ok) {
      showMessage('Maintenance settings saved successfully', 'success');
      updateStatusBadge(enabled);

      // Update maintenance banner
      if (typeof checkAndDisplayMaintenanceBanners === 'function') {
        await checkAndDisplayMaintenanceBanners();
      }

      if (enabled) {
        showMessage('Maintenance mode is now ACTIVE. Only administrators can access the system.', 'success');
      }
    } else {
      showMessage(data.error || 'Error saving settings', 'error');
    }
  } catch (error) {
    console.error('Error saving maintenance settings:', error);
    showMessage('Error saving settings', 'error');
  }
}

// Save scheduled maintenance
async function saveScheduledMaintenance() {
  try {
    const enabled = document.getElementById('scheduledEnabled').checked;
    const message = document.getElementById('scheduledMessage').value;
    const startTime = document.getElementById('scheduledStartTime').value;
    const endTime = document.getElementById('scheduledEndTime').value;
    const showUntil = document.getElementById('scheduledShowUntil').value;

    // Validate required fields if scheduled maintenance is enabled
    if (enabled) {
      if (!startTime || !endTime) {
        showMessage('Start Time and End Time are required when scheduled maintenance is enabled', 'error');
        return;
      }

      // Validate that end time is after start time
      if (new Date(endTime) <= new Date(startTime)) {
        showMessage('End Time must be after Start Time', 'error');
        return;
      }
    }

    // Get current config first
    const currentResponse = await fetch('/api/maintenance');
    const currentConfig = await currentResponse.json();

    // Update scheduled maintenance settings
    const config = {
      ...currentConfig,
      scheduled: {
        enabled: enabled,
        message: message || 'Scheduled maintenance: the system will not be accessible during the indicated period.',
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null,
        showUntil: showUntil ? new Date(showUntil).toISOString() : null
      }
    };

    const response = await fetch('/api/maintenance', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    const data = await response.json();

    if (response.ok) {
      showMessage('Scheduled maintenance settings saved successfully', 'success');

      // Update maintenance banner
      if (typeof checkAndDisplayMaintenanceBanners === 'function') {
        await checkAndDisplayMaintenanceBanners();
      }
    } else {
      showMessage(data.error || 'Error saving scheduled maintenance', 'error');
    }
  } catch (error) {
    console.error('Error saving scheduled maintenance:', error);
    showMessage('Error saving scheduled maintenance', 'error');
  }
}

// Show message
function showMessage(message, type = 'info') {
  MessageManager.show(message, type, 5000);
}



// Format date to datetime-local input format
function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

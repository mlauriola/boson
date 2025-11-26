// ViewRestriction.js - Logic for ViewCommonCodes Restriction Management

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize MessageManager
    if (typeof MessageManager !== 'undefined') {
        MessageManager.init('messageArea');
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

        // Check if user has access to this module (roleId 1, 2, or 3 as per modules.json)
        // For this specific admin feature, we might want to restrict to admins only (roleId 1)
        // But sticking to module access for now, or maybe just admins as it was in Maintenance
        if (data.roleId !== 1) {
            // If strictly for admins like Maintenance page was:
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
    // Show/hide ViewCommonCodes restriction details when checkbox is toggled
    const checkbox = document.getElementById('viewCommonCodesEnabled');
    if (checkbox) {
        checkbox.addEventListener('change', function () {
            const details = document.getElementById('viewCommonCodesDetails');
            if (details) {
                details.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
}

// Load current settings
async function loadSettings() {
    try {
        const response = await fetch('/api/maintenance');
        const data = await response.json();

        if (response.ok) {
            // Populate ViewCommonCodes restriction fields
            if (data.viewCommonCodesRestricted) {
                const checkbox = document.getElementById('viewCommonCodesEnabled');
                const messageInput = document.getElementById('viewCommonCodesMessage');
                const details = document.getElementById('viewCommonCodesDetails');

                if (checkbox) checkbox.checked = data.viewCommonCodesRestricted.enabled || false;
                if (messageInput) messageInput.value = data.viewCommonCodesRestricted.message || '';

                // Show/hide ViewCommonCodes details based on enabled status
                if (details) {
                    details.style.display = data.viewCommonCodesRestricted.enabled ? 'block' : 'none';
                }
            }
        } else {
            showMessage('Error loading settings', 'error');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showMessage('Error loading settings', 'error');
    }
}

// Save ViewCommonCodes restriction
async function saveViewCommonCodesRestriction() {
    try {
        const enabled = document.getElementById('viewCommonCodesEnabled').checked;
        const message = document.getElementById('viewCommonCodesMessage').value;

        // Get current config first
        const currentResponse = await fetch('/api/maintenance');
        const currentConfig = await currentResponse.json();

        // Update ViewCommonCodes restriction settings
        const config = {
            ...currentConfig,
            viewCommonCodesRestricted: {
                enabled: enabled,
                message: message || 'This page is temporarily unavailable to the public.'
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
            showMessage('ViewCommonCodes restriction settings saved successfully', 'success');

            if (enabled) {
                showMessage('ViewCommonCodes restriction is now ACTIVE. The page will show only the header and a message.', 'success');
            }
        } else {
            showMessage(data.error || 'Error saving ViewCommonCodes restriction', 'error');
        }
    } catch (error) {
        console.error('Error saving ViewCommonCodes restriction:', error);
        showMessage('Error saving ViewCommonCodes restriction', 'error');
    }
}

// Show message helper
function showMessage(message, type = 'info') {
    if (typeof MessageManager !== 'undefined') {
        MessageManager.show(message, type, 5000);
    } else {
        alert(message);
    }
}

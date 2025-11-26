// Branding.js - Logic for Branding Configuration

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize MessageManager
    if (window.MessageManager) {
        MessageManager.init('messageArea');
    }

    // Check authentication
    await checkAuth();

    // Load current settings
    await loadBrandingSettings();

    // Setup event listeners for live preview
    setupPreviewListeners();
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

// Load current branding settings
async function loadBrandingSettings() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const data = await response.json();
            const branding = data.branding || {};
            const colors = branding.colors || {};

            // Populate inputs
            document.getElementById('appName').value = branding.appName || '';

            // Update logo preview
            const logoPreview = document.getElementById('currentLogoPreview');
            if (branding.logo) {
                logoPreview.src = branding.logo + '?t=' + Date.now(); // Cache bust
                logoPreview.style.display = 'block';
            } else {
                logoPreview.style.display = 'none';
            }

            // Colors
            document.getElementById('brandColor').value = colors.brandColor || '#1a4480';
            document.getElementById('btnPrimaryBg').value = colors.btnPrimaryBg || '#10bcc7';
            document.getElementById('btnSecondaryBg').value = colors.btnSecondaryBg || '#1a4480';
            document.getElementById('btnDangerBg').value = colors.btnDangerBg || '#dc3545';
            document.getElementById('tableHeaderBg').value = colors.tableHeaderBg || '#2084c6';

            // Update preview
            updatePreview();
        } else {
            showMessage('Error loading configuration', 'error');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showMessage('Error loading configuration', 'error');
    }
}

// Setup preview listeners
function setupPreviewListeners() {
    const inputs = [
        'brandColor', 'btnPrimaryBg', 'btnSecondaryBg', 'btnDangerBg', 'tableHeaderBg',
        'appName'
    ];

    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updatePreview);
        }
    });

    // Handle logo upload
    const logoUpload = document.getElementById('logoUpload');
    if (logoUpload) {
        logoUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await uploadLogo(file);
            }
        });
    }
}

// Update preview elements
function updatePreview() {
    // Get values
    const brandColor = document.getElementById('brandColor').value;
    const btnPrimaryBg = document.getElementById('btnPrimaryBg').value;
    const btnSecondaryBg = document.getElementById('btnSecondaryBg').value;
    const btnDangerBg = document.getElementById('btnDangerBg').value;
    const tableHeaderBg = document.getElementById('tableHeaderBg').value;
    const appName = document.getElementById('appName').value;

    // Get current logo from preview
    const currentLogoSrc = document.getElementById('currentLogoPreview').src;

    // Update Preview Header
    const previewTitle = document.getElementById('previewTitle');
    previewTitle.style.color = brandColor;
    previewTitle.textContent = appName;

    const previewLogo = document.getElementById('previewLogo');
    previewLogo.src = currentLogoSrc;
    previewLogo.style.display = currentLogoSrc ? 'block' : 'none';

    const previewUserInfo = document.getElementById('previewUserInfo');
    previewUserInfo.style.color = brandColor;

    // Update Preview Buttons
    const previewBtnPrimary = document.getElementById('previewBtnPrimary');
    previewBtnPrimary.style.backgroundColor = btnPrimaryBg;
    previewBtnPrimary.style.color = '#ffffff';

    const previewBtnSecondary = document.getElementById('previewBtnSecondary');
    previewBtnSecondary.style.backgroundColor = btnSecondaryBg;
    previewBtnSecondary.style.color = '#ffffff';

    const previewBtnDanger = document.getElementById('previewBtnDanger');
    previewBtnDanger.style.backgroundColor = btnDangerBg;
    previewBtnDanger.style.color = '#ffffff';

    // Update Preview Table Header
    const previewTableHeader = document.getElementById('previewTableHeader');
    previewTableHeader.style.backgroundColor = tableHeaderBg;
    Array.from(previewTableHeader.children).forEach(th => {
        th.style.color = '#ffffff';
    });
}

// Save branding configuration
async function saveBrandingConfig() {
    try {
        const brandColor = document.getElementById('brandColor').value;
        const btnPrimaryBg = document.getElementById('btnPrimaryBg').value;
        const btnSecondaryBg = document.getElementById('btnSecondaryBg').value;
        const btnDangerBg = document.getElementById('btnDangerBg').value;
        const tableHeaderBg = document.getElementById('tableHeaderBg').value;
        const appName = document.getElementById('appName').value;

        // Calculate hover colors (simple darkening)
        const brandColorHover = adjustColor(brandColor, -20);
        const btnPrimaryHover = adjustColor(btnPrimaryBg, -20);
        const btnSecondaryHover = adjustColor(btnSecondaryBg, -20);
        const btnDangerHover = adjustColor(btnDangerBg, -20);

        const config = {
            appName: appName,
            // Logo is handled separately via upload
            colors: {
                brandColor,
                brandColorHover,
                btnPrimaryBg,
                btnPrimaryText: '#ffffff',
                btnPrimaryHover,
                btnSecondaryBg,
                btnSecondaryText: '#ffffff',
                btnSecondaryHover,
                btnDangerBg,
                btnDangerText: '#ffffff',
                btnDangerHover,
                headerBg: '#ffffff',
                headerText: brandColor,
                sidebarBg: '#ffffff',
                sidebarActiveBg: '#e7f3ff',
                sidebarActiveBorder: btnPrimaryBg,
                tableHeaderBg,
                tableHeaderText: '#ffffff'
            }
        };

        const response = await fetch('/api/config/branding', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (response.ok) {
            showMessage('Branding configuration saved successfully', 'success');
            // Apply changes immediately to the current page
            applyBranding(config);
        } else {
            const data = await response.json();
            showMessage(data.error || 'Error saving configuration', 'error');
        }
    } catch (error) {
        console.error('Error saving branding:', error);
        showMessage('Error saving configuration', 'error');
    }
}

// Helper to darken/lighten color
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

// Apply branding to current page
function applyBranding(config) {
    const root = document.documentElement;
    const colors = config.colors;

    for (const [key, value] of Object.entries(colors)) {
        // Convert camelCase to kebab-case for CSS var
        const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.setProperty(cssVar, value);
    }

    // Update logo if present
    const headerLogo = document.querySelector('.header-logo');
    if (headerLogo && config.logo) {
        headerLogo.src = config.logo;
    }
}

// Upload logo file
async function uploadLogo(file) {
    try {
        const formData = new FormData();
        formData.append('logo', file);

        showMessage('Uploading logo...', 'info', 0);

        const response = await fetch('/api/upload/logo', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            showMessage('Logo uploaded successfully', 'success');

            // Update preview
            const logoPreview = document.getElementById('currentLogoPreview');
            logoPreview.src = data.logoPath + '?t=' + Date.now();
            logoPreview.style.display = 'block';

            updatePreview();
        } else {
            const data = await response.json();
            showMessage(data.error || 'Error uploading logo', 'error');
        }
    } catch (error) {
        console.error('Error uploading logo:', error);
        showMessage('Error uploading logo', 'error');
    }
}

// Reset to defaults
function resetToDefaults() {
    if (confirm('Are you sure you want to reset to default colors?')) {
        document.getElementById('brandColor').value = '#1a4480';
        document.getElementById('btnPrimaryBg').value = '#10bcc7';
        document.getElementById('btnSecondaryBg').value = '#1a4480';
        document.getElementById('btnDangerBg').value = '#dc3545';
        document.getElementById('tableHeaderBg').value = '#2084c6';
        updatePreview();
    }
}

// Show message
function showMessage(message, type = 'info') {
    if (window.MessageManager) {
        MessageManager.show(message, type, 5000);
    } else {
        alert(message);
    }
}

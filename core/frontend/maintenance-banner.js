// maintenance-banner.js - Display maintenance banners in application pages

// Create and inject maintenance banner container
function createMaintenanceBannerContainer() {
  // Check if banner already exists
  if (document.getElementById('appMaintenanceBanners')) {
    return;
  }

  // Create banner container
  const bannerContainer = document.createElement('div');
  bannerContainer.id = 'appMaintenanceBanners';
  bannerContainer.style.cssText = `
    position: sticky;
    top: 0;
    z-index: 1000;
    width: 100%;
  `;

  // Insert after header
  const header = document.querySelector('.header');
  if (header && header.parentNode) {
    header.parentNode.insertBefore(bannerContainer, header.nextSibling);
  }
}

// Check and display maintenance banners
async function checkAndDisplayMaintenanceBanners() {
  try {
    // Create banner container if it doesn't exist
    createMaintenanceBannerContainer();
    const container = document.getElementById('appMaintenanceBanners');
    if (!container) return;

    // Detect if this is a public page (check global variable set by the page)
    const isPublicPage = window.IS_PUBLIC_PAGE === true;

    let data = null;
    let isAuthenticated = false;
    let isAdmin = false;

    // Try authenticated endpoint first
    try {
      const authResponse = await fetch('/api/check-auth');
      if (authResponse.ok) {
        data = await authResponse.json();
        isAuthenticated = data.authenticated;
        isAdmin = data.roleId === 1;

        // If authenticated, use data from check-auth
        if (isAuthenticated) {
          // Never show link on public pages, even for admins
          const showLink = !isPublicPage && isAdmin;
          displayBanners(container, data, showLink);
          return;
        }
      }
    } catch (error) {
      // Continue to public endpoint
    }

    // If not authenticated, use public maintenance status endpoint
    const publicResponse = await fetch('/api/maintenance/status');
    if (publicResponse.ok) {
      const publicData = await publicResponse.json();
      // Transform public data to match expected format
      data = {
        maintenanceMode: publicData.enabled,
        maintenanceMessage: publicData.message,
        scheduledMaintenance: publicData.scheduled.enabled ? publicData.scheduled : null
      };
      displayBanners(container, data, false);
    }
  } catch (error) {
    console.log('Could not check maintenance status:', error);
  }
}

// Display banners based on data
function displayBanners(container, data, isAdmin) {
  let bannersHTML = '';

  // Show maintenance mode banner if active
  if (data.maintenanceMode && data.maintenanceMessage) {
    const manageLink = isAdmin
      ? `<a href="Maintenance.html" style="margin-left: 12px; color: #721c24; text-decoration: underline;">Manage Maintenance</a>`
      : '';

    bannersHTML += `
      <div style="background-color: #f8d7da; border-bottom: 2px solid #f5c6cb; padding: 12px 24px; color: #721c24;">
        <strong>MAINTENANCE MODE ACTIVE</strong> - ${data.maintenanceMessage}
        ${manageLink}
      </div>
    `;
  } else {
    // Only show scheduled maintenance banner if system is NOT in active maintenance
    if (data.scheduledMaintenance) {
      const scheduled = data.scheduledMaintenance;
      let timeInfo = '';

      if (scheduled.startTime && scheduled.endTime) {
        const startDate = new Date(scheduled.startTime);
        const endDate = new Date(scheduled.endTime);
        timeInfo = ` - From: ${startDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} to ${endDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      }

      bannersHTML += `
        <div style="background-color: #fff3cd; border-bottom: 2px solid #ffc107; padding: 12px 24px; color: #856404;">
          <strong>Scheduled Maintenance</strong> - ${scheduled.message}${timeInfo}
        </div>
      `;
    }
  }

  container.innerHTML = bannersHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndDisplayMaintenanceBanners);
} else {
  checkAndDisplayMaintenanceBanners();
}

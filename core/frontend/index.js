// index.js - Home page functionality

document.addEventListener('DOMContentLoaded', () => {
  const currentUserSpan = document.getElementById('currentUser');
  const welcomeUserSpan = document.getElementById('welcomeUser');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const layoutWrapper = document.querySelector('.layout-wrapper');

  // First login modal elements
  const firstLoginModal = document.getElementById('firstLoginModal');
  const firstLoginPasswordForm = document.getElementById('firstLoginPasswordForm');
  const modalCurrentPassword = document.getElementById('modalCurrentPassword');
  const modalNewPassword = document.getElementById('modalNewPassword');
  const modalConfirmPassword = document.getElementById('modalConfirmPassword');
  const modalMessageArea = document.getElementById('modalMessageArea');

  // Check authentication on page load
  checkAuthentication();

  // Check if user is authenticated
  async function checkAuthentication() {
    try {
      const response = await fetch('/api/check-auth');

      if (!response.ok) {
        // Server error or not authenticated
        window.location.href = '/login.html';
        return;
      }

      const data = await response.json();

      if (!data.authenticated) {
        // Not authenticated - redirect to login
        window.location.href = '/login.html';
        return;
      }

      // Check if first login - show mandatory modal
      if (data.firstLogin === -1 || data.firstLogin === true) {
        showFirstLoginModal();
        // Load current password in modal
        loadCurrentPasswordInModal();
      }

      // Show current user referent in header and welcome message
      if (currentUserSpan) {
        currentUserSpan.textContent = `Welcome, ${data.referent || data.username}`;
      }
      if (welcomeUserSpan) {
        welcomeUserSpan.textContent = data.referent || data.username;
      }

      // Update sidebar menu visibility based on user role
      if (typeof updateSidebarMenuVisibility === 'function') {
        updateSidebarMenuVisibility(data.roleId);
      }

      // Update index page content visibility based on user role
      updateIndexPageVisibility(data.roleId);

      // Initialize dynamic dashboard
      initDashboard(data.roleId);
    } catch (error) {
      console.error('Error checking authentication:', error);
      // On network error, redirect to login
      window.location.href = '/login.html';
    }
  }

  // Menu toggle functionality (same as other pages)
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // First login modal functions
  function showFirstLoginModal() {
    if (firstLoginModal) {
      firstLoginModal.style.display = 'flex';
    }
  }

  function hideFirstLoginModal() {
    if (firstLoginModal) {
      firstLoginModal.style.display = 'none';
    }
  }

  async function loadCurrentPasswordInModal() {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      const user = await response.json();
      if (user.Password && modalCurrentPassword) {
        modalCurrentPassword.value = user.Password;
      }
    } catch (error) {
      console.error('Error loading current password:', error);
    }
  }

  // Handle first login password form submission
  if (firstLoginPasswordForm) {
    firstLoginPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const current = modalCurrentPassword.value;
      const newPwd = modalNewPassword.value;
      const confirm = modalConfirmPassword.value;

      if (newPwd !== confirm) {
        showModalMessage('New passwords do not match', 'error');
        return;
      }

      // Validate password: minimum 8 characters, must contain letters and numbers
      if (newPwd.length < 8) {
        showModalMessage('New password must be at least 8 characters long', 'error');
        return;
      }

      const hasLetters = /[a-zA-Z]/.test(newPwd);
      const hasNumbers = /[0-9]/.test(newPwd);

      if (!hasLetters || !hasNumbers) {
        showModalMessage('Password must contain both letters and numbers', 'error');
        return;
      }

      try {
        const response = await fetch('/api/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ currentPassword: current, newPassword: newPwd })
        });

        const data = await response.json();

        if (response.ok) {
          showModalMessage('Password changed successfully!', 'success');
          // Wait 1 second and close modal
          setTimeout(() => {
            hideFirstLoginModal();
            // Reload page to refresh authentication state
            window.location.reload();
          }, 1000);
        } else {
          showModalMessage(data.error || 'Error changing password', 'error');
        }
      } catch (error) {
        console.error('Error changing password:', error);
        showModalMessage('Server connection error', 'error');
      }
    });
  }

  function showModalMessage(message, type) {
    if (modalMessageArea) {
      modalMessageArea.textContent = message;
      modalMessageArea.className = `message ${type}`;

      // Auto-hide after 5 seconds
      setTimeout(() => {
        modalMessageArea.textContent = '';
        modalMessageArea.className = 'message';
      }, 5000);
    }
  }

  // Function to update index page visibility based on user role
  function updateIndexPageVisibility(roleId) {
    // ADMINISTRATOR (roleId = 1) sees everything - no changes needed
    if (roleId === 1) return;

    // Hide Administration section card for SUPER EDITOR and NORMAL EDITOR
    const adminCard = document.getElementById('administrationCard');
    if (adminCard) {
      adminCard.style.display = 'none';
    }

    // Hide Administration tab for SUPER EDITOR and NORMAL EDITOR
    const adminTab = document.getElementById('administrationTab');
    if (adminTab) {
      adminTab.style.display = 'none';
    }

    // For NORMAL EDITOR (roleId = 3): hide specific links in Common Codes guide
    if (roleId === 3) {
      const restrictedLinks = [
        'guideLink-rsccodes',
        'guideLink-versioning',
        'guideLink-logs',
        'guideLink-tablelist'
      ];

      restrictedLinks.forEach(id => {
        const linkItem = document.getElementById(id);
        if (linkItem) {
          linkItem.style.display = 'none';
        }
      });
    }
  }
});

// Initialize dynamic dashboard cards
async function initDashboard(roleId) {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) return;

    const config = await response.json();

    // Branding title
    if (config.branding && config.branding.appName) {
      document.title = config.branding.appName;
    }

    const modules = config.modules || {};
    const settingsCard = document.getElementById('settingsCard');
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (!dashboardGrid) return;

    for (const [key, module] of Object.entries(modules)) {
      // Skip core (handled manually) and disabled modules
      if (module.enabled && key !== 'core') {
        // Check role access
        if (module.roleAccess && !module.roleAccess.includes(roleId)) {
          continue;
        }

        // Create card
        const card = document.createElement('div');
        card.className = 'dashboard-card';

        // Use menu config for card details if available
        const title = module.menu ? module.menu.label : key;
        const description = module.description || '';
        const icon = module.menu ? module.menu.icon : ''; // SVG string
        const link = module.menu && module.menu.items && module.menu.items.length > 0 ? module.menu.items[0].link : '#';

        card.innerHTML = `
            <div class="card-icon">
              ${icon}
            </div>
            <div class="card-title">${title}</div>
            <div class="card-description">
              ${description}
            </div>
            <a href="${link}" class="card-link">
              Go to ${title}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
        `;

        // Insert before settings card if it exists, otherwise append
        if (settingsCard) {
          dashboardGrid.insertBefore(card, settingsCard);
        } else {
          dashboardGrid.appendChild(card);
        }
      }
    }

    // Ensure Administration Card is visible for admin (it might be hidden by default CSS)
    const adminCard = document.getElementById('administrationCard');
    if (adminCard && roleId === 1) {
      adminCard.style.display = 'block';
    }

  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
}


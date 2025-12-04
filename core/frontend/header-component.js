// header-component.js - Reusable header component

async function initHeader() {
  // Fetch configuration first
  let config = { branding: {} };
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const data = await response.json();
      config = data;
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }

  const branding = config.branding || {};

  // Always use Microplus logo as per user requirement
  const logoSrc = '/img/MP.svg';
  const appName = branding.appName || 'Commonwealth Games Glasgow 2026';
  const primaryColor = branding.primaryColor || '#2084c6';

  const headerHTML = `
    <div class="header-left">
      <img src="${logoSrc}" alt="Logo" class="header-logo">
      <h1 class="header-title">${appName} - <span id="pageTitle">${window.PAGE_TITLE || 'Back Office'}</span></h1>
    </div>
    <div class="user-info">
      <span id="currentUser">Loading...</span>
      <div class="settings-dropdown">
        <button class="btn btn-secondary" id="settingsBtn" title="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <div class="dropdown-menu" id="settingsMenu" style="display: none;">
          <a href="profile.html" class="dropdown-item">Edit Profile</a>
          <a href="change-password.html" class="dropdown-item">Change Password</a>
          <div class="dropdown-divider"></div>
          <a href="#" class="dropdown-item" id="logoutBtn">Logout</a>
        </div>
      </div>
    </div>
  `;

  // Find header element and inject HTML
  const headerElement = document.querySelector('.header');
  if (headerElement) {
    headerElement.innerHTML = headerHTML;

    // Apply primary color to h1 if needed, or rely on CSS
    // headerElement.querySelector('h1').style.color = primaryColor;
  }

  // Initialize settings dropdown functionality
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsMenu = document.getElementById('settingsMenu');
  const logoutBtn = document.getElementById('logoutBtn');

  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = settingsMenu.style.display === 'block';
      settingsMenu.style.display = isVisible ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
        settingsMenu.style.display = 'none';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (settingsMenu) {
        settingsMenu.style.display = 'none';
      }
      logout();
    });
  }

  // Fetch and update user info
  await updateUserInfo();
}

// Update user info in header
async function updateUserInfo() {
  try {
    const response = await fetch('/api/check-auth');
    const data = await response.json();

    if (data.authenticated) {
      const currentUserSpan = document.getElementById('currentUser');
      if (currentUserSpan) {
        currentUserSpan.textContent = `Welcome, ${data.referent || data.username}`;
      }
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
}

// Logout function
async function logout() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/login.html';
  }
}

// Initialize header when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}

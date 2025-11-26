// login.js - Gestione della pagina di login

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const loginBtn = document.getElementById('loginBtn');

  // Load configuration and apply branding
  await loadConfigAndBranding();

  // Verifica se l'utente è già autenticato
  checkAuthentication();

  // Check and display maintenance banners
  checkMaintenanceStatus();

  // Gestione del submit del form
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Validazione base
    if (!username || !password) {
      showError('Please enter username and password');
      return;
    }

    // Disable button during login
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    hideError();

    try {
      // Send login request to server
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful - redirect to home (will show modal if first login)
        window.location.href = '/index.html';
      } else if (response.status === 503) {
        // System in maintenance mode - user not authorized
        showMaintenanceBanner(data.message, data.estimatedEndTime);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      } else {
        // Login failed - show error
        showError(data.error || 'Invalid credentials');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Server connection error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  });

  // Function to show error messages
  function showError(message) {
    errorMessage.textContent = message;
  }

  // Function to hide error messages
  function hideError() {
    errorMessage.textContent = '';
  }

  // Load config and apply branding
  async function loadConfigAndBranding() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        const branding = config.branding || {};

        // Update Title
        if (branding.appName) {
          document.title = `Login - ${branding.appName}`;
          const appTitle = document.getElementById('appTitle');
          if (appTitle) appTitle.textContent = branding.appName;
        }

        // Update Logos
        const logosContainer = document.getElementById('loginLogos');
        if (logosContainer) {
          let logosHTML = '';

          // Primary Logo (App Logo)
          if (branding.logo) {
            logosHTML += `<img src="${branding.logo}" alt="${branding.appName}" class="login-logo-cg">`;
          } else {
            logosHTML += `<img src="/img/2026_Commonwealth_Games_logo.svg.png" alt="Commonwealth Games Glasgow 2026" class="login-logo-cg">`;
          }

          // Secondary Logo (Company Logo) - Hardcoded for now or could be in config
          logosHTML += `<img src="/img/Microplus2018-1.svg" alt="Microplus" class="login-logo-microplus">`;

          logosContainer.innerHTML = logosHTML;
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }

  // Verifica se l'utente è già autenticato
  async function checkAuthentication() {
    try {
      const response = await fetch('/api/check-auth');
      const data = await response.json();

      if (data.authenticated) {
        // Check if user is blocked by maintenance mode
        if (data.maintenanceBlocked) {
          // User has a session but is blocked by maintenance - show banner and stay on login
          showMaintenanceBanner(data.maintenanceMessage, null);
          // Logout the user to clear the session
          await fetch('/api/logout', { method: 'POST' });
          return;
        }

        // User already authenticated and not blocked - redirect to home
        window.location.href = '/index.html';
      }
    } catch (error) {
      console.error('Authentication check error:', error);
    }
  }

  // Check maintenance status and display banners
  async function checkMaintenanceStatus() {
    try {
      const response = await fetch('/api/maintenance/status');

      // If endpoint doesn't exist or error, skip maintenance check
      if (!response.ok) {
        return;
      }

      const data = await response.json();

      // Show active maintenance banner if system is in maintenance
      if (data.enabled) {
        showMaintenanceBanner(data.message, data.estimatedEndTime);
      } else {
        // Only show scheduled maintenance banner if system is NOT in active maintenance
        if (data.scheduled && data.scheduled.enabled) {
          showScheduledMaintenanceBanner(data.scheduled);
        }
      }
    } catch (error) {
      // Silently fail - maintenance check is not critical for login page
      console.log('Could not check maintenance status:', error);
    }
  }

  // Show active maintenance banner
  function showMaintenanceBanner(message, estimatedEndTime) {
    const banner = document.getElementById('maintenanceBanner');

    let timeInfo = '';
    if (estimatedEndTime) {
      const endDate = new Date(estimatedEndTime);
      timeInfo = `<div class="banner-time">Estimated completion: ${endDate.toLocaleString('en-GB')}</div>`;
    }

    banner.innerHTML = `
      <div class="banner-content">
        <strong>System Under Maintenance</strong>
        <div>${message}</div>
        ${timeInfo}
      </div>
    `;
    banner.className = 'maintenance-banner';
    banner.style.display = 'flex';
  }

  // Show scheduled maintenance banner
  function showScheduledMaintenanceBanner(scheduled) {
    const banner = document.getElementById('scheduledMaintenanceBanner');

    let timeInfo = '';
    if (scheduled.startTime && scheduled.endTime) {
      const startDate = new Date(scheduled.startTime);
      const endDate = new Date(scheduled.endTime);
      timeInfo = `<div class="banner-time">
        From: ${startDate.toLocaleString('en-GB')} -
        To: ${endDate.toLocaleString('en-GB')}
      </div>`;
    }

    banner.innerHTML = `
      <div class="banner-content">
        <strong>Scheduled Maintenance</strong>
        <div>${scheduled.message}</div>
        ${timeInfo}
      </div>
    `;
    banner.className = 'scheduled-maintenance-banner';
    banner.style.display = 'flex';
  }
});

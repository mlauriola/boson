// change-password.js - Change password functionality

document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements
  const messageArea = document.getElementById('messageArea');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const currentPassword = document.getElementById('currentPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const toggleCurrentPassword = document.getElementById('toggleCurrentPassword');
  const toggleNewPassword = document.getElementById('toggleNewPassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  const helpBtn = document.getElementById('helpBtn');

  // Help button event listener
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = window.ACTIVE_PAGE || 'change-password';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  // Password visibility toggles
  if (toggleCurrentPassword) {
    toggleCurrentPassword.addEventListener('click', () => {
      const type = currentPassword.type === 'password' ? 'text' : 'password';
      currentPassword.type = type;
      toggleCurrentPassword.innerHTML = type === 'password'
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
    });
  }

  if (toggleNewPassword) {
    toggleNewPassword.addEventListener('click', () => {
      const type = newPassword.type === 'password' ? 'text' : 'password';
      newPassword.type = type;
      toggleNewPassword.innerHTML = type === 'password'
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
    });
  }

  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', () => {
      const type = confirmPassword.type === 'password' ? 'text' : 'password';
      confirmPassword.type = type;
      toggleConfirmPassword.innerHTML = type === 'password'
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
    });
  }

  // Check authentication and load current password
  await checkAuthentication();
  await loadCurrentPassword();

  // Handle change password form submission
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const current = currentPassword.value;
    const newPwd = newPassword.value;
    const confirm = confirmPassword.value;

    if (newPwd !== confirm) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    // Validate password: minimum 8 characters, must contain letters and numbers
    if (newPwd.length < 8) {
      showMessage('New password must be at least 8 characters long', 'error');
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(newPwd);
    const hasNumbers = /[0-9]/.test(newPwd);

    if (!hasLetters || !hasNumbers) {
      showMessage('Password must contain both letters and numbers', 'error');
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
        showMessage('Password changed successfully! Redirecting...', 'success');
        // Redirect to home after 1.5 seconds
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1500);
      } else {
        showMessage(data.error || 'Error changing password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('Server connection error', 'error');
    }
  });

  // Functions

  async function checkAuthentication() {
    try {
      const response = await fetch('/api/check-auth');
      const data = await response.json();

      if (!data.authenticated) {
        window.location.href = '/login.html';
        return;
      }

      // Check if first login - block navigation
      const isFirstLogin = data.firstLogin === -1 || data.firstLogin === true;

      if (isFirstLogin) {
        // Hide sidebar and menu toggle for first login
        if (sidebar) {
          sidebar.style.display = 'none';
          sidebar.style.visibility = 'hidden';
        }
        if (menuToggle) {
          menuToggle.style.display = 'none';
          menuToggle.style.visibility = 'hidden';
        }

        // Hide settings dropdown and user info for first login
        if (settingsBtn) {
          settingsBtn.style.display = 'none';
          settingsBtn.style.visibility = 'hidden';
        }
        const settingsDropdown = document.querySelector('.settings-dropdown');
        if (settingsDropdown) {
          settingsDropdown.style.display = 'none';
        }

        // Hide "Welcome" message
        if (currentUserSpan) {
          currentUserSpan.style.display = 'none';
        }

        // Adjust main content to full width when sidebar is hidden
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.style.marginLeft = '0';
          mainContent.style.width = '100%';
        }

        // Show a mandatory message
        const header = document.querySelector('.section-header h2');
        if (header) {
          header.textContent = 'Change Password (Required)';
          const infoMessage = document.createElement('p');
          infoMessage.style.color = '#dc3545';
          infoMessage.style.fontWeight = 'bold';
          infoMessage.style.marginTop = '10px';
          infoMessage.style.fontSize = '14px';
          infoMessage.textContent = 'This is your first login. You must change your password before accessing the application.';
          header.parentElement.appendChild(infoMessage);
        }
      } else {
        // Normal user - show navigation
        // Update sidebar menu visibility based on user role
        if (typeof updateSidebarMenuVisibility === 'function') {
          updateSidebarMenuVisibility(data.roleId);
        }
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      window.location.href = '/login.html';
    }
  }

  async function loadCurrentPassword() {
    try {
      const response = await fetch('/api/profile');

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const user = await response.json();

      // Pre-fill current password but mask it with asterisks
      if (user.Password && currentPassword) {
        currentPassword.value = user.Password;
        // Change input type to password to show asterisks
        currentPassword.type = 'password';
      }
    } catch (error) {
      console.error('Error loading current password:', error);
    }
  }

  function showMessage(message, type) {
    messageArea.textContent = message;
    messageArea.className = `message ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageArea.textContent = '';
      messageArea.className = 'message';
    }, 5000);
  }
});

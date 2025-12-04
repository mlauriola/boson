// profile.js - User profile management

document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements
  // DOM elements
  // messageArea handled globally
  const profileForm = document.getElementById('profileForm');
  const profileUsername = document.getElementById('profileUsername');
  const profileReferent = document.getElementById('profileReferent');
  const profileEmail = document.getElementById('profileEmail');
  const profilePhone = document.getElementById('profilePhone');
  // helpBtn handled globally

  // Check authentication and load profile
  await checkAuthentication();
  await loadProfile();

  // Handle profile form submission
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const referent = profileReferent.value.trim();
    const email = profileEmail.value.trim();
    const phone = profilePhone.value.trim();

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ referent, email, phone })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the Welcome message with the new referent in the header
        const currentUserSpan = document.getElementById('currentUser');
        if (currentUserSpan && referent) {
          currentUserSpan.textContent = `Welcome, ${referent}`;
        }
        showMessage('Profile updated successfully!', 'success');
      } else {
        showMessage(data.error || 'Error updating profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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

      // Check if first login - redirect to home (will show modal)
      if (data.firstLogin === -1 || data.firstLogin === true) {
        window.location.href = '/index.html';
        return;
      }

      // Update sidebar menu visibility based on user role
      if (typeof updateSidebarMenuVisibility === 'function') {
        updateSidebarMenuVisibility(data.roleId);
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      window.location.href = '/login.html';
    }
  }

  async function loadProfile() {
    try {
      const response = await fetch('/api/profile');

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const user = await response.json();

      profileUsername.value = user.Username || '';
      profileReferent.value = user.Referent || '';
      profileEmail.value = user.Email || '';
      profilePhone.value = user.Phone || '';
    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('Error loading profile', 'error');
    }
  }

  function showMessage(message, type) {
    if (window.MessageManager) {
      window.MessageManager.show(message, type, 5000);
    } else {
      console.warn('MessageManager not found, falling back to alert');
      alert(message);
    }
  }
});

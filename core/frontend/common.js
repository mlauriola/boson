// common.js - Shared utilities for all pages

// Message handling
// Message handling (Toast Notification)
// Message handling (Persistent Message Bar)
const MessageManager = {
  messageBar: null,
  messageContent: null,

  // Initialize the message bar
  init(containerId = null) {
    // Check if already initialized
    if (this.messageBar) return this;

    // Check if an existing container is provided or exists in DOM
    if (containerId) {
      const existingEl = document.getElementById(containerId);
      if (existingEl) {
        // If the element is the message area itself (inner div)
        if (existingEl.classList.contains('message')) {
          this.messageContent = existingEl;
          this.messageBar = existingEl.parentElement;
        } else {
          // Assume it's the container
          this.messageBar = existingEl;
          this.messageContent = existingEl.querySelector('.message-content') || existingEl.querySelector('.message');
        }

        if (this.messageBar && this.messageContent) {
          this.clear();
          return this;
        }
      }
    }

    // Find the main content area to inject the bar
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return this;

    // Create container if it doesn't exist
    let container = document.getElementById('globalMessageBar');
    if (!container) {
      container = document.createElement('div');
      container.id = 'globalMessageBar';
      container.className = 'message-bar-container';

      // Message Content Area
      const content = document.createElement('div');
      content.id = 'messageContent';
      content.className = 'message-content';
      container.appendChild(content);

      // Help Icon
      const helpLink = document.createElement('a');
      helpLink.href = '#';
      helpLink.className = 'help-icon-link';
      helpLink.title = 'User Guide';
      helpLink.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `;
      helpLink.onclick = (e) => {
        e.preventDefault();
        if (typeof window.showHelp === 'function') {
          // Determine current page help key
          const path = window.location.pathname;
          let pageKey = 'index';
          if (path.includes('users')) pageKey = 'users';
          else if (path.includes('modules')) pageKey = 'modules';
          else if (path.includes('Maintenance')) pageKey = 'maintenance';
          else if (path.includes('Branding')) pageKey = 'branding';

          window.showHelp(pageKey);
        }
      };
      container.appendChild(helpLink);

      // Insert at the top of main content
      mainContent.insertBefore(container, mainContent.firstChild);
    }

    this.messageBar = container;
    this.messageContent = container.querySelector('.message-content');

    // Show page description by default
    this.clear();

    return this;
  },

  // Show message
  show(message, type = 'info', duration = 0) {
    this.init(); // Ensure initialized
    if (!this.messageContent) return;

    this.messageContent.textContent = message;
    this.messageContent.className = `message-content ${type}`;

    // Auto-clear only if duration is set (usually 0 for persistent bar)
    if (duration > 0) {
      setTimeout(() => {
        this.clear();
      }, duration);
    }
  },

  // Hide/Clear message
  hide() {
    this.clear();
  },

  // Clear message text but keep bar visible (show default description)
  clear() {
    if (this.messageContent) {
      if (window.PAGE_DESCRIPTION) {
        this.messageContent.textContent = window.PAGE_DESCRIPTION;
        this.messageContent.className = 'message-content page-description-text'; // Default style with description class
      } else {
        this.messageContent.textContent = '';
        this.messageContent.className = 'message-content';
      }
    }
  },

  // Force hide (same as clear for persistent bar)
  forceHide() {
    this.clear();
  },

  // Show loading
  showLoading(message = 'Loading...') {
    this.show(message, 'info');
  }
};

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Export for use in other scripts
window.MessageManager = MessageManager;

// Legacy function names for backward compatibility
window.showMessage = (message, type, duration) => MessageManager.show(message, type, duration);
window.hideMessage = () => MessageManager.hide();

// Branding Application Logic
async function applyGlobalBranding() {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const data = await response.json();
      if (data.branding) {
        // Apply Colors
        if (data.branding.colors) {
          const root = document.documentElement;
          for (const [key, value] of Object.entries(data.branding.colors)) {
            const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(cssVar, value);
          }
        }

        // Apply Logo (only for client branding, not Microplus logo)
        if (data.branding.logo) {
          // Update sidebar logo and any client branding logos
          const clientLogos = document.querySelectorAll('.sidebar-logo img, .client-branding-logo');
          clientLogos.forEach(img => {
            img.src = data.branding.logo;
            img.style.display = 'block';
            // Handle error - hide if logo doesn't exist
            img.onerror = function () {
              this.style.display = 'none';
            };
          });
        } else {
          // No logo configured - hide client branding logos
          const clientLogos = document.querySelectorAll('.client-branding-logo');
          clientLogos.forEach(img => {
            img.style.display = 'none';
          });
        }
      }
    }
  } catch (error) {
    console.error('Error applying branding:', error);
  }
}

// Initialize branding on load
// Initialize branding and message bar on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applyGlobalBranding();
    MessageManager.init();
  });
} else {
  applyGlobalBranding();
  MessageManager.init();
}

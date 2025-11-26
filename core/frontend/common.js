// common.js - Shared utilities for all pages

// Message handling
const MessageManager = {
  messageArea: null,
  hideTimeout: null,

  // Initialize message area
  init(messageAreaId = 'messageArea') {
    this.messageArea = document.getElementById(messageAreaId);
    if (!this.messageArea) {
      console.warn(`Message area with id "${messageAreaId}" not found`);
    }
    return this;
  },

  // Show message with auto-hide after duration
  show(message, type = 'info', duration = 5000) {
    if (!this.messageArea) {
      console.error('MessageManager not initialized. Call MessageManager.init() first.');
      return;
    }

    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Set message content and styling
    this.messageArea.textContent = message;
    this.messageArea.className = `message ${type}`;
    this.messageArea.style.visibility = 'visible';
    this.messageArea.style.opacity = '1';

    // Auto-hide after duration (if duration > 0)
    if (duration > 0) {
      this.hideTimeout = setTimeout(() => {
        this.hideTimeout = null; // Clear timeout reference
        this.messageArea.style.visibility = 'hidden';
        this.messageArea.style.opacity = '0';
      }, duration);
    }
  },

  // Hide message (only if no timeout is active, i.e., not a timed message)
  hide() {
    if (!this.messageArea) return;

    // Don't hide if there's an active timeout (means a timed message is showing)
    if (this.hideTimeout) {
      return;
    }

    this.messageArea.style.visibility = 'hidden';
    this.messageArea.style.opacity = '0';
  },

  // Force hide message (clears timeout and hides immediately)
  forceHide() {
    if (!this.messageArea) return;

    this.messageArea.style.visibility = 'hidden';
    this.messageArea.style.opacity = '0';

    // Clear timeout if exists
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  },

  // Show loading message (no auto-hide)
  showLoading(message = 'Loading...') {
    this.show(message, 'info', 0); // duration = 0 means no auto-hide
  },

  // Clear message content
  clear() {
    if (!this.messageArea) return;

    this.messageArea.textContent = '';
    this.messageArea.className = 'message';
    this.hide();
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyGlobalBranding);
} else {
  applyGlobalBranding();
}

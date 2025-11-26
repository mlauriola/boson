// Help Modal Component
// Displays contextual help for each page

class HelpModal {
  constructor() {
    this.modal = null;
    this.init();
  }

  init() {
    // Create modal HTML structure
    const modalHTML = `
      <div id="helpModal" class="help-modal" style="display: none;">
        <div class="help-modal-content">
          <div class="help-modal-header">
            <h2 id="helpModalTitle">Help</h2>
            <div class="help-modal-actions">
              <button id="helpCloseBtn" class="help-close" title="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          <div class="help-modal-body" id="helpModalBody">
            <div class="help-loading">Loading help content...</div>
          </div>
        </div>
      </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    this.modal = document.getElementById('helpModal');
    this.body = document.getElementById('helpModalBody');
    this.title = document.getElementById('helpModalTitle');

    // Event listeners
    document.getElementById('helpCloseBtn').addEventListener('click', () => this.close());

    // Close on outside click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'block') {
        this.close();
      }
    });
  }

  async show(pageName) {
    this.currentPage = pageName;
    this.modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Show loading state
    this.body.innerHTML = '<div class="help-loading">Loading help content...</div>';

    try {
      // Fetch markdown content from server
      const response = await fetch(`/api/manual/${pageName}`);

      if (!response.ok) {
        throw new Error(`Manual not found (${response.status})`);
      }

      const markdown = await response.text();

      // Load marked.js from CDN if not already loaded
      if (typeof marked === 'undefined') {
        await this.loadMarked();
      }

      // Convert markdown to HTML
      const html = marked.parse(markdown);

      // Display content
      this.body.innerHTML = html;

      // Update title based on first H1
      const firstH1 = this.body.querySelector('h1');
      if (firstH1) {
        this.title.textContent = firstH1.textContent;
        firstH1.remove(); // Remove H1 from body since it's in the header
      }

      // Smooth scroll links within the modal
      this.setupInternalLinks();

    } catch (error) {
      console.error('Error loading help:', error);
      this.body.innerHTML = `
        <div class="help-error">
          <h3>Unable to load help content</h3>
          <p>The help manual for this page is currently unavailable.</p>
          <p class="help-error-details">${error.message}</p>
        </div>
      `;
    }
  }

  close() {
    this.modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }

  async loadMarked() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  setupInternalLinks() {
    // Make internal anchor links scroll smoothly within the modal
    const links = this.body.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = this.body.querySelector(`#${targetId}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
}

// Initialize global help modal instance
window.helpModal = new HelpModal();

// Global function to show help for current page
window.showHelp = function(pageName) {
  window.helpModal.show(pageName);
};

// index-help.js - Help navigation functionality for the home page

document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const tabs = document.querySelectorAll('.guide-tab');
  const contents = document.querySelectorAll('.guide-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');

      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab
      this.classList.add('active');

      // Show corresponding content
      const targetContent = document.getElementById(`${targetTab}-content`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // Help link click handlers
  const guideLinks = document.querySelectorAll('.guide-link');

  guideLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const pageName = this.getAttribute('data-page');

      if (pageName && typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded or page name missing');
      }
    });
  });

  // Download complete PDF button
  const downloadPdfBtn = document.getElementById('downloadCompletePdfBtn');

  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async function() {
      try {
        // Open the complete manual in a new window
        // User can then use browser's Print to PDF functionality
        window.open('/api/manual/pdf/complete', '_blank');

      } catch (error) {
        console.error('Error opening complete manual:', error);
        alert('Failed to open complete manual. Please try again or contact the administrator.');
      }
    });
  }
});

// Commonwealth Games Glasgow 2026 - RSC Codes
// JavaScript for RSC verification tasks

// DOM Elements
let verifyRscBtn;
let verificationResults;
let currentUserSpan;
let menuToggle;
let sidebar;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize MessageManager
  MessageManager.init('messageArea');
  verifyRscBtn = document.getElementById('verifyRscBtn');
  verificationResults = document.getElementById('verificationResults');
  currentUserSpan = document.getElementById('currentUser');
  menuToggle = document.getElementById('menuToggle');
  sidebar = document.getElementById('sidebar');
  const helpBtn = document.getElementById('helpBtn');

  // Help button event listener
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = window.ACTIVE_PAGE || 'rsccodes';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  // Load username and check authentication
  await loadUserInfo();

  // Menu toggle functionality
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }
});

// Load user information
async function loadUserInfo() {
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

    // Check if user is administrator or super editor (roleId = 1 or 2)
    // NORMAL EDITOR (roleId = 3) is NOT allowed
    if (data.roleId !== 1 && data.roleId !== 2) {
      alert('Access denied. Only administrators and super editors can access this page.');
      window.location.href = '/index.html';
      return;
    }

    // Show current user referent
    if (currentUserSpan) {
      currentUserSpan.textContent = `Welcome, ${data.referent || data.username}`;
    }

    // Update sidebar menu visibility based on user role
    if (typeof updateSidebarMenuVisibility === 'function') {
      updateSidebarMenuVisibility(data.roleId);
    }
  } catch (error) {
    console.error('Error loading user info:', error);
    window.location.href = '/login.html';
  }
}

// Show message in message area
function showMessage(message, type = 'info') {
  const duration = (type === 'success' || type === 'info') ? 5000 : 0;
  MessageManager.show(message, type, duration);
}

// Verify RSC Codes
async function verifyRscCodes() {
  try {
    // Disable button and show loading state
    verifyRscBtn.disabled = true;
    verifyRscBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
      Verifying...
    `;

    showMessage('Running RSC code verification...', 'info');
    verificationResults.style.display = 'none';

    // Call API
    const response = await fetch('/api/commoncodes/verify-rsc');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Verification failed');
    }

    // Display results
    displayVerificationResults(data);
    showMessage('Verification completed successfully', 'success');

  } catch (error) {
    console.error('Error verifying RSC codes:', error);
    showMessage('Error during verification: ' + error.message, 'error');
  } finally {
    // Re-enable button
    verifyRscBtn.disabled = false;
    verifyRscBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Verify RSC Codes
    `;
  }
}

// Display verification results
function displayVerificationResults(data) {
  const resultsDiv = verificationResults;
  resultsDiv.style.display = 'block';

  // Calculate summary
  const totalTables = data.lengthVerification.length;
  const tablesWithErrors = data.lengthVerification.filter(t =>
    (t.InvalidLength || 0) > 0 ||
    (t.NullOrEmpty || 0) > 0 ||
    (t.InvalidFormat || 0) > 0 ||
    (t.InvalidContent || 0) > 0
  ).length + data.structureVerification.filter(t => (t.InvalidComposition || 0) > 0).length;
  const totalRecords = data.lengthVerification.reduce((sum, t) => sum + (t.TotalRows || 0), 0);
  const totalErrors = data.lengthVerification.reduce((sum, t) =>
    sum + (t.InvalidLength || 0) + (t.NullOrEmpty || 0) + (t.InvalidFormat || 0) + (t.InvalidContent || 0), 0
  ) + data.structureVerification.reduce((sum, t) => sum + (t.InvalidComposition || 0), 0);

  // Build HTML
  let html = '<h3>Verification Summary</h3>';

  // Summary cards
  html += '<div style="margin-bottom: 24px;">';
  html += `
    <div class="summary-card">
      <h3>Total Tables</h3>
      <div class="value">${totalTables}</div>
    </div>
    <div class="summary-card">
      <h3>Total Records</h3>
      <div class="value">${totalRecords.toLocaleString()}</div>
    </div>
    <div class="summary-card" style="border-left-color: ${totalErrors === 0 ? '#28a745' : '#dc3545'};">
      <h3>Total Errors</h3>
      <div class="value" style="color: ${totalErrors === 0 ? '#28a745' : '#dc3545'};">${totalErrors}</div>
    </div>
  `;
  html += '</div>';

  // Overall status
  if (totalErrors === 0) {
    html += `
      <div style="padding: 16px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; margin-bottom: 24px;">
        <strong style="color: #155724;">✓ All RSC codes are valid!</strong>
        <p style="margin: 8px 0 0 0; color: #155724;">All ${totalRecords.toLocaleString()} RSC codes across ${totalTables} tables passed both length and structure verification.</p>
      </div>
    `;
  } else {
    html += `
      <div style="padding: 16px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin-bottom: 24px;">
        <strong style="color: #721c24;">✗ Validation errors found</strong>
        <p style="margin: 8px 0 0 0; color: #721c24;">${totalErrors} invalid RSC codes found across ${tablesWithErrors} tables.</p>
      </div>
    `;
  }

  // Length verification results
  html += '<h3>RSC Code Format and Content Verification</h3>';
  html += '<p style="margin-bottom: 16px; color: #666;">Verifies length (34 chars), format (uppercase, alphanumeric + dash), and content consistency with table columns.</p>';
  html += '<table class="results-table">';
  html += '<thead><tr>';
  html += '<th>Table</th>';
  html += '<th>Expected Length</th>';
  html += '<th>Total Rows</th>';
  html += '<th>Invalid Length</th>';
  html += '<th>Null/Empty</th>';
  html += '<th>Invalid Format</th>';
  html += '<th>Invalid Content</th>';
  html += '<th>Min Length</th>';
  html += '<th>Max Length</th>';
  html += '<th>Status</th>';
  html += '</tr></thead><tbody>';

  data.lengthVerification.forEach(row => {
    const invalidLength = row.InvalidLength || 0;
    const nullOrEmpty = row.NullOrEmpty || 0;
    const invalidFormat = row.InvalidFormat || 0;
    const invalidContent = row.InvalidContent || 0;
    const hasError = invalidLength > 0 || nullOrEmpty > 0 || invalidFormat > 0 || invalidContent > 0;

    // Determine which error type to show (prioritize first error found)
    let errorType = null;
    if (invalidLength > 0) errorType = 'InvalidLength';
    else if (nullOrEmpty > 0) errorType = 'NullOrEmpty';
    else if (invalidFormat > 0) errorType = 'InvalidFormat';
    else if (invalidContent > 0) errorType = 'InvalidContent';

    html += '<tr>';
    html += `<td><strong>${row.TableName}</strong></td>`;
    html += `<td>${row.ExpectedLength || 34}</td>`;
    html += `<td>${(row.TotalRows || 0).toLocaleString()}</td>`;
    html += `<td style="${invalidLength > 0 ? 'color: #dc3545; font-weight: bold;' : ''}">${invalidLength}</td>`;
    html += `<td style="${nullOrEmpty > 0 ? 'color: #dc3545; font-weight: bold;' : ''}">${nullOrEmpty}</td>`;
    html += `<td style="${invalidFormat > 0 ? 'color: #dc3545; font-weight: bold;' : ''}">${invalidFormat}</td>`;
    html += `<td style="${invalidContent > 0 ? 'color: #dc3545; font-weight: bold;' : ''}">${invalidContent}</td>`;
    html += `<td>${row.MinLength || 0}</td>`;
    html += `<td>${row.MaxLength || 0}</td>`;
    html += `<td>`;
    if (hasError) {
      html += `<span class="status-badge status-error" style="cursor: pointer;" onclick="showErrorDetails('${row.TableName}', '${errorType}')" title="Click to see error details">ERROR</span>`;
    } else {
      html += `<span class="status-badge status-success">OK</span>`;
    }
    html += `</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';

  // Structure verification results
  html += '<h3 style="margin-top: 32px;">Hierarchical Structure Verification</h3>';
  html += '<p style="margin-bottom: 16px; color: #666;">Verifies that RSC codes maintain proper hierarchical composition (child codes must start with their parent codes).</p>';
  html += '<table class="results-table">';
  html += '<thead><tr>';
  html += '<th>Table</th>';
  html += '<th>Verification Type</th>';
  html += '<th>Total Rows</th>';
  html += '<th>Invalid Composition</th>';
  html += '<th>Status</th>';
  html += '</tr></thead><tbody>';

  data.structureVerification.forEach(row => {
    const hasError = row.InvalidComposition > 0;
    html += '<tr>';
    html += `<td><strong>${row.TableName}</strong></td>`;
    html += `<td>${row.VerificationType}</td>`;
    html += `<td>${(row.TotalRows || 0).toLocaleString()}</td>`;
    html += `<td style="${row.InvalidComposition > 0 ? 'color: #dc3545; font-weight: bold;' : ''}">${row.InvalidComposition || 0}</td>`;
    html += `<td>`;
    if (hasError) {
      html += `<span class="status-badge status-error" style="cursor: pointer;" onclick="showErrorDetails('${row.TableName}', 'InvalidComposition')" title="Click to see error details">ERROR</span>`;
    } else {
      html += `<span class="status-badge status-success">OK</span>`;
    }
    html += `</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';

  resultsDiv.innerHTML = html;
}

// Show error details modal
async function showErrorDetails(tableName, errorType) {
  const modal = document.getElementById('errorDetailsModal');
  const title = document.getElementById('errorDetailsTitle');
  const body = document.getElementById('errorDetailsBody');

  // Show loading state
  title.textContent = 'Loading error details...';
  body.innerHTML = '<p style="text-align: center; padding: 20px;">Loading...</p>';
  modal.style.display = 'flex';

  try {
    const response = await fetch(`/api/commoncodes/rsc-error-details?tableName=${encodeURIComponent(tableName)}&errorType=${encodeURIComponent(errorType)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load error details');
    }

    // Update modal title
    const errorTypeLabels = {
      'InvalidLength': 'Invalid Length',
      'NullOrEmpty': 'Null or Empty',
      'InvalidFormat': 'Invalid Format',
      'InvalidContent': 'Invalid Content',
      'InvalidComposition': 'Invalid Hierarchical Composition'
    };
    title.textContent = `${errorTypeLabels[errorType] || errorType} - ${tableName} (${data.errors.length} errors)`;

    // Build table with error details
    if (data.errors.length === 0) {
      body.innerHTML = '<p style="text-align: center; padding: 20px;">No errors found.</p>';
    } else {
      let html = '<table class="results-table" style="margin: 0;">';
      html += '<thead><tr>';

      // Dynamic columns based on table structure
      const firstRow = data.errors[0];
      Object.keys(firstRow).forEach(key => {
        html += `<th>${key}</th>`;
      });
      html += '</tr></thead><tbody>';

      // Add rows
      data.errors.forEach(error => {
        html += '<tr>';
        Object.values(error).forEach(value => {
          const displayValue = value === null ? '<em style="color: #999;">NULL</em>' :
                               value === '' ? '<em style="color: #999;">Empty</em>' :
                               value;
          html += `<td>${displayValue}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table>';
      body.innerHTML = html;
    }
  } catch (error) {
    title.textContent = 'Error';
    body.innerHTML = `<p style="color: #dc3545; text-align: center; padding: 20px;">Failed to load error details: ${error.message}</p>`;
  }
}

// Close error details modal
function closeErrorDetailsModal() {
  const modal = document.getElementById('errorDetailsModal');
  modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('errorDetailsModal');
  if (event.target === modal) {
    closeErrorDetailsModal();
  }
}

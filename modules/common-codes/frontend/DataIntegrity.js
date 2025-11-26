// DataIntegrity.js - Client-side logic for Data Integrity Check

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize MessageManager
  MessageManager.init('messageArea');

  // DOM Elements
  const helpBtn = document.getElementById('helpBtn');

  // Help button event listener
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = window.ACTIVE_PAGE || 'dataintegrity';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  // Check authentication
  await checkAuth();
});

// Check authentication
async function checkAuth() {
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
    if (data.roleId !== 1 && data.roleId !== 2) {
      window.location.href = '/index.html';
      return;
    }

    // Update current user display in header
    const currentUserSpan = document.getElementById('currentUser');
    if (currentUserSpan) {
      currentUserSpan.textContent = `Welcome, ${data.referent || data.username}`;
    }

    // Update sidebar menu visibility based on role
    if (typeof updateSidebarMenuVisibility === 'function') {
      updateSidebarMenuVisibility(data.roleId);
    }

  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = '/login.html';
  }
}

// Show message
function showMessage(message, type = 'info') {
  MessageManager.show(message, type, 5000);
}

// Show loading state
function showLoading(show) {
  const btn = document.getElementById('checkIntegrityBtn');
  if (show) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
      Checking...
    `;
  } else {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      Check Data Integrity
    `;
  }
}

// Main function to check data integrity
async function checkDataIntegrity() {
  showLoading(true);
  document.getElementById('verificationResults').style.display = 'none';

  try {
    const response = await fetch('/api/integrity/check');
    const data = await response.json();

    if (response.ok) {
      displayResults(data);
      showMessage('Data integrity check completed', 'success');
    } else {
      showMessage(data.error || 'Error checking data integrity', 'error');
    }
  } catch (error) {
    console.error('Error checking data integrity:', error);
    showMessage('Error checking data integrity', 'error');
  } finally {
    showLoading(false);
  }
}

// Display results
function displayResults(issues) {
  const resultsDiv = document.getElementById('verificationResults');
  const summaryCards = document.getElementById('summaryCards');
  const tableContainer = document.getElementById('resultsTableContainer');

  resultsDiv.style.display = 'block';

  // Calculate totals
  const totalIssues = issues.reduce((sum, issue) => sum + issue.OrphanCount, 0);
  const criticalCount = issues.filter(i => i.Severity === 'CRITICAL').reduce((sum, i) => sum + i.OrphanCount, 0);
  const highCount = issues.filter(i => i.Severity === 'HIGH').reduce((sum, i) => sum + i.OrphanCount, 0);
  const tablesAffected = new Set(issues.map(i => i.TableName)).size;

  // Display summary cards
  if (totalIssues === 0) {
    summaryCards.innerHTML = `
      <div class="no-issues">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div><strong>✓ No Data Integrity Issues Found!</strong></div>
        <div style="font-size: 1rem; color: #666; margin-top: 8px;">All foreign key references are valid.</div>
      </div>
    `;
    tableContainer.innerHTML = '';
    return;
  }

  summaryCards.innerHTML = `
    <div class="summary-card ${totalIssues > 0 ? 'critical' : 'success'}">
      <h3>Total Issues</h3>
      <div class="value">${totalIssues.toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <h3>Tables Affected</h3>
      <div class="value">${tablesAffected}</div>
    </div>
    ${criticalCount > 0 ? `
    <div class="summary-card critical">
      <h3>Critical Issues</h3>
      <div class="value">${criticalCount.toLocaleString()}</div>
    </div>
    ` : ''}
    ${highCount > 0 ? `
    <div class="summary-card">
      <h3>High Priority</h3>
      <div class="value">${highCount.toLocaleString()}</div>
    </div>
    ` : ''}
  `;

  // Display results table
  let tableHTML = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Table</th>
          <th>Column</th>
          <th>Referenced Table</th>
          <th>Orphan Count</th>
          <th>Severity</th>
        </tr>
      </thead>
      <tbody>
  `;

  issues.forEach((issue, index) => {
    const severityClass = `severity-${issue.Severity.toLowerCase()}`;
    tableHTML += `
      <tr>
        <td><span class="code-snippet">${issue.TableName}</span></td>
        <td><span class="code-snippet">${issue.ColumnName}</span></td>
        <td><span class="code-snippet">${issue.ReferencedTable}.${issue.ReferencedColumn}</span></td>
        <td><strong>${issue.OrphanCount.toLocaleString()}</strong></td>
        <td>
          <span class="severity-badge ${severityClass}" style="cursor: pointer;" onclick="showDetails(${index})">${issue.Severity}</span>
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  tableContainer.innerHTML = tableHTML;

  // Store issues for details modal
  window.integrityIssues = issues;
}

// Show details modal
function showDetails(index) {
  const issue = window.integrityIssues[index];
  const modal = document.getElementById('detailsModal');
  const title = document.getElementById('detailsTitle');
  const body = document.getElementById('detailsBody');

  title.textContent = `${issue.TableName}.${issue.ColumnName} → ${issue.ReferencedTable}.${issue.ReferencedColumn}`;

  let detailsHTML = `
    <div style="margin-bottom: 20px;">
      <p><strong>Orphan Count:</strong> ${issue.OrphanCount.toLocaleString()} records</p>
      <p><strong>Severity:</strong> <span class="severity-badge severity-${issue.Severity.toLowerCase()}">${issue.Severity}</span></p>
    </div>

    <div style="background: #f8f9fa; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
      <h3 style="margin-top: 0;">Problem Description</h3>
      <p>
        The <span class="code-snippet">${issue.TableName}</span> table has ${issue.OrphanCount} record(s) where the
        <span class="code-snippet">${issue.ColumnName}</span> column references values that don't exist in the
        <span class="code-snippet">${issue.ReferencedTable}</span> lookup table.
      </p>
      <p>
        <strong>Impact:</strong> These records will display with empty/NULL descriptions in the UI instead of proper names.
      </p>
    </div>

    <h3>Example Orphan Records:</h3>
  `;

  // Parse examples
  if (issue.ExamplePK && issue.ExampleInvalidValue) {
    const pks = issue.ExamplePK.split(', ').slice(0, 5);
    const values = issue.ExampleInvalidValue.split(', ').slice(0, 5);

    detailsHTML += `<div style="font-family: 'Courier New', monospace; background: white; padding: 12px; border-radius: 4px; border: 1px solid #dee2e6;">`;

    pks.forEach((pk, i) => {
      detailsHTML += `
        <div style="margin-bottom: 12px; padding: 8px; background: #f8f9fa; border-left: 3px solid #dc3545;">
          <div><strong>Primary Key:</strong> <span style="color: #e83e8c;">${pk}</span></div>
          <div><strong>Invalid ${issue.ColumnName}:</strong> <span style="color: #dc3545;">"${values[i] || 'N/A'}"</span></div>
        </div>
      `;
    });

    detailsHTML += `</div>`;
  } else {
    detailsHTML += `<p style="color: #666;">No example data available.</p>`;
  }

  detailsHTML += `
    <div style="margin-top: 24px; padding: 16px; background: #fff3cd; border-radius: 4px;">
      <h3 style="margin-top: 0;">Recommended Actions:</h3>
      <ol style="margin: 10px 0 0 20px; line-height: 1.8;">
        <li>Review the orphan records and determine if they should be:
          <ul style="margin-left: 20px;">
            <li>Deleted (if obsolete/test data)</li>
            <li>Updated to valid reference values</li>
            <li>Set to NULL (if the column allows NULL values)</li>
          </ul>
        </li>
        <li>Fix the data before publishing new versions</li>
        <li>Consider adding validation in the Create/Update stored procedures</li>
      </ol>
    </div>
  `;

  body.innerHTML = detailsHTML;
  modal.style.display = 'flex';
}

// Close details modal
function closeDetailsModal() {
  document.getElementById('detailsModal').style.display = 'none';
}

// Add CSS for spin animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

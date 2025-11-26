// Versioning.js - Version management functionality

document.addEventListener('DOMContentLoaded', () => {
  // Initialize MessageManager
  MessageManager.init('messageArea');

  // DOM Elements
  const currentUserSpan = document.getElementById('currentUser');
  const addVersionBtn = document.getElementById('addVersionBtn');
  const versionsTableBody = document.getElementById('versionsTableBody');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const publishBtn = document.getElementById('publishBtn');
  const helpBtn = document.getElementById('helpBtn');

  // Help button event listener
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = window.ACTIVE_PAGE || 'versioning';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  // User role
  let userRoleId = null;

  // Quill editors
  let addMessageQuill = null;
  let editMessageQuill = null;

  // Add Modal
  const addModal = document.getElementById('addModal');
  const closeAddModal = document.getElementById('closeAddModal');
  const cancelAdd = document.getElementById('cancelAdd');
  const addVersionForm = document.getElementById('addVersionForm');

  // Edit Modal
  const editModal = document.getElementById('editModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEdit = document.getElementById('cancelEdit');
  const editVersionForm = document.getElementById('editVersionForm');

  // Delete Version Confirmation Modal
  const deleteVersionModal = document.getElementById('deleteVersionModal');
  const closeDeleteVersion = document.getElementById('closeDeleteVersion');
  const cancelDeleteVersion = document.getElementById('cancelDeleteVersion');
  const confirmDeleteVersion = document.getElementById('confirmDeleteVersion');
  const deleteVersionName = document.getElementById('deleteVersionName');

  // Publish Working Version Warning Modal
  const publishWorkingWarningModal = document.getElementById('publishWorkingWarningModal');
  const closePublishWorkingWarning = document.getElementById('closePublishWorkingWarning');
  const cancelPublishWorking = document.getElementById('cancelPublishWorking');
  const confirmPublishWorking = document.getElementById('confirmPublishWorking');

  // Publish Confirmation Modal
  const publishConfirmModal = document.getElementById('publishConfirmModal');
  const closePublishConfirm = document.getElementById('closePublishConfirm');
  const cancelPublish = document.getElementById('cancelPublish');
  const confirmPublish = document.getElementById('confirmPublish');
  const publishVersionName = document.getElementById('publishVersionName');

  // Publish Progress Modal
  const publishProgressModal = document.getElementById('publishProgressModal');
  const closePublishProgress = document.getElementById('closePublishProgress');
  const closePublishProgressBtn = document.getElementById('closePublishProgressBtn');
  const publishProgressVersionName = document.getElementById('publishProgressVersionName');
  const publishProgressBar = document.getElementById('publishProgressBar');
  const publishProgressPercent = document.getElementById('publishProgressPercent');
  const publishCompleteMessage = document.getElementById('publishCompleteMessage');

  // Create Confirmation Modal
  const createConfirmModal = document.getElementById('createConfirmModal');
  const closeCreateConfirm = document.getElementById('closeCreateConfirm');
  const cancelCreate = document.getElementById('cancelCreate');
  const confirmCreate = document.getElementById('confirmCreate');
  const createVersionName = document.getElementById('createVersionName');

  // Variable to store versions data
  let versions = [];
  let filteredVersions = [];

  // Store selected version for publishing
  let versionToPublish = null;

  // Store form data for creating version
  let versionDataToCreate = null;

  // Store version to delete
  let versionToDelete = null;

  // Sorting state
  let currentSortColumn = null;
  let currentSortDirection = 'asc';

  // Check authentication on page load
  checkAuthentication();

  // Initialize Quill editors
  initializeQuillEditors();

  // Menu toggle functionality
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Setup sortable columns
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.getAttribute('data-column');
      sortTable(column);
    });
  });

  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    clearSearch.style.display = searchTerm ? 'flex' : 'none';

    if (searchTerm === '') {
      filteredVersions = versions;
    } else {
      filteredVersions = versions.filter(version => {
        const release = (version.Release || '').toLowerCase();
        const description = (version.Description || '').toLowerCase();
        const author = (version.Author || '').toString().toLowerCase();

        return release.includes(searchTerm) ||
               description.includes(searchTerm) ||
               author.includes(searchTerm);
      });
    }

    renderVersionsTable();
  });

  // Clear search
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    filteredVersions = versions;
    renderVersionsTable();
    searchInput.focus();
  });

  // Delete selected version (single radio selection)
  deleteSelectedBtn.addEventListener('click', () => {
    const selectedRadio = document.querySelector('input[name="versionRadio"]:checked');

    if (!selectedRadio) {
      showMessage('Please select a version to delete', 'error');
      return;
    }

    const code = selectedRadio.dataset.code;
    const release = selectedRadio.dataset.release;

    // Store version info and show confirmation modal
    versionToDelete = { code, release };
    deleteVersionName.textContent = release;
    deleteVersionModal.style.display = 'flex';
  });

  // Close delete version modal
  closeDeleteVersion.addEventListener('click', () => {
    deleteVersionModal.style.display = 'none';
    versionToDelete = null;
  });

  cancelDeleteVersion.addEventListener('click', () => {
    deleteVersionModal.style.display = 'none';
    versionToDelete = null;
  });

  // Confirm delete version
  confirmDeleteVersion.addEventListener('click', async () => {
    if (!versionToDelete) return;

    // Close modal
    deleteVersionModal.style.display = 'none';

    // Proceed with deletion
    await performDelete([versionToDelete.code]);
    versionToDelete = null;
  });

  // Function to perform deletion
  async function performDelete(codes) {
    try {
      const response = await fetch('/api/versions/delete-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes })
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message || 'Version deleted successfully', 'success');
        loadVersions();
      } else {
        showMessage(result.error || 'Error deleting version', 'error');
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      showMessage('Server connection error', 'error');
    }
  }

  // Publish version
  publishBtn.addEventListener('click', () => {
    const selectedRadio = document.querySelector('input[name="versionRadio"]:checked');

    if (!selectedRadio) {
      showMessage('Please select a version to publish', 'error');
      return;
    }

    const code = selectedRadio.dataset.code;
    const release = selectedRadio.dataset.release;

    // Check if this is the working version (latest Code, not published)
    const latestCode = Math.max(...versions.map(v => v.Code));
    const isWorkingVersion = parseInt(code) === latestCode;

    // Check if this version is already published (republishing)
    const selectedVersion = versions.find(v => v.Code.toString() === code);
    const isRepublishing = selectedVersion && (selectedVersion.Published === 1 || selectedVersion.Published === true);

    // Store version info with republishing flag
    versionToPublish = { code, release, isRepublishing };

    // If it's the working version, show warning modal first
    if (isWorkingVersion) {
      publishWorkingWarningModal.style.display = 'flex';
    } else {
      // Otherwise, show confirmation modal directly with appropriate text
      updatePublishConfirmModalText(release, isRepublishing);
      publishConfirmModal.style.display = 'flex';
    }
  });

  // Close publish working warning modal
  closePublishWorkingWarning.addEventListener('click', () => {
    publishWorkingWarningModal.style.display = 'none';
    versionToPublish = null;
  });

  cancelPublishWorking.addEventListener('click', () => {
    publishWorkingWarningModal.style.display = 'none';
    versionToPublish = null;
  });

  // Confirm publish working version (proceed to final confirmation)
  confirmPublishWorking.addEventListener('click', () => {
    // Close warning modal
    publishWorkingWarningModal.style.display = 'none';

    // Show final confirmation modal
    if (versionToPublish) {
      updatePublishConfirmModalText(versionToPublish.release, versionToPublish.isRepublishing);
      publishConfirmModal.style.display = 'flex';
    }
  });

  // Close publish confirmation modal
  closePublishConfirm.addEventListener('click', () => {
    publishConfirmModal.style.display = 'none';
    versionToPublish = null;
  });

  cancelPublish.addEventListener('click', () => {
    publishConfirmModal.style.display = 'none';
    versionToPublish = null;
  });

  // Publish Progress Modal listeners
  closePublishProgress.addEventListener('click', () => {
    if (!closePublishProgressBtn.disabled) {
      publishProgressModal.style.display = 'none';
    }
  });

  closePublishProgressBtn.addEventListener('click', () => {
    publishProgressModal.style.display = 'none';
    loadVersions(); // Reload versions after closing
  });

  // Confirm publish - with progress modal
  confirmPublish.addEventListener('click', async () => {
    if (!versionToPublish) return;

    // Close confirmation modal
    publishConfirmModal.style.display = 'none';

    // Show progress modal
    resetPublishProgressModal();
    publishProgressVersionName.textContent = versionToPublish.release;
    publishProgressModal.style.display = 'flex';

    try {
      // Task 1: Activating publication flag
      updatePublishTask('publish-flag', 'loading', 'In progress...');
      updatePublishProgress(10);

      const response = await fetch(`/api/versions/${versionToPublish.code}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ release: versionToPublish.release })
      });

      const result = await response.json();

      if (response.ok) {
        // Task 1: Complete
        updatePublishTask('publish-flag', 'complete', 'Version published');
        updatePublishProgress(40);

        // Task 2: Release notes (simulated - already done by backend)
        updatePublishTask('release-notes', 'loading', 'Generating...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay
        updatePublishTask('release-notes', 'complete', 'Release notes generated');
        updatePublishProgress(50);

        // Task 3: DT_CODES export
        if (result.dtCodesExported) {
          updatePublishTask('dt-codes', 'loading', `Generating ${result.xmlFilesCount} files...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay
          updatePublishTask('dt-codes', 'complete', `${result.xmlFilesCount} files exported successfully`);
        } else {
          updatePublishTask('dt-codes', 'complete', 'Skipped');
        }
        updatePublishProgress(75);

        // Task 4: Excel export
        if (result.excelGenerated) {
          updatePublishTask('excel-export', 'loading', 'Generating Excel file...');
          await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay
          updatePublishTask('excel-export', 'complete', `Excel file generated successfully`);
        } else if (result.excelError) {
          updatePublishTask('excel-export', 'warning', `Warning: ${result.excelError}`);
        } else {
          updatePublishTask('excel-export', 'warning', 'Excel generation skipped or failed');
        }
        updatePublishProgress(100);

        // Show completion message
        publishCompleteMessage.style.display = 'block';
        closePublishProgressBtn.disabled = false;

        showMessage(result.message || 'Version published successfully', 'success');
      } else {
        // Error occurred
        updatePublishTask('publish-flag', 'pending', 'Failed');
        showMessage(result.error || 'Error publishing version', 'error');
        closePublishProgressBtn.disabled = false;
      }
    } catch (error) {
      console.error('Error publishing version:', error);
      updatePublishTask('publish-flag', 'pending', 'Connection error');
      showMessage('Server connection error', 'error');
      closePublishProgressBtn.disabled = false;
    } finally {
      versionToPublish = null;
    }
  });

  // Add Version Modal
  addVersionBtn.addEventListener('click', () => {
    addVersionForm.reset();
    // Clear Quill editor
    if (addMessageQuill) {
      addMessageQuill.setText('');
    }
    showMessage('', ''); // Clear main message area
    addModal.style.display = 'flex';
  });

  closeAddModal.addEventListener('click', () => {
    addModal.style.display = 'none';
  });

  cancelAdd.addEventListener('click', () => {
    addModal.style.display = 'none';
  });

  // Add Version Form Submit - Show confirmation modal
  addVersionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(addVersionForm);

    // Get HTML content from Quill editor
    const messageHTML = addMessageQuill ? addMessageQuill.root.innerHTML : '';

    versionDataToCreate = {
      Release: formData.get('Release'),
      Description: formData.get('Description') || null,
      Message: messageHTML || null
    };

    // Close add modal and show confirmation modal
    addModal.style.display = 'none';
    createVersionName.textContent = versionDataToCreate.Release;
    createConfirmModal.style.display = 'flex';
  });

  // Close create confirmation modal
  closeCreateConfirm.addEventListener('click', () => {
    createConfirmModal.style.display = 'none';
    versionDataToCreate = null;
    // Reopen add modal
    addModal.style.display = 'flex';
  });

  cancelCreate.addEventListener('click', () => {
    createConfirmModal.style.display = 'none';
    versionDataToCreate = null;
    // Reopen add modal
    addModal.style.display = 'flex';
  });

  // Confirm create version
  confirmCreate.addEventListener('click', async () => {
    if (!versionDataToCreate) return;

    // Close confirmation modal
    createConfirmModal.style.display = 'none';

    try {
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionDataToCreate)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('Version added successfully', 'success');
        addVersionForm.reset();
        loadVersions();
      } else {
        showMessage(result.error || 'Error adding version', 'error');
      }
    } catch (error) {
      console.error('Error adding version:', error);
      showMessage('Server connection error', 'error');
    } finally {
      versionDataToCreate = null;
    }
  });

  // Edit Modal
  closeEditModal.addEventListener('click', () => {
    editModal.style.display = 'none';
  });

  cancelEdit.addEventListener('click', () => {
    editModal.style.display = 'none';
  });

  // Edit Version Form Submit
  editVersionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(editVersionForm);
    const code = document.getElementById('editOriginalCode').value;

    // Get HTML content from Quill editor
    const messageHTML = editMessageQuill ? editMessageQuill.root.innerHTML : '';

    const data = {
      Code: parseFloat(formData.get('Code')),
      Release: formData.get('Release'),
      Version: parseInt(formData.get('Version')),
      Published: document.getElementById('editPublished').checked,
      Author: parseInt(formData.get('Author')),
      Description: formData.get('Description') || null,
      Message: messageHTML || null
    };

    try {
      const response = await fetch(`/api/versions/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        editModal.style.display = 'none';
        showMessage('Version updated successfully', 'success');
        loadVersions();
      } else {
        editModal.style.display = 'none';
        showMessage(result.error || 'Error updating version', 'error');
      }
    } catch (error) {
      console.error('Error updating version:', error);
      editModal.style.display = 'none';
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

      if (data.firstLogin === -1 || data.firstLogin === true) {
        window.location.href = '/index.html';
        return;
      }

      // Check if user is administrator or super editor (roleId = 1 or 2)
      if (data.roleId !== 1 && data.roleId !== 2) {
        alert('Access denied. Only administrators and super editors can access this page.');
        window.location.href = '/index.html';
        return;
      }

      // Store user role
      userRoleId = data.roleId;

      if (currentUserSpan) {
        currentUserSpan.textContent = `Welcome, ${data.referent || data.username}`;
      }

      if (typeof updateSidebarMenuVisibility === 'function') {
        updateSidebarMenuVisibility(data.roleId);
      }

      // Load versions after authentication
      loadVersions(true); // Clear any initial messages
    } catch (error) {
      console.error('Error checking authentication:', error);
      window.location.href = '/login.html';
    }
  }

  async function loadVersions(clearMessage = false) {
    try {
      const response = await fetch('/api/versions');
      const data = await response.json();

      if (response.ok) {
        versions = data;
        filteredVersions = versions;
        renderVersionsTable();
        // Only clear message if explicitly requested
        if (clearMessage) {
          showMessage('', '');
        }
      } else {
        showMessage(data.error || 'Error loading versions', 'error');
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      showMessage('Server connection error', 'error');
    }
  }

  function renderVersionsTable() {
    // Hide Code and Version columns if not ADMINISTRATOR
    const codeHeader = document.querySelector('th[data-column="Code"]');
    const versionHeader = document.querySelector('th[data-column="Version"]');
    if (codeHeader && versionHeader) {
      if (userRoleId === 1) {
        codeHeader.style.display = '';
        versionHeader.style.display = '';
      } else {
        codeHeader.style.display = 'none';
        versionHeader.style.display = 'none';
      }
    }

    if (filteredVersions.length === 0) {
      versionsTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 20px;">No versions found</td>
        </tr>
      `;
      return;
    }

    // Find the latest inserted version (highest Code)
    const latestCode = Math.max(...filteredVersions.map(v => v.Code));

    versionsTableBody.innerHTML = filteredVersions.map(version => {
      let bgColor = '';
      if (version.Published) {
        // Published version: purple color (same as Publish button)
        bgColor = 'background-color: rgba(107, 29, 158, 0.15);'; // #6b1d9e with transparency
      } else if (version.Code === latestCode) {
        // Latest inserted version: cyan color (same as Add Version button)
        bgColor = 'background-color: rgba(16, 188, 199, 0.15);'; // #10bcc7 with transparency
      }

      // Determine status text
      let statusText = '';
      const isPublished = version.Published === 1 || version.Published === true;
      const isWorking = version.Code === latestCode;

      if (isPublished && isWorking) {
        // Both published and working version
        statusText = '<span style="font-weight: bold;"><span style="color: #6b1d9e;">PUBLISHED/</span><span style="color: #10bcc7;">WORKING</span></span>';
      } else if (isPublished) {
        // Only published
        statusText = '<span style="color: #6b1d9e; font-weight: bold;">PUBLISHED</span>';
      } else if (isWorking) {
        // Only working version
        statusText = '<span style="color: #10bcc7; font-weight: bold;">WORKING VERSION</span>';
      } else {
        // Archive version
        statusText = '<span style="color: #999; font-weight: normal;">ARCHIVE</span>';
      }

      // Radio button is always enabled to allow republishing
      const disableRadio = false;

      return `
      <tr ${bgColor ? `style="${bgColor}"` : ''}>
        <td>
          <input type="radio" name="versionRadio" class="row-radio" data-code="${escapeAttr(version.Code)}" data-release="${escapeAttr(version.Release)}" ${disableRadio ? 'disabled style="cursor: not-allowed;"' : ''}>
        </td>
        ${userRoleId === 1 ? `<td>${escapeHtml(version.Code)}</td>` : ''}
        <td>${statusText}</td>
        <td>${escapeHtml(version.Release)}</td>
        <td>${version.DateUpd ? formatDate(version.DateUpd) : ''}</td>
        <td>${escapeHtml(version.AuthorName || 'Unknown')}</td>
        <td>${version.Description ? escapeHtml(version.Description.substring(0, 100)) + (version.Description.length > 100 ? '...' : '') : ''}</td>
        <td>
          ${version.File_Excel ? `<a href="${escapeAttr(version.File_Excel)}" target="_blank" title="Excel">📊</a>` : ''}
          ${version.File_ODF ? `<a href="${escapeAttr(version.File_ODF)}" target="_blank" title="ODF">📄</a>` : ''}
        </td>
        <td>
          <button class="btn btn-small btn-edit" data-code="${escapeAttr(version.Code)}">Edit</button>
        </td>
      </tr>
      `;
    }).join('');

    // Attach radio listeners
    document.querySelectorAll('.row-radio').forEach(radio => {
      radio.addEventListener('change', updateSelectedButtons);
    });

    // Attach edit button listeners
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const code = e.target.getAttribute('data-code');
        editVersion(code);
      });
    });

    updateSelectedButtons();
  }

  function updateSelectedButtons() {
    const selectedRadio = document.querySelector('input[name="versionRadio"]:checked');

    if (!selectedRadio) {
      deleteSelectedBtn.disabled = true;
      publishBtn.disabled = true;
      return;
    }

    const code = selectedRadio.dataset.code;
    const version = versions.find(v => v.Code.toString() === code);

    if (!version) {
      deleteSelectedBtn.disabled = true;
      publishBtn.disabled = true;
      return;
    }

    const latestCode = Math.max(...versions.map(v => v.Code));
    const isPublished = version.Published === 1 || version.Published === true;
    const isWorking = version.Code === latestCode;

    // Delete button: disabled for published and working version
    deleteSelectedBtn.disabled = isPublished || isWorking;

    // Publish button: always enabled to allow republishing
    publishBtn.disabled = false;
  }

  function sortTable(column) {
    if (currentSortColumn === column) {
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortColumn = column;
      currentSortDirection = 'asc';
    }

    filteredVersions.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle null/undefined
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    renderVersionsTable();

    // Update sort indicators
    document.querySelectorAll('.sortable').forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
      if (header.getAttribute('data-column') === column) {
        header.classList.add(`sort-${currentSortDirection}`);
      }
    });
  }

  // Global functions for inline onclick handlers
  window.editVersion = async function(code) {
    try {
      const response = await fetch(`/api/versions/${code}`);
      const version = await response.json();

      if (response.ok) {
        document.getElementById('editOriginalCode').value = version.Code;
        document.getElementById('editRelease').value = version.Release;
        document.getElementById('editPublished').value = version.Published ? 'Yes' : 'No';
        document.getElementById('editAuthorName').value = version.AuthorName || 'Unknown';
        document.getElementById('editDescription').value = version.Description || '';
        document.getElementById('editFileExcel').value = version.File_Excel || '';
        document.getElementById('editFileODF').value = version.File_ODF || '';

        // Load Message content into Quill editor
        if (editMessageQuill) {
          const messageContent = version.Message || '';
          editMessageQuill.root.innerHTML = messageContent;
        }

        showMessage('', ''); // Clear main message area
        editModal.style.display = 'flex';
      } else {
        showMessage(version.error || 'Error loading version', 'error');
      }
    } catch (error) {
      console.error('Error loading version:', error);
      showMessage('Server connection error', 'error');
    }
  };

  window.deleteVersion = async function(code, release) {
    if (!confirm(`Are you sure you want to delete version "${release}"?`)) return;

    try {
      const response = await fetch(`/api/versions/${code}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('Version deleted successfully', 'success');
        loadVersions();
      } else {
        showMessage(result.error || 'Error deleting version', 'error');
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      showMessage('Server connection error', 'error');
    }
  };

  // Publish Progress Functions
  function updatePublishTask(taskName, status, message) {
    const taskElement = document.querySelector(`.publish-task[data-task="${taskName}"]`);
    if (!taskElement) return;

    const icons = {
      pending: taskElement.querySelector('.task-pending'),
      loading: taskElement.querySelector('.task-loading'),
      complete: taskElement.querySelector('.task-complete'),
      warning: taskElement.querySelector('.task-warning')
    };
    const statusText = taskElement.querySelector('.task-status');

    // Hide all icons
    Object.values(icons).forEach(icon => {
      if (icon) icon.style.display = 'none';
    });

    // Show appropriate icon and update status
    if (status === 'loading') {
      icons.loading.style.display = 'block';
      statusText.textContent = message || 'In progress...';
      statusText.style.color = '#6b1d9e';
    } else if (status === 'complete') {
      icons.complete.style.display = 'block';
      statusText.textContent = message || 'Completed';
      statusText.style.color = '#28a745';
    } else if (status === 'warning') {
      if (icons.warning) {
        icons.warning.style.display = 'block';
      } else {
        icons.pending.style.display = 'block';
      }
      statusText.textContent = message || 'Warning';
      statusText.style.color = '#ffc107';
    } else {
      icons.pending.style.display = 'block';
      statusText.textContent = message || 'Waiting...';
      statusText.style.color = '#999';
    }
  }

  function updatePublishProgress(percent) {
    publishProgressBar.style.width = `${percent}%`;
    publishProgressPercent.textContent = `${percent}%`;
  }

  function resetPublishProgressModal() {
    // Reset progress bar
    updatePublishProgress(0);

    // Reset all tasks
    updatePublishTask('publish-flag', 'pending', 'Waiting...');
    updatePublishTask('release-notes', 'pending', 'Waiting...');
    updatePublishTask('dt-codes', 'pending', 'Waiting...');
    updatePublishTask('excel-export', 'pending', 'Waiting...');

    // Hide completion message
    publishCompleteMessage.style.display = 'none';

    // Disable close button
    closePublishProgressBtn.disabled = true;
  }

  // Utility functions
  function showMessage(message, type) {
    if (!message) {
      MessageManager.hide();
      return;
    }
    MessageManager.show(message, type, type === 'success' ? 5000 : 0);
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB');
  }

  function escapeHtml(text) {
    if (text == null) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }

  function escapeAttr(text) {
    if (text == null) return '';
    return escapeHtml(text).replace(/"/g, '&quot;');
  }

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === addModal) {
      addModal.style.display = 'none';
    }
    if (e.target === editModal) {
      editModal.style.display = 'none';
    }
    if (e.target === publishConfirmModal) {
      publishConfirmModal.style.display = 'none';
      versionToPublish = null;
    }
    if (e.target === createConfirmModal) {
      createConfirmModal.style.display = 'none';
      versionDataToCreate = null;
      // Reopen add modal
      addModal.style.display = 'flex';
    }
  });

  // Update publish confirmation modal text based on whether it's a republish
  function updatePublishConfirmModalText(release, isRepublishing) {
    publishVersionName.textContent = release;

    const modalBody = publishConfirmModal.querySelector('.modal-body');
    const descriptionParagraph = modalBody.querySelector('p:first-of-type');
    const actionsList = modalBody.querySelector('ul');

    if (isRepublishing) {
      // Republishing text
      descriptionParagraph.innerHTML = `
        You are about to <strong style="color: #6b1d9e;">republish</strong> version <strong id="publishVersionName" style="color: #6b1d9e;">${release}</strong>.
      `;
      actionsList.innerHTML = `
        <li>All <strong>export files will be regenerated</strong></li>
        <li>Front-end users will continue to see data from this version</li>
      `;
    } else {
      // Normal publishing text
      descriptionParagraph.innerHTML = `
        You are about to publish version <strong id="publishVersionName" style="color: #6b1d9e;">${release}</strong>.
      `;
      actionsList.innerHTML = `
        <li>Set this version as the <strong>current published version</strong></li>
        <li>Automatically <strong>unpublish</strong> any previously published version</li>
        <li>Make this version data the <strong>active</strong> version for all front-end users</li>
      `;
    }
  }

  // Initialize Quill rich text editors
  function initializeQuillEditors() {
    // Add modal editor
    if (document.getElementById('addMessageEditor')) {
      addMessageQuill = new Quill('#addMessageEditor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link'],
            ['clean']
          ]
        },
        placeholder: 'Enter release message...'
      });
    }

    // Edit modal editor
    if (document.getElementById('editMessageEditor')) {
      editMessageQuill = new Quill('#editMessageEditor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link'],
            ['clean']
          ]
        },
        placeholder: 'Enter release message...'
      });
    }
  }
});

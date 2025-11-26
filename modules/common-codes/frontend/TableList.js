document.addEventListener('DOMContentLoaded', () => {
  MessageManager.init('messageArea');

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  const tableListTableBody = document.getElementById('tableListTableBody');
  const editModal = document.getElementById('editModal');
  const closeModal = document.getElementById('closeModal');
  const cancelEdit = document.getElementById('cancelEdit');
  const editTableForm = document.getElementById('editTableForm');
  const editCode = document.getElementById('editCode');
  const editDescription = document.getElementById('editDescription');
  const editRefTable = document.getElementById('editRefTable');
  const editHasToBeManaged = document.getElementById('editHasToBeManaged');
  const editLongDescription = document.getElementById('editLongDescription');
  const helpBtn = document.getElementById('helpBtn');

  // Help button event listener
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = window.ACTIVE_PAGE || 'tablelist';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  let tables = [];
  let filteredTables = [];
  let currentSortColumn = '';
  let currentSortDirection = 'asc';
  let userRoleId = null;

  // Check authentication - only administrators
  async function checkAuth() {
    try {
      const response = await fetch('/api/check-auth');
      const data = await response.json();

      if (!data.authenticated) {
        window.location.href = 'login.html';
        return false;
      }

      userRoleId = data.roleId;

      if (userRoleId !== 1 && userRoleId !== 2) {
        MessageManager.show('Access denied. Administrator or Super Editor privileges required.', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return false;
      }

      // Update sidebar menu visibility based on user role
      if (typeof updateSidebarMenuVisibility === 'function') {
        updateSidebarMenuVisibility(data.roleId);
      }

      return true;
    } catch (error) {
      console.error('Auth error:', error);
      MessageManager.show('Authentication error', 'error');
      return false;
    }
  }

  // Load tables
  async function loadTables() {
    try {
      const response = await fetch('/api/tablelist');
      const data = await response.json();

      if (response.ok) {
        tables = data;
        filteredTables = [...tables];
        renderTableListTable();
      } else {
        MessageManager.show(data.error || 'Failed to load tables', 'error');
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      MessageManager.show('Error loading tables', 'error');
    }
  }

  // Render tables
  function renderTableListTable() {
    tableListTableBody.innerHTML = '';

    filteredTables.forEach(table => {
      // Determine visibility text, class, and row styling based on HasToBeManaged value
      let visibilityText, visibilityClass, rowClass, tooltipText;

      if (table.HasToBeManaged === 1) {
        visibilityText = 'Visible';
        visibilityClass = 'text-success';
        rowClass = '';
        tooltipText = 'Visible and exported';
      } else if (table.HasToBeManaged === 0) {
        visibilityText = 'Hidden';
        visibilityClass = 'text-muted';
        rowClass = 'row-hidden';
        tooltipText = 'Hidden but exported';
      } else if (table.HasToBeManaged === 2) {
        visibilityText = 'Excluded';
        visibilityClass = 'text-danger';
        rowClass = 'row-excluded';
        tooltipText = 'Hidden and excluded from export';
      }

      // Truncate long description for display
      const longDesc = table.LongDescription || '';
      const longDescPreview = longDesc.length > 50
        ? escapeHtml(longDesc.substring(0, 50)) + '...'
        : escapeHtml(longDesc);

      // Tooltip for long description (only if truncated)
      const longDescTooltip = longDesc.length > 50 ? escapeHtml(longDesc) : '';

      const row = document.createElement('tr');
      row.className = rowClass;
      row.innerHTML = `
        <td><strong>${escapeHtml(table.Description)}</strong></td>
        <td><code style="background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px;">${escapeHtml(table.RefTable)}</code></td>
        <td title="${tooltipText}"><span class="${visibilityClass}">${visibilityText}</span></td>
        <td${longDescTooltip ? ` title="${longDescTooltip}"` : ''}>${longDescPreview}</td>
        <td>
          <button class="btn btn-small btn-edit" data-id="${table.Code}">Edit</button>
        </td>
      `;
      tableListTableBody.appendChild(row);
    });

    addTableEventListeners();
  }

  // Add event listeners to table buttons
  function addTableEventListeners() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const code = e.currentTarget.getAttribute('data-id');
        openEditModal(code);
      });
    });
  }

  // Open edit modal
  function openEditModal(code) {
    const table = tables.find(t => t.Code === parseInt(code));
    if (!table) return;

    editCode.value = table.Code;
    editDescription.value = table.Description;
    editRefTable.value = table.RefTable;
    editHasToBeManaged.value = table.HasToBeManaged.toString();
    editLongDescription.value = table.LongDescription || '';

    editModal.style.display = 'flex';
  }

  // Close edit modal
  function closeEditModal() {
    editModal.style.display = 'none';
    editTableForm.reset();
  }

  closeModal.addEventListener('click', closeEditModal);
  cancelEdit.addEventListener('click', closeEditModal);

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // Handle edit form submission
  editTableForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = parseInt(editCode.value);
    const hasToBeManaged = parseInt(editHasToBeManaged.value);
    const longDescription = editLongDescription.value.trim();

    try {
      const response = await fetch(`/api/tablelist/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          HasToBeManaged: hasToBeManaged,
          LongDescription: longDescription
        })
      });

      const result = await response.json();

      if (response.ok) {
        MessageManager.show(result.message || 'Table updated successfully', 'success');
        closeEditModal();
        loadTables();
      } else {
        // Close modal before showing error message so user can read it
        closeEditModal();
        MessageManager.show(result.error || 'Failed to update table', 'error');
      }
    } catch (error) {
      console.error('Error updating table:', error);
      closeEditModal();
      MessageManager.show('Error updating table', 'error');
    }
  });

  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    clearSearch.style.display = searchTerm ? 'flex' : 'none';

    filteredTables = tables.filter(table => {
      return (
        table.Description.toLowerCase().includes(searchTerm) ||
        table.RefTable.toLowerCase().includes(searchTerm) ||
        (table.LongDescription && table.LongDescription.toLowerCase().includes(searchTerm))
      );
    });

    renderTableListTable();
  });

  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    filteredTables = [...tables];
    renderTableListTable();
  });

  // Sorting functionality
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.getAttribute('data-column');
      sortTable(column);
    });
  });

  function sortTable(column) {
    // Toggle sort direction if clicking same column
    if (currentSortColumn === column) {
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortColumn = column;
      currentSortDirection = 'asc';
    }

    // Update sort icons
    document.querySelectorAll('.sortable').forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
    });

    const currentHeader = document.querySelector(`.sortable[data-column="${column}"]`);
    currentHeader.classList.add(`sort-${currentSortDirection}`);

    // Sort the filtered tables array
    filteredTables.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      // Compare values
      if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    renderTableListTable();
  }

  // Initialize
  checkAuth().then(isAuthenticated => {
    if (isAuthenticated) {
      loadTables();
    }
  });
});

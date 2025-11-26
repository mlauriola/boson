// logs.js - Activity Logs management

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize MessageManager
  MessageManager.init('messageArea');

  // DOM elements
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const userFilterSelect = document.getElementById('userFilter');
  const operationFilterSelect = document.getElementById('operationFilter');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const logsTableBody = document.getElementById('logsTableBody');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const currentUserSpan = document.getElementById('currentUser');
  const layoutWrapper = document.querySelector('.layout-wrapper');
  const helpBtn = document.getElementById('helpBtn');

  // Help button event listener
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = window.ACTIVE_PAGE || 'logs';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  // Store logs data for sorting
  let allLogs = [];

  // Sorting state
  let currentSortColumn = null;
  let currentSortDirection = 'asc';

  // Infinite scroll state
  let currentOffset = 0;
  const PAGE_SIZE = 100;
  let isLoading = false;
  let hasMoreData = true;
  let totalRecordCount = 0;

  // Sidebar toggle
  let sidebarCollapsed = false;
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebarCollapsed = !sidebarCollapsed;
      sidebar.classList.toggle('collapsed', sidebarCollapsed);
      if (layoutWrapper) {
        layoutWrapper.classList.toggle('sidebar-collapsed', sidebarCollapsed);
      }
    });
  }

  // Setup sortable columns
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.getAttribute('data-column');
      sortTable(column);
    });
  });

  // Infinite scroll event listener
  const tableWrapper = document.querySelector('.table-wrapper');
  if (tableWrapper) {
    tableWrapper.addEventListener('scroll', () => {
      const scrollPosition = tableWrapper.scrollTop + tableWrapper.clientHeight;
      const scrollHeight = tableWrapper.scrollHeight;

      // Load more when user is 200px from bottom
      if (scrollPosition >= scrollHeight - 200 && !isLoading && hasMoreData) {
        loadMoreLogs();
      }
    });
  }

  // Check authentication and role
  await checkAuthentication();

  // Load users for filter dropdown
  await loadUsers();

  // Load initial logs (last 7 days by default)
  setDefaultDateRange();
  await loadLogs();

  // Event listeners
  applyFiltersBtn.addEventListener('click', () => loadLogs());
  clearFiltersBtn.addEventListener('click', clearFilters);

  // Allow Enter key to apply filters
  [startDateInput, endDateInput, userFilterSelect, operationFilterSelect].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadLogs();
      }
    });
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

      // Check if user is administrator or super editor
      if (data.roleId !== 1 && data.roleId !== 2) {
        alert('Access denied. Only administrators and super editors can access this page.');
        window.location.href = '/index.html';
        return;
      }

      // Update current user display
      if (currentUserSpan) {
        currentUserSpan.textContent = `Welcome, ${data.referent || data.username}`;
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

  async function loadUsers() {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const users = await response.json();

      // Populate user filter dropdown
      userFilterSelect.innerHTML = '<option value="">-- All Users --</option>';
      users.forEach(user => {
        // Skip users without Username
        if (!user.Username) return;

        const option = document.createElement('option');
        option.value = user.Id;
        option.textContent = user.Username;
        userFilterSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('Error loading users', 'error');
    }
  }

  function setDefaultDateRange() {
    // Set both dates to today to avoid querying entire table
    const today = new Date();

    endDateInput.value = formatDateForInput(today);
    startDateInput.value = formatDateForInput(today);
  }

  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function loadLogs() {
    try {
      // Reset pagination state
      currentOffset = 0;
      hasMoreData = true;
      allLogs = [];
      totalRecordCount = 0;

      showLoading(true);
      logsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading...</td></tr>';

      // Build query string with pagination
      const params = new URLSearchParams();
      params.append('offset', '0');
      params.append('limit', PAGE_SIZE.toString());

      if (startDateInput.value) {
        params.append('startDate', startDateInput.value);
      }

      if (endDateInput.value) {
        params.append('endDate', endDateInput.value);
      }

      if (userFilterSelect.value) {
        params.append('userId', userFilterSelect.value);
      }

      if (operationFilterSelect.value) {
        params.append('tableOperation', operationFilterSelect.value);
      }

      const response = await fetch(`/api/logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load logs');
      }

      const data = await response.json();

      showLoading(false);

      // Check if response has pagination metadata
      if (data.data && data.totalCount !== undefined) {
        // Paginated response
        allLogs = data.data;
        totalRecordCount = data.totalCount;
        hasMoreData = data.hasMore;
        currentOffset = PAGE_SIZE;
      } else {
        // Legacy response (all data at once)
        allLogs = data;
        totalRecordCount = data.length;
        hasMoreData = false;
      }

      displayLogs(allLogs);

      if (allLogs.length > 0) {
        showMessage(`Loaded ${allLogs.length} of ${totalRecordCount} log entries`, 'success');
      } else {
        showMessage('No logs found for the selected filters', 'info');
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      showLoading(false);
      showMessage('Error loading logs', 'error');
      logsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error loading logs</td></tr>';
    }
  }

  // Load more logs for infinite scroll
  async function loadMoreLogs() {
    if (isLoading || !hasMoreData) return;

    isLoading = true;

    try {
      // Build query string with current filters and pagination
      const params = new URLSearchParams();
      params.append('offset', currentOffset.toString());
      params.append('limit', PAGE_SIZE.toString());

      if (startDateInput.value) {
        params.append('startDate', startDateInput.value);
      }

      if (endDateInput.value) {
        params.append('endDate', endDateInput.value);
      }

      if (userFilterSelect.value) {
        params.append('userId', userFilterSelect.value);
      }

      if (operationFilterSelect.value) {
        params.append('tableOperation', operationFilterSelect.value);
      }

      const response = await fetch(`/api/logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load more logs');
      }

      const data = await response.json();

      // Check if response has pagination metadata
      if (data.data && data.totalCount !== undefined) {
        // Paginated response
        const newLogs = data.data;
        allLogs = [...allLogs, ...newLogs];
        hasMoreData = data.hasMore;
        currentOffset += newLogs.length;

        // Append new rows to table
        appendLogsToTable(newLogs);

        // Update message
        showMessage(`Loaded ${allLogs.length} of ${totalRecordCount} log entries`, 'success');

        console.log(`Loaded ${newLogs.length} more logs. Total: ${allLogs.length} of ${totalRecordCount}`);
      } else {
        // No more data
        hasMoreData = false;
      }
    } catch (error) {
      console.error('Error loading more logs:', error);
    } finally {
      isLoading = false;
    }
  }

  function displayLogs(logs) {
    if (logs.length === 0) {
      logsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No logs found</td></tr>';
      return;
    }

    logsTableBody.innerHTML = '';

    logs.forEach(log => {
      const row = document.createElement('tr');

      // ID
      const idCell = document.createElement('td');
      idCell.textContent = log.Id;
      row.appendChild(idCell);

      // Date/Time
      const dateCell = document.createElement('td');
      dateCell.textContent = formatDateTime(log.Data_Operation);
      row.appendChild(dateCell);

      // User
      const userCell = document.createElement('td');
      userCell.textContent = log.Username || log.Usr_Code;
      row.appendChild(userCell);

      // Table Name
      const tableCell = document.createElement('td');
      tableCell.textContent = log.Table_Name;
      row.appendChild(tableCell);

      // Operation
      const operationCell = document.createElement('td');
      operationCell.textContent = log.Table_Operation;
      // Color code operations
      if (log.Table_Operation === 'INSERT') {
        operationCell.style.color = '#28a745';
        operationCell.style.fontWeight = 'bold';
      } else if (log.Table_Operation === 'UPDATE') {
        operationCell.style.color = '#007bff';
        operationCell.style.fontWeight = 'bold';
      } else if (log.Table_Operation === 'DELETE') {
        operationCell.style.color = '#dc3545';
        operationCell.style.fontWeight = 'bold';
      }
      row.appendChild(operationCell);

      // Old Value
      const oldValueCell = document.createElement('td');
      oldValueCell.textContent = log.Old_Data_Value || '-';
      oldValueCell.style.fontSize = '12px';
      oldValueCell.style.maxWidth = '200px';
      oldValueCell.style.overflow = 'hidden';
      oldValueCell.style.textOverflow = 'ellipsis';
      oldValueCell.style.whiteSpace = 'nowrap';
      oldValueCell.title = log.Old_Data_Value || '';
      row.appendChild(oldValueCell);

      // New Value
      const newValueCell = document.createElement('td');
      newValueCell.textContent = log.New_Data_Value || '-';
      newValueCell.style.fontSize = '12px';
      newValueCell.style.maxWidth = '200px';
      newValueCell.style.overflow = 'hidden';
      newValueCell.style.textOverflow = 'ellipsis';
      newValueCell.style.whiteSpace = 'nowrap';
      newValueCell.title = log.New_Data_Value || '';
      row.appendChild(newValueCell);

      logsTableBody.appendChild(row);
    });
  }

  function formatDateTime(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  function clearFilters() {
    startDateInput.value = '';
    endDateInput.value = '';
    userFilterSelect.value = '';
    operationFilterSelect.value = '';

    // Reload logs with no filters (will return all logs)
    loadLogs();
  }

  function showMessage(message, type) {
    MessageManager.show(message, type, 5000);
  }

  function showLoading(show) {
    if (show) {
      MessageManager.showLoading();
    } else {
      MessageManager.hide();
    }
  }

  // Append new log rows to existing table (for infinite scroll)
  function appendLogsToTable(newLogs) {
    if (!newLogs || newLogs.length === 0) return;

    newLogs.forEach(log => {
      const row = document.createElement('tr');

      // ID
      const idCell = document.createElement('td');
      idCell.textContent = log.Id;
      row.appendChild(idCell);

      // Date/Time
      const dateCell = document.createElement('td');
      dateCell.textContent = formatDateTime(log.Data_Operation);
      row.appendChild(dateCell);

      // User
      const userCell = document.createElement('td');
      userCell.textContent = log.Username || log.Usr_Code;
      row.appendChild(userCell);

      // Table Name
      const tableCell = document.createElement('td');
      tableCell.textContent = log.Table_Name;
      row.appendChild(tableCell);

      // Operation
      const operationCell = document.createElement('td');
      operationCell.textContent = log.Table_Operation;
      // Color code operations
      if (log.Table_Operation === 'INSERT') {
        operationCell.style.color = '#28a745';
        operationCell.style.fontWeight = 'bold';
      } else if (log.Table_Operation === 'UPDATE') {
        operationCell.style.color = '#007bff';
        operationCell.style.fontWeight = 'bold';
      } else if (log.Table_Operation === 'DELETE') {
        operationCell.style.color = '#dc3545';
        operationCell.style.fontWeight = 'bold';
      }
      row.appendChild(operationCell);

      // Old Value
      const oldValueCell = document.createElement('td');
      oldValueCell.textContent = log.Old_Data_Value || '-';
      oldValueCell.style.fontSize = '12px';
      oldValueCell.style.maxWidth = '200px';
      oldValueCell.style.overflow = 'hidden';
      oldValueCell.style.textOverflow = 'ellipsis';
      oldValueCell.style.whiteSpace = 'nowrap';
      oldValueCell.title = log.Old_Data_Value || '';
      row.appendChild(oldValueCell);

      // New Value
      const newValueCell = document.createElement('td');
      newValueCell.textContent = log.New_Data_Value || '-';
      newValueCell.style.fontSize = '12px';
      newValueCell.style.maxWidth = '200px';
      newValueCell.style.overflow = 'hidden';
      newValueCell.style.textOverflow = 'ellipsis';
      newValueCell.style.whiteSpace = 'nowrap';
      newValueCell.title = log.New_Data_Value || '';
      row.appendChild(newValueCell);

      logsTableBody.appendChild(row);
    });
  }

  // Sort table by column
  function sortTable(column) {
    // Toggle sort direction if clicking same column
    if (currentSortColumn === column) {
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortColumn = column;
      currentSortDirection = 'asc';
    }

    // Remove sort classes from all headers
    document.querySelectorAll('.sortable').forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
    });

    // Add sort class to current header
    const currentHeader = document.querySelector(`.sortable[data-column="${column}"]`);
    if (currentHeader) {
      currentHeader.classList.add(`sort-${currentSortDirection}`);
    }

    // Sort the logs array
    allLogs.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // For dates, convert to timestamp for proper comparison
      if (column === 'Data_Operation') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      // Compare values
      if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    displayLogs(allLogs);
  }
});

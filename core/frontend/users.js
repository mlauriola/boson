// app.js - Dashboard and CRUD operations management

document.addEventListener('DOMContentLoaded', () => {
  // Initialize MessageManager
  MessageManager.init('messageArea');

  // DOM Elements

  const addUserBtn = document.getElementById('addUserBtn');
  const addUserForm = document.getElementById('addUserForm');
  const usersTableBody = document.getElementById('usersTableBody');

  const sidebar = document.getElementById('sidebar');
  const layoutWrapper = document.querySelector('.layout-wrapper');
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  const selectAll = document.getElementById('selectAll');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const selectedCount = document.getElementById('selectedCount');
  const helpBtn = document.getElementById('helpBtn');

  // Help button event listener
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = window.ACTIVE_PAGE || 'users';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  // Modal for adding users
  const addModal = document.getElementById('addModal');
  const closeAddModal = document.getElementById('closeAddModal');
  const cancelAdd = document.getElementById('cancelAdd');

  // Modal for editing users
  const editModal = document.getElementById('editModal');
  const closeModal = document.getElementById('closeModal');
  const cancelEdit = document.getElementById('cancelEdit');
  const editUserForm = document.getElementById('editUserForm');

  // Confirm Delete Modal
  const confirmDeleteModal = document.getElementById('confirmDeleteModal');
  const closeConfirmDeleteModal = document.getElementById('closeConfirmDeleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const confirmDeleteMessage = document.getElementById('confirmDeleteMessage');

  // Variable to store user data
  let users = [];
  let filteredUsers = [];
  let userIdToDelete = null;

  // Sorting state
  let currentSortColumn = null;
  let currentSortDirection = 'asc';

  // Sidebar toggle state (collapsed by default on mobile)
  let sidebarCollapsed = window.innerWidth <= 768;
  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
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

    // Show/hide clear button
    clearSearch.style.display = searchTerm ? 'flex' : 'none';

    // Filter users
    if (searchTerm === '') {
      filteredUsers = users;
    } else {
      filteredUsers = users.filter(user => {
        const username = (user.Username || '').toLowerCase();
        const email = (user.Email || '').toLowerCase();
        const phone = (user.Phone || '').toLowerCase();

        return username.includes(searchTerm) ||
          email.includes(searchTerm) ||
          phone.includes(searchTerm);
      });
    }

    renderUsersTable();
  });

  // Clear search
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    filteredUsers = users;
    renderUsersTable();
    searchInput.focus();
  });

  // Select all checkbox functionality
  selectAll.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
    updateSelectedCount();
  });

  // Delete selected users
  // Delete selected users
  deleteSelectedBtn.addEventListener('click', async () => {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const userIds = Array.from(checkedBoxes).map(cb => cb.dataset.userId);
    const usernames = Array.from(checkedBoxes).map(cb => cb.dataset.username);

    if (userIds.length === 0) return;

    const count = userIds.length;
    userIdToDelete = userIds; // Store array or single ID
    confirmDeleteMessage.innerHTML = `Are you sure you want to delete <strong>${count}</strong> selected user(s)?`;
    confirmDeleteModal.style.display = 'flex';
  });



  // Initialization
  init();

  async function init() {
    // Check authentication
    await checkAuthentication();

    // Load roles and users

    await loadUsers();
  }

  // Verifica se l'utente è autenticato
  async function checkAuthentication() {
    try {
      const response = await fetch('/api/check-auth');
      const data = await response.json();

      if (!data.authenticated) {
        // Non autenticato - reindirizza al login
        window.location.href = '/login.html';
        return;
      }

      // Check if first login - redirect to home (will show modal)
      if (data.firstLogin === -1 || data.firstLogin === true) {
        window.location.href = '/index.html';
        return;
      }

      // Check if user is ADMINISTRATOR (roleId = 1)
      if (data.roleId !== 1) {
        // Non-administrator users cannot access Users page
        alert('Access denied. Only administrators can access this page.');
        window.location.href = '/index.html';
        return;
      }

      // Show current user referent
      // Handled by header-component.js
      // currentUserSpan.textContent = `Welcome, ${data.referent || data.username}`;

      // Update sidebar menu visibility based on user role
      if (typeof updateSidebarMenuVisibility === 'function') {
        updateSidebarMenuVisibility(data.roleId);
      }
    } catch (error) {
      console.error('Errore nella verifica dell\'autenticazione:', error);
      // window.location.href = '/login.html';
      showMessage('Authentication check failed. See console for details.', 'error');
    }
  }

  // Carica tutti gli utenti dal database
  async function loadUsers() {
    showLoading(true);

    try {
      const response = await fetch('/api/users');

      if (response.status === 401) {
        // Non autenticato
        // window.location.href = '/login.html';
        showMessage('Session expired or unauthorized. Please log in again.', 'error');
        return;
      }

      if (!response.ok) {
        throw new Error('Errore nel caricamento degli utenti');
      }

      users = await response.json();
      filteredUsers = users; // Initialize filtered users
      renderUsersTable();
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('Error loading users', 'error');
    } finally {
      showLoading(false);
    }
  }



  // Render users table
  function renderUsersTable() {
    usersTableBody.innerHTML = '';

    const usersToRender = filteredUsers.length > 0 ? filteredUsers : (searchInput.value.trim() ? [] : users);

    if (usersToRender.length === 0) {
      const message = searchInput.value.trim() ? 'No users match your search' : 'No users found';
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem;">
            ${message}
          </td>
        </tr>
      `;
      return;
    }

    usersToRender.forEach(user => {
      const row = document.createElement('tr');

      // Checkbox cell
      const checkboxCell = document.createElement('td');
      checkboxCell.className = 'checkbox-col';
      checkboxCell.innerHTML = `<input type="checkbox" class="row-checkbox" data-user-id="${user.Id}" data-username="${escapeHtml(user.Username)}">`;
      row.appendChild(checkboxCell);

      // Username cell
      const usernameCell = document.createElement('td');
      const usernameText = `${escapeHtml(user.Username)} (${user.Id})`;
      usernameCell.innerHTML = `<strong>${escapeHtml(user.Username)}</strong> <span style="color: #6c757d;">(${user.Id})</span>`;
      row.appendChild(usernameCell);

      // Referent cell
      const referentCell = document.createElement('td');
      const referentText = user.Referent || 'N/A';
      referentCell.innerHTML = user.Referent ? escapeHtml(user.Referent) : '<em>N/A</em>';
      row.appendChild(referentCell);

      // Email cell
      const emailCell = document.createElement('td');
      const emailText = user.Email || 'N/A';
      emailCell.innerHTML = user.Email ? escapeHtml(user.Email) : '<em>N/A</em>';
      row.appendChild(emailCell);

      // Phone cell
      const phoneCell = document.createElement('td');
      const phoneText = user.Phone || 'N/A';
      phoneCell.innerHTML = user.Phone ? escapeHtml(user.Phone) : '<em>N/A</em>';
      row.appendChild(phoneCell);



      // Recovery cell
      const recoveryCell = document.createElement('td');
      recoveryCell.textContent = user.Recovery || 0;
      row.appendChild(recoveryCell);

      // Actions cell
      const actionsCell = document.createElement('td');
      actionsCell.innerHTML = `<button class="btn btn-small btn-edit" data-id="${user.Id}">Edit</button>`;
      row.appendChild(actionsCell);

      usersTableBody.appendChild(row);

      // Add title only for truncated cells
      setTimeout(() => {
        if (usernameCell.scrollWidth > usernameCell.clientWidth) {
          usernameCell.title = usernameText;
        }
        if (referentCell.scrollWidth > referentCell.clientWidth) {
          referentCell.title = referentText;
        }
        if (emailCell.scrollWidth > emailCell.clientWidth) {
          emailCell.title = emailText;
        }
        if (phoneCell.scrollWidth > phoneCell.clientWidth) {
          phoneCell.title = phoneText;
        }

        if (recoveryCell.scrollWidth > recoveryCell.clientWidth) {
          recoveryCell.title = String(user.Recovery || 0);
        }
      }, 0);
    });

    // Aggiungi event listener ai pulsanti
    addTableEventListeners();

    // Add event listeners to checkboxes for selection tracking
    updateCheckboxListeners();
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
    currentHeader.classList.add(`sort-${currentSortDirection}`);

    // Sort the filtered users array
    filteredUsers.sort((a, b) => {
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

    renderUsersTable();
  }

  // Add event listeners to table buttons
  function addTableEventListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.getAttribute('data-id');
        openEditModal(userId);
      });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.getAttribute('data-id');
        const username = e.target.getAttribute('data-username');
        openDeleteModal(userId, username);
      });
    });
  }

  // Add event listeners to checkboxes
  function updateCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', updateSelectedCount);
    });
    updateSelectedCount();
  }

  // Update selected count and enable/disable delete button
  function updateSelectedCount() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const count = checkedBoxes.length;
    selectedCount.textContent = count;
    deleteSelectedBtn.disabled = count === 0;

    // Update select all checkbox state
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    if (allCheckboxes.length === 0) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    } else if (count === 0) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    } else if (count === allCheckboxes.length) {
      selectAll.checked = true;
      selectAll.indeterminate = false;
    } else {
      selectAll.checked = false;
      selectAll.indeterminate = true;
    }
  }

  // Open add user modal
  addUserBtn.addEventListener('click', () => {
    addModal.style.display = 'flex';
    addUserForm.reset();
  });

  // Close add user modal
  closeAddModal.addEventListener('click', () => {
    addModal.style.display = 'none';
  });

  cancelAdd.addEventListener('click', () => {
    addModal.style.display = 'none';
  });

  // Close modal clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === addModal) {
      addModal.style.display = 'none';
    }
  });

  // Handle add user form submission
  addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const referent = document.getElementById('newReferent').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const phone = document.getElementById('newPhone').value.trim();

    try {
      // Default to Role 3 (Viewer) - "Invisible Role"
      const roleId = 3;

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, referent, email, phone, roleId })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('User added successfully!', 'success');
        setTimeout(() => {
          addModal.style.display = 'none';
          addUserForm.reset();
        }, 1000);
        await loadUsers();
      } else {
        showMessage(data.error || 'Error adding user', 'error');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      showMessage('Server connection error', 'error');
    }
  });

  // Apri modal per modificare un utente
  function openEditModal(userId) {
    const user = users.find(u => u.Id === parseInt(userId));
    if (!user) return;

    document.getElementById('editUserId').value = user.Id;
    document.getElementById('editId').value = user.Id;
    document.getElementById('editUsername').value = user.Username;
    document.getElementById('editPassword').value = '';
    document.getElementById('editReferent').value = user.Referent || '';
    document.getElementById('editEmail').value = user.Email || '';
    document.getElementById('editPhone').value = user.Phone || '';

    document.getElementById('editRecovery').value = user.Recovery || 0;
    document.getElementById('editRecoveryOTP').value = user.RecoveryOTP || '';

    editModal.style.display = 'flex';
  }

  // Chiudi modal
  closeModal.addEventListener('click', () => {
    editModal.style.display = 'none';
  });

  cancelEdit.addEventListener('click', () => {
    editModal.style.display = 'none';
  });

  // Chiudi modal cliccando fuori
  window.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.style.display = 'none';
    }
  });

  // Gestione del form di modifica utente
  editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value.trim();
    const password = document.getElementById('editPassword').value;
    const referent = document.getElementById('editReferent').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const recovery = parseInt(document.getElementById('editRecovery').value) || 0;
    const recoveryOTP = document.getElementById('editRecoveryOTP').value.trim();

    if (!username) {
      showMessage('Username is required', 'error');
      return;
    }

    try {
      // Default to Role 3 (Viewer) - "Invisible Role"
      const roleId = 3;

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, referent, email, phone, roleId, recovery, recoveryOTP })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('User updated successfully!', 'success');
        setTimeout(() => {
          editModal.style.display = 'none';
          loadUsers();
        }, 1000);
      } else {
        showMessage(data.error || 'Error updating user', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showMessage('Server connection error', 'error');
    }
  });

  function openDeleteModal(userId, username) {
    userIdToDelete = userId;
    confirmDeleteMessage.innerHTML = `Are you sure you want to delete <strong>1</strong> selected user(s)?`;
    confirmDeleteModal.style.display = 'flex';
  }

  function hideDeleteModal() {
    confirmDeleteModal.style.display = 'none';
    userIdToDelete = null;
  }

  if (closeConfirmDeleteModal) closeConfirmDeleteModal.addEventListener('click', hideDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', hideDeleteModal);

  // Close modal clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === confirmDeleteModal) {
      hideDeleteModal();
    }
  });

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!userIdToDelete) return;

      const idsToDelete = userIdToDelete; // Capture ID(s) before hideDeleteModal wipes it
      hideDeleteModal();
      showLoading(true);

      const ids = Array.isArray(idsToDelete) ? idsToDelete : [idsToDelete];

      try {
        // Delete each user
        const deletePromises = ids.map(id =>
          fetch(`/api/users/${id}`, { method: 'DELETE' })
        );

        const results = await Promise.all(deletePromises);
        const allSuccessful = results.every(res => res.ok);

        if (allSuccessful) {
          showMessage(`User(s) deleted successfully`, 'success');
          await loadUsers();
        } else {
          // If mixed results or failure
          const data = results.find(r => !r.ok);
          // Try to get error text if possible, but response body might be consumed or tough to get from here easily without reading
          showMessage('Error deleting some or all users', 'error');
          await loadUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Server connection error', 'error');
      } finally {
        showLoading(false);
        userIdToDelete = null; // Reset
      }
    });
  }


  // Utility functions

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

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT') + ' ' + date.toLocaleTimeString('it-IT');
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
});

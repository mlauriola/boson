// Global State
let allItems = [];
let filteredItems = [];
let currentPermissions = {
    roleId: 4,
    canAccess: false,
    canEdit: false,
    currentUser: null
};

// Global for deletion
let itemsToDelete = []; // Stores IDs of items to delete
const confirmDeleteModal = document.getElementById('confirmDeleteModal');
const closeConfirmDeleteModal = document.getElementById('closeConfirmDeleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const confirmDeleteMessage = document.getElementById('confirmDeleteMessage');

document.addEventListener('DOMContentLoaded', () => {
    // Initialize MessageManager if available
    if (typeof MessageManager !== 'undefined') {
        MessageManager.init('messageArea');
    }

    // Initial Load
    initModule();

    // Event Listeners
    setupEventListeners();

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!itemsToDelete || itemsToDelete.length === 0) return;
            hideDeleteModal();

            let successCount = 0;
            // Single API DELETE calls sequence
            for (const id of itemsToDelete) {
                try {
                    await fetch(`/api/missing-items/${id}`, { method: 'DELETE' });
                    successCount++;
                } catch (e) {
                    console.error(`Failed to delete ${id}`, e);
                }
            }

            if (successCount > 0) {
                showMessage(`${successCount} items deleted.`, 'success');
                loadItems();
                // Reset
                itemsToDelete = [];
                const delBtn = document.getElementById('deleteSelectedBtn');
                if (delBtn) delBtn.disabled = true;
                document.getElementById('selectAll').checked = false;
            } else {
                alert('Error deleting items.');
            }
        });
    }

    if (closeConfirmDeleteModal) closeConfirmDeleteModal.addEventListener('click', hideDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    window.addEventListener('click', (e) => {
        if (e.target === confirmDeleteModal) hideDeleteModal();
    });
});

function openDeleteModal(ids) {
    itemsToDelete = ids;
    const count = ids.length;
    confirmDeleteMessage.innerHTML = `Are you sure you want to delete <strong>${count}</strong> selected item(s)?`;
    confirmDeleteModal.style.display = 'flex';
}

function hideDeleteModal() {
    confirmDeleteModal.style.display = 'none';
}

async function initModule() {
    await loadPermissions();
    if (currentPermissions.canAccess) {
        await loadItems();
    } else {
        // Redirect or Show Access Denied
        document.querySelector('.main-content').innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                <h3>Access Denied</h3>
                <p>You do not have permission to view this page.</p>
            </div>`;
    }
}

async function loadPermissions() {
    try {
        const response = await fetch('/api/missing-items/permissions');
        if (response.ok) {
            currentPermissions = await response.json();
            console.log('DEBUG: Permissions loaded:', currentPermissions);

            // Adjust UI based on permissions
            const addBtn = document.getElementById('addItemBtn');
            const deleteBtn = document.getElementById('deleteSelectedBtn');
            const exportBtn = document.getElementById('exportExcelBtn');

            if (!currentPermissions.canEdit) {
                if (addBtn) addBtn.style.display = 'none';
                if (deleteBtn) deleteBtn.style.display = 'none';
                if (exportBtn) exportBtn.style.display = 'none';
            } else {
                if (addBtn) addBtn.style.display = 'inline-flex';
                if (deleteBtn) deleteBtn.style.display = 'inline-flex';
                if (exportBtn) exportBtn.style.display = 'inline-flex';
            }
        } else {
            console.error('Failed to load permissions');
        }
    } catch (e) {
        console.error('Error loading permissions:', e);
    }
}

async function loadItems() {
    const tableBody = document.getElementById('itemsTableBody');
    tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Loading...</td></tr>';

    try {
        const response = await fetch('/api/missing-items');
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        allItems = await response.json();
        filteredItems = allItems;

        applySearch(); // will call renderTable
    } catch (error) {
        console.error('Error loading items:', error);
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Error loading items: ${error.message}</td></tr>`;
    }
}

function renderTable(items) {
    const tableBody = document.getElementById('itemsTableBody');

    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 20px;">No items found</td></tr>';
        return;
    }

    tableBody.innerHTML = items.map(item => `
        <tr class="item-row">
            <td class="checkbox-col"><input type="checkbox" class="row-checkbox" data-id="${item.Id}"></td>
            <td>#${item.Id}</td>
            <td>${item.ItemCode || '-'}</td>
            <td><div class="text-truncate" style="max-width: 250px;" title="${escapeHtml(item.Description)}">${escapeHtml(item.Description)}</div></td>
            <td><span class="badge ${getStatusBadge(item.Status)}">${item.Status}</span></td>
            <td>
                ${item.ReportId ? `
                    <div style="font-size: 0.85rem;">
                        <strong>${escapeHtml(item.EventName)}</strong><br>
                    </div>
                ` : '<span class="text-muted font-italic">Standalone</span>'}
            </td>
             <td>${formatDate(item.ReportDate)}</td>
            <td>${item.ReportedBy || '-'}</td>
            <td>
                ${currentPermissions.canEdit ? `
                    <button class="btn btn-small btn-edit" onclick="openEditModal(${item.Id})" title="Edit">Edit</button>
                ` : ''}
            </td>
        </tr>
    `).join('');

    updateCheckboxListeners();
}

// --- Search & Bulk Actions ---
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const addItemBtn = document.getElementById('addItemBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn'); // Button next to Add Item
    const selectAllCb = document.getElementById('selectAll');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            clearSearch.style.display = val ? 'flex' : 'none';
            applySearch();
        });
    }

    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            clearSearch.style.display = 'none';
            applySearch();
        });
    }

    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            openAddModal();
        });
    }

    const exportBtn = document.getElementById('exportExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.location.href = '/api/missing-items/export';
        });
    }

    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.row-checkbox:checked');
            if (checkboxes.length === 0) return;
            const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
            openDeleteModal(ids);
        });
    }

    if (selectAllCb) {
        selectAllCb.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateDeleteButtonState();
        });
    }

    // Modal Buttons
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('modalSaveBtn').addEventListener('click', saveItem);
}

function updateCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateDeleteButtonState);
    });
}

function updateDeleteButtonState() {
    const checkboxes = document.querySelectorAll('.row-checkbox:checked');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
        // Enable if items selected AND user has edit permissions
        if (checkboxes.length > 0 && currentPermissions.canEdit) {
            deleteBtn.disabled = false;
        } else {
            deleteBtn.disabled = true;
        }
    }
}

async function deleteSelectedItems() {
    const checkboxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkboxes.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${checkboxes.length} item(s)?`)) return;

    const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));

    let successCount = 0;

    for (const id of ids) {
        try {
            await fetch(`/api/missing-items/${id}`, { method: 'DELETE' });
            successCount++;
        } catch (e) {
            console.error(`Failed to delete ${id}`, e);
        }
    }

    showMessage(`${successCount} items deleted.`, 'success');
    loadItems();
}

function applySearch() {
    const searchInput = document.getElementById('searchInput');
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!term) {
        filteredItems = allItems;
    } else {
        filteredItems = allItems.filter(item => {
            return (item.ItemCode || '').toLowerCase().includes(term) ||
                (item.Description || '').toLowerCase().includes(term) ||
                (item.Status || '').toLowerCase().includes(term) ||
                (item.EventName || '').toLowerCase().includes(term) ||
                String(item.ReportId || '').includes(term);
        });
    }
    renderTable(filteredItems);
}

// --- CRUD Modals ---
const modal = document.getElementById('itemModal');

function openEditModal(id) {
    const item = allItems.find(i => i.Id === id);
    if (!item) return;

    document.getElementById('modalTitle').textContent = 'Edit Missing Item #' + id;
    document.getElementById('itemId').value = id;

    document.getElementById('itemCode').value = item.ItemCode || '';
    document.getElementById('description').value = item.Description || '';
    document.getElementById('status').value = item.Status || 'Missing';

    modal.style.display = 'block';
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Missing Item';
    document.getElementById('itemId').value = '';

    // Reset form
    document.getElementById('itemCode').value = '';
    document.getElementById('description').value = '';
    document.getElementById('status').value = 'Missing';

    // Hide Delete Button
    const deleteBtn = document.getElementById('modalDeleteBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';

    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

async function saveItem() {
    const id = document.getElementById('itemId').value;
    const data = {
        reportId: null, // Removed field
        itemCode: document.getElementById('itemCode').value,
        description: document.getElementById('description').value,
        status: document.getElementById('status').value
    };

    if (!data.description) {
        alert('Description is required');
        return;
    }

    try {
        const url = id ? `/api/missing-items/${id}` : '/api/missing-items';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal();
            showMessage('Item saved successfully!', 'success');
            loadItems();
        } else {
            const err = await response.json();
            alert('Error: ' + err.error);
        }
    } catch (e) {
        console.error('Save failed', e);
        alert('Save failed: ' + e.message);
    }
}

async function deleteItem(id) {
    openDeleteModal([id]);
}

// --- Helpers ---
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT');
}

function getStatusBadge(status) {
    switch (status) {
        case 'Missing': return 'badge-danger';
        case 'Found': return 'badge-success';
        case 'Lost': return 'badge-dark';
        default: return 'badge-secondary';
    }
}

function showMessage(msg, type) {
    if (typeof MessageManager !== 'undefined') {
        MessageManager.show(msg, type);
    } else {
        alert(msg);
    }
}

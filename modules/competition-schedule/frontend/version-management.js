// version-management.js - Competition Schedule Version Management

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadVersionBtn = document.getElementById('uploadVersionBtn');
    const uploadForm = document.getElementById('uploadForm');
    const versionsTableBody = document.getElementById('versionsTableBody');

    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const selectAll = document.getElementById('selectAll');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const selectedCount = document.getElementById('selectedCount');
    const downloadBtn = document.getElementById('downloadBtn');
    const setActiveBtn = document.getElementById('setActiveBtn');

    // Modals
    const uploadModal = document.getElementById('uploadModal');
    const closeUploadModal = document.getElementById('closeUploadModal');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const editVersionForm = document.getElementById('editVersionForm');

    // Confirm Delete Modal
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    const closeConfirmDeleteModal = document.getElementById('closeConfirmDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const confirmDeleteMessage = document.getElementById('confirmDeleteMessage');
    const confirmDeleteList = document.getElementById('confirmDeleteList');

    // State
    let versions = [];
    let filteredVersions = [];
    let currentSortColumn = 'UploadDate';
    let currentSortDirection = 'desc';
    let idsToDelete = [];

    // Sort setup
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-column');
            sortTable(column);
        });
    });

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (clearSearch) clearSearch.style.display = searchTerm ? 'flex' : 'none';

            if (searchTerm === '') {
                filteredVersions = [...versions];
            } else {
                filteredVersions = versions.filter(v => {
                    const name = (v.VersionName || '').toLowerCase();
                    const file = (v.FileName || '').toLowerCase();
                    return name.includes(searchTerm) || file.includes(searchTerm);
                });
            }
            renderTable();
        });
    }

    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            clearSearch.style.display = 'none';
            filteredVersions = [...versions];
            renderTable();
            if (searchInput) searchInput.focus();
        });
    }

    // Select All
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateSelectedCount();
        });
    }

    // --- Deletion Flow ---
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', () => {
            const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
            idsToDelete = Array.from(checkedBoxes).map(cb => cb.dataset.id);
            const names = Array.from(checkedBoxes).map(cb => cb.dataset.name);

            if (idsToDelete.length === 0) return;

            // Show Custom Confirmation Modal
            if (confirmDeleteModal) {
                confirmDeleteMessage.innerHTML = `Are you sure you want to delete <strong>${idsToDelete.length}</strong> selected version(s)?`;
                confirmDeleteList.innerHTML = '';
                confirmDeleteModal.style.display = 'flex';
            }
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async () => {
            if (confirmDeleteModal) confirmDeleteModal.style.display = 'none';
            if (window.MessageManager) MessageManager.showLoading(`Deleting ${idsToDelete.length} version(s)...`);

            try {
                let successCount = 0;
                for (const id of idsToDelete) {
                    const response = await fetch(`/api/schedule/versions/${id}`, { method: 'DELETE' });
                    if (response.ok) successCount++;
                }

                if (successCount === idsToDelete.length) {
                    if (window.MessageManager) MessageManager.show(`Successfully deleted ${idsToDelete.length} version(s)`, 'success', 3000);
                } else if (successCount > 0) {
                    if (window.MessageManager) MessageManager.show(`Deleted ${successCount} of ${idsToDelete.length} versions.`, 'warning', 5000);
                } else {
                    if (window.MessageManager) MessageManager.show('Failed to delete selected versions', 'error');
                }

                if (selectAll) selectAll.checked = false;
                idsToDelete = [];
                await loadVersions();
            } catch (error) {
                console.error('Error during deletion:', error);
                if (window.MessageManager) MessageManager.show('Error during deletion process', 'error');
            }
        };
    }

    const hideConfirmModal = () => {
        if (confirmDeleteModal) confirmDeleteModal.style.display = 'none';
        idsToDelete = [];
    };

    if (closeConfirmDeleteModal) closeConfirmDeleteModal.onclick = hideConfirmModal;
    if (cancelDeleteBtn) cancelDeleteBtn.onclick = hideConfirmModal;

    // Set Active Version
    if (setActiveBtn) {
        setActiveBtn.onclick = async () => {
            const checked = document.querySelector('.row-checkbox:checked');
            if (!checked) return;

            const id = checked.dataset.id;
            const name = checked.dataset.name;

            if (window.MessageManager) MessageManager.showLoading(`Setting "${name}" as active version...`);

            try {
                const response = await fetch(`/api/schedule/versions/${id}/active`, { method: 'POST' });
                if (!response.ok) throw new Error('Failed to set active');

                if (window.MessageManager) MessageManager.show(`"${name}" is now the active version`, 'success', 3000);
                await loadVersions();
            } catch (err) {
                if (window.MessageManager) MessageManager.show('Error: ' + err.message, 'error');
            }
        };
    }

    // Download File
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const checked = document.querySelector('.row-checkbox:checked');
            if (checked && checked.dataset.filename) {
                const name = checked.dataset.name || 'Schedule';
                const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_');
                window.location.href = `/api/schedule/download/${checked.dataset.filename}?name=${encodeURIComponent(sanitizedName)}`;
            }
        };
    }

    // --- Initial Load ---
    loadVersions();

    async function loadVersions() {
        try {
            const response = await fetch('/api/schedule/versions');
            if (!response.ok) throw new Error('Failed to load versions');

            versions = await response.json();
            filteredVersions = [...versions];
            renderTable();
        } catch (err) {
            console.error('Error loading versions:', err);
            if (window.MessageManager) MessageManager.show('Error loading versions: ' + err.message, 'error');
        }
    }

    function renderTable() {
        if (!versionsTableBody) return;
        versionsTableBody.innerHTML = '';

        if (filteredVersions.length === 0) {
            versionsTableBody.innerHTML = `<tr><td colspan="7" class="text-center">No versions found</td></tr>`;
            return;
        }

        filteredVersions.forEach(v => {
            const tr = document.createElement('tr');
            const date = new Date(v.UploadDate).toLocaleString();

            const versionId = v.Id || v.id;
            const versionName = v.VersionName || v.versionName || '';
            const fileName = v.FileName || v.fileName || '';
            const isActive = (v.Status === 1 || v.status === 1);
            const statusVal = isActive ? 'Active' : 'Archive';

            if (isActive) {
                tr.classList.add('row-active');
            }

            tr.innerHTML = `
                <td class="checkbox-col"><input type="checkbox" class="row-checkbox" data-id="${versionId}" data-name="${versionName}" data-filename="${fileName}"></td>
                <td><strong>${versionName}</strong></td>
                <td><small>${fileName}</small></td>
                <td>${date}</td>
                <td>${v.CreatedBy || v.createdBy || 'System'}</td>
                <td>${statusVal}</td>
                <td>
                    <button class="btn btn-small btn-edit" data-id="${versionId}">Edit</button>
                </td>
            `;
            versionsTableBody.appendChild(tr);
        });

        // Add Listeners
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = (e) => openEditModal(e.target.dataset.id);
        });

        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => cb.addEventListener('change', updateSelectedCount));
        updateSelectedCount();
    }

    function sortTable(column) {
        if (currentSortColumn === column) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = column;
            currentSortDirection = 'asc';
        }

        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        const header = document.querySelector(`.sortable[data-column="${column}"]`);
        if (header) header.classList.add(`sort-${currentSortDirection}`);

        filteredVersions.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            if (aVal == null) aVal = '';
            if (bVal == null) bVal = '';

            if (column === 'UploadDate') {
                return currentSortDirection === 'asc'
                    ? new Date(aVal) - new Date(bVal)
                    : new Date(bVal) - new Date(aVal);
            }

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        renderTable();
    }

    function updateSelectedCount() {
        const checked = document.querySelectorAll('.row-checkbox:checked');
        if (selectedCount) selectedCount.textContent = checked.length;
        if (deleteSelectedBtn) deleteSelectedBtn.disabled = checked.length === 0;
        if (downloadBtn) downloadBtn.disabled = checked.length !== 1;
        if (setActiveBtn) setActiveBtn.disabled = checked.length !== 1;

        if (selectAll) {
            const all = document.querySelectorAll('.row-checkbox');
            if (all.length === 0) {
                selectAll.checked = false;
                selectAll.indeterminate = false;
            } else {
                selectAll.checked = checked.length === all.length;
                selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
            }
        }
    }

    // --- Upload Logic ---
    function handleFile(file) {
        if (!file) return;
        const fileText = document.getElementById('selectedFile');
        if (fileText) fileText.textContent = file.name;

        const vNameInput = document.getElementById('versionName');
        if (vNameInput && !vNameInput.value) {
            const date = new Date().toISOString().split('T')[0];
            vNameInput.value = `Upload ${date}`;
        }
    }

    if (uploadVersionBtn) {
        uploadVersionBtn.onclick = () => {
            if (uploadModal) uploadModal.style.display = 'flex';
            if (uploadForm) uploadForm.reset();
            const fileText = document.getElementById('selectedFile');
            if (fileText) fileText.textContent = '';
        };
    }

    if (closeUploadModal) closeUploadModal.onclick = () => uploadModal.style.display = 'none';

    if (dropZone) {
        dropZone.onclick = () => fileInput.click();

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length) {
                fileInput.files = files;
                handleFile(files[0]);
            }
        }, false);
    }

    if (fileInput) {
        fileInput.onchange = () => {
            if (fileInput.files.length) {
                handleFile(fileInput.files[0]);
            }
        };
    }

    if (uploadForm) {
        uploadForm.onsubmit = async (e) => {
            e.preventDefault();
            const progress = document.getElementById('uploadProgress');
            if (progress) progress.style.display = 'block';

            if (window.MessageManager) MessageManager.showLoading('Uploading and processing schedule...');

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('versionName', document.getElementById('versionName').value);

            try {
                const response = await fetch('/api/schedule/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Upload failed');

                if (window.MessageManager) MessageManager.show('Upload successful!', 'success', 3000);
                if (uploadModal) uploadModal.style.display = 'none';
                await loadVersions();
            } catch (err) {
                if (window.MessageManager) MessageManager.show('Upload error: ' + err.message, 'error');
            } finally {
                if (progress) progress.style.display = 'none';
            }
        };
    }

    // --- Edit Logic ---
    function openEditModal(id) {
        const v = versions.find(item => (item.Id || item.id) == id);
        if (!v) return;

        const idInput = document.getElementById('editVersionId');
        const nameInput = document.getElementById('editVersionName');
        const fileInputDisp = document.getElementById('editFileName');

        if (idInput) idInput.value = v.Id || v.id;
        if (nameInput) nameInput.value = v.VersionName || v.versionName;
        if (fileInputDisp) fileInputDisp.value = v.FileName || v.fileName;

        if (editModal) editModal.style.display = 'flex';
    }

    if (closeEditModal) closeEditModal.onclick = () => editModal.style.display = 'none';

    if (editVersionForm) {
        editVersionForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('editVersionId').value;
            const versionName = document.getElementById('editVersionName').value;

            if (window.MessageManager) MessageManager.showLoading('Updating version...');

            try {
                const response = await fetch(`/api/schedule/versions/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ versionName })
                });

                if (!response.ok) throw new Error('Failed to update');

                if (window.MessageManager) MessageManager.show('Version updated successfully', 'success', 3000);
                if (editModal) editModal.style.display = 'none';
                await loadVersions();
            } catch (err) {
                if (window.MessageManager) MessageManager.show('Error: ' + err.message, 'error');
            }
        };
    }

    // Global Close
    window.onclick = (e) => {
        if (e.target == uploadModal) uploadModal.style.display = 'none';
        if (e.target == editModal) editModal.style.display = 'none';
        if (e.target == confirmDeleteModal) hideConfirmModal();
    };
});

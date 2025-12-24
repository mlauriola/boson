// Global State
let allReports = [];
let filteredReports = [];

// Global Permissions State
let currentPermissions = {
    roleId: 4,
    canCreate: false,
    canEditAll: false,
    canDeleteAll: false,
    isViewer: true,
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
    loadReports();
    EventManager.init();

    // Event delegation for Edit buttons
    document.getElementById('reportsTableBody').addEventListener('click', function (e) {
        if (e.target && e.target.closest('.btn-edit')) {
            const btn = e.target.closest('.btn-edit');
            const id = btn.getAttribute('data-id');
            EventManager.loadReportForEdit(id);
        }
    });

    const delBtn = document.getElementById('deleteSelectedBtn');
    if (delBtn) {
        delBtn.addEventListener('click', () => {
            const selected = Array.from(document.querySelectorAll('.row-checkbox:not(#selectAll):checked'))
                .map(cb => cb.getAttribute('data-id'));
            if (selected.length > 0) {
                openDeleteModal(selected);
            }
        });
    } // End filtering logic? No, this is closing search listener probably.

    // Confirm Delete Button Logic
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!itemsToDelete || itemsToDelete.length === 0) return;
            hideDeleteModal();

            try {
                // Delete each item
                // Use Promise.all
                const promises = itemsToDelete.map(id =>
                    fetch(`/api/event-management/${id}`, { method: 'DELETE' })
                );

                const results = await Promise.all(promises);
                const allOk = results.every(r => r.ok);

                if (allOk) {
                    // Update list
                    loadReports();
                    // Clear selection
                    itemsToDelete = [];
                    // Disable delete button
                    const delBtn = document.getElementById('deleteSelectedBtn');
                    if (delBtn) delBtn.disabled = true;
                    document.getElementById('selectAll').checked = false;

                    if (typeof MessageManager !== 'undefined') {
                        MessageManager.show('Selected reports deleted successfully.', 'success');
                    } else {
                        alert('Selected reports deleted successfully.');
                    }
                } else {
                    alert('Error deleting some items.');
                    loadReports(); // Reload to see what remains
                }

            } catch (err) {
                console.error(err);
                alert('Error processing deletion.');
            }
        });
    }
});

if (closeConfirmDeleteModal) closeConfirmDeleteModal.addEventListener('click', hideDeleteModal);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', hideDeleteModal);
window.addEventListener('click', (e) => {
    if (e.target === confirmDeleteModal) hideDeleteModal();
});

function openDeleteModal(ids) {
    itemsToDelete = ids;
    const count = ids.length;
    confirmDeleteMessage.innerHTML = `Are you sure you want to delete <strong>${count}</strong> selected report(s)?`;
    confirmDeleteModal.style.display = 'flex';
}

function hideDeleteModal() {
    confirmDeleteModal.style.display = 'none';
}

async function loadPermissions() {
    try {
        const response = await fetch('/api/event-management/permissions');
        if (response.ok) {
            currentPermissions = await response.json();
            console.log('DEBUG: Permissions loaded:', currentPermissions);
            applyGlobalUIPermissions();
        } else {
            console.error('Failed to load permissions');
        }
    } catch (e) {
        console.error('Error loading permissions:', e);
    }
}

function applyGlobalUIPermissions() {
    const addBtn = document.getElementById('addReportBtn');
    const delBtn = document.getElementById('deleteSelectedBtn');

    const selectAllCb = document.getElementById('selectAll');

    if (currentPermissions.isViewer) {
        if (addBtn) addBtn.style.display = 'none';
        if (delBtn) delBtn.style.display = 'none';

        // Hide Created By Header
        const createdByHeader = document.getElementById('createdByHeader');
        if (createdByHeader) createdByHeader.style.display = 'none';

        // Hide Actions Header
        const actionsHeader = document.getElementById('actionsHeader');
        if (actionsHeader) actionsHeader.style.display = 'none';
    } else {
        // Normal Editors and Admins
        if (addBtn) addBtn.style.display = 'inline-flex'; // Restore matching CSS
        if (delBtn) delBtn.style.display = 'inline-flex';
    }

    // Hide Select All for anyone who isn't an Admin/Super (cannot delete all)
    // This covers Viewers (Role 4) and Normal Editors (Role 3)
    if (!currentPermissions.canDeleteAll) {
        if (selectAllCb) selectAllCb.style.visibility = 'hidden';
    } else {
        if (selectAllCb) selectAllCb.style.visibility = 'visible';
    }
}

async function loadReports() {
    const tableBody = document.getElementById('reportsTableBody');

    try {
        await loadPermissions(); // Ensure permissions are loaded first

        const response = await fetch('/api/event-management');
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        // Update global state
        allReports = await response.json();
        filteredReports = allReports;

        // Re-apply search filter if input exists
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim()) {
            searchInput.dispatchEvent(new Event('input'));
        } else {
            renderTable(filteredReports);
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Error loading reports: ${error.message}</td></tr>`;
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('reportsTableBody');
    tableBody.innerHTML = '';

    // Check global perms again just to be safe (though loadReports calls it)
    const { canEditAll, currentUser, isViewer } = currentPermissions;

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No reports found.</td></tr>';
        return;
    }
    data.forEach(report => {
        const isOwner = report.CreatedBy === currentUser;
        const canEditThis = canEditAll || isOwner;

        const row = document.createElement('tr');
        const dateFrom = new Date(report.DateFrom).toLocaleDateString();
        const dateTo = new Date(report.DateTo).toLocaleDateString();
        const dateRange = (dateFrom === dateTo) ? dateFrom : `${dateFrom} - ${dateTo}`;
        const statusClass = (report.Status === 'Published') ? 'status-published' : 'status-draft';

        // Conditional Checkbox for EVERYONE (needed for View)
        const checkboxHtml = `<input type="checkbox" class="row-checkbox" data-id="${report.Id}" data-name="${escapeHtml(report.EventName)}">`;

        // Conditional Actions
        let actionsHtml = '';
        if (canEditThis && !isViewer) {
            actionsHtml = `
                <button class="btn btn-small btn-edit" title="Edit" data-id="${report.Id}">
                     Edit
                </button>`;
        }

        // Conditional Created By Column Visibility
        const createdByColStyle = isViewer ? 'display: none;' : '';
        const actionsColStyle = isViewer ? 'display: none;' : '';

        row.innerHTML = `
            <td class="checkbox-col">${checkboxHtml}</td>
            <td>${report.Id}</td>
            <td style="${createdByColStyle}">${escapeHtml(report.CreatedBy || '')}</td>
            <td><strong>${escapeHtml(report.EventName)}</strong></td>
            <td>${escapeHtml(report.Location)}</td>
            <td>${dateRange}</td>
            <td>${escapeHtml(report.ManagerName)}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(report.Status || 'Draft')}</span></td>
            <td style="${actionsColStyle}">
                ${actionsHtml}
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateCheckboxListeners(); // Bind new checkboxes
}

function updateCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.row-checkbox:not(#selectAll)');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const selectAll = document.getElementById('selectAll');

    // Update button state based on selection
    const updateButtonState = () => {
        const selected = Array.from(checkboxes).filter(cb => cb.checked);
        if (deleteBtn) {
            deleteBtn.disabled = selected.length === 0;
            // Removed text update "Delete Selected (N)" -> User prefers simple "Delete Selected"
            // deleteBtn.innerHTML = ...
        }
    };

    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateButtonState);
    });

    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateButtonState();
        });
    }

    // Attach click handler to Delete Button (ONLY ONCE)
    // Remove old listeners first? Or assume this function is called once per render?
    // Actually, this function is called on every renderTable. 
    // Attaching listeners to permanent elements like deleteBtn here is BAD.
    // Move deleteBtn listener to DOMContentLoaded or handle "off/on"
}
// Helper handled outside

/* --- MERGED WIZARD LOGIC (EventManager) --- */

const EventManager = {
    data: {
        section1: {},
        section2: [],
        section3: [],
        section4: [],
        section5: {},
        section6: {}
    },
    counters: {
        issues: 0,
        damaged: 0,
        missing: 0
    },
    sectionTitles: [
        '1. Event General Details',
        '2. Issues & Solutions',
        '3. Damaged Items',
        '4. Missing Items',
        '5. Suggestions',
        '6. Overview & Submit'
    ],

    init() {
        // Initial setup if needed
    },

    async loadReportForEdit(id, viewOnly = false) {
        try {
            const response = await fetch(`/api/event-management/${id}`);
            if (!response.ok) throw new Error('Failed to fetch report');
            const report = await response.json();

            // Populate internal data structure
            this.reset(); // Clear previous data
            this.currentReportId = id; // Set ID for Update

            // Map flat API response back to sections
            this.data.section1 = {
                eventName: report.EventName || '',
                location: report.Location || '',
                dateFrom: report.DateFrom ? report.DateFrom.split('T')[0] : '', // Extract YYYY-MM-DD
                dateTo: report.DateTo ? report.DateTo.split('T')[0] : '',
                manager: report.ManagerName || '',
                summary: report.Summary || '', // Corrected from Description
                servicesProvided: report.ServicesProvided || ''
            };

            // Populate Input Fields for Section 1
            document.getElementById('eventName').value = this.data.section1.eventName;
            document.getElementById('location').value = this.data.section1.location;
            document.getElementById('dateFrom').value = this.data.section1.dateFrom;
            document.getElementById('dateTo').value = this.data.section1.dateTo;
            document.getElementById('manager').value = this.data.section1.manager;
            document.getElementById('summary').value = this.data.section1.summary;
            document.getElementById('servicesProvided').value = this.data.section1.servicesProvided;

            // 2. Populate Issues
            if (report.Issues && Array.isArray(report.Issues)) {
                report.Issues.forEach(issue => {
                    this.addIssue();
                    const blocks = document.querySelectorAll('.issue-block');
                    const lastBlock = blocks[blocks.length - 1];
                    lastBlock.querySelector('[data-field="problem"]').value = issue.Problem || '';
                    lastBlock.querySelector('[data-field="impact"]').value = issue.Impact || '';
                    lastBlock.querySelector('[data-field="solution"]').value = issue.Solution || '';
                    lastBlock.querySelector('[data-field="preventive"]').value = issue.PreventiveActions || '';
                    lastBlock.querySelector('[data-field="notes"]').value = issue.Notes || '';
                });
            }

            // 3. Populate Damaged Items
            if (report.DamagedItems && Array.isArray(report.DamagedItems)) {
                report.DamagedItems.forEach(item => {
                    this.addDamagedItem();
                    const blocks = document.querySelectorAll('.damaged-block');
                    const lastBlock = blocks[blocks.length - 1];
                    lastBlock.querySelector('[data-field="code"]').value = item.ItemCode || '';
                    lastBlock.querySelector('[data-field="description"]').value = item.Description || '';
                    lastBlock.querySelector('[data-field="status"]').value = item.Status || '';
                });
            }

            // 4. Populate Missing Items
            if (report.MissingItems && Array.isArray(report.MissingItems)) {
                report.MissingItems.forEach(item => {
                    this.addMissingItem();
                    const blocks = document.querySelectorAll('.missing-block');
                    const lastBlock = blocks[blocks.length - 1];
                    lastBlock.querySelector('[data-field="code"]').value = item.ItemCode || '';
                    lastBlock.querySelector('[data-field="description"]').value = item.Description || '';
                    lastBlock.querySelector('[data-field="status"]').value = item.Status || 'Missing';
                });
            }

            // 5. Populate Suggestions
            if (report.Suggestions && Object.keys(report.Suggestions).length > 0) {
                const sugg = report.Suggestions;
                document.getElementById('suggLogistics').value = sugg.Logistics || '';
                document.getElementById('suggOperations').value = sugg.Operations || '';
                document.getElementById('suggCommunication').value = sugg.Communication || '';
                document.getElementById('suggMaterials').value = sugg.Materials || '';
                document.getElementById('suggSoftware').value = sugg.Software || '';
            }

            // Section 6
            if (report.Notes) {
                document.getElementById('finalNotes').value = report.Notes;
            }

            // Open Modal
            document.getElementById('addReportModal').style.display = 'flex';

            if (viewOnly) {
                document.getElementById('modalTitle').textContent = `View Report #${id}`;
                this.setReadOnlyMode(true);
            } else {
                document.getElementById('modalTitle').textContent = `Edit Report #${id}`;
                this.setReadOnlyMode(false);
            }

            // Refresh Section 1 UI to ensure "Save Draft" button visibility matches Edit Mode
            this.showSection(1);

        } catch (err) {
            console.error(err);
            alert('Error loading report for edit.');
        }
    },

    setReadOnlyMode(isReadOnly) {
        // Disable/Enable all inputs
        const modal = document.getElementById('addReportModal');
        const inputs = modal.querySelectorAll('input, textarea, select, button.btn-outline-danger'); // inputs + remove buttons
        inputs.forEach(el => {
            if (el.classList.contains('btn-close') || el.classList.contains('btn-secondary')) return; // Don't disable close/prev/next buttons
            el.disabled = isReadOnly;
        });

        // Toggle View Mode Class
        if (isReadOnly) {
            modal.classList.add('view-mode');
            // Show all sections
            document.querySelectorAll('.wizard-section').forEach(s => s.classList.remove('hidden'));
            // Show headers
            document.querySelectorAll('.view-only-header').forEach(h => h.style.display = 'block');
        } else {
            modal.classList.remove('view-mode');
            // Hide headers
            document.querySelectorAll('.view-only-header').forEach(h => h.style.display = 'none');
        }

        // Hide/Show Save Buttons
        const saveDraftBtn = document.getElementById('saveDraftBtnS1');
        const submitBtn = document.getElementById('submitBtn');

        if (isReadOnly) {
            if (saveDraftBtn) saveDraftBtn.style.visibility = 'hidden'; // using visibility to keep layout
            if (submitBtn) submitBtn.style.display = 'none';
        } else {
            if (saveDraftBtn) saveDraftBtn.style.visibility = 'visible';
            if (submitBtn) submitBtn.style.display = 'inline-block';
        }
    },

    reset() {
        this.currentReportId = null;
        this.setReadOnlyMode(false); // Reset to editable (removes view-mode)
        this.data = {
            section1: {},
            section2: [],
            section3: [],
            section4: [],
            section5: {},
            section6: {}
        };
        this.counters = {
            issues: 0,
            damaged: 0,
            missing: 0
        };

        // Reset Inputs
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.value = '';
            el.disabled = false;
        });
        document.getElementById('issues-container').innerHTML = '';
        document.getElementById('damaged-container').innerHTML = '';
        document.getElementById('missing-container').innerHTML = '';

        // Reset buttons visibility in case they were hidden
        const saveDraftBtn = document.getElementById('saveDraftBtnS1');
        const submitBtn = document.getElementById('submitBtn');
        if (saveDraftBtn) saveDraftBtn.style.visibility = 'visible';
        if (submitBtn) submitBtn.style.display = 'inline-block';


        // Show first section
        this.showSection(1);
    },

    nextSection(targetSection) {
        if (targetSection > 1) {
            // Skip validation if Read Only? No, navigation should work. 
            // But validation checks required fields, which might be populated.
            // If it's read only, we shouldn't fail validation if something is missing/invalid?
            // Ideally existing reports define valid data. But let's check.

            // Actually, we should probably SAVE only if not read-only.
            // But we need to switch sections.

            // If ReadOnly, skip saveSectionData
            const modalTitle = document.getElementById('modalTitle').textContent;
            const isReadOnly = modalTitle.includes('View Report');

            if (!isReadOnly) {
                const prevSection = targetSection - 1;
                if (!this.validateSection(prevSection)) return;
                this.saveSectionData(prevSection);
            }
        }
        this.showSection(targetSection);
    },

    prevSection(targetSection) {
        this.showSection(targetSection);
    },

    showSection(num) {
        document.querySelectorAll('.wizard-section').forEach(s => s.classList.add('hidden'));
        document.getElementById(`section-${num}`).classList.remove('hidden');

        // Update Modal Title
        const stepTitle = this.sectionTitles[num - 1] || '';
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) {
            const currentTitle = titleEl.textContent;
            const baseTitle = currentTitle.split(' - ')[0]; // Extract "Edit Report #123" or "View Report #123"
            titleEl.textContent = `${baseTitle} - ${stepTitle}`;
        }

        // Scroll modal to top
        document.querySelector('.modal-body').scrollTop = 0;

        // Toggle Save Draft in Section 1 based on Edit Mode
        if (num === 1) {
            const saveDraftBtn = document.getElementById('saveDraftBtnS1');
            if (saveDraftBtn) {
                // Check if ReadOnly
                const isReadOnly = titleEl.textContent.includes('View Report');
                if (!isReadOnly) {
                    saveDraftBtn.style.display = this.currentReportId ? 'inline-block' : 'none';
                }
            }
        }

        if (num === 6) this.renderSummary();
    },

    validateSection(num) {
        if (num === 1) {
            const inputs = document.querySelectorAll('#section-1 .section1-input');
            const dateFromInput = document.getElementById('dateFrom');
            const dateToInput = document.getElementById('dateTo');

            // Reset custom validation to ensure fresh check
            if (dateToInput) dateToInput.setCustomValidity('');

            // Standard basic validation (required, types, etc)
            for (const input of inputs) {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    return false;
                }
            }

            // Logic Validation: Date Range
            if (dateFromInput && dateToInput && dateFromInput.value && dateToInput.value) {
                const start = new Date(dateFromInput.value);
                const end = new Date(dateToInput.value);
                if (end < start) {
                    dateToInput.setCustomValidity('The end date cannot be earlier than the start date.');
                    dateToInput.reportValidity();
                    return false;
                }
            }

            return true;
        } else if (num === 2) {
            // Check dynamic inputs
            const inputs = document.querySelectorAll('#section-2 input[required], #section-2 textarea[required], #section-2 select[required]');
            for (const input of inputs) {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    return false;
                }
            }
            // Custom check: if block exists but empty? Handled by required attribute on fields inside addIssue

            // If manual check needed for at least one issue? Not strictly required by HTML unless we add a hidden input.
            // Keeping it consistent with HTML validity. 
            // Logic in addIssue adds "required" attribute to fields.

        } else if (num === 3) {
            const inputs = document.querySelectorAll('#section-3 input[required], #section-3 textarea[required], #section-3 select[required]');
            for (const input of inputs) {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    return false;
                }
            }
        } else if (num === 4) {
            const inputs = document.querySelectorAll('#section-4 input[required], #section-4 textarea[required], #section-4 select[required]');
            for (const input of inputs) {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    return false;
                }
            }
        }
        return true;
    },

    saveSectionData(num) {
        if (num === 1) {
            this.data.section1 = {
                eventName: document.getElementById('eventName').value,
                location: document.getElementById('location').value,
                dateFrom: document.getElementById('dateFrom').value,
                dateTo: document.getElementById('dateTo').value,
                manager: document.getElementById('manager').value,
                summary: document.getElementById('summary').value,
                servicesProvided: document.getElementById('servicesProvided').value
            };
        }
        // ... (data collection logic is same, simplified for brevity in this merged file)
        if (num === 2) {
            this.data.section2 = [];
            document.querySelectorAll('.issue-block').forEach(block => {
                this.data.section2.push({
                    problem: block.querySelector('[data-field="problem"]').value,
                    impact: block.querySelector('[data-field="impact"]').value,
                    solution: block.querySelector('[data-field="solution"]').value,
                    preventive: block.querySelector('[data-field="preventive"]').value,
                    notes: block.querySelector('[data-field="notes"]').value
                });
            });
        }
        if (num === 3) {
            this.data.section3 = [];
            document.querySelectorAll('.damaged-block').forEach(block => {
                this.data.section3.push({
                    code: block.querySelector('[data-field="code"]').value,
                    description: block.querySelector('[data-field="description"]').value,
                    status: block.querySelector('[data-field="status"]').value
                });
            });
        }
        if (num === 4) {
            this.data.section4 = [];
            document.querySelectorAll('.missing-block').forEach(block => {
                this.data.section4.push({
                    code: block.querySelector('[data-field="code"]').value,
                    description: block.querySelector('[data-field="description"]').value,
                    status: block.querySelector('[data-field="status"]').value
                });
            });
        }
        if (num === 5) {
            this.data.section5 = {
                logistics: document.getElementById('suggLogistics').value,
                operations: document.getElementById('suggOperations').value,
                communication: document.getElementById('suggCommunication').value,
                materials: document.getElementById('suggMaterials').value,
                software: document.getElementById('suggSoftware').value
            };
        }
    },

    addIssue() {
        this.counters.issues++;
        const id = this.counters.issues;
        const div = document.createElement('div');
        div.className = 'issue-block card mb-3 p-3 bg-light-yellow';
        div.innerHTML = `
            <div class="d-flex justify-content-between">
                <h6>Issue #${id}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.issue-block').remove()">Remove</button>
            </div>
            <div class="form-group"><label>Problem *</label><textarea class="form-control" data-field="problem" required></textarea></div>
            <div class="form-group"><label>Impact *</label><textarea class="form-control" data-field="impact" required></textarea></div>
            <div class="form-group"><label>Solution</label><textarea class="form-control" data-field="solution"></textarea></div>
            <div class="form-group"><label>Preventive Actions</label><textarea class="form-control" data-field="preventive"></textarea></div>
            <div class="form-group"><label>Additional Notes</label><textarea class="form-control" data-field="notes"></textarea></div>
        `;
        document.getElementById('issues-container').appendChild(div);
    },

    addDamagedItem() {
        this.counters.damaged++;
        const id = this.counters.damaged;
        const div = document.createElement('div');
        div.className = 'damaged-block card mb-3 p-3 bg-light-blue';
        div.innerHTML = `
            <div class="d-flex justify-content-between">
                <h6>Damaged Item #${id}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.damaged-block').remove()">Remove</button>
            </div>
            <div class="form-group"><label>Item Code</label><input type="text" class="form-control" data-field="code"></div>
            <div class="form-group"><label>Description *</label><textarea class="form-control" data-field="description" required></textarea></div>
            <div class="form-group"><label>Status *</label>
                <select class="form-control" data-field="status" required>
                    <option value="">Select Status</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Not Working">Not Working</option>
                </select>
            </div>
        `;
        document.getElementById('damaged-container').appendChild(div);
    },

    addMissingItem() {
        this.counters.missing++;
        const id = this.counters.missing;
        const div = document.createElement('div');
        div.className = 'missing-block card mb-3 p-3 bg-light-red';
        div.innerHTML = `
            <div class="d-flex justify-content-between">
                <h6>Missing Item #${id}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.missing-block').remove()">Remove</button>
            </div>
            <div class="form-group"><label>Item Code</label><input type="text" class="form-control" data-field="code"></div>
            <div class="form-group"><label>Description *</label><textarea class="form-control" data-field="description" required></textarea></div>
            <div class="form-group">
                <label>Status</label>
                <select class="form-control" data-field="status">
                    <option value="Missing">Missing</option>
                    <option value="Lost">Lost</option>
                </select>
            </div>
        `;
        document.getElementById('missing-container').appendChild(div);
    },

    renderSummary() {
        const s1 = this.data.section1;

        // Custom stats block builder - Forced Horizontal
        const getStatBlock = (label, count, bgClass) => {
            const countDisplay = `<div class="font-weight-bold text-dark ml-2" style="font-size: 0.85rem; white-space: nowrap;">${count}</div>`;
            return `
                <div class="card ${bgClass} border-0 py-2 px-2 h-100" style="min-width: 0; display: flex !important; flex-direction: row !important; justify-content: space-between !important; align-items: center !important; flex-wrap: nowrap !important;">
                    <div class="text-uppercase text-muted text-truncate mb-0" style="font-size: 0.85rem; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 0 !important;">${label}</div>
                    ${countDisplay}
                </div>
            `;
        };

        const html = `
            <div class="row">
                <!-- Left: General Details (Ultra Compact) -->
                <div class="col-md-7">
                    <div class="card mb-2 h-100">
                        <div class="card-header bg-white border-bottom-0 py-2">
                            <h6 class="mb-0 text-primary" style="font-size: 0.85rem; font-weight: 700;">General Details</h6>
                        </div>
                        <div class="card-body p-0">
                            <table class="table table-sm table-borderless mb-0" style="margin: 0; font-size: 0.85rem; line-height: 1;">
                                <tbody>
                                    <tr>
                                        <td class="text-muted text-right pl-1 pr-1 py-0" style="width: 1%; white-space: nowrap;">Event:</td>
                                        <td class="font-weight-bold pl-0 text-truncate text-dark py-0" style="max-width: 200px;">${s1.eventName}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted text-right pl-1 pr-1 py-0">Location:</td>
                                        <td class="font-weight-bold pl-0 text-truncate text-dark py-0" style="max-width: 200px;">${s1.location}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted text-right pl-1 pr-1 py-0" style="white-space: nowrap;">Event Coordinator:</td>
                                        <td class="font-weight-bold pl-0 text-truncate text-dark py-0" style="max-width: 200px;">${s1.manager}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted text-right pl-1 pr-1 py-0">Period:</td>
                                        <td class="font-weight-bold pl-0 text-dark py-0">${s1.dateFrom} - ${s1.dateTo}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted text-right pl-1 pr-1 py-0" style="vertical-align: top;">Description:</td>
                                        <td class="font-weight-bold pl-0 text-dark py-0" style="white-space: pre-wrap; font-size: 0.85rem;">${s1.summary || '<span class="text-muted font-italic">No description provided.</span>'}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted text-right pl-1 pr-1 py-0" style="vertical-align: top;">Services:</td>
                                        <td class="font-weight-bold pl-0 text-dark py-0" style="white-space: pre-wrap; font-size: 0.85rem;">${s1.servicesProvided || '<span class="text-muted font-italic">No services provided.</span>'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Right: Executive Summary + Stats -->
                <div class="col-md-5">
                    <div class="row no-gutters h-100 align-content-start">
                        <!-- Suggestions (Moved Here) -->
                        <div class="col-12 mb-0 p-0 px-1">
                            ${getStatBlock('Suggestions', Object.values(this.data.section5).filter(v => v && v.trim().length > 0).length, 'bg-light')}
                        </div>

                        <!-- Separator -->
                        <div class="col-12 px-2">
                            <hr class="w-100 my-2" style="border-top: 1px solid #dee2e6;">
                        </div>

                        <!-- Stats List -->
                        <div class="col-12 mb-1 p-0 px-1">
                            ${getStatBlock('Issues', this.data.section2.length, 'bg-light-yellow')}
                        </div>
                        <div class="col-12 mb-1 p-0 px-1">
                            ${getStatBlock('Damaged', this.data.section3.length, 'bg-light-blue')}
                        </div>
                        <div class="col-12 mb-1 p-0 px-1">
                            ${getStatBlock('Missing', this.data.section4.length, 'bg-light-red')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('summary-content').innerHTML = html;
    },

    async submitReport(status = 'Published') { // Status is 'Draft' or 'Published'
        // Force save ALL sections to ensure latest DOM state is captured
        // This fixes issues where 'Next' might not have persisted data or if user jumped around
        for (let i = 1; i <= 6; i++) {
            this.saveSectionData(i);
        }

        this.data.section6 = {
            notes: document.getElementById('finalNotes').value
        };

        // Construct Payload matching Backend Expectation (Nested Sections)
        const reportData = {
            section1: this.data.section1,
            section2: this.data.section2,
            section3: this.data.section3,
            section4: this.data.section4,
            section5: this.data.section5,
            section6: this.data.section6,
            Status: status, // Backend needs to be updated to read this!
            CreatedBy: (window.CurrentAuth && (window.CurrentAuth.username || window.CurrentAuth.referent)) ? (window.CurrentAuth.username || window.CurrentAuth.referent) : 'Unknown'
        };

        try {
            let url = '/api/event-management';
            let method = 'POST';

            console.log('DEBUG: Submitting. Status:', status, 'Current ID:', this.currentReportId);

            if (this.currentReportId) {
                url = `/api/event-management/${this.currentReportId}`;
                method = 'PUT';
            }
            console.log('DEBUG: Method:', method, 'URL:', url);

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });
            const result = await response.json();
            console.log('DEBUG: Response:', result);

            if (response.ok) {
                // Update Current ID to ensure subsequent saves are Updates (PUT)
                this.currentReportId = result.reportId;
                console.log('DEBUG: Set currentReportId to:', this.currentReportId);

                // Update Modal Title to reflect Edit Mode
                document.getElementById('modalTitle').textContent = `Edit Report #${this.currentReportId}`;

                const msg = status === 'Published' ? 'Report submitted successfully!' : 'Report saved as draft successfully!';
                if (typeof MessageManager !== 'undefined') {
                    MessageManager.show(msg, 'success');
                } else {
                    alert(msg);
                }

                // If Published, close modal. If Draft, keep open for continued editing.
                if (status === 'Published') {
                    document.getElementById('addReportModal').style.display = 'none';
                }

                loadReports(); // Refresh List in background
            } else {
                if (typeof MessageManager !== 'undefined') {
                    MessageManager.show(`Error: ${result.error || 'Unknown error'}`, 'error');
                } else {
                    alert(`Error: ${result.error || 'Unknown error'}`);
                }
            }
        } catch (err) {
            console.error(err);
            if (typeof MessageManager !== 'undefined') {
                MessageManager.show('Network error.', 'error');
            } else {
                alert('Network error.');
            }
        }
    },

    saveDraft() {
        this.submitReport('Draft');
    }
};

// --- Deletion Logic ---

function updateCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateSelectedCount);
    });
    updateSelectedCount();
}

function updateSelectedCount() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
        deleteBtn.disabled = checkedBoxes.length === 0;
    }

    // View Button Logic
    const viewBtn = document.getElementById('viewReportBtn');
    if (viewBtn) {
        viewBtn.disabled = checkedBoxes.length !== 1;
    }

    // Update Select All Checkbox
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.checked = allCheckboxes.length > 0 && checkedBoxes.length === allCheckboxes.length;
        selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < allCheckboxes.length;
    }
}

async function viewSelectedReport() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkedBoxes.length !== 1) return;

    const id = checkedBoxes[0].dataset.id;
    await EventManager.loadReportForEdit(id, true); // true = viewOnly
}



// Bind Global Events (Ensure this runs after DOM load)
document.addEventListener('DOMContentLoaded', () => {
    // Note: selectAll and deleteSelectedBtn are handled in the main DOMContentLoaded block or updateCheckboxListeners
    // We only need to add listeners for View and Add here if not already handled.

    const viewBtn = document.getElementById('viewReportBtn');
    if (viewBtn) {
        viewBtn.addEventListener('click', viewSelectedReport);
    }

    const addBtn = document.getElementById('addReportBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            EventManager.reset();
            document.getElementById('modalTitle').textContent = 'New Report';
            document.getElementById('addReportModal').style.display = 'flex';
        });
    }
});



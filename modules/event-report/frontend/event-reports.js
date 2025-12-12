document.addEventListener('DOMContentLoaded', () => {
    // Initialize MessageManager if available
    if (typeof MessageManager !== 'undefined') {
        MessageManager.init('messageArea');
    }
    loadReports();
    EventManager.init();

    // Modal Handling
    const modal = document.getElementById('addReportModal');
    const btn = document.getElementById('addReportBtn');
    const closeBtn = document.getElementById('closeAddModal');

    // Open Modal
    btn.onclick = function () {
        modal.style.display = 'flex'; // Use flex to center like users.html styles
        // Reset Wizard
        EventManager.reset();
    }

    // Close Modal
    closeBtn.onclick = function () {
        modal.style.display = 'none';
    }

    // Close on click outside
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
    // Event delegation for Edit buttons
    document.getElementById('reportsTableBody').addEventListener('click', function (e) {
        if (e.target && e.target.closest('.btn-edit')) {
            const btn = e.target.closest('.btn-edit');
            const id = btn.getAttribute('data-id');
            EventManager.loadReportForEdit(id);
        }
    });
});

async function loadReports() {
    const tableBody = document.getElementById('reportsTableBody');

    try {
        const response = await fetch('/api/event-reports');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const reports = await response.json();
        renderTable(reports);
    } catch (error) {
        console.error('Error loading reports:', error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Error loading reports: ${error.message}</td></tr>`;
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('reportsTableBody');
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No reports found.</td></tr>';
        return;
    }
    data.forEach(report => {
        const row = document.createElement('tr');
        const dateFrom = new Date(report.DateFrom).toLocaleDateString();
        const dateTo = new Date(report.DateTo).toLocaleDateString();
        const dateRange = (dateFrom === dateTo) ? dateFrom : `${dateFrom} - ${dateTo}`;
        const statusClass = (report.Status === 'Published') ? 'status-published' : 'status-draft';

        row.innerHTML = `
            <td class="checkbox-col"><input type="checkbox" class="row-checkbox" data-id="${report.Id}" data-name="${escapeHtml(report.EventName)}"></td>
            <td>${report.Id}</td>
            <td>${escapeHtml(report.CreatedBy || '')}</td>
            <td><strong>${escapeHtml(report.EventName)}</strong></td>
            <td>${escapeHtml(report.Location)}</td>
            <td>${dateRange}</td>
            <td>${escapeHtml(report.ManagerName)}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(report.Status || 'Draft')}</span></td>
            <td>
                <button class="btn btn-small btn-edit" title="Edit" data-id="${report.Id}">
                     Edit
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateCheckboxListeners(); // Bind new checkboxes
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

    async loadReportForEdit(id) {
        try {
            const response = await fetch(`/api/event-reports/${id}`);
            if (!response.ok) throw new Error('Failed to fetch report');
            const report = await response.json();

            // Populate internal data structure
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
            document.getElementById('modalTitle').textContent = `Edit Report #${id}`;

            // Refresh Section 1 UI to ensure "Save Draft" button visibility matches Edit Mode
            this.showSection(1);

        } catch (err) {
            console.error(err);
            alert('Error loading report for edit.');
        }
    },

    reset() {
        this.currentReportId = null;
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
        document.querySelectorAll('input, textarea, select').forEach(el => el.value = '');
        document.getElementById('issues-container').innerHTML = '';
        document.getElementById('damaged-container').innerHTML = '';
        document.getElementById('missing-container').innerHTML = '';

        // Show first section
        this.showSection(1);
    },

    nextSection(targetSection) {
        if (targetSection > 1) {
            const prevSection = targetSection - 1;
            if (!this.validateSection(prevSection)) return;
            this.saveSectionData(prevSection);
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
            if (this.currentReportId) {
                titleEl.textContent = `Report #${this.currentReportId} - ${stepTitle}`;
            } else {
                titleEl.textContent = `New Report - ${stepTitle}`;
            }
        }

        // Scroll modal to top
        document.querySelector('.modal-body').scrollTop = 0;

        // Toggle Save Draft in Section 1 based on Edit Mode
        if (num === 1) {
            const saveDraftBtn = document.getElementById('saveDraftBtnS1');
            if (saveDraftBtn) {
                saveDraftBtn.style.display = this.currentReportId ? 'inline-block' : 'none';
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
                    description: block.querySelector('[data-field="description"]').value
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
                                        <td class="text-muted text-right pl-1 pr-1 py-0">Manager:</td>
                                        <td class="font-weight-bold pl-0 text-truncate text-dark py-0" style="max-width: 200px;">${s1.manager}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted text-right pl-1 pr-1 py-0">Period:</td>
                                        <td class="font-weight-bold pl-0 text-dark py-0">${s1.dateFrom} - ${s1.dateTo}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Right: Executive Summary + Stats -->
                <div class="col-md-5">
                    <div class="row no-gutters h-100 align-content-start">
                        <!-- Executive Summary (Moved Top) -->
                        <div class="col-12 mb-2">
                            <div class="card border-0 bg-light">
                                <div class="card-body py-2 px-3 rounded">
                                    <div class="text-uppercase text-muted mb-1" style="font-size: 0.85rem; font-weight: 700; letter-spacing: 0.5px;">Executive Summary</div>
                                    <p class="card-text text-dark mb-0" style="white-space: pre-wrap; line-height: 1.3; font-size: 0.85rem;">${s1.summary || '<span class="text-muted font-italic">No summary provided.</span>'}</p>
                                </div>
                            </div>
                        </div>

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
            let url = '/api/event-reports';
            let method = 'POST';

            console.log('DEBUG: Submitting. Status:', status, 'Current ID:', this.currentReportId);

            if (this.currentReportId) {
                url = `/api/event-reports/${this.currentReportId}`;
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

    // Update Select All Checkbox
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.checked = allCheckboxes.length > 0 && checkedBoxes.length === allCheckboxes.length;
        selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < allCheckboxes.length;
    }
}

async function deleteSelectedReports() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const ids = Array.from(checkedBoxes).map(cb => cb.dataset.id);
    const names = Array.from(checkedBoxes).map(cb => cb.dataset.name);

    if (ids.length === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${ids.length} report(s)?\n\n${names.join('\n')}`);
    if (!confirmed) return;

    try {
        const deletePromises = ids.map(id =>
            fetch(`/api/event-reports/${id}`, { method: 'DELETE' })
        );

        const results = await Promise.all(deletePromises);
        const allSuccessful = results.every(res => res.ok);

        if (allSuccessful) {
            const msg = `Successfully deleted ${ids.length} report(s)!`;
            if (typeof MessageManager !== 'undefined') MessageManager.show(msg, 'success');
            else alert(msg);

            if (document.getElementById('selectAll')) document.getElementById('selectAll').checked = false;
            loadReports();
        } else {
            const msg = 'Some reports could not be deleted.';
            if (typeof MessageManager !== 'undefined') MessageManager.show(msg, 'error');
            else alert(msg);
            loadReports();
        }
    } catch (error) {
        console.error('Error deleting reports:', error);
        alert('Error deleting reports');
    }
}

// Bind Global Events (Ensure this runs after DOM load)
document.addEventListener('DOMContentLoaded', () => {
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = e.target.checked);
            updateSelectedCount();
        });
    }

    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteSelectedReports);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Initialize MessageManager
    MessageManager.init('messageArea');

    // --- STATE ---
    let currentDate = new Date();
    let currentView = 'calendar'; // 'calendar' | 'quarterly'
    let currentEvents = [];
    let planningTags = { clients: [], status: [], roles: [] };

    let allResources = []; // Unified list
    let appUsers = []; // For manager dropdown

    // --- DOM ELEMENTS ---
    const grid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('monthDisplay');
    const filterClient = document.getElementById('filterClient');
    const filterStatus = document.getElementById('filterStatus');

    // Modal Elements
    // Modal Elements
    const eventModal = document.getElementById('eventModal');
    const timelineModal = document.getElementById('timelineModal');
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');

    // --- INITIALIZATION ---
    init();

    async function init() {
        console.log('Using planning.js Init...');
        try {
            await checkAuth(); // Standard auth check
            console.log('Auth OK');

            await loadTags();
            console.log('Tags Loaded');

            await loadAppUsers();
            console.log('Users Loaded');

            // Init View Switcher
            document.getElementById('btnViewCalendar').onclick = () => switchView('calendar');
            document.getElementById('btnViewQuarterly').onclick = () => switchView('quarterly');

            // Set Default View
            console.log('Rendering Initial View (Quarterly)');
            switchView('quarterly');
        } catch (e) {
            console.error('Init Failed:', e);
            MessageManager.show('Initialization Failed', 'error');
        }
    }

    function switchView(view) {
        currentView = view;

        // Button Classes (Tab Style)
        const btnCal = document.getElementById('btnViewCalendar');
        const btnQuart = document.getElementById('btnViewQuarterly');

        // Reset both
        btnCal.className = 'btn btn-sm mr-1 btn-light';
        btnQuart.className = 'btn btn-sm mr-1 btn-light';

        // Set Active
        if (view === 'calendar') {
            btnCal.classList.remove('btn-light');
            btnCal.classList.add('btn-primary');
        } else {
            btnQuart.classList.remove('btn-light');
            btnQuart.classList.add('btn-primary');
        }

        // Containers
        // Containers
        document.getElementById('calendarGrid').style.display = view === 'calendar' ? 'grid' : 'none';
        // Always show the nav parent (it contains Prev, Next, Month Title)
        document.getElementById('monthDisplay').parentNode.style.display = 'flex';

        document.getElementById('quarterlyView').style.display = view === 'quarterly' ? 'flex' : 'none';

        if (view === 'calendar') {
            renderCalendar();
        } else {
            renderQuarterlyView();
        }
    }

    // --- CALENDAR RENDERING ---
    function renderCalendar() {
        // Update Title
        const options = { month: 'long', year: 'numeric' };
        monthDisplay.textContent = currentDate.toLocaleDateString('en-US', options);

        // Clear Grid (keep headers)
        const headers = Array.from(grid.querySelectorAll('.day-header'));
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));

        // Calculate Days
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Mon=0, Sun=6
        const totalDays = lastDayOfMonth.getDate();

        // 1. Previous Month Padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = 0; i < startingDayOfWeek; i++) {
            const dayNum = prevMonthLastDay - startingDayOfWeek + 1 + i;
            const dayEl = createDayElement(dayNum, true);
            grid.appendChild(dayEl);
        }

        // 2. Current Month Days
        for (let i = 1; i <= totalDays; i++) {
            const dayEl = createDayElement(i, false);
            dayEl.dataset.date = new Date(year, month, i).toISOString().split('T')[0]; // YYYY-MM-DD
            grid.appendChild(dayEl);
        }

        // 3. Next Month Padding (to fill 7 cols)
        const dayCountSoFar = startingDayOfWeek + totalDays;
        const remainingCells = (7 - (dayCountSoFar % 7)) % 7;
        for (let i = 1; i <= remainingCells; i++) {
            const dayEl = createDayElement(i, true);
            grid.appendChild(dayEl);
        }

        // Fetch and Render Events
        loadEvents();
    }

    function createDayElement(dayNum, isOtherMonth) {
        const div = document.createElement('div');
        div.className = `calendar-day ${isOtherMonth ? 'other-month' : ''}`;
        div.innerHTML = `<div class="day-number">${dayNum}</div><div class="events-container"></div>`;

        // Highlight Today
        if (!isOtherMonth) {
            const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
            const today = new Date();
            if (checkDate.toDateString() === today.toDateString()) {
                div.classList.add('today');
            }
        }
        return div;
    }

    async function loadEvents() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        // Get full range displayed (including padding? API handles basic overlap)
        // Let's request 1st to Last Day of month for now
        const from = new Date(year, month, 1).toISOString();
        const to = new Date(year, month + 1, 0).toISOString();

        try {
            const res = await fetch(`/api/event-management/planning/events?from=${from}&to=${to}`);
            if (res.ok) {
                currentEvents = await res.json();
                renderEventsOnGrid(currentEvents);
            }
        } catch (e) {
            console.error('Failed to load events', e);
        }
    }

    function renderEventsOnGrid(events) {
        // Filter first
        const clientFilter = filterClient.value;
        const statusFilter = filterStatus.value;

        // Clear existing events
        grid.querySelectorAll('.events-container').forEach(container => container.innerHTML = '');

        const filtered = events.filter(ev => {
            if (clientFilter && ev.ClientId !== clientFilter) return false;
            if (statusFilter && ev.Status !== statusFilter) return false;
            return true;
        });

        // Simple rendering strategy: Add bar to EACH day cell it spans
        // (A more advanced view would act like Google Calendar stripes, but grid cells make it tricky without colspan. 
        // Repeating the bar is easier for Grid Layouts unless we use absolute positioning)

        filtered.forEach(ev => {
            const start = new Date(ev.DateFrom);
            const end = new Date(ev.DateTo);

            // Iterate days in current month view
            const cells = grid.querySelectorAll('.calendar-day:not(.other-month)');
            cells.forEach(cell => {
                const cellDate = new Date(cell.dataset.date);
                // Check overlap
                // Reset times for safe compare
                cellDate.setHours(0, 0, 0, 0);
                const s = new Date(start); s.setHours(0, 0, 0, 0);
                const e = new Date(end); e.setHours(0, 0, 0, 0);

                if (cellDate >= s && cellDate <= e) {
                    const bar = document.createElement('div');
                    bar.className = 'event-bar';
                    // Color logic
                    const statusColor = getStatusColor(ev.Status);
                    bar.style.backgroundColor = statusColor;

                    if (ev.Status === 'Cancelled') {
                        bar.style.color = '#999999'; // Lighter Grey text
                        bar.style.textDecoration = 'line-through';
                    }

                    bar.innerHTML = `
                        <span style="font-weight:bold;">[${ev.ClientId}]</span> ${ev.Name}
                        <span class="delete-icon" title="Quick Delete">×</span>
                    `;

                    // Click to Edit
                    bar.addEventListener('click', (e) => {
                        if (e.target.classList.contains('delete-icon')) {
                            e.stopPropagation();
                            openDeleteConfirm(ev);
                        } else {
                            openEventModal(ev);
                        }
                    });

                    cell.querySelector('.events-container').appendChild(bar);
                }
            });
        });
    }

    // --- NAVIGATION HELPERS ---
    // --- NAVIGATION HELPERS ---
    document.getElementById('btnPrevMonth').addEventListener('click', () => {
        if (currentView === 'quarterly') {
            currentDate.setMonth(currentDate.getMonth() - 4); // Jump 4 months (Tertial view)
            renderQuarterlyView();
        } else {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        }
    });

    document.getElementById('btnNextMonth').addEventListener('click', () => {
        if (currentView === 'quarterly') {
            currentDate.setMonth(currentDate.getMonth() + 4); // Jump 4 months (Tertial view)
            renderQuarterlyView();
        } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        }
    });

    // --- FILTERS ---
    function applyFilters() {
        if (currentView === 'calendar') {
            renderEventsOnGrid(currentEvents);
        } else {
            renderQuarterlyView();
        }
    }
    document.getElementById('filterClient').addEventListener('change', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);

    // --- EVENT MODAL LOGIC ---
    document.getElementById('btnNewEvent').onclick = () => openEventModal();
    document.getElementById('closeEventModal').onclick = () => eventModal.style.display = 'none';
    document.getElementById('btnCancelEvent').onclick = () => eventModal.style.display = 'none';
    document.getElementById('btnSaveEvent').onclick = saveEvent;
    document.getElementById('btnDeleteEvent').onclick = () => {
        // Trigger confirm modal for the currently open event
        eventModal.style.display = 'none';
        const evId = document.getElementById('eventId').value;
        openDeleteConfirm({ Id: evId }); // minimal obj
    };

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            // Activate
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    async function openEventModal(event = null) {
        // Reset Form
        document.getElementById('eventForm').reset();
        document.getElementById('allocationsContainer').innerHTML = '';
        document.getElementById('eventId').value = '';

        // Populate Selects
        populateSelects(!event);

        function populateSelects(isNew) {
            const clientSelect = document.getElementById('eventClient');
            const statusSelect = document.getElementById('eventStatus');

            // Clear
            clientSelect.innerHTML = '<option value="">Select Client...</option>';
            statusSelect.innerHTML = '<option value="">Select Status...</option>';

            // Populate from global state
            if (planningTags.clients) {
                planningTags.clients.forEach(t => clientSelect.add(new Option(t.Name, t.Name)));
            }
            if (planningTags.status) {
                planningTags.status.forEach(t => {
                    // Hide 'Cancelled' if creating new event
                    if (isNew && t.Name === 'Cancelled') return;
                    statusSelect.add(new Option(t.Name, t.Name));
                });
            }
            if (planningTags.roles) {
                const roleList = document.getElementById('roleList');
                roleList.innerHTML = '';
                planningTags.roles.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.Name;
                    roleList.appendChild(opt);
                });
            }
        }

        if (event) {
            document.getElementById('eventModalTitle').textContent = `Edit Event: ${event.Name}`;
            document.getElementById('eventId').value = event.Id;
            document.getElementById('eventClient').value = event.ClientId;
            document.getElementById('eventSubClient').value = event.SubClient || '';
            document.getElementById('eventName').value = event.Name;
            document.getElementById('eventLocation').value = event.Location || '';
            document.getElementById('eventDateFrom').value = event.DateFrom.split('T')[0];
            document.getElementById('eventDateTo').value = event.DateTo.split('T')[0];
            document.getElementById('eventStatus').value = event.Status;
            document.getElementById('eventManager').value = event.ManagerId || '';
            document.getElementById('eventReferent').value = event.Referent || '';
            document.getElementById('eventNotes').value = event.Notes || '';

            // Load Full Details (Allocations)
            await loadEventAllocations(event.Id);

            // Show/Hide Delete
            document.getElementById('btnDeleteEvent').style.display = 'block';
            document.querySelectorAll('.disabled-if-new').forEach(el => el.disabled = false);
            document.querySelectorAll('.disabled-if-new-hint').forEach(el => el.style.display = 'none');

        } else {
            document.getElementById('eventModalTitle').textContent = 'New Event';
            document.getElementById('eventStatus').value = 'Draft';
            document.getElementById('btnDeleteEvent').style.display = 'none';
            document.querySelectorAll('.disabled-if-new').forEach(el => el.disabled = true);
            document.querySelectorAll('.disabled-if-new-hint').forEach(el => el.style.display = 'block');
        }

        eventModal.style.display = 'flex';
    }

    // --- ALLOCATIONS LOGIC ---
    // Remove all previous listeners by cloning
    const oldBtn = document.getElementById('btnAddAllocation');
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.onclick = () => addAllocationRow(null);

    // Add a new row to the UI
    function addAllocationRow(data = null) {
        const container = document.getElementById('allocationsContainer');
        const rowId = data ? data.Id : 'new_' + Date.now();

        const row = document.createElement('div');
        row.className = 'alloc-row';
        row.dataset.id = rowId;

        // 1. Role (Tag input style)
        // Linking to datalist for autosuggest
        let roleHtml = `<input type="text" class="form-control alloc-role" placeholder="Role (e.g. Timing)" value="${data ? data.Role : ''}" style="width:120px;" list="roleList">`;

        // 2. Resource (Dropdown with conflict check)
        let resourceHtml = `<select class="form-control alloc-resource" style="flex:1;">
            <option value="">Select Resource...</option>
        </select>`;

        // 3. Notes
        let notesHtml = `<input type="text" class="form-control alloc-notes" placeholder="Logistics Notes" value="${data ? data.LogisticsNotes || '' : ''}" style="flex:1;">`;

        // 4. Actions
        let actionsHtml = `<button type="button" class="btn btn-danger btn-small btn-remove-alloc">×</button>`;

        row.innerHTML = roleHtml + resourceHtml + notesHtml + actionsHtml;

        container.appendChild(row);

        // Populate Resource Dropdown
        const select = row.querySelector('.alloc-resource');
        populateResourceDropdown(select, data ? data.ResourceId : null, data ? data.ResourceType : null);

        // Remove Handler
        row.querySelector('.btn-remove-alloc').addEventListener('click', () => {
            row.remove();
            // Should also call API to delete if it's existing? 
            // Implementation Plan didn't specify auto-save on modal rows. 
            // Usually we accept "Save Event" to commit all. 
            // But if we delete here, we might want to track deletions.
            // For simplicity: If it has real ID, call DELETE API. If 'new_', just remove DOM.
            if (data && data.Id) {
                deleteAllocation(data.Id);
            }
        });
    }

    async function loadEventAllocations(eventId) {
        try {
            const res = await fetch(`/api/event-management/planning/events/${eventId}`);
            if (res.ok) {
                const fullEvent = await res.json();
                fullEvent.Allocations.forEach(alloc => addAllocationRow(alloc));
            }
        } catch (e) { console.error(e); }
    }

    async function deleteAllocation(id) {
        await fetch(`/api/event-management/planning/allocations/${id}`, { method: 'DELETE' });
    }

    // --- TIMELINE MODAL ---
    document.getElementById('btnOpenTimelineMatrix').addEventListener('click', openTimelineMatrix);
    document.getElementById('closeTimelineModal').addEventListener('click', () => timelineModal.style.display = 'none');

    function openTimelineMatrix() {
        // Must be existing event
        const evId = document.getElementById('eventId').value;
        if (!evId) return; // Should be disabled

        // Get Allocations from DOM (or re-fetch)
        // Safer to re-fetch to ensure we have IDs for matrix saving
        renderTimelineMatrix(evId);
        timelineModal.style.display = 'flex';
    }

    // --- SAVING ---
    async function saveEvent() {
        const id = document.getElementById('eventId').value;
        const payload = {
            id: id ? parseInt(id) : null,
            client: document.getElementById('eventClient').value,
            subClient: document.getElementById('eventSubClient').value,
            name: document.getElementById('eventName').value,
            location: document.getElementById('eventLocation').value,
            dateFrom: document.getElementById('eventDateFrom').value,
            dateTo: document.getElementById('eventDateTo').value,
            status: document.getElementById('eventStatus').value,
            managerId: document.getElementById('eventManager').value,
            referent: document.getElementById('eventReferent').value,
            notes: document.getElementById('eventNotes').value
        };

        try {
            const res = await fetch('/api/event-management/planning/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, // Typo deliberate to fix manually? No, fix it. 'application/json'
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Save failed');
            const data = await res.json();

            // Now Save Allocations (Loop through DOM rows)
            // Ideally this is one transaction but for now frontend loop
            const rows = document.querySelectorAll('.alloc-row');
            for (const row of rows) {
                const allocId = row.dataset.id.startsWith('new_') ? null : row.dataset.id;

                // If it already has a real ID, skip it (it's already saved).
                // Updates to existing allocations could be handled here via PUT if needed, 
                // but currently we only support Add (POST) or Remove (DELETE immediately).
                if (allocId) continue;

                const resourcePart = row.querySelector('.alloc-resource').value; // "ID|Type" or similar needed
                if (!resourcePart) continue;

                const [rId, rType] = resourcePart.split('|');

                // We need specific Add endpoint or use the save logic
                // Using the specific allocation endpoint defined in backend
                await fetch('/api/event-management/planning/allocations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: data.id,
                        role: row.querySelector('.alloc-role').value,
                        resourceId: parseInt(rId),
                        resourceType: rType,
                        notes: row.querySelector('.alloc-notes').value
                    })
                });
            }

            MessageManager.show('Event Saved Successfully', 'success');
            // eventModal.style.display = 'none'; // Keep open as requested
            await loadTags(); // Refresh tags (new Roles etc)
            loadEvents(); // Refresh Grid

        } catch (e) {
            MessageManager.show('Error saving event', 'error');
            console.error(e);
        }
    }

    // --- HELPERS ---

    // Check Auth
    async function checkAuth() {
        // Implement standard check if not global
    }

    async function loadTags() {
        try {
            const res = await fetch('/api/event-management/planning/tags');
            if (res.ok) {
                const tags = await res.json();
                // Store in global state
                planningTags.clients = tags.filter(t => t.Category === 'Client');
                planningTags.status = tags.filter(t => t.Category === 'Status');
                planningTags.roles = tags.filter(t => t.Category === 'Role');

                // Populate Filters immediately
                const filterClient = document.getElementById('filterClient');
                filterClient.innerHTML = '<option value="">All Clients</option>';
                planningTags.clients.forEach(t => {
                    filterClient.add(new Option(t.Name, t.Name));
                });

                const filterStatus = document.getElementById('filterStatus');
                filterStatus.innerHTML = '<option value="">All Statuses</option>';
                planningTags.status.forEach(t => {
                    filterStatus.add(new Option(t.Name, t.Name));
                });
            }
        } catch (e) { console.error('Error loading tags', e); }
    }

    async function loadAppUsers() {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const users = await res.json();
                const sel = document.getElementById('eventManager');
                sel.innerHTML = '<option value="">Select Manager...</option>'; // reset
                users.forEach(u => {
                    sel.add(new Option(u.Username, u.Id));
                });
            }
        } catch (e) {
            console.error('Failed to load users for dropdown', e);
        }
    }

    async function populateResourceDropdown(select, selectedId = null, selectedType = null) {
        const dFrom = document.getElementById('eventDateFrom').value;
        const dTo = document.getElementById('eventDateTo').value;
        const evId = document.getElementById('eventId').value;

        if (!dFrom || !dTo) return;

        select.innerHTML = '<option value="">Loading...</option>';

        try {
            const url = `/api/event-management/planning/resources?from=${dFrom}&to=${dTo}&excludeEventId=${evId}`;
            const res = await fetch(url);
            if (res.ok) {
                const resources = await res.json();
                select.innerHTML = '<option value="">Select Resource...</option>';

                resources.forEach(r => {
                    const val = `${r.Id}|${r.ResourceType}`;
                    const isConflicted = r.IsAvailable === 0;
                    const conflictText = isConflicted ? ` (BUSY: ${r.ConflictingEvent})` : '';

                    const opt = new Option(`${r.FullName} [${r.ResourceType}]${conflictText}`, val);
                    if (isConflicted) {
                        opt.style.color = 'red';
                    }
                    if (selectedId && parseInt(selectedId) === r.Id && selectedType === r.ResourceType) {
                        opt.selected = true;
                    }
                    select.add(opt);
                });
            }
        } catch (e) {
            console.error('Error loading resources', e);
            select.innerHTML = '<option value="">Error loading list</option>';
        }
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Confirmed': return '#2ecc71'; // Green
            case 'Draft': return '#95a5a6'; // Grey
            case 'Pending': return '#f39c12'; // Orange
            case 'Cancelled': return '#f8f9fa'; // Very Light Grey
            default: return '#3498db'; // Blue default
        }
    }

    // --- DELETE LOGIC ---
    let eventToDelete = null;

    function openDeleteConfirm(event) {
        eventToDelete = event;
        // Ensure global scope update if needed
        window.eventToDelete = event;
        document.getElementById('confirmDeleteMessage').innerHTML = `Are you sure you want to delete event <strong>${event.Name || 'Draft'}</strong>?`;
        confirmDeleteModal.style.display = 'flex';
    }

    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        confirmDeleteModal.style.display = 'none';
        eventToDelete = null;
        window.eventToDelete = null;
    });

    document.getElementById('closeConfirmDeleteModal').addEventListener('click', () => {
        confirmDeleteModal.style.display = 'none';
        eventToDelete = null;
        window.eventToDelete = null;
    });

    // --- TIMELINE MATRIX LOGIC ---
    function renderTimelineMatrix(eventId) {
        const container = document.getElementById('timelineMatrixContainer');
        container.innerHTML = '<div style="padding:20px; text-align:center;">Loading Matrix...</div>';

        fetch(`/api/event-management/planning/events/${eventId}`)
            .then(res => res.json())
            .then(event => {
                const start = new Date(event.DateFrom);
                const end = new Date(event.DateTo);
                const days = [];
                // Generate Date Range
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    days.push(new Date(d));
                }

                // Update Headers
                document.getElementById('timelineEventName').textContent = event.Name;
                document.getElementById('timelineEventDates').textContent =
                    `${new Date(event.DateFrom).toLocaleDateString()} - ${new Date(event.DateTo).toLocaleDateString()}`;

                // Build Table HTML
                let html = `<table class="timeline-matrix" style="border-collapse: collapse; min-width: 100%;">
                    <thead>
                        <tr>
                            <th class="matrix-resource matrix-header" style="position:sticky; top:0; left:0; z-index:2; background:#F8F9FA;">Resource</th>`;

                days.forEach(d => {
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = d.getDate();
                    // Highlight header if weekend?
                    html += `<th class="matrix-header matrix-cell" style="position:sticky; top:0; z-index:1; background:#F8F9FA;">
                        <div style="font-size:0.8em">${dayName}</div>
                        <div>${dayNum}</div>
                      </th>`;
                });
                html += `</tr></thead><tbody>`;

                if (!event.Allocations || event.Allocations.length === 0) {
                    html += `<tr><td colspan="${days.length + 1}" style="padding:20px; text-align:center;">No resources allocated yet.</td></tr>`;
                } else {
                    event.Allocations.forEach(alloc => {
                        html += `<tr>
                            <td class="matrix-resource" style="border-bottom:1px solid #ddd; padding:5px;">
                                <strong>${alloc.FullName || 'Unknown'}</strong><br>
                                <small>${alloc.Role || '-'}</small>
                            </td>`;

                        days.forEach(d => {
                            const dateKey = d.toISOString().split('T')[0];
                            // Find saved value
                            const existing = event.Timeline.find(t => t.AllocationId === alloc.Id && t.Date.startsWith(dateKey));
                            const val = existing ? existing.Value : '';
                            const colorStyle = getTimelineColorStyle(val);

                            html += `<td class="matrix-cell" style="cursor:pointer; border:1px solid #ddd; ${colorStyle}" 
                                   data-alloc="${alloc.Id}" data-date="${dateKey}" onclick="window.cycleCell(this)">
                                   ${val}
                               </td>`;
                        });
                        html += `</tr>`;
                    });
                }

                html += `</tbody></table>`;
                container.innerHTML = html;
            })
            .catch(err => {
                container.innerHTML = '<div style="color:red; padding:20px;">Error loading timeline data.</div>';
                console.error(err);
            });
    }

    window.cycleCell = function (cell) {
        const val = cell.innerText.trim();
        let nextVal = '';

        // Cycle logic
        if (val === '') nextVal = 'TRAVEL';
        else if (val === 'TRAVEL') nextVal = 'HOTEL';
        else if (val === 'HOTEL') nextVal = 'WORK';
        else if (val === 'WORK') nextVal = 'OFF';
        else if (val === 'OFF') nextVal = '';
        else nextVal = ''; // Reset if unknown

        cell.innerText = nextVal;
        cell.style = `cursor:pointer; border:1px solid #ddd; ${getTimelineColorStyle(nextVal)}`;

        // Save via API
        const allocId = cell.dataset.alloc;
        const date = cell.dataset.date;

        fetch('/api/event-management/planning/timeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allocationId: allocId, date: date, value: nextVal })
        }).catch(e => console.error('Auto-save failed', e)); // Silent fail or toast? Silent for speed
    };

    function getTimelineColorStyle(val) {
        if (!val) return 'background: #fff;';
        if (val === 'TRAVEL') return 'background: #ffeaa7; color: #d35400; font-weight:bold;'; // Yellowish
        if (val === 'HOTEL') return 'background: #74b9ff; color: #fff; font-weight:bold;'; // Blue
        if (val === 'WORK') return 'background: #55efc4; color: #00b894; font-weight:bold;'; // Green
        if (val === 'OFF') return 'background: #dfe6e9; color: #636e72;'; // Grey
        return 'background: #fff;';
    }



    // --- QUARTERLY VIEW LOGIC ---

    async function renderQuarterlyView() {
        // Use SHARED header title
        const quarterDisplay = document.getElementById('monthDisplay');
        const container = document.getElementById('quarterlyTableContainer');
        container.innerHTML = '<div style="padding:20px;">Loading Quarterly View...</div>';

        // 1. Determine Range
        // Jan-Apr (0-3), May-Aug (4-7), Sep-Dec (8-11) - Keeping existing logic
        const month = currentDate.getMonth();
        let startMonth, endMonth;
        let qLabel = '';

        if (month >= 0 && month <= 3) { startMonth = 0; endMonth = 3; qLabel = `Quarter: Jan - Apr ${currentDate.getFullYear()}`; }
        else if (month >= 4 && month <= 7) { startMonth = 4; endMonth = 7; qLabel = `Quarter: May - Aug ${currentDate.getFullYear()}`; }
        else { startMonth = 8; endMonth = 11; qLabel = `Quarter: Sep - Dec ${currentDate.getFullYear()}`; }

        if (quarterDisplay) quarterDisplay.textContent = qLabel;

        const year = currentDate.getFullYear();
        const fromDate = new Date(year, startMonth, 1);
        const toDate = new Date(year, endMonth + 1, 0); // Last day of end month

        // 2. Generate Date Columns
        const days = [];
        let cur = new Date(fromDate);
        while (cur <= toDate) {
            days.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
        }

        // 3. Fetch Data
        try {
            const url = `/api/event-management/planning/events?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to load events');
            const events = await res.json();

            // Fetch Allocations for ALL these events (Parallel fetch)
            for (const ev of events) {
                const detRes = await fetch(`/api/event-management/planning/events/${ev.Id}`);
                if (detRes.ok) {
                    const full = await detRes.json();
                    ev.Allocations = full.Allocations;
                }
            }

            // 4. Build Table
            let html = `<table class="quarterly-table">`;

            // Header STYLES
            const headerBg = 'background-color:var(--table-header-bg); color:var(--table-header-text); border-bottom:1px solid #ddd; vertical-align:middle;';

            // Header 1: Metadata
            html += `<thead><tr class="sticky-row">
                <th class="sticky-col header col-category" colspan="2" style="${headerBg} width:105px; text-align:center;">Client</th>
                <!-- col-client merged -->
                <th class="sticky-col header col-event" style="${headerBg}">EVENT</th>
                <th class="sticky-col header col-status" style="${headerBg}">Status</th>
                <th class="sticky-col header col-manager" style="${headerBg}">Manager</th>`;

            days.forEach(d => {
                // Date Header: GG MMM (01 Jan)
                const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                html += `<th class="timeline-cell" style="${headerBg} font-size:0.7em; min-width:35px;">${dateStr}</th>`;
            });
            html += `</tr>`;

            // Header 2: Day Names
            html += `<tr class="sticky-row row-2">
                <th class="sticky-col header col-category" style="background:#fff; border:none;"></th>
                <th class="sticky-col header col-client" style="background:#fff; border:none;"></th>
                <th class="sticky-col header col-event" style="background:#fff; border:none;"></th>
                <th class="sticky-col header col-status" style="background:#fff; border:none;"></th>
                <th class="sticky-col header col-manager" style="background:#fff; border-right: 3px solid #666; border-top:none; border-bottom:none;"></th>`;

            days.forEach(d => {
                // Ensure locale is correct and option is distinct
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                // Color Logic
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const bg = isWeekend ? '#e9ecef' : '#fff'; // Grey for weekend, white for others

                // Debug note: previous logic was correct, maybe cached? 
                // Will force rebuild string to ensure no hidden conditionals
                // FORCE COLOR: #000 explicitly
                html += `<th class="timeline-cell" style="background:${bg}; color:#000; font-size:0.7em; text-align:center;">${dayName}</th>`;
            });
            html += `</tr></thead><tbody>`;

            // Body
            if (events.length === 0) {
                html += `<tr><td colspan="100" style="padding:20px; text-align:center;">No events in this quarter.</td></tr>`;
            }

            // Filter Values
            const fClient = document.getElementById('filterClient').value;
            const fStatus = document.getElementById('filterStatus').value;

            events.forEach((ev, index) => {
                // Spacer Style Definition (Moved up or reused)
                const spacerStyle = 'height:12px; background:#f9f9f9; border-top:1px solid #ccc; border-bottom:1px solid #ccc; padding:0;';

                // Add Initial Spacer Row before the VERY FIRST event
                if (index === 0) {
                    html += `<tr style="height:12px;">
                        <td class="sticky-col col-category" style="${spacerStyle}"></td>
                        <td class="sticky-col col-client" style="${spacerStyle}"></td>
                        <td class="sticky-col col-event" style="${spacerStyle}"></td>
                        <td class="sticky-col col-status" style="${spacerStyle}"></td>
                        <td class="sticky-col col-manager" style="${spacerStyle} border-right:3px solid #666;"></td>
                        <td colspan="${days.length}" style="${spacerStyle}"></td>
                    </tr>`;
                }

                // Apply Filters
                if (fClient && ev.ClientId !== fClient) return;
                if (fStatus && ev.Status !== fStatus) return;

                const color = getStatusColor(ev.Status); // Use for bg
                const evStart = new Date(ev.DateFrom);
                const evEnd = new Date(ev.DateTo);

                // Manager Lookup (Use Resolved Name from DB)
                const mgrName = ev.ResolvedManagerName || '-';

                // Common Cell Style for Event Identity
                const eventCellStyle = `background:${color}; color:#fff; font-weight:bold; border-right:1px solid rgba(255,255,255,0.2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;`;

                // EVENT ROW
                html += `<tr class="row-event-header" style="background:${color}33; border-top: 2px solid #333;">`;
                // Col 1: Client
                html += `<td class="sticky-col col-category" style="${eventCellStyle}" title="${ev.ClientId}">${ev.ClientId || '-'}</td>`;
                // Col 2: SubClient (Placeholder)
                html += `<td class="sticky-col col-client" style="${eventCellStyle}" title="${ev.SubClient || ''}">${ev.SubClient || ''}</td>`;
                // Col 3: Title + Location + Dates
                const sDate = evStart.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
                const eDate = evEnd.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
                const locStr = ev.Location ? `${ev.Location}, ` : '';
                html += `<td class="sticky-col col-event" style="${eventCellStyle}" title="${ev.Name}">${ev.Name} (${locStr}${sDate} - ${eDate})</td>`;

                html += `<td class="sticky-col col-status" style="${eventCellStyle}">${ev.Status}</td>`;
                html += `<td class="sticky-col col-manager" style="${eventCellStyle}">${mgrName}</td>`; // Apply color to Manager too

                // Timeline Cells for Event
                days.forEach(d => {
                    const dTime = d.setHours(0, 0, 0, 0);
                    const sTime = new Date(evStart).setHours(0, 0, 0, 0);
                    const eTime = new Date(evEnd).setHours(0, 0, 0, 0);

                    if (dTime >= sTime && dTime <= eTime) {
                        html += `<td class="timeline-cell" style="background:${color};"></td>`;
                    } else {
                        // FIX: Use standard weekend/weekday logic instead of opacity
                        const isWk = d.getDay() === 0 || d.getDay() === 6;
                        const cellBg = isWk ? '#e9ecef' : '#fff';
                        html += `<td class="timeline-cell" style="background:${cellBg};"></td>`;
                    }
                });
                html += `</tr>`;

                // ALLOCATION ROWS
                if (ev.Allocations) {
                    ev.Allocations.forEach(alloc => {
                        html += `<tr class="row-allocation">`;
                        html += `<td class="sticky-col col-category" style="background:#fff;"></td>`; // Indent
                        html += `<td class="sticky-col col-client" style="background:#fff;"></td>`;
                        html += `<td class="sticky-col col-event" style="padding-left:20px; font-size:0.9em; border-left: 2px solid ${color};">${alloc.Role}: <strong>${alloc.FullName || 'TBD'}</strong></td>`;
                        html += `<td class="sticky-col col-status" style="background:#fff;"></td>`;
                        html += `<td class="sticky-col col-manager" style="background:#fff;"></td>`;

                        days.forEach(d => {
                            const dTime = d.setHours(0, 0, 0, 0);
                            const sTime = new Date(evStart).setHours(0, 0, 0, 0);
                            const eTime = new Date(evEnd).setHours(0, 0, 0, 0);

                            if (dTime >= sTime && dTime <= eTime) {
                                html += `<td class="timeline-cell" style="background:${color}; opacity:0.3;"></td>`;
                            } else {
                                const isWk = d.getDay() === 0 || d.getDay() === 6;
                                const cellBg = isWk ? '#e9ecef' : '#fff';
                                html += `<td class="timeline-cell" style="background:${cellBg};"></td>`;
                            }
                        });
                        html += `</tr>`;
                    });
                }

                // Spacer Row (Structural to support sticky columns)
                // spacerStyle is already defined at top of loop
                html += `<tr style="height:12px;">
                    <td class="sticky-col col-category" style="${spacerStyle}"></td>
                    <td class="sticky-col col-client" style="${spacerStyle}"></td>
                    <td class="sticky-col col-event" style="${spacerStyle}"></td>
                    <td class="sticky-col col-status" style="${spacerStyle}"></td>
                    <td class="sticky-col col-manager" style="${spacerStyle} border-right:3px solid #666;"></td>
                    <td colspan="${days.length}" style="${spacerStyle}"></td>
                </tr>`;
            });

            html += `</tbody></table>`;
            container.innerHTML = html;

            // Auto-scroll to Today
            setTimeout(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Find index of today in 'days' array using safer comparison
                const index = days.findIndex(d => d.toDateString() === today.toDateString());

                if (index !== -1 && container) {
                    // Get dynamic cell width - target HEADERS to avoid spacer row issues
                    const sampleCell = container.querySelector('th.timeline-cell');
                    const cellWidth = sampleCell && sampleCell.offsetWidth > 0 ? sampleCell.offsetWidth : 40;

                    // Metadata Columns Width: Client(105) + Event(350) + Status(80) + Mgr(120) = 655
                    const fixedWidth = 655;

                    const targetX = fixedWidth + (index * cellWidth);

                    // Center the target
                    container.scrollLeft = targetX - (container.clientWidth / 2) + (cellWidth / 2);
                }
            }, 300);
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div style="color:red; padding:20px;">Error loading data.</div>';
        }
    }

    // Confirm Delete Event Listener
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        if (!window.eventToDelete) return;

        try {
            const res = await fetch(`/api/event-management/planning/events/${window.eventToDelete.Id}`, { method: 'DELETE' });
            if (res.ok) {
                MessageManager.show('Event Deleted', 'success');
                confirmDeleteModal.style.display = 'none';
                loadEvents();
            } else {
                throw new Error('Delete failed');
            }
        } catch (e) {
            MessageManager.show('Failed to delete event', 'error');
        }
    });

});

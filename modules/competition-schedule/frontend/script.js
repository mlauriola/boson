document.addEventListener('DOMContentLoaded', () => {
    loadActiveSchedule();
});

// --- Data Loading ---
// Initialize view from URL "view" param, default to 'list'
const urlParams = new URLSearchParams(window.location.search);
let currentView = urlParams.get('view') || 'list'; // 'list', 'daily', 'session'
let globalSessionData = []; // Store full dataset for pivoting

// Helper to update page info
function updatePageInfo(view) {
    const titles = {
        'list': { title: 'Competition Schedule - Table View', desc: 'View the complete competition schedule in a detailed table format.' },
        'daily': { title: 'Competition Schedule - Daily View', desc: 'Detailed daily schedule matrix.' },
        'session': { title: 'Competition Schedule - Session View', desc: 'Detailed session schedule matrix.' }
    };
    const info = titles[view] || titles['list'];

    // Update global vars usually picked up by layout
    window.PAGE_TITLE = info.title;
    window.PAGE_DESCRIPTION = info.desc;

    // Direct DOM update if elements exist (common pattern in this app)
    const titleEl = document.querySelector('.header-title');
    const descEl = document.querySelector('.message-content');
    if (titleEl) titleEl.textContent = info.title;
    if (descEl) descEl.textContent = info.desc;
}

// Initial Update
updatePageInfo(currentView);


async function loadActiveSchedule() {
    const tbody = document.querySelector('#scheduleTable tbody');
    const indicator = document.getElementById('loadingIndicator');

    if (!tbody) return;

    if (indicator) indicator.style.display = 'block';
    if (window.MessageManager) MessageManager.showLoading('Loading active schedule data...');

    tbody.innerHTML = ''; // Clear current

    try {
        const response = await fetch('/api/schedule/active');
        if (!response.ok) throw new Error('Failed to load active schedule');

        const sessions = await response.json();
        renderTable(sessions);
        if (window.MessageManager) MessageManager.clear();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">Error: ${err.message}</td></tr>`;
        if (window.MessageManager) MessageManager.show('Error loading schedule: ' + err.message, 'error');
    } finally {
        if (indicator) indicator.style.display = 'none';
    }
}

function renderTable(sessions) {
    // Capture Data for Pivoting
    globalSessionData = sessions;

    const tableHandler = document.querySelector('#scheduleTable');
    if (!tableHandler) return;

    // Dispatcher
    if (currentView !== 'list') {
        renderMatrixView(currentView);
        return;
    }

    // Cleanup Matrix View if exists
    const matrix = document.querySelector('.matrix-container');
    if (matrix) matrix.remove();
    tableHandler.style.display = ''; // Show table

    // Restore table-responsive for List View
    if (tableHandler.parentNode) {
        tableHandler.parentNode.classList.add('table-responsive');
    }

    tableHandler.classList.add('ultra-compact');

    // Clear existing content
    tableHandler.innerHTML = '';

    if (sessions.length === 0) {
        tableHandler.innerHTML = '<tbody><tr><td class="text-center text-muted p-3">No sessions found in this version.</td></tr></tbody>';
        return;
    }

    // --- Tab Logic ---
    // 1. Extract unique SheetNames
    const sheets = [...new Set(sessions.map(s => s.SheetName).filter(Boolean))];

    // 2. Determine Active Sheet (default to first)
    const activeSheet = window.currentSheet || sheets[0];

    // 3. Render Tabs
    const tabsContainer = document.getElementById('sheetTabs');
    if (tabsContainer && sheets.length > 0) {
        tabsContainer.innerHTML = '';
        sheets.forEach(sheet => {
            const btn = document.createElement('button');
            btn.className = `btn btn-sm mr-1 ${sheet === activeSheet ? 'btn-primary' : 'btn-light'}`;
            btn.textContent = sheet;
            btn.onclick = () => {
                window.currentSheet = sheet;
                renderTable(sessions); // Re-render with filter
            };
            tabsContainer.appendChild(btn);
        });
    }

    // 4. Filter Data by Active Sheet
    const filteredSessions = sessions.filter(s => s.SheetName === activeSheet);

    // Update Title Display
    const titleEl = document.getElementById('sheetTitleDisplay');
    if (titleEl) {
        // Use title from first row of filtered data, or fallback to SheetName
        titleEl.textContent = filteredSessions[0]?.SheetTitle || activeSheet;
    }

    if (filteredSessions.length === 0) {
        tableHandler.innerHTML = '<tbody><tr><td class="text-center text-muted p-3">No sessions found for this sheet.</td></tr></tbody>';
        return;
    }

    // Determine Columns
    // Prefer JsonData headers if available
    let headers = [];
    let rowsData = [];

    // Check first item of FILTERED list for JsonData
    if (filteredSessions[0].JsonData) {
        try {
            const allKeys = new Set();

            rowsData = filteredSessions.map(s => {
                try {
                    const d = JSON.parse(s.JsonData);
                    Object.keys(d).forEach(k => allKeys.add(k));
                    return d;
                } catch (e) {
                    console.error("JSON Parse error", e);
                    return {};
                }
            });
            headers = Array.from(allKeys);
        } catch (e) {
            console.error("Error preparing JSON data", e);
        }
    } else {
        // Fallback to legacy columns
        headers = ['Sheet', 'Date', 'Time', 'Activity', 'Location', 'Venue', 'Code'];
        rowsData = filteredSessions;
    }

    // Build Header
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');

    // Add Row Number Header
    const thNum = document.createElement('th');
    thNum.textContent = '#';
    thNum.className = 'excel-row-head'; // Apply shared class
    trHead.appendChild(thNum);

    headers.forEach(h => {
        const th = document.createElement('th');
        // Strip unique suffix for display (e.g. "Start_2" -> "Start")
        th.textContent = h.replace(/_\d+$/, '');
        // th.style.whiteSpace = 'nowrap'; // handled by CSS
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    tableHandler.appendChild(thead);

    // Build Body
    const tbody = document.createElement('tbody');
    rowsData.forEach((row, idx) => {
        const tr = document.createElement('tr');

        // Add Row Number Cell
        const tdNum = document.createElement('td');
        const session = filteredSessions[idx];
        tdNum.textContent = session.RowIndex || (idx + 1);
        tdNum.className = 'excel-row-head'; // Apply shared class

        // Remove manual styles that are now in CSS class
        // tdNum.style.fontWeight = 'bold';
        // tdNum.style.backgroundColor = '#f8f9fa';
        // tdNum.style.borderRight = '2px solid #dee2e6';

        tr.appendChild(tdNum);

        headers.forEach(h => {
            const td = document.createElement('td');
            // Data is now likely { v: "...", bg: "#..." } or legacy
            let cellData = row[h];
            let val = '';
            let bg = null;
            let color = null;

            if (cellData && typeof cellData === 'object' && 'v' in cellData) {
                // New Rich Format
                val = cellData.v;
                bg = cellData.bg;
                color = cellData.c;
            } else {
                // Legacy / Fallback
                val = cellData;
            }

            // Stringify if strictly object (shouldn't happen with new backend format)
            if (typeof val === 'object' && val !== null) val = JSON.stringify(val);

            // Format Dates if ISO string detected (simple check)
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
                try {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                        // Extract only Time HH:mm, forcing UTC to avoid timezone shifts (e.g. +1h in CET)
                        val = d.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'UTC'
                        });
                    }
                } catch (e) { }
            }

            // Format "1899-12-30..." common excel date base? handled by above regex roughly.

            td.innerHTML = (val !== null && val !== undefined) ? val : '';

            // Excel-like styling: Ultra Compact
            td.style.padding = '1px 3px'; // Very tight
            td.style.border = '1px solid #d0d0d0';
            td.style.fontSize = '11px';
            td.style.fontFamily = 'Calibri, Arial, sans-serif';
            td.style.lineHeight = '14px'; // Fixed low line-height
            td.style.height = 'auto';
            td.style.whiteSpace = 'nowrap';
            td.style.overflow = 'hidden';
            td.style.textOverflow = 'ellipsis';
            td.style.maxWidth = '150px';

            // Apply Background Color
            if (bg) {
                td.style.backgroundColor = bg;
                // Simple contrast check (if dark bg, white text)
                // Rough heuristic: if bg hex starts with #4 or less? 
                // Let's stick to black text unless user complains about contrast.
            }

            // Apply Font Color
            if (color) {
                td.style.color = color;
            }

            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    tableHandler.appendChild(tbody);
    console.log("Rendered Table w/ Ultra Compact V4");
}

// Helpers
function formatExcelDate(excelDate) {
    if (!excelDate) return '';
    if (excelDate.includes('T')) {
        return new Date(excelDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    }
    return excelDate;
}

function formatTime(excelDate) {
    if (!excelDate) return '';
    if (excelDate.includes('T')) {
        return new Date(excelDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return '';
}

// --- View Switching ---
window.switchView = function (viewName) {
    currentView = viewName;
    updatePageInfo(viewName);

    // Update Buttons
    document.querySelectorAll('.btn-group .btn').forEach(b => {
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-outline-primary');
    });

    const activeBtnId = viewName === 'list' ? 'btnViewList' : (viewName === 'daily' ? 'btnViewDaily' : 'btnViewSession');
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
        activeBtn.classList.remove('btn-outline-primary');
        activeBtn.classList.add('btn-primary', 'active');
    }

    // Toggle Sheet Tabs Visibility (Only relevant for List View)
    const tabs = document.getElementById('sheetTabs');
    if (tabs) tabs.style.display = viewName === 'list' ? 'block' : 'none';

    // Toggle Title
    const title = document.getElementById('sheetTitleDisplay');
    if (title) title.style.display = viewName === 'list' ? 'block' : 'none';

    // Re-render
    renderTable(globalSessionData);
}

// --- Matrix Rendering Logic ---
function renderMatrixView(mode) {
    const tableHandler = document.querySelector('#scheduleTable');

    // Cleanup existing matrix to prevent duplicates
    const existing = document.querySelector('.matrix-container');
    if (existing) existing.remove();

    // Disable outer scrolling (table-responsive) to prevent double scrollbars
    if (tableHandler.parentNode) {
        tableHandler.parentNode.classList.remove('table-responsive');
    }

    tableHandler.innerHTML = '';
    // Use standard Bootstrap classes + matrix specific generic class
    tableHandler.className = 'table table-bordered table-hover matrix-table';

    // 1. Pivot Data
    // Rows: Activity + Venue
    // Cols: SheetName (Date)

    // Extract unique dates (Sheets) sorted
    const uniqueDates = [...new Set(globalSessionData.map(s => s.SheetName).filter(Boolean))].sort();

    // Group Data
    const pivotData = {}; // Key: "Activity|Venue" -> { activity, venue, days: { Date: Val } }

    globalSessionData.forEach(s => {
        let jsonData = {};
        if (s.JsonData) {
            try { jsonData = JSON.parse(s.JsonData); } catch (e) { }
        }

        // Find Activity and Venue
        // We look for column names containing keys, or fallback output of unique suffix strip
        const keys = Object.keys(jsonData);

        // Helper to find key roughly matching name
        const findKey = (patterns) => keys.find(k => patterns.some(p => new RegExp(p, 'i').test(k)));

        const activityKey = findKey(['activity', 'task', 'description']) || 'Activity';
        const venueKey = findKey(['venue', 'location']) || 'Venue';
        const startKey = findKey(['^start']) || 'Start';
        const endKey = findKey(['end', 'finish']) || 'End';
        // STRICT RSC KEY: Only "RSC" or "Code". 
        // Do NOT use findKey because it matches "Location Code".
        let rscKey = keys.find(k => k === 'RSC') || keys.find(k => k === 'Code');


        // Extract value (could be object {v, bg})
        const getV = (k) => {
            const cell = jsonData[k];
            if (cell && typeof cell === 'object' && cell.v !== undefined) return cell.v;
            return cell;
        };

        const activity = getV(activityKey) || 'Unknown Activity';
        const venue = getV(venueKey) || '';
        const sheet = s.SheetName;
        const rscVal = getV(rscKey);
        // Highlight logic: if value exist and is not empty string
        const hasRsc = (rscVal !== null && rscVal !== undefined && String(rscVal).trim() !== '');

        const key = `${activity}|${venue}`;
        if (!pivotData[key]) {
            pivotData[key] = { activity, venue, days: {} };
        }

        // Calculate Cell Value
        let displayVal = 'X';
        if (mode === 'session') {
            let start = getV(startKey);
            let end = getV(endKey);

            // Format Times
            const fmtTime = (t) => {
                if (!t) return '';
                if (typeof t === 'string' && t.includes('T')) {
                    try { return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }); } catch (e) { }
                }
                return t;
            };

            start = fmtTime(start);
            end = fmtTime(end);

            if (start) {
                displayVal = start;
                if (end) displayVal += ` - ${end}`;
            } else {
                displayVal = ''; // No time?
            }
        }

        // Append if exists (multiple sessions per day)
        // Store object { text, hasRsc } instead of string
        if (pivotData[key].days[sheet]) {
            // Only append new line if it's Session View (Times). 
            // For Daily View ('X'), one X is enough.
            if (mode === 'session') {
                pivotData[key].days[sheet].text += `\n${displayVal}`;
            }
            pivotData[key].days[sheet].hasRsc = pivotData[key].days[sheet].hasRsc || hasRsc;
        } else {
            pivotData[key].days[sheet] = { text: displayVal, hasRsc: hasRsc };
        }
    });

    // 2. Render HTML
    // Wrapper for sticky behaviors
    const container = document.createElement('div');
    container.className = 'matrix-container';

    const table = document.createElement('table');
    table.className = 'table table-bordered table-hover matrix-table';

    // Header
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    tr.innerHTML = `<th class="sticky-col">Activity / Task Description</th>`;
    uniqueDates.forEach(d => {
        tr.innerHTML += `<th>${d}</th>`;
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');

    // Sort Rows by Activity
    Object.values(pivotData).sort((a, b) => String(a.activity).localeCompare(String(b.activity))).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="sticky-col">
          <strong>${row.activity}</strong>
        </td>`;

        uniqueDates.forEach(d => {
            const cellObj = row.days[d];
            if (cellObj) {
                // Determine class
                let cls = mode === 'session' ? 'matrix-cell-time' : 'matrix-cell-x';

                // Check RSC trigger
                if (cellObj.hasRsc && mode === 'session') {
                    // Use GLOBAL BRAND CLASS as requested
                    cls += ' bg-brand-secondary';
                }
                tr.innerHTML += `<td class="${cls}">${cellObj.text.replace(/\n/g, '<br>')}</td>`;
            } else {
                tr.innerHTML += `<td></td>`;
            }
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // Inject (replacing clear content)
    tableHandler.parentNode.insertBefore(container, tableHandler);
    tableHandler.style.display = 'none'; // Hide original table element to avoid conflict
}

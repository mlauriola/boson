document.addEventListener('DOMContentLoaded', () => {
    loadActiveSchedule();
});

// --- Data Loading ---

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
    const tbody = document.querySelector('#scheduleTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No sessions found in this version.</td></tr>';
        return;
    }

    sessions.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge badge-light border" style="padding: 5px 10px; border-radius: 4px; display: inline-block;">${s.SheetName || '-'}</span></td>
            <td>${formatExcelDate(s.StartTime)}</td>
            <td>${formatTime(s.StartTime)} - ${formatTime(s.EndTime)}</td>
            <td class="font-weight-bold">${s.Activity || ''}</td>
            <td>${s.Location || ''} <small class="text-muted">(${s.LocationCode || ''})</small></td>
            <td>${s.Venue || ''}</td>
            <td><code>${s.SessionCode || ''}</code></td>
        `;
        tbody.appendChild(tr);
    });
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

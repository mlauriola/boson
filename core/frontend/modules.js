document.addEventListener('DOMContentLoaded', () => {
    // Initialize MessageManager
    if (window.MessageManager) {
        MessageManager.init('messageArea');
    }
    checkAuthentication();
});

let originalModules = {};
let currentModules = {};

async function checkAuthentication() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();

        if (!data.authenticated) {
            window.location.href = '/login.html';
            return;
        }

        if (data.roleId !== 1) {
            // Only admin can access this page
            window.location.href = '/index.html';
            return;
        }

        // Initialize header and sidebar
        if (typeof initHeader === 'function') initHeader(data);
        if (typeof initSidebar === 'function') initSidebar('modules');

        // Load modules
        loadModules();
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login.html';
    }
}

async function loadModules() {
    try {
        const response = await fetch('/api/modules');
        if (!response.ok) throw new Error('Failed to fetch modules');

        const modules = await response.json();
        // Deep copy for comparison
        originalModules = JSON.parse(JSON.stringify(modules));
        currentModules = JSON.parse(JSON.stringify(modules));

        renderModulesTable(currentModules);
        updateSaveButton();
    } catch (error) {
        console.error('Error loading modules:', error);
        const tbody = document.getElementById('modulesTableBody');
        tbody.innerHTML = `<tr><td colspan="5" class="error-message">Error loading modules: ${error.message}</td></tr>`;
    }
}

function renderModulesTable(modules) {
    const tbody = document.getElementById('modulesTableBody');
    tbody.innerHTML = '';

    Object.entries(modules).forEach(([key, module]) => {
        if (key === 'core') return;
        const tr = document.createElement('tr');

        const isCore = key === 'core';
        const badgeClass = isCore ? 'badge-core' : 'badge-module';
        const roleAccess = module.roleAccess ? module.roleAccess.join(', ') : 'All';

        // Check if modified
        const isModified = originalModules[key] && originalModules[key].enabled !== module.enabled;

        tr.innerHTML = `
            <td>
                <strong>${key}</strong>
                <span class="badge ${badgeClass}">${isCore ? 'System' : 'Module'}</span>
                ${isModified ? '<span class="badge badge-warning" style="margin-left:5px; background:#ffc107; color:#212529;">Modified</span>' : ''}
            </td>
            <td>${module.description || ''}</td>
            <td><code>${module.path}</code></td>
            <td>${roleAccess}</td>
            <td>
                <label class="switch">
                    <input type="checkbox" 
                        ${module.enabled ? 'checked' : ''} 
                        ${isCore ? 'disabled' : ''}
                        onchange="toggleModuleLocal('${key}', this.checked)">
                    <span class="slider"></span>
                </label>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function toggleModuleLocal(key, enabled) {
    if (currentModules[key]) {
        currentModules[key].enabled = enabled;
        renderModulesTable(currentModules);
        updateSaveButton();
    }
}

function updateSaveButton() {
    const saveBtn = document.getElementById('saveChangesBtn');
    const hasChanges = JSON.stringify(originalModules) !== JSON.stringify(currentModules);
    saveBtn.disabled = !hasChanges;
}

function showConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    const changesList = document.getElementById('changesList');

    let changesHtml = '<ul style="list-style: none; padding: 0; margin: 0;">';
    let changeCount = 0;

    Object.keys(currentModules).forEach(key => {
        if (currentModules[key].enabled !== originalModules[key].enabled) {
            const action = currentModules[key].enabled ? 'Enable' : 'Disable';
            const color = currentModules[key].enabled ? 'green' : 'red';
            changesHtml += `<li style="padding: 5px 0; border-bottom: 1px solid #eee;">
        <strong>${key}</strong>: <span style="color: ${color}; font-weight: bold;">${action}</span>
      </li>`;
            changeCount++;
        }
    });

    changesHtml += '</ul>';

    if (changeCount === 0) return; // Should not happen if button is enabled

    changesList.innerHTML = changesHtml;
    modal.style.display = 'flex';
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

async function saveChanges() {
    // alert('Debug: saveChanges called'); // Uncomment for debugging
    console.log('saveChanges called');
    const btn = document.querySelector('#confirmationModal .btn-primary');
    if (!btn) {
        alert('Error: Save button not found');
        return;
    }
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Saving...';

    try {
        console.log('Sending PUT request to /api/modules');
        const response = await fetch('/api/modules', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modules: currentModules })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update modules');
        }

        const result = await response.json();

        // Close modal
        closeConfirmationModal();

        // Show success message (could be a toast, but alert is fine for now as we reload)
        // alert(result.message);

        // Reload to reflect changes and server restart
        // Give server a moment to restart
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error updating modules:', error);
        alert(`Error: ${error.message}`);
        btn.disabled = false;
        btn.innerText = originalText;
        closeConfirmationModal();
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('confirmationModal');
    if (event.target == modal) {
        closeConfirmationModal();
    }
}

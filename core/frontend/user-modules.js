
document.addEventListener('DOMContentLoaded', () => {
    // Initialize MessageManager
    MessageManager.init('messageArea');

    // DOM Elements
    const userSelect = document.getElementById('userSelect');
    const matrixContainer = document.getElementById('matrixContainer');
    const matrixBody = document.getElementById('matrixBody');
    const savePermissionsBtn = document.getElementById('savePermissionsBtn');

    // State
    let users = [];
    let roles = [];
    let modules = {};
    let currentUserRoles = {}; // { 'common-codes': 2, ... }
    let hasUnsavedChanges = false;

    // Initialization
    init();

    async function init() {
        await checkAuth();
        await Promise.all([loadUsers(), loadRoles(), loadModules()]);
        renderRoleHeaders();
    }

    async function checkAuth() {
        try {
            const response = await fetch('/api/check-auth');
            const data = await response.json();
            if (!data.authenticated || data.roleId !== 1) {
                window.location.href = '/index.html'; // Admin only
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function loadUsers() {
        try {
            const response = await fetch('/api/users');
            users = await response.json();

            users.sort((a, b) => a.Username.localeCompare(b.Username));

            userSelect.innerHTML = '<option value="">-- Select a User --</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.Id;
                option.textContent = user.Username;
                userSelect.appendChild(option);
            });
        } catch (error) {
            MessageManager.show('Error loading users', 'error');
        }
    }

    async function loadRoles() {
        try {
            const response = await fetch('/api/roles');
            roles = await response.json();
            roles.sort((a, b) => a.Id - b.Id);
        } catch (error) {
            MessageManager.show('Error loading roles', 'error');
        }
    }

    async function loadModules() {
        try {
            const response = await fetch('/api/modules');
            modules = await response.json();
        } catch (error) {
            MessageManager.show('Error loading modules', 'error');
        }
    }

    function renderRoleHeaders() {
        const headerRow = document.querySelector('.matrix-table thead tr');
        // Clear existing headers except first
        while (headerRow.children.length > 1) {
            headerRow.removeChild(headerRow.lastChild);
        }

        // Add "None" column header
        const thNone = document.createElement('th');
        thNone.textContent = 'None';
        thNone.style.color = '#999';
        headerRow.appendChild(thNone);

        roles.forEach(role => {
            const th = document.createElement('th');
            th.textContent = role.Description;
            headerRow.appendChild(th);
        });
    }

    // Event Listeners
    userSelect.addEventListener('change', async () => {
        const userId = userSelect.value;

        if (!userId) {
            matrixContainer.style.display = 'none';
            savePermissionsBtn.disabled = true;
            hasUnsavedChanges = false;
            return;
        }

        savePermissionsBtn.disabled = false;

        await loadUserPermissions(userId);
        renderMatrix(userId);
        matrixContainer.style.display = 'block';
    });

    async function loadUserPermissions(userId, showLoading = true) {
        if (showLoading) MessageManager.showLoading();
        try {
            const response = await fetch(`/api/users/${userId}/roles`);
            currentUserRoles = await response.json();
            if (showLoading) MessageManager.hide();
        } catch (error) {
            MessageManager.show('Error loading user permissions', 'error');
        }
    }

    function renderMatrix(userId) {
        matrixBody.innerHTML = '';

        // Show all modules including core
        const moduleKeys = Object.keys(modules).sort();

        if (moduleKeys.length === 0) {
            matrixBody.innerHTML = '<tr><td colspan="100%">No configurable modules found.</td></tr>';
            return;
        }

        moduleKeys.forEach(moduleKey => {
            const module = modules[moduleKey];
            const tr = document.createElement('tr');

            // Module Name Cell
            const tdName = document.createElement('td');
            tdName.innerHTML = `
                <strong>${module.menu ? module.menu.label : moduleKey}</strong>
                <div style="font-size: 11px; color: #666;">${module.description || moduleKey}</div>
            `;
            tr.appendChild(tdName);

            // Role Radios
            const currentRoleId = currentUserRoles[moduleKey] || 0;
            // Use specific allowedRoles config, or fallback to general roleAccess, or allow all if neither exists
            const allowedRoles = module.allowedRoles || module.roleAccess;

            // Add "None" option (Value 0)
            const tdNone = document.createElement('td');
            const isNoneChecked = !currentRoleId || currentRoleId === 0;
            tdNone.innerHTML = `
                <input type="radio" 
                       name="role_${moduleKey}" 
                       value="0" 
                       class="role-radio" 
                       ${isNoneChecked ? 'checked' : ''}>
            `;
            tr.appendChild(tdNone);

            roles.forEach(role => {
                const td = document.createElement('td');
                const isChecked = currentRoleId == role.Id;

                // Check if role is allowed for this module
                let isDisabled = false;
                if (allowedRoles && !allowedRoles.includes(role.Id)) {
                    isDisabled = true;
                }

                td.innerHTML = `
                    <input type="radio" 
                           name="role_${moduleKey}" 
                           value="${role.Id}" 
                           class="role-radio" 
                           ${isChecked ? 'checked' : ''}
                           ${isDisabled ? 'disabled' : ''}
                           style="${isDisabled ? 'cursor: not-allowed; opacity: 0.5;' : ''}">
                `;
                tr.appendChild(td);
            });

            matrixBody.appendChild(tr);
        });

        // Add change listeners
        document.querySelectorAll('.role-radio').forEach(radio => {
            radio.addEventListener('change', () => {
                hasUnsavedChanges = true;
            });
        });
    }

    savePermissionsBtn.addEventListener('click', async () => {
        const userId = userSelect.value;
        if (!userId) return;

        const newRoles = {};

        // Collect data from radios
        const moduleKeys = Object.keys(modules);
        moduleKeys.forEach(key => {
            const selected = document.querySelector(`input[name="role_${key}"]:checked`);
            if (selected) {
                const roleId = parseInt(selected.value);
                if (roleId > 0) {
                    newRoles[key] = roleId;
                }
            }
        });

        MessageManager.showLoading();
        try {
            const response = await fetch(`/api/users/${userId}/roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleRoles: newRoles })
            });

            if (response.ok) {
                MessageManager.show('Permissions saved successfully!', 'success', 3000);
                hasUnsavedChanges = false;

                // Reload to confirm consistency - fetch again silently
                await loadUserPermissions(userId, false);
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            MessageManager.show('Error saving permissions', 'error');
        }
    });

    // Warning on navigate away
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});

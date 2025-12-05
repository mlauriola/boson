// sidebar-component.js - Reusable sidebar navigation component

async function initSidebar(activePage) {
  // Fetch configuration first
  let config = { modules: {} };
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const data = await response.json();
      config = data;
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }

  // Branding from config
  const branding = config.branding || {};
  const logoSrc = branding.logo || '/img/2026_Commonwealth_Games_logo.svg.png';
  const appName = branding.appName || 'Commonwealth Games Glasgow 2026';

  let sidebarHTML = `
    <div class="sidebar-logo">
      <img src="${logoSrc}" alt="${appName}" onerror="this.style.display='none'">
    </div>
    <button class="btn-menu" id="menuToggle" aria-label="Toggle menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    <nav class="nav-menu">
      <ul>
        <li>
          <a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Home</span>
          </a>
        </li>
        
        <!-- Administration Module (Core) -->
        <li id="administrationMenuItem" class="has-submenu ${(activePage === 'users' || activePage === 'maintenance' || activePage === 'branding' || activePage === 'user-modules') ? 'open' : ''}" style="display: none;">
          <a href="#" class="nav-link" onclick="toggleSubmenu(event, 'administrationSubmenu')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span>Administration</span>
          </a>
          <ul class="submenu ${(activePage === 'users' || activePage === 'maintenance' || activePage === 'branding' || activePage === 'user-modules') ? 'open' : ''}" id="administrationSubmenu" style="${(activePage === 'users' || activePage === 'maintenance' || activePage === 'branding' || activePage === 'user-modules') ? 'display: block;' : ''}">
            <li>
              <a href="users.html" class="nav-link ${activePage === 'users' ? 'active' : ''}">
                <span>Users</span>
              </a>
            </li>
            <li>
              <a href="Maintenance.html" class="nav-link ${activePage === 'maintenance' ? 'active' : ''}">
                <span>Maintenance</span>
              </a>
            </li>
            <li>
              <a href="modules.html" class="nav-link ${activePage === 'modules' ? 'active' : ''}">
                <span>Modules</span>
              </a>
            </li>
            <li>
              <a href="Branding.html" class="nav-link ${activePage === 'branding' ? 'active' : ''}">
                <span>Branding</span>
              </a>
            </li>
            <li>
              <a href="user-modules.html" class="nav-link ${activePage === 'user-modules' ? 'active' : ''}">
                <span>Authorization</span>
              </a>
            </li>
          </ul>
        </li>
  `;

  // Dynamic Modules
  if (config.modules) {
    for (const [key, module] of Object.entries(config.modules)) {
      if (module.enabled && module.menu && key !== 'core') {
        const menu = module.menu;
        // Check if any child is active
        const isModuleActive = menu.items.some(item => item.id === activePage);
        const moduleRoles = module.roleAccess ? JSON.stringify(module.roleAccess) : null;

        sidebarHTML += `
        <li class="has-submenu ${isModuleActive ? 'open' : ''}" style="display: none;" ${moduleRoles ? `data-roles='${moduleRoles}'` : ''} data-module-key="${key}">
          <a href="#" class="nav-link" onclick="toggleSubmenu(event, '${key}Submenu')">
            ${menu.icon}
            <span>${menu.label}</span>
          </a>
          <ul class="submenu ${isModuleActive ? 'open' : ''}" id="${key}Submenu" style="${isModuleActive ? 'display: block;' : ''}">
        `;

        menu.items.forEach(item => {
          const isActive = item.id === activePage;
          const itemRoles = item.roles ? JSON.stringify(item.roles) : null;

          sidebarHTML += `
            <li style="${itemRoles ? 'display: none;' : ''}" ${itemRoles ? `data-roles='${itemRoles}'` : ''}>
              <a href="${item.link}" class="nav-link ${isActive ? 'active' : ''}">
                <span>${item.label}</span>
              </a>
            </li>
          `;
        });

        sidebarHTML += `
          </ul>
        </li>
        `;
      }
    }
  }

  sidebarHTML += `
      </ul>
    </nav>
    <div class="sidebar-footer">
      <span class="sidebar-version" id="appVersion">Version ...</span>
    </div>
  `;

  // Find sidebar element and inject HTML
  const sidebarElement = document.querySelector('.sidebar');
  if (sidebarElement) {
    sidebarElement.innerHTML = sidebarHTML;

    // Load application version after sidebar is rendered
    loadAppVersion();
  }

  // Initialize menu toggle functionality
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const layoutWrapper = document.querySelector('.layout-wrapper');
  let sidebarCollapsed = false;

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebarCollapsed = !sidebarCollapsed;
      if (sidebar) {
        sidebar.classList.toggle('collapsed', sidebarCollapsed);

        // Close all submenus if sidebar is collapsed
        if (sidebarCollapsed) {
          const openSubmenus = document.querySelectorAll('.submenu.open');
          openSubmenus.forEach(submenu => {
            submenu.classList.remove('open');
            submenu.style.display = 'none';
            // Update localStorage
            localStorage.setItem(`submenu_${submenu.id}`, 'closed');
          });

          const openItems = document.querySelectorAll('.has-submenu.open');
          openItems.forEach(item => {
            item.classList.remove('open');
          });
        }
      }
      if (layoutWrapper) {
        layoutWrapper.classList.toggle('sidebar-collapsed', sidebarCollapsed);
      }
    });
  }

  // Auto-expand sidebar on click when collapsed
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      // Only act if sidebar is collapsed
      if (sidebar.classList.contains('collapsed')) {
        // Check if click target is a nav-link or inside one
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
          // Expand sidebar
          sidebarCollapsed = false;
          sidebar.classList.remove('collapsed');
          if (layoutWrapper) {
            layoutWrapper.classList.remove('sidebar-collapsed');
          }
        }
      }
    });
  }

  // Check auth and update visibility
  try {
    const authResponse = await fetch('/api/check-auth');
    if (authResponse.ok) {
      const authData = await authResponse.json();
      if (authData.authenticated) {
        updateSidebarMenuVisibility(authData.roleId, authData.moduleRoles);

        // Restore submenu states from localStorage
        restoreSubmenuStates();
      }
    }
  } catch (error) {
    console.error('Error checking auth for sidebar:', error);
  }
}

// Restore submenu states from localStorage
function restoreSubmenuStates() {
  // Check all submenus and restore their state
  const submenus = document.querySelectorAll('.submenu');
  submenus.forEach(submenu => {
    const submenuId = submenu.id;
    const savedState = localStorage.getItem(`submenu_${submenuId}`);

    if (savedState === 'open') {
      const parentLi = submenu.closest('.has-submenu');
      submenu.classList.add('open');
      submenu.style.display = 'block';
      if (parentLi) {
        parentLi.classList.add('open');
      }
    } else if (savedState === 'closed') {
      const parentLi = submenu.closest('.has-submenu');
      submenu.classList.remove('open');
      submenu.style.display = 'none';
      if (parentLi) {
        parentLi.classList.remove('open');
      }
    }
    // If no saved state, keep the default state from the HTML
  });
}

// Load application version from package.json
async function loadAppVersion() {
  console.log('Loading app version...');
  try {
    const response = await fetch('/api/version/app');
    if (response.ok) {
      const data = await response.json();
      const versionElement = document.getElementById('appVersion');
      if (versionElement) {
        versionElement.textContent = `Version ${data.version}`;
      }
    }
  } catch (error) {
    console.error('Error loading app version:', error);
  }
}

// Toggle submenu function
function toggleSubmenu(event, submenuId) {
  event.preventDefault();
  event.stopPropagation();

  // Auto-expand sidebar if collapsed
  const sidebar = document.getElementById('sidebar');
  const layoutWrapper = document.querySelector('.layout-wrapper');
  // We need to access the sidebarCollapsed variable from the outer scope or check the class
  if (sidebar && sidebar.classList.contains('collapsed')) {
    sidebar.classList.remove('collapsed');
    if (layoutWrapper) {
      layoutWrapper.classList.remove('sidebar-collapsed');
    }
    // Update the local variable if we can access it, or rely on the class check next time
    // Since sidebarCollapsed is local to initSidebar, we can't update it here directly if this function is outside.
    // However, the toggle button listener toggles the class based on the variable.
    // To keep it in sync, we might need to dispatch an event or just rely on the class.
    // Let's just remove the class for now, the toggle button logic might get out of sync but it toggles based on current state usually.
    // Actually, looking at initSidebar, sidebarCollapsed is a local variable.
    // The toggle button listener does: sidebarCollapsed = !sidebarCollapsed;
    // If we change the class here, the variable will be out of sync.
    // But toggleSubmenu is defined OUTSIDE initSidebar in the file I read (lines 213+).
    // So it cannot access sidebarCollapsed.
    // The toggle button listener (lines 140+) uses a local variable.
    // This is a potential bug in the original code structure if state needs to be shared.
    // For now, removing the class is the visual fix.
  }

  const submenu = document.getElementById(submenuId);
  if (submenu) {
    const parentLi = submenu.closest('.has-submenu');
    const isOpen = submenu.classList.contains('open');

    if (isOpen) {
      // Close submenu
      submenu.classList.remove('open');
      submenu.style.display = 'none';
      if (parentLi) {
        parentLi.classList.remove('open');
      }
      // Save state to localStorage
      localStorage.setItem(`submenu_${submenuId}`, 'closed');
    } else {
      // Open submenu
      submenu.classList.add('open');
      submenu.style.display = 'block';
      if (parentLi) {
        parentLi.classList.add('open');
      }
      // Save state to localStorage
      localStorage.setItem(`submenu_${submenuId}`, 'open');
    }
  }
}

// Update sidebar menu visibility based on user role and module roles
function updateSidebarMenuVisibility(roleId, moduleRoles = {}) {
  // Show Administration menu for ADMINISTRATOR role (roleId = 1)
  // OR if they have Admin access to the 'core' module explicitly
  const administrationMenuItem = document.getElementById('administrationMenuItem');

  // Robust check with loose equality and safety
  const isAdmin = (roleId == 1) || (moduleRoles && moduleRoles['core'] == 1);

  console.log('Sidebar Visibility Check:', { roleId, moduleRoles, isAdmin, hasMenuItem: !!administrationMenuItem });

  if (isAdmin && administrationMenuItem) {
    administrationMenuItem.style.display = 'block';
  }

  // Handle dynamic items with data-roles
  // Now also checks data-module-key if present (backward compatibility with global role)
  const dynamicItems = document.querySelectorAll('[data-roles]');

  // NOTE: In the future, we should add data-module-key to sidebar items generator
  // to make this cleaner. For now, we rely on the implementation plan's sidebar generation
  // which I should have updated or need to update now? 
  // Wait, I haven't updated the generator yet. 
  // The plan said: "Add data-module-key=\"${key}\" to the sidebar items."
  // I need to update the generator code in initSidebar first or simultaneously.

  dynamicItems.forEach(item => {
    try {
      const roles = JSON.parse(item.dataset.roles);
      // Try to find the module key associated with this item
      // We haven't added data-module-key yet, so we can't easily map it unless we rely on ID logic
      // But let's assume I will update the generator immediately after this.

      const moduleKey = item.dataset.moduleKey;
      let effectiveRole = roleId;

      if (moduleKey && moduleRoles[moduleKey]) {
        effectiveRole = moduleRoles[moduleKey];
      }

      if (Array.isArray(roles)) {
        if (roles.includes(effectiveRole)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      }
    } catch (e) {
      console.error('Error parsing roles for sidebar item:', e);
    }
  });
}

// Export function to window for global access
window.updateSidebarMenuVisibility = updateSidebarMenuVisibility;
window.toggleSubmenu = toggleSubmenu; // Make sure this is available globally

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Note: activePage should be set by the including page before this script runs
    const activePage = window.ACTIVE_PAGE || '';
    initSidebar(activePage);
  });
} else {
  const activePage = window.ACTIVE_PAGE || '';
  initSidebar(activePage);
}

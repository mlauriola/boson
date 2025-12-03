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
        <li id="administrationMenuItem" class="has-submenu ${(activePage === 'users' || activePage === 'maintenance' || activePage === 'branding') ? 'open' : ''}" style="display: none;">
          <a href="#" class="nav-link" onclick="toggleSubmenu(event, 'administrationSubmenu')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span>Administration</span>
          </a>
          <ul class="submenu ${(activePage === 'users' || activePage === 'maintenance' || activePage === 'branding') ? 'open' : ''}" id="administrationSubmenu" style="${(activePage === 'users' || activePage === 'maintenance' || activePage === 'branding') ? 'display: block;' : ''}">
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
        <li class="has-submenu ${isModuleActive ? 'open' : ''}" style="display: none;" ${moduleRoles ? `data-roles='${moduleRoles}'` : ''}>
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
      }
      if (layoutWrapper) {
        layoutWrapper.classList.toggle('sidebar-collapsed', sidebarCollapsed);
      }
    });
  }

  // Check auth and update visibility
  try {
    const authResponse = await fetch('/api/check-auth');
    if (authResponse.ok) {
      const authData = await authResponse.json();
      if (authData.authenticated) {
        updateSidebarMenuVisibility(authData.roleId);

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

// Update sidebar menu visibility based on user role
function updateSidebarMenuVisibility(roleId) {
  // Show Administration menu for ADMINISTRATOR role (roleId = 1)
  const administrationMenuItem = document.getElementById('administrationMenuItem');
  if (roleId === 1 && administrationMenuItem) {
    administrationMenuItem.style.display = 'block';
  }

  // Handle dynamic items with data-roles
  const dynamicItems = document.querySelectorAll('[data-roles]');
  dynamicItems.forEach(item => {
    try {
      const roles = JSON.parse(item.dataset.roles);
      if (Array.isArray(roles)) {
        if (roles.includes(roleId)) {
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

// ViewCommonCodes.js - Read-only view for Common Codes (no authentication required)

document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements
  const tableSelector = document.getElementById('tableSelector');
  const tableLongDescription = document.getElementById('tableLongDescription');
  const messageArea = document.getElementById('messageArea');
  const placeholderArea = document.getElementById('placeholderArea');
  const tableContainer = document.getElementById('tableContainer');
  const tableTitle = document.getElementById('tableTitle');
  const dataTable = document.getElementById('dataTable');
  const tableHead = document.getElementById('tableHead');
  const tableBody = document.getElementById('tableBody');
  const viewRecordBtn = document.getElementById('viewRecordBtn');
  const excelBtn = document.getElementById('excelBtn');
  const odfBtn = document.getElementById('odfBtn');
  const releaseVersionSpan = document.getElementById('releaseVersion');
  const helpBtn = document.getElementById('helpBtn');

  // Help button event listener
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = 'viewcommoncodes';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  let tables = [];
  let selectedTable = null;
  let tableData = [];
  let selectedRecordIndex = null;

  // Sorting state
  let currentSortColumn = null;
  let currentSortDirection = 'asc';

  // Check maintenance status and handle accordingly
  const maintenanceStatus = await checkMaintenanceStatus();
  const isMaintenanceActive = maintenanceStatus && maintenanceStatus.enabled;
  const isViewCommonCodesRestricted = maintenanceStatus &&
                                      maintenanceStatus.viewCommonCodesRestricted &&
                                      maintenanceStatus.viewCommonCodesRestricted.enabled;

  // If ViewCommonCodes restriction is active, show only header and message
  if (isViewCommonCodesRestricted) {
    // Hide export buttons
    if (excelBtn) excelBtn.style.display = 'none';
    if (odfBtn) odfBtn.style.display = 'none';
    // Hide release info from header
    const releaseInfo = document.getElementById('releaseInfo');
    if (releaseInfo) releaseInfo.style.display = 'none';
    // Hide main content
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.style.display = 'none';
    // Show restriction message
    const restrictionMessage = document.getElementById('restrictionMessage');
    const restrictionMessageText = document.getElementById('restrictionMessageText');
    if (restrictionMessage && restrictionMessageText) {
      restrictionMessageText.textContent = maintenanceStatus.viewCommonCodesRestricted.message ||
                                           'This page is temporarily unavailable to the public.';
      restrictionMessage.style.display = 'block';
    }
    // Stop here - don't load anything else
    return;
  }

  if (isMaintenanceActive) {
    // Disable combobox
    tableSelector.disabled = true;
    // Hide login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.style.display = 'none';
    // Hide export buttons
    if (excelBtn) excelBtn.style.display = 'none';
    if (odfBtn) odfBtn.style.display = 'none';
    // Change instruction text
    tableLongDescription.textContent = 'Table selection is disabled during maintenance. Please check back later.';
  }

  // Always load published release version (to show release notes and modified tables)
  await loadPublishedRelease();

  // Only load tables list and add event listeners if NOT in maintenance
  if (!isMaintenanceActive) {
    await loadTables();

    // Event listeners
    tableSelector.addEventListener('change', onTableSelect);
    viewRecordBtn.addEventListener('click', viewSelectedRecord);
    excelBtn.addEventListener('click', exportToExcel);
    odfBtn.addEventListener('click', exportToODF);
  }

  // Load published release version from _Version table
  async function loadPublishedRelease() {
    try {
      const response = await fetch('/api/version/published');

      if (response.ok) {
        const versionData = await response.json();
        releaseVersionSpan.textContent = versionData.Release || '1.0';

        // Display release notes if available
        const releaseNotesContainer = document.getElementById('releaseNotesContainer');
        const releaseMessageContent = document.getElementById('releaseMessageContent');
        const releaseMessageTitle = document.getElementById('releaseMessageTitle');

        if (versionData.Message && releaseMessageContent) {
          // Update title with version number
          if (releaseMessageTitle) {
            releaseMessageTitle.textContent = `Release Notes - Version ${versionData.Release || '1.0'}`;
          }
          releaseMessageContent.innerHTML = versionData.Message;
          if (releaseNotesContainer) {
            releaseNotesContainer.style.display = 'block';
          }
        }

        // Display modified tables if available
        const modifiedTablesList = document.getElementById('modifiedTablesList');
        const modifiedTablesBox = document.getElementById('modifiedTablesBox');

        if (modifiedTablesList && versionData.ModifiedTables) {
          try {
            const modifiedTables = JSON.parse(versionData.ModifiedTables);
            if (modifiedTables && modifiedTables.length > 0) {
              modifiedTablesList.innerHTML = '';
              modifiedTables.forEach(table => {
                const li = document.createElement('li');

                // Build operation details string
                let operations = [];
                if (table.inserts > 0) operations.push(`${table.inserts} new`);
                if (table.updates > 0) operations.push(`${table.updates} modified`);
                if (table.deletes > 0) operations.push(`${table.deletes} deleted`);

                const operationText = operations.length > 0 ? ` (${operations.join(', ')})` : '';
                li.textContent = `${table.description || table.table}${operationText}`;

                modifiedTablesList.appendChild(li);
              });
              // Show the modified tables box
              if (modifiedTablesBox) {
                modifiedTablesBox.style.display = 'block';
              }
            }
          } catch (e) {
            console.error('Error parsing ModifiedTables JSON:', e);
          }
        }
      } else {
        console.error('Error loading published version');
        releaseVersionSpan.textContent = 'N/A';
      }
    } catch (error) {
      console.error('Error loading published version:', error);
      releaseVersionSpan.textContent = 'N/A';
    }
  }

  // Load tables list from API
  async function loadTables() {
    try {
      const response = await fetch('/api/commoncodes/tables');
      const data = await response.json();

      if (response.ok) {
        tables = data;
        populateTableSelector();
      } else {
        showMessage('Error loading tables list', 'error');
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      showMessage('Error connecting to server', 'error');
    }
  }

  // Populate table selector dropdown
  function populateTableSelector() {
    tableSelector.innerHTML = '<option value="">-- Select a table --</option>';
    tables.forEach(table => {
      const option = document.createElement('option');
      option.value = table.Code;
      option.textContent = table.Description;
      option.dataset.spGetAll = table.SP_GetAll;
      option.dataset.refTable = table.RefTable;
      option.dataset.description = table.Description;
      option.dataset.longDescription = table.LongDescription || '';
      tableSelector.appendChild(option);
    });
  }

  // Handle table selection
  async function onTableSelect(e) {
    const selectedOption = e.target.selectedOptions[0];
    const releaseNotesContainer = document.getElementById('releaseNotesContainer');
    const modifiedTablesBox = document.getElementById('modifiedTablesBox');

    if (!selectedOption || !selectedOption.value) {
      // No table selected - show instruction text, release notes and modified tables, hide table
      tableContainer.style.display = 'none';
      tableLongDescription.textContent = 'Please select a table from the dropdown above to view its contents.';

      // Show release notes if available
      if (releaseNotesContainer && releaseNotesContainer.querySelector('#releaseMessageContent').innerHTML) {
        releaseNotesContainer.style.display = 'block';
      }

      // Show modified tables if available
      if (modifiedTablesBox && modifiedTablesBox.querySelector('#modifiedTablesList').children.length > 0) {
        modifiedTablesBox.style.display = 'block';
      }

      return;
    }

    selectedTable = {
      code: selectedOption.value,
      description: selectedOption.dataset.description,
      spGetAll: selectedOption.dataset.spGetAll,
      refTable: selectedOption.dataset.refTable,
      longDescription: selectedOption.dataset.longDescription
    };

    // Replace instruction text with table description
    tableLongDescription.textContent = selectedTable.longDescription || '';

    // Hide release notes and modified tables
    if (releaseNotesContainer) {
      releaseNotesContainer.style.display = 'none';
    }
    if (modifiedTablesBox) {
      modifiedTablesBox.style.display = 'none';
    }

    await loadTableData();
  }

  // Load table data
  async function loadTableData() {
    try {
      showLoading(true);

      // Always use _Published version
      const publishedSP = `${selectedTable.spGetAll}_Published`;
      const response = await fetch(`/api/commoncodes/data/${publishedSP}`);

      if (response.ok) {
        const data = await response.json();
        tableData = data;
        tableTitle.textContent = `${selectedTable.description}`;
        renderTable();
        tableContainer.style.display = 'block';
        showMessage(`Loaded ${tableData.length} records`, 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        showMessage('Error loading table data', 'error');
      }
    } catch (error) {
      console.error('Error loading table data:', error);
      showMessage('Error loading table data', 'error');
    } finally {
      showLoading(false);
    }
  }

  // Render table
  function renderTable() {
    if (tableData.length === 0) {
      tableHead.innerHTML = '<tr><th>No data available</th></tr>';
      tableBody.innerHTML = '';
      return;
    }

    // Get columns from first row (exclude system columns and versioning columns)
    const columns = Object.keys(tableData[0]).filter(col =>
      !['UserId', 'Data_Ins', 'Data_upd', 'StartingVersion', 'Version', 'DisciplineCode', 'Code_DisciplineCode', 'DisciplineValue', 'GenderCode', 'EventCode', 'SportCode', 'VenueCodeValue', 'CountryCodeValue', 'ContinentCodeValue', 'PartecipationFlagCode', 'TypeCode', 'PhaseTypeCode', 'CompetitionTypeCode', 'ProgressionTypeCode', 'Schedule_TypesCode', 'MedalCountCode', 'NonSportFlagCode', 'ScheduledFlagCode', 'TeamEventCode', 'ScheduleFlagCode', 'CompetitionFlagCode', 'EventOrderCode', 'IntFedCode', 'ParticCode', 'ResultsCode', 'CategoryCode', 'Indoor_OutdoorCode', 'ODF_Incoming'].includes(col)
    );

    // Render header
    const headerRow = document.createElement('tr');

    // Add select column
    const selectTh = document.createElement('th');
    selectTh.innerHTML = '<input type="radio" name="selectRow" id="selectAll" disabled>';
    headerRow.appendChild(selectTh);

    columns.forEach(col => {
      const th = document.createElement('th');
      th.className = 'sortable';
      th.setAttribute('data-column', col);
      th.textContent = col;

      // Add sort icon
      const sortIcon = document.createElement('span');
      sortIcon.className = 'sort-icon';
      th.appendChild(sortIcon);

      headerRow.appendChild(th);
    });

    tableHead.innerHTML = '';
    tableHead.appendChild(headerRow);

    // Setup sorting functionality
    document.querySelectorAll('.sortable').forEach(header => {
      header.addEventListener('click', () => {
        const column = header.getAttribute('data-column');
        sortTable(column);
      });
    });

    // Render body
    tableBody.innerHTML = '';
    tableData.forEach((row, index) => {
      const tr = document.createElement('tr');

      // Add radio button cell
      const selectTd = document.createElement('td');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'selectRow';
      radio.value = index;
      radio.addEventListener('change', () => {
        selectedRecordIndex = index;
        viewRecordBtn.disabled = false;
      });
      selectTd.appendChild(radio);
      tr.appendChild(selectTd);

      columns.forEach(col => {
        const td = document.createElement('td');
        const value = row[col];
        let displayValue = '';

        // Format dates to YYYY-MM-DD (without time)
        if (value && (col.toLowerCase().includes('date') || col.toLowerCase().includes('data_'))) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            displayValue = `${year}-${month}-${day}`;
            td.textContent = displayValue;
          } else {
            displayValue = value ?? '';
            td.textContent = displayValue;
          }
        } else {
          displayValue = value ?? '';
          td.textContent = displayValue;
        }

        tr.appendChild(td);
      });

      tableBody.appendChild(tr);

      // Add titles only for truncated cells after rendering
      setTimeout(() => {
        const cells = tr.querySelectorAll('td');
        cells.forEach((td, index) => {
          if (index === 0) return; // Skip radio button column
          if (td.scrollWidth > td.clientWidth) {
            td.title = td.textContent;
          }
        });
      }, 0);
    });

    // Reset selection
    selectedRecordIndex = null;
    viewRecordBtn.disabled = true;
  }

  // Sort table by column
  function sortTable(column) {
    if (currentSortColumn === column) {
      // Toggle direction if clicking the same column
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column - start with ascending
      currentSortColumn = column;
      currentSortDirection = 'asc';
    }

    // Update sort indicators
    document.querySelectorAll('.sortable').forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
    });

    const currentHeader = document.querySelector(`.sortable[data-column="${column}"]`);
    if (currentHeader) {
      currentHeader.classList.add(`sort-${currentSortDirection}`);
    }

    // Sort the data
    tableData.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // Check if values are dates
      const aDate = new Date(aVal);
      const bDate = new Date(bVal);
      const isDate = !isNaN(aDate.getTime()) && !isNaN(bDate.getTime()) &&
                     typeof aVal === 'string' && aVal.includes('-');

      if (isDate) {
        aVal = aDate.getTime();
        bVal = bDate.getTime();
      } else {
        // Convert to string for comparison if not a number
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Re-render table with sorted data
    renderTable();
  }

  // View selected record in modal
  function viewSelectedRecord() {
    if (selectedRecordIndex === null) return;

    const record = tableData[selectedRecordIndex];

    // Check if record has RSC_Code
    const hasRSCCode = record.hasOwnProperty('RSC_Code');
    const rscCodeValue = hasRSCCode ? (record['RSC_Code'] || '') : '';

    // Function to format RSC_Code with colors and separators (each character colored)
    function formatRSCCode(rscCode) {
      if (!rscCode) return '<span style="color: #adb5bd; font-style: italic;">No RSC_Code</span>';

      // Color each character based on position (same logic as backend)
      let coloredHTML = '';
      const chars = rscCode.split('');

      chars.forEach((char, index) => {
        let bgColor = '';
        let textColor = '#000';

        // Determine color based on position (matches backend CommonCodes.js)
        if (index < 3) {
          // D: Discipline (positions 0-2)
          bgColor = '#d1ecf1';
          textColor = '#0c5460';
        } else if (index < 4) {
          // G: Gender (position 3)
          bgColor = '#d4edda';
          textColor = '#155724';
        } else if (index < 22) {
          // E: Event (positions 4-21)
          bgColor = '#fff3cd';
          textColor = '#856404';
        } else if (index < 26) {
          // P: Phase (positions 22-25)
          bgColor = '#f8d7da';
          textColor = '#721c24';
        } else {
          // U: Unit (positions 26-33)
          bgColor = '#e2d8f8';
          textColor = '#5a3c82';
        }

        coloredHTML += `<span style="
          display: inline-block;
          background-color: ${bgColor};
          color: ${textColor};
          padding: 2px 4px;
          margin: 0 1px;
          border-radius: 2px;
          font-weight: bold;
          min-width: 12px;
          text-align: center;
        ">${char}</span>`;
      });

      return coloredHTML;
    }

    // Build RSC_Code section if exists
    const rscCodeSectionHTML = hasRSCCode ? `
      <div class="rsc-code-section" style="
        padding: 15px 20px;
        background-color: #f8f9fa;
        border-bottom: 2px solid #dee2e6;
      ">
        <label style="
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #495057;
          font-size: 14px;
        ">
          RSC_Code
        </label>
        <div id="rsc_code_display" style="
          padding: 12px 15px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background-color: white;
          font-family: 'Courier New', monospace;
          font-size: 15px;
          min-height: 44px;
          display: flex;
          align-items: center;
        ">${formatRSCCode(rscCodeValue)}</div>
      </div>
    ` : '';

    // Build modal content
    let content = '<table style="width: 100%; border-collapse: collapse;">';

    Object.keys(record).forEach(key => {
      // Skip system columns, versioning columns, and RSC_Code (shown separately)
      if (['UserId', 'Data_Ins', 'Data_upd', 'StartingVersion', 'Version', 'RSC_Code'].includes(key)) return;

      const value = record[key];
      let displayValue = value ?? '';

      // Format dates to YYYY-MM-DD (without time)
      if (value && (key.toLowerCase().includes('date') || key.toLowerCase().includes('data_'))) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          displayValue = `${year}-${month}-${day}`;
        }
      }

      content += `<tr style="border-bottom: 1px solid #ddd;">`;
      content += `<td style="padding: 8px; font-weight: bold; width: 200px;">${key}</td>`;
      content += `<td style="padding: 8px;">${displayValue}</td>`;
      content += `</tr>`;
    });

    content += '</table>';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>View Record - ${selectedTable.description}</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        ${rscCodeSectionHTML}
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Export to Excel
  async function exportToExcel() {
    try {
      showMessage('Preparing download...', 'info');

      // Check if file exists first
      const response = await fetch('/api/commoncodes/download-excel', {
        method: 'HEAD'
      });

      if (response.ok) {
        // File exists, proceed with download
        window.location.href = '/api/commoncodes/download-excel';
        setTimeout(() => {
          showMessage('Download started', 'success');
        }, 500);
      } else {
        // File not found
        showMessage('The Excel export file is not available at the moment', 'error');
      }
    } catch (error) {
      console.error('Error checking file:', error);
      showMessage('The Excel export file is not available at the moment', 'error');
    }
  }

  // Download DT_CODES (ODF XML format)
  async function exportToODF() {
    try {
      showMessage('Preparing download...', 'info');

      // Check if file exists first
      const response = await fetch('/api/commoncodes/download-dt-codes', {
        method: 'HEAD'
      });

      if (response.ok) {
        // File exists, proceed with download
        window.location.href = '/api/commoncodes/download-dt-codes';
        setTimeout(() => {
          showMessage('Download started', 'success');
        }, 500);
      } else {
        // File not found
        showMessage('The DT_CODES export file is not available at the moment', 'error');
      }
    } catch (error) {
      console.error('Error checking file:', error);
      showMessage('The DT_CODES export file is not available at the moment', 'error');
    }
  }

  // Show loading message in message area
  function showLoading(show) {
    if (show) {
      messageArea.textContent = 'Loading...';
      messageArea.className = 'message info';
      messageArea.style.visibility = 'visible';
      messageArea.style.opacity = '1';
    } else {
      // Clear loading message only if it's still showing "Loading..."
      if (messageArea.textContent === 'Loading...') {
        messageArea.textContent = '';
        messageArea.className = 'message';
        messageArea.style.visibility = 'hidden';
        messageArea.style.opacity = '0';
      }
    }
  }

  // Show message
  function showMessage(text, type = 'info') {
    messageArea.textContent = text;
    messageArea.className = `message ${type}`;
    messageArea.style.visibility = 'visible';
    messageArea.style.opacity = '1';

    setTimeout(() => {
      messageArea.style.visibility = 'hidden';
      messageArea.style.opacity = '0';
    }, 5000);
  }

  // Check maintenance status
  async function checkMaintenanceStatus() {
    try {
      const response = await fetch('/api/maintenance/status');
      if (!response.ok) {
        console.log('Could not check maintenance status:', response.status);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.log('Could not check maintenance status:', error);
      return null;
    }
  }
});

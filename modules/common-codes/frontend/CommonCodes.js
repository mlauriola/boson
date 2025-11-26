// CommonCodes.js - Client-side logic for Common Codes management

// Helper function to escape HTML special characters for use in HTML content
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to escape HTML special characters for use in attribute values
function escapeAttr(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize MessageManager
  MessageManager.init('messageArea');

  // DOM elements
  const tableSelector = document.getElementById('tableSelector');
  const tableLongDescription = document.getElementById('tableLongDescription');
  const welcomeInfo = document.getElementById('welcomeInfo');
  const tableContainer = document.getElementById('tableContainer');
  const tableTitle = document.getElementById('tableTitle');
  const dataTable = document.getElementById('dataTable');
  const tableHead = document.getElementById('tableHead');
  const tableBody = document.getElementById('tableBody');
  const addRecordBtn = document.getElementById('addRecordBtn');
  const cloneRecordBtn = document.getElementById('cloneRecordBtn');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  const importExcelBtn = document.getElementById('importExcelBtn');
  const importFileInput = document.getElementById('importFileInput');
  const helpBtn = document.getElementById('helpBtn');

  let tables = [];
  let selectedTable = null;
  let tableData = [];
  let originalTableData = []; // Unfiltered original data for column filtering
  let tableStructure = []; // Column metadata including primary keys
  let workingVersionRelease = null; // Working version release number
  let disciplineList = []; // Cache for Discipline lookup values
  let sportGenderList = []; // Cache for SportGender lookup values
  let sportList = []; // Cache for Sport lookup values
  let eventList = []; // Cache for Event lookup values
  let phaseList = []; // Cache for Phase lookup values
  let eventUnitTypeList = []; // Cache for EventUnitType lookup values
  let yesNoList = []; // Cache for YesNo lookup values

  // Infinite scroll state
  let currentOffset = 0;
  const PAGE_SIZE = 100;
  let isLoading = false;
  let hasMoreData = true;
  let totalRecordCount = 0;

  // Sorting state
  let currentSortColumn = null;
  let currentSortDirection = 'asc';

  // Column filter state
  let columnFilters = {}; // { columnName: { type: 'checkbox'|'search', values: [...] | searchText: '...' } }
  let activeFilterDropdown = null; // Currently open filter dropdown
  let eventOrderList = []; // Cache for EventOrder lookup values
  let intFedList = []; // Cache for IntFed (Organisation IF type) lookup values
  let functionCategoryList = []; // Cache for FunctionCategory lookup values
  let venueList = []; // Cache for Venue lookup values
  let countryList = []; // Cache for Country lookup values
  let continentList = []; // Cache for Continent lookup values
  let participationFlagList = []; // Cache for Participation Flag lookup values
  let organisationTypeList = []; // Cache for OrganisationType lookup values
  let phaseTypeList = []; // Cache for PhaseType lookup values
  let competitionFormatTypeList = []; // Cache for CompetitionFormatType lookup values
  let progressionTypeList = []; // Cache for ProgressionType lookup values
  let scheduleTypesList = []; // Cache for Schedule Types lookup values
  let indoorOutdoorList = []; // Cache for Indoor_Outdoor lookup values
  let weatherRegionList = []; // Cache for WeatherRegion lookup values

  // Check authentication
  await checkAuthentication();

  // Load working version release
  await loadWorkingVersion();

  // Load tables list
  await loadTables();

  // Event listeners
  tableSelector.addEventListener('change', onTableSelect);
  addRecordBtn.addEventListener('click', addRecord);
  cloneRecordBtn.addEventListener('click', cloneRecord);
  deleteSelectedBtn.addEventListener('click', deleteSelectedRecords);
  exportExcelBtn.addEventListener('click', exportToExcel);
  importExcelBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', importFromExcel);

  // Help button event listener
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const pageName = window.ACTIVE_PAGE || 'commoncodes';
      if (typeof window.showHelp === 'function') {
        window.showHelp(pageName);
      } else {
        console.error('Help modal not loaded');
      }
    });
  }

  // Infinite scroll event listener
  const tableWrapper = document.querySelector('.table-wrapper');
  if (tableWrapper) {
    tableWrapper.addEventListener('scroll', () => {
      const scrollPosition = tableWrapper.scrollTop + tableWrapper.clientHeight;
      const scrollHeight = tableWrapper.scrollHeight;

      // Load more when user is 200px from bottom
      if (scrollPosition >= scrollHeight - 200 && !isLoading && hasMoreData) {
        loadMoreTableData();
      }
    });
  }

  // Check authentication
  async function checkAuthentication() {
    try {
      const response = await fetch('/api/check-auth');
      const data = await response.json();

      if (!data.authenticated) {
        window.location.href = '/login.html';
        return;
      }

      // Check if first login - redirect to home (will show modal)
      if (data.firstLogin === -1 || data.firstLogin === true) {
        window.location.href = '/index.html';
        return;
      }

      // Update header user display
      const currentUserSpan = document.getElementById('currentUser');
      if (currentUserSpan) {
        currentUserSpan.textContent = `Welcome, ${data.referent || data.username}`;
      }

      // Update sidebar menu visibility based on user role
      if (typeof updateSidebarMenuVisibility === 'function') {
        updateSidebarMenuVisibility(data.roleId);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      window.location.href = '/login.html';
    }
  }

  // Load working version release number
  async function loadWorkingVersion() {
    try {
      const response = await fetch('/api/version/working');

      if (response.ok) {
        const versionData = await response.json();
        workingVersionRelease = versionData.Release || 'N/A';
      } else {
        console.error('Error loading working version');
        workingVersionRelease = 'N/A';
      }
    } catch (error) {
      console.error('Error loading working version:', error);
      workingVersionRelease = 'N/A';
    }
  }

  // Load tables from _TableList
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
      showMessage('Error loading tables list', 'error');
    }
  }

  // Populate table selector dropdown
  function populateTableSelector() {
    tableSelector.innerHTML = '<option value="">-- Select a table --</option>';
    tables.forEach(table => {
      const option = document.createElement('option');
      option.value = table.Code;
      option.textContent = table.Description;
      option.dataset.refTable = table.RefTable;
      option.dataset.spGetAll = table.SP_GetAll;
      option.dataset.spCreate = table.SP_Create;
      option.dataset.spUpdate = table.SP_Update;
      option.dataset.spDelete = table.SP_Delete;
      option.dataset.longDescription = table.LongDescription || '';
      tableSelector.appendChild(option);
    });
  }

  // Load Discipline lookup values
  async function loadDisciplineList() {
    if (disciplineList.length > 0) {
      return disciplineList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_Discipline_GetAll');
      const data = await response.json();

      if (response.ok) {
        disciplineList = data;
        return disciplineList;
      } else {
        console.error('Error loading Discipline list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Discipline list:', error);
      return [];
    }
  }

  // Load SportGender lookup values from SportGender table
  async function loadSportGenderList() {
    if (sportGenderList.length > 0) {
      return sportGenderList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_SportGender_GetAll');
      const data = await response.json();

      if (response.ok) {
        sportGenderList = data;
        return sportGenderList;
      } else {
        console.error('Error loading SportGender list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading SportGender list:', error);
      return [];
    }
  }

  // Load Sport lookup values from Sport table
  async function loadSportList() {
    if (sportList.length > 0) {
      return sportList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_Sport_GetAll');
      const data = await response.json();

      if (response.ok) {
        sportList = data;
        return sportList;
      } else {
        console.error('Error loading Sport list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Sport list:', error);
      return [];
    }
  }

  // Load Event lookup values from Event table
  async function loadEventList() {
    if (eventList.length > 0) {
      return eventList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_Event_GetAll');
      const data = await response.json();

      if (response.ok) {
        eventList = data;
        return eventList;
      } else {
        console.error('Error loading Event list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Event list:', error);
      return [];
    }
  }

  // Load Phase lookup values from Phase table
  async function loadPhaseList() {
    if (phaseList.length > 0) {
      return phaseList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_Phase_GetAll');
      const data = await response.json();

      if (response.ok) {
        phaseList = data;
        return phaseList;
      } else {
        console.error('Error loading Phase list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Phase list:', error);
      return [];
    }
  }

  // Load EventUnitType lookup values from EventUnitType table
  async function loadEventUnitTypeList() {
    if (eventUnitTypeList.length > 0) {
      return eventUnitTypeList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_EventUnitType_GetAll');
      const data = await response.json();

      if (response.ok) {
        eventUnitTypeList = data;
        return eventUnitTypeList;
      } else {
        console.error('Error loading EventUnitType list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading EventUnitType list:', error);
      return [];
    }
  }

  // Load YesNo lookup values from MP_Support_YesNo table
  async function loadYesNoList() {
    if (yesNoList.length > 0) {
      return yesNoList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_MP_Support_YesNo_GetAll');
      const data = await response.json();

      if (response.ok) {
        yesNoList = data;
        return yesNoList;
      } else {
        console.error('Error loading YesNo list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading YesNo list:', error);
      return [];
    }
  }

  // Load EventOrder lookup values from MP_Support_EventOrder table
  async function loadEventOrderList() {
    if (eventOrderList.length > 0) {
      return eventOrderList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_MP_Support_EventOrder_GetAll');
      const data = await response.json();

      if (response.ok) {
        eventOrderList = data;
        return eventOrderList;
      } else {
        console.error('Error loading EventOrder list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading EventOrder list:', error);
      return [];
    }
  }

  // Load IntFed lookup values from Organisation table (Type = 'IF')
  async function loadIntFedList() {
    if (intFedList.length > 0) {
      return intFedList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_Organisation_GetByTypeIF');
      const data = await response.json();

      if (response.ok) {
        intFedList = data;
        return intFedList;
      } else {
        console.error('Error loading IntFed list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading IntFed list:', error);
      return [];
    }
  }

  async function loadFunctionCategoryList() {
    if (functionCategoryList.length > 0) {
      return functionCategoryList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_FunctionCategory_GetAll');
      const data = await response.json();

      if (response.ok) {
        functionCategoryList = data;
        return functionCategoryList;
      } else {
        console.error('Error loading FunctionCategory list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading FunctionCategory list:', error);
      return [];
    }
  }

  // Load Venue lookup values from Venue table
  async function loadVenueList() {
    if (venueList.length > 0) {
      return venueList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_Venue_GetAll');
      const data = await response.json();

      if (response.ok) {
        venueList = data;
        return venueList;
      } else {
        console.error('Error loading Venue list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Venue list:', error);
      return [];
    }
  }

  // Load Country lookup values from Country table
  async function loadCountryList() {
    if (countryList.length > 0) {
      return countryList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_Country_GetAll');
      const data = await response.json();

      if (response.ok) {
        countryList = data;
        return countryList;
      } else {
        console.error('Error loading Country list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Country list:', error);
      return [];
    }
  }

  // Load Continent lookup values from Continent table
  async function loadContinentList() {
    if (continentList.length > 0) {
      return continentList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_Continent_GetAll');
      const data = await response.json();

      if (response.ok) {
        continentList = data;
        return continentList;
      } else {
        console.error('Error loading Continent list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Continent list:', error);
      return [];
    }
  }

  // Load Participation Flag lookup values from MP_Support_Participation_Flag table
  async function loadParticipationFlagList() {
    if (participationFlagList.length > 0) {
      return participationFlagList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_Support_ParticipationFlag_GetAll');
      const data = await response.json();

      if (response.ok) {
        participationFlagList = data;
        return participationFlagList;
      } else {
        console.error('Error loading Participation Flag list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Participation Flag list:', error);
      return [];
    }
  }

  // Load OrganisationType lookup values from OrganisationType table
  async function loadOrganisationTypeList() {
    if (organisationTypeList.length > 0) {
      return organisationTypeList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_OrganisationType_GetAll');
      const data = await response.json();

      if (response.ok) {
        organisationTypeList = data;
        return organisationTypeList;
      } else {
        console.error('Error loading OrganisationType list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading OrganisationType list:', error);
      return [];
    }
  }

  // Load PhaseType lookup values from PhaseType table
  async function loadPhaseTypeList() {
    if (phaseTypeList.length > 0) {
      return phaseTypeList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_PhaseType_GetAll');
      const data = await response.json();

      if (response.ok) {
        phaseTypeList = data;
        return phaseTypeList;
      } else {
        console.error('Error loading PhaseType list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading PhaseType list:', error);
      return [];
    }
  }

  // Load CompetitionFormatType lookup values from CompetitionFormatType table
  async function loadCompetitionFormatTypeList() {
    if (competitionFormatTypeList.length > 0) {
      return competitionFormatTypeList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_CompetitionFormatType_GetAll');
      const data = await response.json();

      if (response.ok) {
        competitionFormatTypeList = data;
        return competitionFormatTypeList;
      } else {
        console.error('Error loading CompetitionFormatType list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading CompetitionFormatType list:', error);
      return [];
    }
  }

  // Load ProgressionType lookup values from ProgressionType table
  async function loadProgressionTypeList() {
    if (progressionTypeList.length > 0) {
      return progressionTypeList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_CC_ProgressionType_GetAll');
      const data = await response.json();

      if (response.ok) {
        progressionTypeList = data;
        return progressionTypeList;
      } else {
        console.error('Error loading ProgressionType list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading ProgressionType list:', error);
      return [];
    }
  }

  // Load Schedule Types lookup values from MP_Support_Schedule_Types table
  async function loadScheduleTypesList() {
    if (scheduleTypesList.length > 0) {
      return scheduleTypesList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_Support_ScheduleTypes_GetAll');
      const data = await response.json();

      if (response.ok) {
        scheduleTypesList = data;
        return scheduleTypesList;
      } else {
        console.error('Error loading Schedule Types list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Schedule Types list:', error);
      return [];
    }
  }

  // Load Indoor_Outdoor lookup values from MP_Support_Indoor_Outdoor table
  async function loadIndoorOutdoorList() {
    if (indoorOutdoorList.length > 0) {
      return indoorOutdoorList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_Support_IndoorOutdoor_GetAll');
      const data = await response.json();

      if (response.ok) {
        indoorOutdoorList = data;
        return indoorOutdoorList;
      } else {
        console.error('Error loading Indoor_Outdoor list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading Indoor_Outdoor list:', error);
      return [];
    }
  }

  // Load WeatherRegion lookup values from WeatherRegion table
  async function loadWeatherRegionList(forceReload = false) {
    if (weatherRegionList.length > 0 && !forceReload) {
      return weatherRegionList; // Return cached values
    }

    try {
      const response = await fetch('/api/commoncodes/data/sp_Support_WeatherRegion_GetAll');
      const data = await response.json();

      if (response.ok) {
        weatherRegionList = data;
        console.log('WeatherRegion list loaded:', weatherRegionList);
        return weatherRegionList;
      } else {
        console.error('Error loading WeatherRegion list:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading WeatherRegion list:', error);
      return [];
    }
  }

  // Invalidate all lookup list caches
  function invalidateLookupCaches() {
    disciplineList = [];
    sportGenderList = [];
    sportList = [];
    eventList = [];
    phaseList = [];
    eventUnitTypeList = [];
    yesNoList = [];
    eventOrderList = [];
    intFedList = [];
    functionCategoryList = [];
    venueList = [];
    countryList = [];
    continentList = [];
    participationFlagList = [];
    organisationTypeList = [];
    phaseTypeList = [];
    competitionFormatTypeList = [];
    progressionTypeList = [];
    scheduleTypesList = [];
    indoorOutdoorList = [];
    weatherRegionList = [];
  }

  // Handle table selection
  async function onTableSelect(e) {
    const selectedOption = e.target.selectedOptions[0];

    if (!selectedOption || !selectedOption.value) {
      tableContainer.style.display = 'none';
      welcomeInfo.style.display = 'block';
      tableLongDescription.textContent = 'Please select a table from the dropdown above to view its contents.';
      MessageManager.forceHide();
      selectedTable = null;
      return;
    }

    // Hide welcome info and prepare to show table
    welcomeInfo.style.display = 'none';

    selectedTable = {
      code: selectedOption.value,
      description: selectedOption.textContent,
      refTable: selectedOption.dataset.refTable,
      spGetAll: selectedOption.dataset.spGetAll,
      spCreate: selectedOption.dataset.spCreate,
      spUpdate: selectedOption.dataset.spUpdate,
      spDelete: selectedOption.dataset.spDelete,
      longDescription: selectedOption.dataset.longDescription
    };

    // Reload working version to get the most recent release number
    await loadWorkingVersion();

    tableTitle.textContent = `${selectedTable.description} (${workingVersionRelease})`;
    tableLongDescription.textContent = selectedTable.longDescription || '';
    await loadTableData(true); // Show success message when selecting a table
  }

  // Load table data
  async function loadTableData(showSuccessMessage = false, customSuccessMessage = null) {
    if (!selectedTable) return;

    // Reset pagination state
    currentOffset = 0;
    hasMoreData = true;
    tableData = [];
    originalTableData = []; // Reset original data too
    totalRecordCount = 0;

    showLoading(true);
    tableContainer.style.display = 'none';

    try {
      // Load table structure to get primary key info
      const structureResponse = await fetch(`/api/commoncodes/structure/${selectedTable.refTable}`);
      const structureData = await structureResponse.json();

      if (structureResponse.ok) {
        tableStructure = structureData;
        console.log('Table structure loaded:', tableStructure);
      }

      // Load initial page of table data with pagination
      const response = await fetch(`/api/commoncodes/data/${selectedTable.spGetAll}?offset=0&limit=${PAGE_SIZE}`);
      const data = await response.json();

      if (response.ok) {
        // Check if response has pagination metadata
        if (data.data && data.totalCount !== undefined) {
          // Paginated response
          tableData = data.data;
          originalTableData = [...data.data]; // Save original unfiltered data
          totalRecordCount = data.totalCount;
          hasMoreData = data.hasMore;
          currentOffset = PAGE_SIZE;
        } else {
          // Legacy response (all data at once)
          tableData = data;
          originalTableData = [...data]; // Save original unfiltered data
          totalRecordCount = data.length;
          hasMoreData = false;
        }

        renderTable();
        tableContainer.style.display = 'block';

        // Show success message when explicitly requested
        if (showSuccessMessage) {
          const message = customSuccessMessage || `Loaded ${tableData.length} of ${totalRecordCount} records`;
          showMessage(message, 'success');
        }
      } else {
        showMessage(data.error || 'Error loading table data', 'error');
      }
    } catch (error) {
      console.error('Error loading table data:', error);
      showMessage('Error loading table data', 'error');
    } finally {
      showLoading(false);
    }
  }

  // Load more table data for infinite scroll
  async function loadMoreTableData() {
    if (!selectedTable || isLoading || !hasMoreData) return;

    isLoading = true;

    try {
      const response = await fetch(`/api/commoncodes/data/${selectedTable.spGetAll}?offset=${currentOffset}&limit=${PAGE_SIZE}`);
      const data = await response.json();

      if (response.ok) {
        // Check if response has pagination metadata
        if (data.data && data.totalCount !== undefined) {
          // Paginated response
          const newRows = data.data;
          tableData = [...tableData, ...newRows];
          originalTableData = [...originalTableData, ...newRows]; // Update original data too
          hasMoreData = data.hasMore;
          currentOffset += newRows.length;

          // Append new rows to table
          appendRowsToTable(newRows);

          // Update the message to show current count
          showMessage(`Loaded ${tableData.length} of ${totalRecordCount} records`, 'success');

          console.log(`Loaded ${newRows.length} more records. Total: ${tableData.length} of ${totalRecordCount}`);
        } else {
          // No more data
          hasMoreData = false;
        }
      } else {
        console.error('Error loading more data:', data.error);
      }
    } catch (error) {
      console.error('Error loading more table data:', error);
    } finally {
      isLoading = false;
    }
  }

  // Render table
  function renderTable() {
    if (tableData.length === 0) {
      tableHead.innerHTML = '<tr><th>No data available</th></tr>';
      tableBody.innerHTML = '';
      return;
    }

    // Get columns from first row
    // Get hidden columns from configuration (case-insensitive)
    const hiddenColsForTable = COLUMN_CONFIG.alwaysHidden
      .filter(config => config.table === '*' || config.table.toLowerCase() === selectedTable.refTable.toLowerCase())
      .map(config => config.column);

    const columns = Object.keys(tableData[0]).filter(col => {
      // Check against configuration (case-insensitive)
      if (hiddenColsForTable.some(hidden => hidden.toLowerCase() === col.toLowerCase())) return false;

      // Also hide helper/code columns
      const helperColumns = ['DisciplineCode', 'Code_DisciplineCode', 'DisciplineValue', 'GenderCode', 'EventCode',
        'SportCode', 'VenueCodeValue', 'CountryCodeValue', 'ContinentCodeValue', 'PartecipationFlagCode',
        'TypeCode', 'PhaseTypeCode', 'CompetitionTypeCode', 'ProgressionTypeCode', 'Schedule_TypesCode',
        'MedalCountCode', 'NonSportFlagCode', 'ScheduledFlagCode', 'TeamEventCode', 'ScheduleFlagCode',
        'CompetitionFlagCode', 'EventOrderCode', 'IntFedCode', 'ParticCode', 'ResultsCode', 'CategoryCode',
        'Indoor_OutdoorCode', 'CodeValue', 'WeatherRegionCode'];
      return !helperColumns.includes(col);
    });

    // Render header
    const headerRow = document.createElement('tr');

    // Add checkbox column
    const checkboxHeader = document.createElement('th');
    checkboxHeader.className = 'checkbox-col';
    checkboxHeader.innerHTML = '<input type="checkbox" id="selectAll" class="row-checkbox">';
    headerRow.appendChild(checkboxHeader);

    columns.forEach(col => {
      const th = document.createElement('th');
      th.className = 'sortable';
      th.setAttribute('data-column', col);

      // Create text content
      let displayName = col;
      if (col === 'Code_Discipline') {
        displayName = 'Discipline';
      } else if (col === 'VenueCode') {
        displayName = 'Venue';
      } else if (col === 'CountryCode') {
        displayName = 'Country';
      } else if (col === 'ContinentCode') {
        displayName = 'Continent';
      }

      // Set th to relative positioning for absolute children
      th.style.position = 'relative';
      th.style.paddingRight = '45px'; // Space for both icons

      // Column name text
      th.textContent = displayName;

      // Sort icon - positioned absolutely at right edge
      const sortIcon = document.createElement('span');
      sortIcon.className = 'sort-icon';
      sortIcon.style.position = 'absolute';
      sortIcon.style.right = '8px';
      sortIcon.style.top = '50%';
      sortIcon.style.transform = 'translateY(-50%)';
      th.appendChild(sortIcon);

      // Filter icon - positioned absolutely to left of sort icon
      const filterIcon = document.createElement('span');
      filterIcon.className = 'filter-icon';
      filterIcon.style.position = 'absolute';
      filterIcon.style.right = '28px'; // 8px + 14px icon + 6px gap
      filterIcon.style.top = '50%';
      filterIcon.style.transform = 'translateY(-50%)';
      filterIcon.setAttribute('data-column', col);
      filterIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="white">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
      `;
      filterIcon.title = 'Filter column';

      // Mark as active if this column has filters
      if (columnFilters[col]) {
        filterIcon.classList.add('active');
      }

      th.appendChild(filterIcon);

      headerRow.appendChild(th);
    });
    // Add actions column
    const actionsHeader = document.createElement('th');
    actionsHeader.textContent = 'Actions';
    actionsHeader.style.width = '80px';
    headerRow.appendChild(actionsHeader);
    tableHead.innerHTML = '';
    tableHead.appendChild(headerRow);

    // Render rows
    tableBody.innerHTML = '';
    tableData.forEach(row => {
      const tr = document.createElement('tr');

      // Add checkbox column
      const checkboxTd = document.createElement('td');
      checkboxTd.className = 'checkbox-col';
      // Use encodeURIComponent to safely embed JSON in HTML attribute
      checkboxTd.innerHTML = `<input type="checkbox" class="row-checkbox" data-row="${encodeURIComponent(JSON.stringify(row))}">`;
      tr.appendChild(checkboxTd);

      columns.forEach(col => {
        const td = document.createElement('td');
        const value = row[col];

        // Check if this column is a BIT type (only if tableStructure is loaded)
        const structureColumns = tableStructure && tableStructure.columns ? tableStructure.columns : [];
        const columnInfo = structureColumns.find(c => c.COLUMN_NAME === col);
        const isBitColumn = columnInfo && columnInfo.DATA_TYPE === 'bit';

        if (isBitColumn) {
          // Display checkmark or X for BIT columns
          td.innerHTML = value === true || value === 1 ? '<span style="color: green; font-size: 18px;">✓</span>' : '<span style="color: red; font-size: 18px;">✗</span>';
          td.style.textAlign = 'center';
          td.title = value === true || value === 1 ? 'Yes' : 'No';
        } else {
          // Check if this column is a DATE/DATETIME type
          const isDateColumn = columnInfo && (columnInfo.DATA_TYPE === 'date' || columnInfo.DATA_TYPE === 'datetime');

          if (isDateColumn && value) {
            // Format date to show only YYYY-MM-DD
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              td.textContent = `${year}-${month}-${day}`;
            } else {
              td.textContent = value;
            }
          } else {
            const displayValue = value !== null ? value : '';
            td.textContent = displayValue;
          }
        }

        tr.appendChild(td);
      });

      // Add titles only for truncated cells after rendering
      setTimeout(() => {
        const cells = tr.querySelectorAll('td');
        cells.forEach((td, index) => {
          if (index === 0) return; // Skip checkbox column
          if (td.scrollWidth > td.clientWidth && !td.title) {
            const col = columns[index - 1];
            const value = row[col];
            const displayValue = value !== null ? value : '';
            td.title = String(displayValue);
          }
        });
      }, 0);

      // Actions column (only Edit button)
      const actionsTd = document.createElement('td');
      // Use encodeURIComponent to safely embed JSON in HTML attribute
      actionsTd.innerHTML = `
        <button class="btn btn-small btn-edit" data-row="${encodeURIComponent(JSON.stringify(row))}">Edit</button>
      `;
      tr.appendChild(actionsTd);
      tableBody.appendChild(tr);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = JSON.parse(decodeURIComponent(e.target.getAttribute('data-row')));
        editRecord(row);
      });
    });

    // Setup checkbox functionality
    setupCheckboxes();

    // Setup sorting functionality
    document.querySelectorAll('.sortable').forEach(header => {
      header.addEventListener('click', () => {
        const column = header.getAttribute('data-column');
        sortTable(column);
      });
    });

    // Setup filter icon click handlers
    document.querySelectorAll('.filter-icon').forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent sort trigger
        const column = icon.getAttribute('data-column');
        toggleFilterDropdown(column, icon);
      });
    });
  }

  // Append new rows to existing table (for infinite scroll)
  function appendRowsToTable(newRows) {
    if (!newRows || newRows.length === 0) return;

    // Get columns from first row of existing data
    const hiddenColsForTable = COLUMN_CONFIG.alwaysHidden
      .filter(config => config.table === '*' || config.table.toLowerCase() === selectedTable.refTable.toLowerCase())
      .map(config => config.column);

    const columns = Object.keys(tableData[0]).filter(col => {
      if (hiddenColsForTable.some(hidden => hidden.toLowerCase() === col.toLowerCase())) return false;

      const helperColumns = ['DisciplineCode', 'Code_DisciplineCode', 'DisciplineValue', 'GenderCode', 'EventCode',
        'SportCode', 'VenueCodeValue', 'CountryCodeValue', 'ContinentCodeValue', 'PartecipationFlagCode',
        'TypeCode', 'PhaseTypeCode', 'CompetitionTypeCode', 'ProgressionTypeCode', 'Schedule_TypesCode',
        'MedalCountCode', 'NonSportFlagCode', 'ScheduledFlagCode', 'TeamEventCode', 'ScheduleFlagCode',
        'CompetitionFlagCode', 'EventOrderCode', 'IntFedCode', 'ParticCode', 'ResultsCode', 'CategoryCode',
        'Indoor_OutdoorCode', 'CodeValue', 'WeatherRegionCode'];
      return !helperColumns.includes(col);
    });

    // Append new rows
    newRows.forEach(row => {
      const tr = document.createElement('tr');

      // Add checkbox column
      const checkboxTd = document.createElement('td');
      checkboxTd.className = 'checkbox-col';
      checkboxTd.innerHTML = `<input type="checkbox" class="row-checkbox" data-row="${encodeURIComponent(JSON.stringify(row))}">`;
      tr.appendChild(checkboxTd);

      columns.forEach(col => {
        const td = document.createElement('td');
        const value = row[col];

        const structureColumns = tableStructure && tableStructure.columns ? tableStructure.columns : [];
        const columnInfo = structureColumns.find(c => c.COLUMN_NAME === col);
        const isBitColumn = columnInfo && columnInfo.DATA_TYPE === 'bit';

        if (isBitColumn) {
          td.innerHTML = value === true || value === 1 ? '<span style="color: green; font-size: 18px;">✓</span>' : '<span style="color: red; font-size: 18px;">✗</span>';
          td.style.textAlign = 'center';
          td.title = value === true || value === 1 ? 'Yes' : 'No';
        } else {
          const isDateColumn = columnInfo && (columnInfo.DATA_TYPE === 'date' || columnInfo.DATA_TYPE === 'datetime');

          if (isDateColumn && value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              td.textContent = `${year}-${month}-${day}`;
            } else {
              td.textContent = value;
            }
          } else {
            const displayValue = value !== null ? value : '';
            td.textContent = displayValue;
          }
        }

        tr.appendChild(td);
      });

      // Add titles for truncated cells
      setTimeout(() => {
        const cells = tr.querySelectorAll('td');
        cells.forEach((td, index) => {
          if (index === 0) return;
          if (td.scrollWidth > td.clientWidth && !td.title) {
            const col = columns[index - 1];
            const value = row[col];
            const displayValue = value !== null ? value : '';
            td.title = String(displayValue);
          }
        });
      }, 0);

      // Actions column
      const actionsTd = document.createElement('td');
      actionsTd.innerHTML = `
        <button class="btn btn-small btn-edit" data-row="${encodeURIComponent(JSON.stringify(row))}">Edit</button>
      `;
      tr.appendChild(actionsTd);
      tableBody.appendChild(tr);
    });

    // Add event listeners to new edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      if (!btn.hasAttribute('data-listener-attached')) {
        btn.setAttribute('data-listener-attached', 'true');
        btn.addEventListener('click', (e) => {
          const row = JSON.parse(decodeURIComponent(e.target.getAttribute('data-row')));
          editRecord(row);
        });
      }
    });

    // Re-setup checkboxes for new rows
    setupCheckboxes();
  }

  // Setup checkbox functionality
  function setupCheckboxes() {
    const selectAll = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox:not(#selectAll)');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const selectedCountSpan = document.getElementById('selectedCount');

    // Select all functionality
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        rowCheckboxes.forEach(cb => {
          cb.checked = e.target.checked;
        });
        updateDeleteButton();
      });
    }

    // Individual checkbox change
    rowCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        updateDeleteButton();

        // Update select all checkbox
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);
        const someChecked = Array.from(rowCheckboxes).some(checkbox => checkbox.checked);

        if (selectAll) {
          selectAll.checked = allChecked;
          selectAll.indeterminate = someChecked && !allChecked;
        }
      });
    });

    // Update delete and clone button states
    function updateDeleteButton() {
      const checkedCount = Array.from(rowCheckboxes).filter(cb => cb.checked).length;
      deleteSelectedBtn.disabled = checkedCount === 0;
      cloneRecordBtn.disabled = checkedCount !== 1; // Enable only when exactly 1 row is selected
      if (selectedCountSpan) {
        selectedCountSpan.textContent = checkedCount;
      }
    }

    // Initialize button state
    updateDeleteButton();
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

  // Toggle filter dropdown for a column
  function toggleFilterDropdown(column, iconElement) {
    console.log('Toggle filter dropdown for column:', column);

    // Close any existing dropdown
    if (activeFilterDropdown) {
      activeFilterDropdown.remove();
      activeFilterDropdown = null;
      document.removeEventListener('click', handleClickOutside);
      return; // Just close if one is already open
    }

    // Always use search filter type
    const filterType = 'search';
    console.log('Creating search filter for column:', column);

    // Create dropdown
    const dropdown = createFilterDropdown(column, filterType);

    // Use fixed positioning to escape table-wrapper overflow
    const th = iconElement.closest('th');
    const rect = th.getBoundingClientRect();

    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 8}px`;
    dropdown.style.left = `${rect.left}px`;

    // Append to body instead of th
    document.body.appendChild(dropdown);

    activeFilterDropdown = dropdown;
    console.log('Dropdown created and appended to body');

    // Close dropdown when clicking outside (after a small delay)
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
  }

  // Handle click outside dropdown
  function handleClickOutside(e) {
    if (!activeFilterDropdown) return;

    // Check if click is inside dropdown
    const isInsideDropdown = activeFilterDropdown.contains(e.target);

    // Check if click is on filter icon
    const isFilterIcon = e.target.closest('.filter-icon');

    // Close if clicked outside
    if (!isInsideDropdown && !isFilterIcon) {
      activeFilterDropdown.remove();
      activeFilterDropdown = null;
      document.removeEventListener('click', handleClickOutside);
    }
  }

  // Create filter dropdown HTML
  function createFilterDropdown(column, filterType) {
    const dropdown = document.createElement('div');
    dropdown.className = 'filter-dropdown';

    // Get current filter for this column
    const currentFilter = columnFilters[column];
    const currentSearchText = currentFilter?.searchText || '';

    // Simple dropdown with search input, clear button (eraser icon), and close button
    dropdown.innerHTML = `
      <div class="filter-search">
        <input type="text" class="filter-search-input" placeholder="Filter..." value="${currentSearchText}" data-column="${column}" autofocus>
        <button class="filter-clear ${currentSearchText ? 'has-text' : ''}" title="Clear filter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path>
            <path d="M22 11l-4-4"></path>
            <path d="M4.5 16.5L3 18"></path>
          </svg>
        </button>
        <button class="filter-close" title="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    // Setup event listeners
    setupFilterDropdownListeners(dropdown, column, filterType);

    return dropdown;
  }

  // Setup event listeners for filter dropdown
  function setupFilterDropdownListeners(dropdown, column, filterType) {
    // Stop propagation of clicks inside dropdown to prevent closing
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const searchInput = dropdown.querySelector('.filter-search-input');
    const clearBtn = dropdown.querySelector('.filter-clear');
    const closeBtn = dropdown.querySelector('.filter-close');

    // Clear button - empty the input and remove has-text class
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      searchInput.value = '';
      clearBtn.classList.remove('has-text');

      // Remove filter
      delete columnFilters[column];

      // Update filter icon appearance in header
      updateFilterIconState(column);

      // Apply filters and re-render
      applyAllFilters();

      // Focus back on input
      searchInput.focus();
    });

    // Close button
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.remove();
      activeFilterDropdown = null;
      document.removeEventListener('click', handleClickOutside);
    });

    // Search input - apply filter automatically with debounce
    if (searchInput) {
      // Apply filter automatically while typing (with debounce)
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        const currentValue = searchInput.value.trim();

        // Toggle has-text class based on input value
        if (searchInput.value) {
          clearBtn.classList.add('has-text');
        } else {
          clearBtn.classList.remove('has-text');
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          // Apply or remove filter based on current value
          if (currentValue) {
            columnFilters[column] = {
              type: 'search',
              searchText: currentValue
            };
          } else {
            delete columnFilters[column];
          }

          // Update filter icon appearance in header
          updateFilterIconState(column);

          // Apply filters and re-render
          applyAllFilters();
        }, 300); // 300ms debounce
      });
    }
  }

  // Apply column filter
  function applyColumnFilter(column, filterType, dropdown) {
    if (filterType === 'checkbox') {
      const checkedBoxes = dropdown.querySelectorAll('.filter-option input[type="checkbox"]:checked');
      const selectedValues = Array.from(checkedBoxes).map(cb => cb.value);

      if (selectedValues.length > 0) {
        columnFilters[column] = {
          type: 'checkbox',
          values: selectedValues
        };
      } else {
        delete columnFilters[column];
      }
    } else {
      const searchInput = dropdown.querySelector('.filter-search-input');
      const searchText = searchInput.value.trim();

      if (searchText) {
        columnFilters[column] = {
          type: 'search',
          searchText: searchText
        };
      } else {
        delete columnFilters[column];
      }
    }

    // Update filter icon appearance in header
    updateFilterIconState(column);

    // Apply filters and re-render
    applyAllFilters();
  }

  // Update filter icon state (active/inactive)
  function updateFilterIconState(column) {
    const filterIcon = document.querySelector(`.filter-icon[data-column="${column}"]`);
    if (filterIcon) {
      if (columnFilters[column]) {
        filterIcon.classList.add('active');
      } else {
        filterIcon.classList.remove('active');
      }
    }
  }

  // Clear filter for a column
  function clearColumnFilter(column) {
    delete columnFilters[column];
    applyAllFilters();
  }

  // Apply all active filters to tableData
  function applyAllFilters() {
    // Start with ALL original unfiltered data
    let filteredData = [...originalTableData];

    // Apply each column filter
    Object.keys(columnFilters).forEach(column => {
      const filter = columnFilters[column];

      if (filter.type === 'checkbox') {
        filteredData = filteredData.filter(row => {
          const value = row[column];
          return filter.values.includes(String(value));
        });
      } else if (filter.type === 'search') {
        filteredData = filteredData.filter(row => {
          const value = String(row[column] || '').toLowerCase();
          return value.includes(filter.searchText.toLowerCase());
        });
      }
    });

    // Re-render table with filtered data
    // We need to temporarily store original data and use filtered data for rendering
    renderTableWithFilteredData(filteredData);
  }

  // Render table with filtered data
  function renderTableWithFilteredData(filteredData) {
    // Temporarily replace tableData with filtered data for rendering
    const previousTableData = tableData;
    tableData = filteredData;

    // Always update message to show current record count
    if (Object.keys(columnFilters).length > 0) {
      // Show filtered count
      showMessage(`Showing ${filteredData.length} of ${originalTableData.length} records (filtered)`, 'info');
    } else {
      // Show unfiltered count - include total if using pagination
      if (filteredData.length < totalRecordCount) {
        showMessage(`Showing ${filteredData.length} of ${totalRecordCount} records`, 'info');
      } else {
        showMessage(`Showing ${filteredData.length} records`, 'info');
      }
    }

    // Only render table body, not header (to preserve active dropdown)
    renderTableBody();

    // Restore previous tableData
    tableData = previousTableData;
  }

  // Render only table body (used when filtering to preserve header dropdowns)
  function renderTableBody() {
    if (tableData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="100" style="text-align: center;">No data matches the filters</td></tr>';
      return;
    }

    // Get hidden columns from configuration
    const hiddenColsForTable = COLUMN_CONFIG.alwaysHidden
      .filter(config => config.table === '*' || config.table.toLowerCase() === selectedTable.refTable.toLowerCase())
      .map(config => config.column);

    const columns = Object.keys(tableData[0]).filter(col => {
      if (hiddenColsForTable.some(hidden => hidden.toLowerCase() === col.toLowerCase())) return false;
      const helperColumns = ['DisciplineCode', 'Code_DisciplineCode', 'DisciplineValue', 'GenderCode', 'EventCode',
        'SportCode', 'VenueCodeValue', 'CountryCodeValue', 'ContinentCodeValue', 'PartecipationFlagCode',
        'TypeCode', 'PhaseTypeCode', 'CompetitionTypeCode', 'ProgressionTypeCode', 'Schedule_TypesCode',
        'MedalCountCode', 'NonSportFlagCode', 'ScheduledFlagCode', 'TeamEventCode', 'ScheduleFlagCode',
        'CompetitionFlagCode', 'EventOrderCode', 'IntFedCode', 'ParticCode', 'ResultsCode', 'CategoryCode',
        'Indoor_OutdoorCode', 'CodeValue', 'WeatherRegionCode'];
      return !helperColumns.includes(col);
    });

    // Render rows only
    tableBody.innerHTML = '';
    tableData.forEach(row => {
      const tr = document.createElement('tr');

      // Add checkbox column
      const checkboxTd = document.createElement('td');
      checkboxTd.className = 'checkbox-col';
      const rowData = encodeURIComponent(JSON.stringify(row));
      checkboxTd.innerHTML = `<input type="checkbox" class="row-checkbox" data-row="${rowData}">`;
      tr.appendChild(checkboxTd);

      columns.forEach(col => {
        const td = document.createElement('td');
        let value = row[col];

        // Format dates
        if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/))) {
          value = formatDate(value);
        }

        td.textContent = value !== null && value !== undefined ? value : '';
        tr.appendChild(td);
      });

      // Actions column (only Edit button, matching renderTable format)
      const actionsTd = document.createElement('td');
      actionsTd.innerHTML = `
        <button class="btn btn-small btn-edit" data-row="${encodeURIComponent(JSON.stringify(row))}">Edit</button>
      `;
      tr.appendChild(actionsTd);
      tableBody.appendChild(tr);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = JSON.parse(decodeURIComponent(e.target.getAttribute('data-row')));
        editRecord(row);
      });
    });
  }

  // Delete selected records
  async function deleteSelectedRecords() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:not(#selectAll):checked');

    if (checkedBoxes.length === 0) {
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete ${checkedBoxes.length} record(s)?`);
    if (!confirmed) return;

    showLoading(true);

    try {
      const deletePromises = Array.from(checkedBoxes).map(async (checkbox) => {
        const row = JSON.parse(decodeURIComponent(checkbox.getAttribute('data-row')));

        // Extract primary key values from row using tableStructure
        const pkData = {};

        // Get primary key columns from structure
        // tableStructure might be {columns: [...]} or just [...]
        const structureArray = Array.isArray(tableStructure) ? tableStructure : (tableStructure?.columns || []);

        if (structureArray.length > 0) {
          const pkColumns = structureArray
            .filter(col => col.IS_PRIMARY_KEY === 1)
            .map(col => col.COLUMN_NAME);

          // Extract PK values from row data
          pkColumns.forEach(pkCol => {
            // For lookup columns (Discipline, Gender, Event, Code_Discipline, WeatherRegion), use the Code version if available
            if (pkCol === 'Discipline' && row['DisciplineCode'] !== undefined) {
              pkData[pkCol] = row['DisciplineCode'];
            } else if (pkCol === 'Code_Discipline' && row['Code_DisciplineCode'] !== undefined) {
              pkData[pkCol] = row['Code_DisciplineCode'];
            } else if (pkCol === 'Gender' && row['GenderCode'] !== undefined) {
              pkData[pkCol] = row['GenderCode'];
            } else if (pkCol === 'Event' && row['EventCode'] !== undefined) {
              pkData[pkCol] = row['EventCode'];
            } else if (pkCol === 'WeatherRegion' && row['WeatherRegionCode'] !== undefined) {
              pkData[pkCol] = row['WeatherRegionCode'];
            } else if (row[pkCol] !== undefined) {
              pkData[pkCol] = row[pkCol];
            }
          });
        } else {
          // Fallback: extract all columns that look like primary keys
          Object.keys(row).forEach(key => {
            // Exclude system columns and lookup codes
            if (key === 'UserId' || key === 'Data_Ins' || key === 'Data_upd' ||
                key === 'DisciplineCode' || key === 'Code_DisciplineCode' ||
                key === 'GenderCode' || key === 'EventCode') {
              return;
            }
            // Include likely PK columns
            if (key.endsWith('Code') || key.endsWith('_Code') || key === 'Code' ||
                key.endsWith('Id') || key.endsWith('_Id') || key === 'Id' ||
                key === 'Discipline' || key === 'Gender' || key === 'Event' ||
                key === 'Code_Discipline' ||
                key === 'Phase' || key === 'Unit' || key === 'Class') {
              // For Discipline/Gender/Event/Code_Discipline, use the Code version
              if (key === 'Discipline' && row['DisciplineCode']) {
                pkData[key] = row['DisciplineCode'];
              } else if (key === 'Code_Discipline' && row['Code_DisciplineCode']) {
                pkData[key] = row['Code_DisciplineCode'];
              } else if (key === 'Gender' && row['GenderCode']) {
                pkData[key] = row['GenderCode'];
              } else if (key === 'Event' && row['EventCode']) {
                pkData[key] = row['EventCode'];
              } else {
                pkData[key] = row[key];
              }
            }
          });
        }

        console.log('=== DELETE DEBUG ===');
        console.log('pkData:', pkData);
        console.log('tableStructure:', tableStructure);
        console.log('row data:', row);
        console.log('==================');

        const response = await fetch('/api/commoncodes/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spName: selectedTable.spDelete,
            data: pkData
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Delete failed');
        }

        return response.json();
      });

      await Promise.all(deletePromises);

      showMessage(`Successfully deleted ${checkedBoxes.length} record(s)`, 'success');
      invalidateLookupCaches(); // Invalidate caches before reloading
      await loadTableData();
    } catch (error) {
      console.error('Error deleting records:', error);
      showMessage('Error deleting some records: ' + error.message, 'error');
      await loadTableData(); // Refresh to show current state
    } finally {
      showLoading(false);
    }
  }

  // Add record
  async function addRecord() {
    if (!selectedTable) return;

    // Get table structure to build form
    showLoading(true);
    try {
      const response = await fetch(`/api/commoncodes/structure/${selectedTable.refTable}`);
      const data = await response.json();

      if (response.ok) {
        await showRecordModal('Add', data.columns, null);
      } else {
        showMessage(data.error || 'Error loading table structure', 'error');
      }
    } catch (error) {
      console.error('Error loading table structure:', error);
      showMessage('Error loading table structure', 'error');
    } finally {
      showLoading(false);
    }
  }

  // Clone record
  async function cloneRecord() {
    if (!selectedTable) return;

    // Get the selected checkbox
    const checkedBoxes = document.querySelectorAll('.row-checkbox:not(#selectAll):checked');

    if (checkedBoxes.length !== 1) {
      showMessage('Please select exactly one record to clone', 'error');
      return;
    }

    // Get the row data
    const row = JSON.parse(decodeURIComponent(checkedBoxes[0].getAttribute('data-row')));

    // Get table structure to build form
    showLoading(true);
    try {
      const response = await fetch(`/api/commoncodes/structure/${selectedTable.refTable}`);
      const data = await response.json();

      if (response.ok) {
        // Call showRecordModal with 'Add' mode but with row data (to populate form)
        await showRecordModal('Add', data.columns, row);
      } else {
        showMessage(data.error || 'Error loading table structure', 'error');
      }
    } catch (error) {
      console.error('Error loading table structure:', error);
      showMessage('Error loading table structure', 'error');
    } finally {
      showLoading(false);
    }
  }

  // Edit record
  async function editRecord(row) {
    if (!selectedTable) return;

    // Get table structure to build form
    showLoading(true);
    try {
      const response = await fetch(`/api/commoncodes/structure/${selectedTable.refTable}`);
      const data = await response.json();

      if (response.ok) {
        await showRecordModal('Edit', data.columns, row);
      } else {
        showMessage(data.error || 'Error loading table structure', 'error');
      }
    } catch (error) {
      console.error('Error loading table structure:', error);
      showMessage('Error loading table structure', 'error');
    } finally {
      showLoading(false);
    }
  }

  // Delete record
  async function deleteRecord(row) {
    const confirmed = confirm('Are you sure you want to delete this record?');
    if (!confirmed) return;

    showLoading(true);
    try {
      // Extract primary key values from row
      const pkData = {};
      Object.keys(row).forEach(key => {
        // Primary keys typically end with Code or Id, or are named Code/Id
        if (key.endsWith('Code') || key.endsWith('_Code') || key === 'Code' ||
            key.endsWith('Id') || key.endsWith('_Id') || key === 'Id') {
          pkData[key] = row[key];
        }
      });

      const response = await fetch('/api/commoncodes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spName: selectedTable.spDelete,
          data: pkData
        })
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('Record deleted successfully', 'success');
        invalidateLookupCaches(); // Invalidate caches before reloading
        await loadTableData();
      } else {
        showMessage(result.error || 'Error deleting record', 'error');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      showMessage('Error deleting record', 'error');
    } finally {
      showLoading(false);
    }
  }

  // Show modal for add/edit record
  async function showRecordModal(mode, columns, rowData) {
    // Load Discipline list if any column is named "Discipline", "DisciplineCode", "Code_Discipline", or "Discipline_Code"
    const hasDisciplineColumn = columns.some(col => col.COLUMN_NAME === 'Discipline' || col.COLUMN_NAME === 'DisciplineCode' || col.COLUMN_NAME === 'Code_Discipline' || col.COLUMN_NAME === 'Discipline_Code');
    let disciplines = [];
    if (hasDisciplineColumn) {
      disciplines = await loadDisciplineList();
    }

    // Load SportGender list if any column is named "Gender" (except for DisciplineGender table)
    const hasGenderColumn = columns.some(col => col.COLUMN_NAME === 'Gender');
    let sportGenders = [];
    if (hasGenderColumn && selectedTable.refTable !== 'DisciplineGender') {
      sportGenders = await loadSportGenderList();
    }

    // Load Sport list if any column is named "Sport" or "SportCode"
    const hasSportColumn = columns.some(col => col.COLUMN_NAME === 'Sport' || col.COLUMN_NAME === 'SportCode');
    let sports = [];
    if (hasSportColumn) {
      sports = await loadSportList();
    }

    // Load Event list if any column is named "Event" (except for Event table)
    const hasEventColumn = columns.some(col => col.COLUMN_NAME === 'Event');
    let events = [];
    if (hasEventColumn && selectedTable.refTable !== 'Event') {
      events = await loadEventList();
    }

    // Load Event list if any column is named "EventCode" (for Record table)
    const hasEventCodeColumn = columns.some(col => col.COLUMN_NAME === 'EventCode');
    if (hasEventCodeColumn && selectedTable.refTable === 'Record') {
      events = await loadEventList();
    }

    // Load Phase list if any column is named "Phase" (except for Phase table)
    const hasPhaseColumn = columns.some(col => col.COLUMN_NAME === 'Phase');
    let phases = [];
    if (hasPhaseColumn && selectedTable.refTable !== 'Phase') {
      phases = await loadPhaseList();
    }

    // Load EventUnitType list if any column is named "UnitTypeFlag"
    const hasUnitTypeFlagColumn = columns.some(col => col.COLUMN_NAME === 'UnitTypeFlag');
    let eventUnitTypes = [];
    if (hasUnitTypeFlagColumn) {
      eventUnitTypes = await loadEventUnitTypeList();
    }

    // Load Venue list if any column is named "VenueCode"
    const hasVenueCodeColumn = columns.some(col => col.COLUMN_NAME === 'VenueCode');
    let venues = [];
    if (hasVenueCodeColumn) {
      venues = await loadVenueList();
    }

    // Load Country list if any column is named "CountryCode"
    const hasCountryCodeColumn = columns.some(col => col.COLUMN_NAME === 'CountryCode');
    let countries = [];
    if (hasCountryCodeColumn) {
      countries = await loadCountryList();
    }

    // Load Continent list if any column is named "ContinentCode"
    const hasContinentCodeColumn = columns.some(col => col.COLUMN_NAME === 'ContinentCode');
    let continents = [];
    if (hasContinentCodeColumn) {
      continents = await loadContinentList();
    }

    // Load Participation Flag list if any column is named "PartecipationFlag"
    const hasPartecipationFlagColumn = columns.some(col => col.COLUMN_NAME === 'PartecipationFlag');
    let participationFlags = [];
    if (hasPartecipationFlagColumn) {
      participationFlags = await loadParticipationFlagList();
    }

    // Load OrganisationType list if any column is named "Type" (for Organisation table)
    const hasTypeColumn = columns.some(col => col.COLUMN_NAME === 'Type');
    let organisationTypes = [];
    if (hasTypeColumn && selectedTable.refTable === 'Organisation') {
      organisationTypes = await loadOrganisationTypeList();
    }

    // Load PhaseType list if any column is named "PhaseType" (for Phase table)
    const hasPhaseTypeColumn = columns.some(col => col.COLUMN_NAME === 'PhaseType');
    let phaseTypes = [];
    if (hasPhaseTypeColumn && selectedTable.refTable === 'Phase') {
      phaseTypes = await loadPhaseTypeList();
    }

    // Load CompetitionFormatType list if any column is named "CompetitionType" (for Phase table)
    const hasCompetitionTypeColumn = columns.some(col => col.COLUMN_NAME === 'CompetitionType');
    let competitionFormatTypes = [];
    if (hasCompetitionTypeColumn && selectedTable.refTable === 'Phase') {
      competitionFormatTypes = await loadCompetitionFormatTypeList();
    }

    // Load ProgressionType list if any column is named "ProgressionType" (for Phase table)
    const hasProgressionTypeColumn = columns.some(col => col.COLUMN_NAME === 'ProgressionType');
    let progressionTypes = [];
    if (hasProgressionTypeColumn && selectedTable.refTable === 'Phase') {
      progressionTypes = await loadProgressionTypeList();
    }

    // Load Schedule Types list if any column is named "Schedule_Types" (for PhaseType table)
    const hasScheduleTypesColumn = columns.some(col => col.COLUMN_NAME === 'Schedule_Types');
    let scheduleTypes = [];
    if (hasScheduleTypesColumn && selectedTable.refTable === 'PhaseType') {
      scheduleTypes = await loadScheduleTypesList();
    }

    // Load Indoor_Outdoor list if any column is named "Indoor_Outdoor" (for Venue table)
    const hasIndoorOutdoorColumn = columns.some(col => col.COLUMN_NAME === 'Indoor_Outdoor');
    let indoorOutdoors = [];
    if (hasIndoorOutdoorColumn && selectedTable.refTable === 'Venue') {
      indoorOutdoors = await loadIndoorOutdoorList();
    }

    // Load Venue and WeatherRegion lists for VenueWeatherRegion table
    let venuesForVWR = [];
    let weatherRegions = [];
    if (selectedTable.refTable === 'VenueWeatherRegion') {
      venuesForVWR = await loadVenueList();
      weatherRegions = await loadWeatherRegionList();
    }

    // Load YesNo list for flag columns (NonSportFlag, ScheduledFlag, TeamEvent, CompetitionFlag, MedalCount)
    const yesNoColumns = ['NonSportFlag', 'ScheduledFlag', 'TeamEvent', 'ScheduleFlag', 'CompetitionFlag', 'Partic', 'Results', 'MedalCount'];
    const hasYesNoColumn = columns.some(col => yesNoColumns.includes(col.COLUMN_NAME));
    let yesNoValues = [];
    if (hasYesNoColumn) {
      yesNoValues = await loadYesNoList();
    }

    // Load EventOrder list if any column is named "EventOrder"
    const hasEventOrderColumn = columns.some(col => col.COLUMN_NAME === 'EventOrder');
    let eventOrders = [];
    if (hasEventOrderColumn) {
      eventOrders = await loadEventOrderList();
    }

    // Load IntFed list if any column is named "IntFed"
    const hasIntFedColumn = columns.some(col => col.COLUMN_NAME === 'IntFed');
    let intFeds = [];
    if (hasIntFedColumn) {
      intFeds = await loadIntFedList();
    }

    // Load FunctionCategory list if any column is named "Category"
    const hasCategoryColumn = columns.some(col => col.COLUMN_NAME === 'Category');
    let categories = [];
    if (hasCategoryColumn) {
      categories = await loadFunctionCategoryList();
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'recordModal';

    // Filter out system columns and helper codes (DisciplineCode/GenderCode/EventCode/SportCode/YesNoFlagCodes)
    // BUT keep DisciplineCode/GenderCode/EventCode/SportCode if they are the ONLY column (no Discipline/Gender/Event/Sport column exists)
    const hasDisciplineCol = columns.some(col => col.COLUMN_NAME === 'Discipline' || col.COLUMN_NAME === 'Code_Discipline' || col.COLUMN_NAME === 'Discipline_Code');
    const hasGenderCol = columns.some(col => col.COLUMN_NAME === 'Gender');
    const hasEventCol = columns.some(col => col.COLUMN_NAME === 'Event');
    const hasEventCodeCol = columns.some(col => col.COLUMN_NAME === 'EventCode' && selectedTable.refTable === 'Record');
    const hasSportCol = columns.some(col => col.COLUMN_NAME === 'Sport');
    const hasVenueCodeCol = columns.some(col => col.COLUMN_NAME === 'VenueCode');
    const hasCountryCodeCol = columns.some(col => col.COLUMN_NAME === 'CountryCode');
    const hasContinentCodeCol = columns.some(col => col.COLUMN_NAME === 'ContinentCode');
    const hasPartecipationFlagCol = columns.some(col => col.COLUMN_NAME === 'PartecipationFlag');
    const hasTypeCol = columns.some(col => col.COLUMN_NAME === 'Type' && selectedTable.refTable === 'Organisation');
    const hasPhaseTypeCol = columns.some(col => col.COLUMN_NAME === 'PhaseType' && selectedTable.refTable === 'Phase');
    const hasCompetitionTypeCol = columns.some(col => col.COLUMN_NAME === 'CompetitionType' && selectedTable.refTable === 'Phase');
    const hasProgressionTypeCol = columns.some(col => col.COLUMN_NAME === 'ProgressionType' && selectedTable.refTable === 'Phase');
    const hasScheduleTypesCol = columns.some(col => col.COLUMN_NAME === 'Schedule_Types' && selectedTable.refTable === 'PhaseType');
    const hasIndoorOutdoorCol = columns.some(col => col.COLUMN_NAME === 'Indoor_Outdoor' && selectedTable.refTable === 'Venue');
    const hasNonSportFlagCol = columns.some(col => col.COLUMN_NAME === 'NonSportFlag');
    const hasScheduledFlagCol = columns.some(col => col.COLUMN_NAME === 'ScheduledFlag');
    const hasTeamEventCol = columns.some(col => col.COLUMN_NAME === 'TeamEvent');
    const hasScheduleFlagCol = columns.some(col => col.COLUMN_NAME === 'ScheduleFlag');
    const hasCompetitionFlagCol = columns.some(col => col.COLUMN_NAME === 'CompetitionFlag');
    const hasEventOrderCol = columns.some(col => col.COLUMN_NAME === 'EventOrder');
    const hasIntFedCol = columns.some(col => col.COLUMN_NAME === 'IntFed');
    const hasParticCol = columns.some(col => col.COLUMN_NAME === 'Partic');
    const hasResultsCol = columns.some(col => col.COLUMN_NAME === 'Results');
    const hasCategoryCol = columns.some(col => col.COLUMN_NAME === 'Category');
    const hasMedalCountCol = columns.some(col => col.COLUMN_NAME === 'MedalCount');

    // Get list of columns to hide from configuration (do this once, not in every filter iteration)
    console.log('DEBUG - Selected table:', selectedTable.refTable);
    console.log('DEBUG - All rules:', COLUMN_CONFIG.alwaysHidden.map(c => `${c.table}.${c.column}`));
    const hiddenColumns = COLUMN_CONFIG.alwaysHidden
      .filter(config => config.table === '*' || config.table.toLowerCase() === selectedTable.refTable.toLowerCase())
      .map(config => config.column);
    console.log('DEBUG - Hidden columns:', hiddenColumns);

    const editableColumns = columns.filter(col => {
      // Always exclude columns configured in column-config.js (system-managed columns)
      // Case-insensitive comparison for column names
      if (hiddenColumns.some(hidden => hidden.toLowerCase() === col.COLUMN_NAME.toLowerCase())) return false;

      // Exclude helper codes only if the main column exists
      if (col.COLUMN_NAME === 'DisciplineCode' && hasDisciplineCol) return false;
      if (col.COLUMN_NAME === 'Code_DisciplineCode') return false;  // Always hide this helper column
      if (col.COLUMN_NAME === 'GenderCode' && hasGenderCol) return false;
      if (col.COLUMN_NAME === 'EventCode' && hasEventCol) return false;
      if (col.COLUMN_NAME === 'SportCode' && hasSportCol) return false;
      if (col.COLUMN_NAME === 'VenueCodeValue') return false;  // Always hide this helper column
      if (col.COLUMN_NAME === 'DisciplineValue') return false;  // Always hide this helper column
      if (col.COLUMN_NAME === 'CountryCodeValue') return false;  // Always hide this helper column
      if (col.COLUMN_NAME === 'ContinentCodeValue') return false;  // Always hide this helper column
      if (col.COLUMN_NAME === 'CodeValue') return false;  // Always hide this helper column (VenueWeatherRegion)
      if (col.COLUMN_NAME === 'WeatherRegionCode') return false;  // Always hide this helper column (VenueWeatherRegion)
      if (col.COLUMN_NAME === 'PartecipationFlagCode' && hasPartecipationFlagCol) return false;
      if (col.COLUMN_NAME === 'TypeCode' && hasTypeCol) return false;
      if (col.COLUMN_NAME === 'PhaseTypeCode' && hasPhaseTypeCol) return false;
      if (col.COLUMN_NAME === 'CompetitionTypeCode' && hasCompetitionTypeCol) return false;
      if (col.COLUMN_NAME === 'ProgressionTypeCode' && hasProgressionTypeCol) return false;
      if (col.COLUMN_NAME === 'Schedule_TypesCode' && hasScheduleTypesCol) return false;
      if (col.COLUMN_NAME === 'Indoor_OutdoorCode' && hasIndoorOutdoorCol) return false;
      if (col.COLUMN_NAME === 'NonSportFlagCode' && hasNonSportFlagCol) return false;
      if (col.COLUMN_NAME === 'ScheduledFlagCode' && hasScheduledFlagCol) return false;
      if (col.COLUMN_NAME === 'TeamEventCode' && hasTeamEventCol) return false;
      if (col.COLUMN_NAME === 'ScheduleFlagCode' && hasScheduleFlagCol) return false;
      if (col.COLUMN_NAME === 'CompetitionFlagCode' && hasCompetitionFlagCol) return false;
      if (col.COLUMN_NAME === 'EventOrderCode' && hasEventOrderCol) return false;
      if (col.COLUMN_NAME === 'IntFedCode' && hasIntFedCol) return false;
      if (col.COLUMN_NAME === 'ParticCode' && hasParticCol) return false;
      if (col.COLUMN_NAME === 'ResultsCode' && hasResultsCol) return false;
      if (col.COLUMN_NAME === 'CategoryCode' && hasCategoryCol) return false;
      if (col.COLUMN_NAME === 'MedalCountCode' && hasMedalCountCol) return false;

      return true;
    });

    // Build form fields
    let formFields = '';

    // First, check if RSC_Code exists and generate it first
    const rscCodeColumn = editableColumns.find(col => col.COLUMN_NAME === 'RSC_Code');
    if (rscCodeColumn) {
      const value = rowData ? (rowData['RSC_Code'] || '') : '';
      const isPK = rscCodeColumn.IS_PRIMARY_KEY;
      const isRequired = isPK ? (mode === 'Add') : (rscCodeColumn.IS_NULLABLE === 'NO');

      // RSC_Code will be shown separately outside the scrollable form
      // Just store it as a hidden field in the form
      formFields += `
        <input type="hidden" id="field_RSC_Code" name="RSC_Code" value="${escapeAttr(value)}">
      `;
    }

    // Then generate all other fields (excluding RSC_Code)
    editableColumns.filter(col => col.COLUMN_NAME !== 'RSC_Code').forEach(col => {
      const value = rowData ? (rowData[col.COLUMN_NAME] || '') : '';
      const isPK = col.IS_PRIMARY_KEY;
      // PK fields are required in Add mode, other fields follow IS_NULLABLE rule
      const isRequired = isPK ? (mode === 'Add') : (col.IS_NULLABLE === 'NO');
      const isDisabled = (mode === 'Edit' && isPK) ? 'disabled' : '';

      // Check if this is a Discipline column - create dropdown
      if (col.COLUMN_NAME === 'Discipline' || col.COLUMN_NAME === 'DisciplineCode' || col.COLUMN_NAME === 'Code_Discipline' || col.COLUMN_NAME === 'Discipline_Code') {
        // Use DisciplineCode/Code_DisciplineCode/DisciplineValue from rowData for matching, or the column itself if it's a code column
        const disciplineCodeValue = rowData ? (rowData['DisciplineValue'] || rowData['DisciplineCode'] || rowData['Code_DisciplineCode'] || rowData['Code_Discipline'] || rowData['Discipline_Code'] || rowData['Discipline'] || '') : '';
        let options = '<option value="">-- Select Discipline --</option>';
        disciplines.forEach(disc => {
          const selected = disc.Code === disciplineCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(disc.Code)}" ${selected}>${escapeHtml(disc.Code)} - ${escapeHtml(disc.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'Gender' && selectedTable.refTable !== 'DisciplineGender') {
        // Check if this is a Gender column - create dropdown
        // EXCEPT for DisciplineGender table where Gender is part of PK and should be a text field
        const genderCodeValue = rowData ? (rowData['GenderCode'] || rowData['Gender'] || '') : '';

        // Check if Discipline field exists in this form (for cascade dropdown)
        const hasDisciplineField = editableColumns.some(c => c.COLUMN_NAME === 'Discipline');

        let options = '<option value="">-- Select Gender --</option>';
        // Only populate options initially if NOT depending on Discipline, or in Edit mode
        if (!hasDisciplineField || rowData) {
          sportGenders.forEach(gender => {
            const selected = gender.Code === genderCodeValue ? 'selected' : '';
            options += `<option value="${escapeHtml(gender.Code)}" ${selected}>${escapeHtml(gender.Code)} - ${escapeHtml(gender.Description)}</option>`;
          });
        }
        // If hasDisciplineField and Add mode: leave empty, will be populated by cascade logic

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
              ${hasDisciplineField ? 'data-depends-on="Discipline"' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'Sport' || col.COLUMN_NAME === 'SportCode') {
        // Check if this is a Sport column - create dropdown
        // Use SportCode from rowData for matching, or Sport if SportCode doesn't exist
        const sportCodeValue = rowData ? (rowData['SportCode'] || rowData['Sport'] || '') : '';
        let options = '<option value="">-- Select Sport --</option>';
        sports.forEach(sport => {
          const selected = sport.Code === sportCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(sport.Code)}" ${selected}>${escapeHtml(sport.Code)} - ${escapeHtml(sport.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'Event' && selectedTable.refTable !== 'Event') {
        // Check if this is an Event column - create dropdown
        // EXCEPT for Event table where Event is part of PK and should be a text field
        const eventCodeValue = rowData ? (rowData['EventCode'] || rowData['Event'] || '') : '';

        // Check if Discipline and Gender fields exist (for cascade dropdown)
        const hasDisciplineAndGenderFields = editableColumns.some(c => c.COLUMN_NAME === 'Discipline') &&
                                              editableColumns.some(c => c.COLUMN_NAME === 'Gender');

        let options = '<option value="">-- Select Event --</option>';

        // Only populate options initially if NOT depending on Discipline/Gender, or in Edit mode
        if (!hasDisciplineAndGenderFields || rowData) {
          // Get Discipline and Gender codes for more precise matching (Event table has composite key)
          const disciplineCodeValue = rowData ? (rowData['DisciplineCode'] || rowData['Discipline'] || '') : '';
          const genderCodeValue = rowData ? (rowData['GenderCode'] || rowData['Gender'] || '') : '';

          // Normalize event codes: trim and remove trailing dashes, but keep if only dashes exist
          const normalizeEventCode = (code) => {
            if (!code) return '';
            const trimmed = code.trim();
            // If it's only dashes, keep it as is
            if (/^-+$/.test(trimmed)) return trimmed;
            // Otherwise remove trailing dashes
            return trimmed.replace(/-+$/, '');
          };

          const normalizedEventCodeValue = normalizeEventCode(eventCodeValue);
          const normalizedDisciplineCodeValue = normalizeEventCode(disciplineCodeValue);
          const normalizedGenderCodeValue = normalizeEventCode(genderCodeValue);

          events.forEach(event => {
            const normalizedEventCode = normalizeEventCode(event.Event);
            const normalizedDiscipline = normalizeEventCode(event.DisciplineCode);
            const normalizedGender = normalizeEventCode(event.GenderCode);

            // Match by Event code AND Discipline AND Gender (composite key)
            const selected = normalizedEventCode === normalizedEventCodeValue &&
                            normalizedDiscipline === normalizedDisciplineCodeValue &&
                            normalizedGender === normalizedGenderCodeValue ? 'selected' : '';

            // Show Discipline and Gender in dropdown to help user select correct event
            const eventLabel = `${event.Event} - ${event.Description} (${event.Discipline || 'N/A'} / ${event.Gender || 'N/A'})`;
            options += `<option value="${escapeHtml(event.Event)}" ${selected}>${escapeHtml(eventLabel)}</option>`;
          });
        }
        // If hasDisciplineAndGenderFields and Add mode: leave empty, will be populated by cascade logic

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
              ${hasDisciplineAndGenderFields ? 'data-depends-on="Discipline,Gender"' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'EventCode' && selectedTable.refTable === 'Record') {
        // Check if this is an EventCode column for Record table - create dropdown
        const eventCodeValue = rowData ? (rowData['EventCode'] || '') : '';
        let options = '<option value="">-- Select Event --</option>';
        events.forEach(event => {
          const selected = event.Event === eventCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(event.Event)}" ${selected}>${escapeHtml(event.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'Phase' && selectedTable.refTable !== 'Phase') {
        // Check if this is a Phase column - create dropdown (except for Phase table)
        // Check if form has Discipline, Gender, and Event fields for cascade dropdown
        const hasDisciplineGenderAndEventFields = editableColumns.some(c => c.COLUMN_NAME === 'Discipline') &&
                                                   editableColumns.some(c => c.COLUMN_NAME === 'Gender') &&
                                                   editableColumns.some(c => c.COLUMN_NAME === 'Event');

        const phaseValue = rowData ? (rowData['Phase'] || '') : '';
        let options = '<option value="">-- Select Phase --</option>';

        // Only populate if NOT depending on Discipline/Gender/Event, or in Edit mode
        if (!hasDisciplineGenderAndEventFields || rowData) {
          phases.forEach(phase => {
            const selected = phase.Phase === phaseValue ? 'selected' : '';
            options += `<option value="${escapeHtml(phase.Phase)}" ${selected}>${escapeHtml(phase.Phase)} - ${escapeHtml(phase.Description)}</option>`;
          });
        }

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
              ${hasDisciplineGenderAndEventFields ? 'data-depends-on="Discipline,Gender,Event"' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'UnitTypeFlag') {
        // Check if this is a UnitTypeFlag column - create dropdown
        const unitTypeFlagValue = rowData ? (rowData['UnitTypeFlag'] || '') : '';
        let options = '<option value="">-- Select Unit Type --</option>';
        eventUnitTypes.forEach(type => {
          const selected = type.Code === unitTypeFlagValue ? 'selected' : '';
          options += `<option value="${escapeHtml(type.Code)}" ${selected}>${escapeHtml(type.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (yesNoColumns.includes(col.COLUMN_NAME)) {
        // Check if this is a YesNo flag column - create dropdown
        const codeColumnName = col.COLUMN_NAME + 'Code';
        const flagValue = rowData ? (rowData[codeColumnName] || rowData[col.COLUMN_NAME] || '') : '';
        let options = '<option value="">-- Select --</option>';
        yesNoValues.forEach(yn => {
          const selected = yn.Code === flagValue ? 'selected' : '';
          options += `<option value="${escapeHtml(yn.Code)}" ${selected}>${escapeHtml(yn.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'EventOrder') {
        // Check if this is an EventOrder column - create dropdown
        const eventOrderCodeValue = rowData ? (rowData['EventOrderCode'] || rowData['EventOrder'] || '') : '';
        let options = '<option value="">-- Select Event Order --</option>';
        eventOrders.forEach(eo => {
          const selected = eo.Code === eventOrderCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(eo.Code)}" ${selected}>${escapeHtml(eo.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'IntFed') {
        // Check if this is an IntFed column - create dropdown
        const intFedCodeValue = rowData ? (rowData['IntFedCode'] || rowData['IntFed'] || '') : '';
        let options = '<option value="">-- Select International Federation --</option>';
        intFeds.forEach(fed => {
          const selected = fed.Code === intFedCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(fed.Code)}" ${selected}>${escapeHtml(fed.Code)} - ${escapeHtml(fed.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'VenueCode') {
        // Check if this is a VenueCode column - create dropdown
        const venueCodeValue = rowData ? (rowData['VenueCodeValue'] || rowData['VenueCode'] || '') : '';
        let options = '<option value="">-- Select Venue --</option>';
        venues.forEach(venue => {
          const selected = venue.Code === venueCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(venue.Code)}" ${selected}>${escapeHtml(venue.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'CountryCode') {
        // Check if this is a CountryCode column - create dropdown
        const countryCodeValue = rowData ? (rowData['CountryCodeValue'] || rowData['CountryCode'] || '') : '';
        let options = '<option value="">-- Select Country --</option>';
        countries.forEach(country => {
          const selected = country.Code === countryCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(country.Code)}" ${selected}>${escapeHtml(country.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'ContinentCode') {
        // Check if this is a ContinentCode column - create dropdown
        const continentCodeValue = rowData ? (rowData['ContinentCodeValue'] || rowData['ContinentCode'] || '') : '';
        let options = '<option value="">-- Select Continent --</option>';
        continents.forEach(continent => {
          const selected = continent.Code === continentCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(continent.Code)}" ${selected}>${escapeHtml(continent.Name)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'PartecipationFlag') {
        // Check if this is a PartecipationFlag column - create dropdown
        const participationFlagCodeValue = rowData ? (rowData['PartecipationFlagCode'] || rowData['PartecipationFlag'] || '') : '';
        let options = '<option value="">-- Select Participation Flag --</option>';
        participationFlags.forEach(pf => {
          const selected = pf.Code === participationFlagCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(pf.Code)}" ${selected}>${escapeHtml(pf.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'Type' && selectedTable.refTable === 'Organisation') {
        // Check if this is a Type column for Organisation table - create dropdown
        const typeCodeValue = rowData ? (rowData['TypeCode'] || rowData['Type'] || '') : '';
        let options = '<option value="">-- Select Type --</option>';
        organisationTypes.forEach(ot => {
          const selected = ot.Code === typeCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(ot.Code)}" ${selected}>${escapeHtml(ot.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'PhaseType' && selectedTable.refTable === 'Phase') {
        // Check if this is a PhaseType column for Phase table - create dropdown
        const phaseTypeCodeValue = rowData ? (rowData['PhaseTypeCode'] || rowData['PhaseType'] || '') : '';
        let options = '<option value="">-- Select Phase Type --</option>';
        phaseTypes.forEach(pt => {
          const selected = pt.Code === phaseTypeCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(pt.Code)}" ${selected}>${escapeHtml(pt.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'CompetitionType' && selectedTable.refTable === 'Phase') {
        // Check if this is a CompetitionType column for Phase table - create dropdown
        const competitionTypeCodeValue = rowData ? (rowData['CompetitionTypeCode'] || rowData['CompetitionType'] || '') : '';
        let options = '<option value="">-- Select Competition Type --</option>';
        competitionFormatTypes.forEach(cft => {
          const selected = cft.Code === competitionTypeCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(cft.Code)}" ${selected}>${escapeHtml(cft.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'ProgressionType' && selectedTable.refTable === 'Phase') {
        // Check if this is a ProgressionType column for Phase table - create dropdown
        const progressionTypeCodeValue = rowData ? (rowData['ProgressionTypeCode'] || rowData['ProgressionType'] || '') : '';
        let options = '<option value="">-- Select Progression Type --</option>';
        progressionTypes.forEach(prt => {
          const selected = prt.Code === progressionTypeCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(prt.Code)}" ${selected}>${escapeHtml(prt.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'Schedule_Types' && selectedTable.refTable === 'PhaseType') {
        // Check if this is a Schedule_Types column for PhaseType table - create dropdown
        const scheduleTypesCodeValue = rowData ? (rowData['Schedule_TypesCode'] || rowData['Schedule_Types'] || '') : '';
        let options = '<option value="">-- Select Schedule Type --</option>';
        scheduleTypes.forEach(st => {
          const selected = st.Code === scheduleTypesCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(st.Code)}" ${selected}>${escapeHtml(st.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'Indoor_Outdoor' && selectedTable.refTable === 'Venue') {
        // Check if this is an Indoor_Outdoor column for Venue table - create dropdown
        const indoorOutdoorCodeValue = rowData ? (rowData['Indoor_OutdoorCode'] || rowData['Indoor_Outdoor'] || '') : '';
        let options = '<option value="">-- Select Indoor/Outdoor --</option>';
        indoorOutdoors.forEach(io => {
          const selected = io.Code === indoorOutdoorCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(io.Code)}" ${selected}>${escapeHtml(io.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'Code' && selectedTable.refTable === 'VenueWeatherRegion') {
        // Venue dropdown for VenueWeatherRegion table
        const codeValue = rowData ? (rowData['CodeValue'] || rowData['Code'] || '') : '';
        let options = '<option value="">-- Select Venue --</option>';
        venuesForVWR.forEach(venue => {
          const selected = venue.Code === codeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(venue.Code)}" ${selected}>${escapeHtml(venue.Code)} - ${escapeHtml(venue.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'WeatherRegion' && selectedTable.refTable === 'VenueWeatherRegion') {
        // WeatherRegion dropdown for VenueWeatherRegion table
        const weatherRegionValue = rowData ? (rowData['WeatherRegionCode'] || rowData['WeatherRegion'] || '') : '';
        let options = '<option value="">-- Select Weather Region --</option>';
        weatherRegions.forEach(wr => {
          const selected = wr.Code === weatherRegionValue ? 'selected' : '';
          options += `<option value="${escapeHtml(wr.Code)}" ${selected}>${escapeHtml(wr.Code)} - ${escapeHtml(wr.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.COLUMN_NAME === 'Category') {
        // Check if this is a Category column - create dropdown
        const categoryCodeValue = rowData ? (rowData['CategoryCode'] || rowData['Category'] || '') : '';
        let options = '<option value="">-- Select Category --</option>';
        categories.forEach(cat => {
          const selected = cat.Code === categoryCodeValue ? 'selected' : '';
          options += `<option value="${escapeHtml(cat.Code)}" ${selected}>${escapeHtml(cat.Description)}</option>`;
        });

        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <select
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
              ${options}
            </select>
          </div>
        `;
      } else if (col.DATA_TYPE === 'bit') {
        // Checkbox for BIT columns - no asterisk shown for checkboxes
        const isChecked = (value === true || value === 1 || value === '1') ? 'checked' : '';
        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}" style="display: flex; align-items: center; gap: 10px;">
              <input
                type="checkbox"
                id="field_${col.COLUMN_NAME}"
                name="${col.COLUMN_NAME}"
                ${isChecked}
                ${isDisabled}
                style="width: auto; margin: 0;"
              >
              ${col.COLUMN_NAME}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
          </div>
        `;
      } else if (col.DATA_TYPE === 'date' || col.DATA_TYPE === 'datetime' || col.DATA_TYPE === 'datetime2') {
        // Date picker for DATE/DATETIME columns
        // Format date value to YYYY-MM-DD for input type="date"
        let dateValue = '';
        if (value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            dateValue = date.toISOString().split('T')[0];
          }
        }
        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME} (dd/MM/yyyy)
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <input
              type="date"
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              value="${dateValue}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
            >
          </div>
        `;
      } else {
        // Regular text input for other columns
        formFields += `
          <div class="form-group">
            <label for="field_${col.COLUMN_NAME}">
              ${col.COLUMN_NAME}
              ${isRequired ? '<span class="required">*</span>' : ''}
              ${isPK ? '<span class="pk-badge">PK</span>' : ''}
            </label>
            <input
              type="text"
              id="field_${col.COLUMN_NAME}"
              name="${col.COLUMN_NAME}"
              value="${escapeAttr(value)}"
              ${isDisabled}
              ${isRequired ? 'required' : ''}
              maxlength="${col.CHARACTER_MAXIMUM_LENGTH || ''}"
              placeholder="${col.DATA_TYPE}"
            >
          </div>
        `;
      }
    });

    // Check if this table has RSC_Code
    const hasRSCCode = rscCodeColumn !== undefined;
    const rscCodeValue = rowData ? (rowData['RSC_Code'] || '') : '';
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
        ">
          RSC_Code
          ${rscCodeColumn && (rscCodeColumn.IS_PRIMARY_KEY ? (mode === 'Add') : (rscCodeColumn.IS_NULLABLE === 'NO')) ? '<span class="required">*</span>' : ''}
          ${rscCodeColumn && rscCodeColumn.IS_PRIMARY_KEY ? '<span class="pk-badge">PK</span>' : ''}
        </label>
        <div id="rsc_code_display" style="
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background-color: white;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          color: #495057;
          min-height: 42px;
          display: flex;
          align-items: center;
        ">${escapeAttr(rscCodeValue) || '<span style="color: #adb5bd; font-style: italic;">Auto-generated from form fields</span>'}</div>
      </div>
    ` : '';

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${mode} Record - ${selectedTable.description}</h2>
          <button class="modal-close" onclick="closeRecordModal()">&times;</button>
        </div>
        ${rscCodeSectionHTML}
        <div class="modal-body">
          <form id="recordForm" lang="en">
            ${formFields}
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeRecordModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveRecord('${mode}')">${mode === 'Add' ? 'Create' : 'Update'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // RSC_Code dynamic composition - Define this FIRST so it can be called from cascade dropdowns
    const rscCodeDisplay = modal.querySelector('#rsc_code_display');
    const rscCodeHidden = modal.querySelector('#field_RSC_Code');
    let buildRSCCode = null;

    if (rscCodeDisplay && rscCodeHidden) {
      // Function to build RSC_Code based on table and field values
      buildRSCCode = () => {
        const tableName = selectedTable.refTable;
        let rscCode = '';

        // Get current values from form fields
        const getFieldValue = (fieldName) => {
          const field = modal.querySelector(`[name="${fieldName}"]`);
          return field ? (field.value || '').trim() : '';
        };

        // Build RSC_Code based on table structure
        if (tableName === 'Discipline') {
          // Discipline: Code (3 chars) + padding
          const code = getFieldValue('Code');
          rscCode = code ? code.padEnd(34, '-') : '';
        }
        else if (tableName === 'DisciplineGender') {
          // DisciplineGender: Discipline (3) + Gender (1) + padding
          const discipline = getFieldValue('Discipline');
          const gender = getFieldValue('Gender') || '-';
          if (discipline) {
            rscCode = (discipline + gender).padEnd(34, '-');
          }
        }
        else if (tableName === 'Event') {
          // Event: Discipline (3) + Gender (1) + Event (18) + padding
          const discipline = getFieldValue('Discipline');
          const gender = getFieldValue('Gender') || '-';
          const event = getFieldValue('Event') || '';
          if (discipline) {
            rscCode = (discipline + gender + event.padEnd(18, '-')).padEnd(34, '-');
          }
        }
        else if (tableName === 'Phase') {
          // Phase: Discipline (3) + Gender (1) + Event (18) + Phase (4) + padding
          const discipline = getFieldValue('Discipline');
          const gender = getFieldValue('Gender') || '-';
          const event = getFieldValue('Event') || '';
          const phase = getFieldValue('Phase') || '';
          if (discipline) {
            rscCode = (discipline + gender + event.padEnd(18, '-') + phase.padEnd(4, '-')).padEnd(34, '-');
          }
        }
        else if (tableName === 'EventUnit') {
          // EventUnit: Discipline (3) + Gender (1) + Event (18) + Phase (4) + Unit (8)
          const discipline = getFieldValue('Discipline');
          const gender = getFieldValue('Gender') || '-';
          const event = getFieldValue('Event') || '';
          const phase = getFieldValue('Phase') || '';
          const unit = getFieldValue('Unit') || '';
          if (discipline) {
            rscCode = discipline + gender + event.padEnd(18, '-') + phase.padEnd(4, '-') + unit.padEnd(8, '-');
          }
        }

        // Update display and hidden field
        if (rscCode) {
          // Create colored visualization with separators
          let coloredHTML = '';
          const chars = rscCode.split('');

          chars.forEach((char, index) => {
            let bgColor = '';
            let textColor = '#000';

            // Determine color based on position
            if (index < 3) {
              // D: Discipline (positions 1-3)
              bgColor = '#d1ecf1';
              textColor = '#0c5460';
            } else if (index < 4) {
              // G: Gender (position 4)
              bgColor = '#d4edda';
              textColor = '#155724';
            } else if (index < 22) {
              // E: Event (positions 5-22)
              bgColor = '#fff3cd';
              textColor = '#856404';
            } else if (index < 26) {
              // P: Phase (positions 23-26)
              bgColor = '#f8d7da';
              textColor = '#721c24';
            } else {
              // U: Unit (positions 27-34)
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

          rscCodeDisplay.innerHTML = coloredHTML;
          rscCodeHidden.value = rscCode;
        } else {
          rscCodeDisplay.innerHTML = '<span style="color: #adb5bd; font-style: italic;">Auto-generated from form fields</span>';
          rscCodeHidden.value = '';
        }
      };

      // Add event listeners to all fields that compose RSC_Code
      const fieldsToWatch = ['Code', 'Discipline', 'Gender', 'Event', 'Phase', 'Unit'];
      fieldsToWatch.forEach(fieldName => {
        const field = modal.querySelector(`[name="${fieldName}"]`);
        if (field) {
          field.addEventListener('change', () => {
            if (buildRSCCode) buildRSCCode();
          });
          field.addEventListener('input', () => {
            if (buildRSCCode) buildRSCCode();
          });
        }
      });

      // Initial build (for Edit mode with existing values)
      buildRSCCode();
    }

    // Setup cascade dropdown: Gender depends on Discipline
    const genderSelect = modal.querySelector('select[name="Gender"][data-depends-on="Discipline"]');
    const disciplineSelect = modal.querySelector('select[name="Discipline"]');

    if (genderSelect && disciplineSelect) {
      // Function to update Gender options based on selected Discipline
      const updateGenderOptions = async (disciplineCode, preserveSelection = false) => {
        const currentGender = genderSelect.value;

        if (!disciplineCode) {
          // No discipline selected - keep Gender dropdown empty
          genderSelect.innerHTML = '<option value="">-- Select Gender --</option>';
          if (buildRSCCode) buildRSCCode();
          return;
        }

        try {
          // Fetch valid genders for this discipline
          const response = await fetch(`/api/commoncodes/genders-by-discipline/${disciplineCode}`);
          const genders = await response.json();

          if (response.ok) {
            genderSelect.innerHTML = '<option value="">-- Select Gender --</option>';
            genders.forEach(gender => {
              const selected = (preserveSelection && gender.Code === currentGender) ? 'selected' : '';
              genderSelect.innerHTML += `<option value="${escapeHtml(gender.Code)}" ${selected}>${escapeHtml(gender.Code)} - ${escapeHtml(gender.Description)}</option>`;
            });
            // Rebuild RSC_Code after updating options
            if (buildRSCCode) buildRSCCode();
          }
        } catch (error) {
          console.error('Error loading genders for discipline:', error);
        }
      };

      // Listen for Discipline changes
      disciplineSelect.addEventListener('change', async (e) => {
        await updateGenderOptions(e.target.value, false);
        if (buildRSCCode) buildRSCCode();
      });

      // Initialize Gender options only in Edit mode (when Discipline has a value)
      if (disciplineSelect.value) {
        // Edit mode: filter by current Discipline and preserve selection
        updateGenderOptions(disciplineSelect.value, true);
      }
      // In Add mode: Gender dropdown stays empty until Discipline is selected
    }

    // Setup cascade dropdown: Event depends on Discipline AND Gender
    const eventSelect = modal.querySelector('select[name="Event"][data-depends-on="Discipline,Gender"]');
    const disciplineSelectForEvent = modal.querySelector('select[name="Discipline"]');
    const genderSelectForEvent = modal.querySelector('select[name="Gender"]');

    if (eventSelect && disciplineSelectForEvent && genderSelectForEvent) {
      // Function to update Event options based on selected Discipline and Gender
      const updateEventOptions = async (disciplineCode, genderCode, preserveSelection = false) => {
        const currentEvent = eventSelect.value;

        if (!disciplineCode || !genderCode) {
          // Discipline or Gender not selected - keep Event dropdown empty
          eventSelect.innerHTML = '<option value="">-- Select Event --</option>';
          if (buildRSCCode) buildRSCCode();
          return;
        }

        try {
          // Fetch valid events for this discipline and gender
          const response = await fetch(`/api/commoncodes/events-by-discipline-gender/${disciplineCode}/${genderCode}`);
          const events = await response.json();

          if (response.ok) {
            eventSelect.innerHTML = '<option value="">-- Select Event --</option>';
            events.forEach(event => {
              const selected = (preserveSelection && event.Code === currentEvent) ? 'selected' : '';
              eventSelect.innerHTML += `<option value="${escapeHtml(event.Code)}" ${selected}>${escapeHtml(event.Code)} - ${escapeHtml(event.Description)}</option>`;
            });
            // Rebuild RSC_Code after updating options
            if (buildRSCCode) buildRSCCode();
          }
        } catch (error) {
          console.error('Error loading events for discipline and gender:', error);
        }
      };

      // Listen for Discipline changes - reset Gender and Event
      disciplineSelectForEvent.addEventListener('change', async (e) => {
        // Event cascade is handled by Gender change listener
        eventSelect.innerHTML = '<option value="">-- Select Event --</option>';
        if (buildRSCCode) buildRSCCode();
      });

      // Listen for Gender changes - update Event options
      genderSelectForEvent.addEventListener('change', async (e) => {
        const disciplineCode = disciplineSelectForEvent.value;
        const genderCode = e.target.value;
        await updateEventOptions(disciplineCode, genderCode, false);
        if (buildRSCCode) buildRSCCode();
      });

      // Initialize Event options in Edit mode (when both Discipline and Gender have values)
      if (disciplineSelectForEvent.value && genderSelectForEvent.value) {
        // Edit mode: filter by current Discipline and Gender and preserve selection
        updateEventOptions(disciplineSelectForEvent.value, genderSelectForEvent.value, true);
      }
      // In Add mode: Event dropdown stays empty until both Discipline and Gender are selected
    }

    // FOUR-LEVEL CASCADE: Discipline -> Gender -> Event -> Phase
    // Find Phase dropdown that depends on Discipline, Gender, and Event
    const phaseSelect = modal.querySelector('select[name="Phase"][data-depends-on="Discipline,Gender,Event"]');
    const disciplineSelectForPhase = modal.querySelector('select[name="Discipline"]');
    const genderSelectForPhase = modal.querySelector('select[name="Gender"]');
    const eventSelectForPhase = modal.querySelector('select[name="Event"]');

    if (phaseSelect && disciplineSelectForPhase && genderSelectForPhase && eventSelectForPhase) {
      const updatePhaseOptions = async (disciplineCode, genderCode, eventCode, preserveSelection = false) => {
        const currentValue = preserveSelection ? phaseSelect.value : null;

        // Phase dropdown empty unless all three parent fields have values
        if (!disciplineCode || !genderCode || !eventCode) {
          phaseSelect.innerHTML = '<option value="">-- Select Phase --</option>';
          if (buildRSCCode) buildRSCCode();
          return;
        }

        try {
          const response = await fetch(`/api/commoncodes/phases-by-discipline-gender-event/${disciplineCode}/${genderCode}/${eventCode}`);
          const phases = await response.json();

          let options = '<option value="">-- Select Phase --</option>';
          phases.forEach(phase => {
            const selected = preserveSelection && phase.Code === currentValue ? 'selected' : '';
            options += `<option value="${escapeHtml(phase.Code)}" ${selected}>${escapeHtml(phase.Code)}${phase.Description ? ' - ' + escapeHtml(phase.Description) : ''}</option>`;
          });
          phaseSelect.innerHTML = options;
          // Rebuild RSC_Code after updating options
          if (buildRSCCode) buildRSCCode();
        } catch (err) {
          console.error('Error loading phases:', err);
          phaseSelect.innerHTML = '<option value="">-- Select Phase --</option>';
          if (buildRSCCode) buildRSCCode();
        }
      };

      // Listen for Discipline changes - empty Gender, Event, and Phase
      disciplineSelectForPhase.addEventListener('change', async (e) => {
        // Gender and Event changes will be handled by their own listeners
        // Just empty Phase when Discipline changes
        phaseSelect.innerHTML = '<option value="">-- Select Phase --</option>';
        if (buildRSCCode) buildRSCCode();
      });

      // Listen for Gender changes - empty Event and Phase
      genderSelectForPhase.addEventListener('change', async (e) => {
        // Event change will be handled by Event listener
        // Just empty Phase when Gender changes
        phaseSelect.innerHTML = '<option value="">-- Select Phase --</option>';
        if (buildRSCCode) buildRSCCode();
      });

      // Listen for Event changes - update Phase options
      eventSelectForPhase.addEventListener('change', async (e) => {
        const disciplineCode = disciplineSelectForPhase.value;
        const genderCode = genderSelectForPhase.value;
        const eventCode = e.target.value;
        await updatePhaseOptions(disciplineCode, genderCode, eventCode, false);
        if (buildRSCCode) buildRSCCode();
      });

      // Initialize Phase options in Edit mode (when Discipline, Gender, and Event all have values)
      if (disciplineSelectForPhase.value && genderSelectForPhase.value && eventSelectForPhase.value) {
        // Edit mode: filter by current Discipline, Gender, and Event and preserve selection
        updatePhaseOptions(disciplineSelectForPhase.value, genderSelectForPhase.value, eventSelectForPhase.value, true);
      }
      // In Add mode: Phase dropdown stays empty until all three parents are selected
    }

    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('input:not([disabled])');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  // Close modal
  window.closeRecordModal = function() {
    const modal = document.getElementById('recordModal');
    if (modal) {
      modal.remove();
    }
  };

  // Save record (create or update)
  window.saveRecord = async function(mode) {
    const form = document.getElementById('recordForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Also include disabled fields (like Primary Keys in Edit mode)
    const disabledFields = form.querySelectorAll('input[disabled], select[disabled]');
    disabledFields.forEach(field => {
      if (field.name) {
        data[field.name] = field.value;
      }
    });

    // Handle checkboxes (BIT columns): convert to 0 or 1
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      if (checkbox.name) {
        // Send 1 if checked, 0 if unchecked
        data[checkbox.name] = checkbox.checked ? 1 : 0;
      }
    });

    // Remove helper codes (DisciplineCode/GenderCode/EventCode/SportCode/YesNoFlagCodes) only if the main column exists
    // If only DisciplineCode exists (no Discipline column), keep it as it's the actual physical column
    const hasDiscipline = data.hasOwnProperty('Discipline');
    const hasGender = data.hasOwnProperty('Gender');
    const hasEvent = data.hasOwnProperty('Event');
    const hasSport = data.hasOwnProperty('Sport');
    const hasNonSportFlag = data.hasOwnProperty('NonSportFlag');
    const hasScheduledFlag = data.hasOwnProperty('ScheduledFlag');
    const hasTeamEvent = data.hasOwnProperty('TeamEvent');
    const hasScheduleFlag = data.hasOwnProperty('ScheduleFlag');
    const hasCompetitionFlag = data.hasOwnProperty('CompetitionFlag');
    const hasEventOrder = data.hasOwnProperty('EventOrder');
    const hasIntFed = data.hasOwnProperty('IntFed');
    const hasPartic = data.hasOwnProperty('Partic');
    const hasResults = data.hasOwnProperty('Results');
    const hasCategory = data.hasOwnProperty('Category');
    const hasMedalCount = data.hasOwnProperty('MedalCount');
    const hasPartecipationFlag = data.hasOwnProperty('PartecipationFlag');
    const hasType = data.hasOwnProperty('Type');
    const hasPhaseType = data.hasOwnProperty('PhaseType');
    const hasCompetitionType = data.hasOwnProperty('CompetitionType');
    const hasProgressionType = data.hasOwnProperty('ProgressionType');
    const hasScheduleTypes = data.hasOwnProperty('Schedule_Types');

    if (hasDiscipline && data.hasOwnProperty('DisciplineCode')) delete data.DisciplineCode;
    if (data.hasOwnProperty('Code_DisciplineCode')) delete data.Code_DisciplineCode;  // Always remove helper column
    if (hasGender && data.hasOwnProperty('GenderCode')) delete data.GenderCode;
    if (hasEvent && data.hasOwnProperty('EventCode')) delete data.EventCode;
    if (hasSport && data.hasOwnProperty('SportCode')) delete data.SportCode;
    if (data.hasOwnProperty('VenueCodeValue')) delete data.VenueCodeValue;  // Always remove helper column
    if (data.hasOwnProperty('DisciplineValue')) delete data.DisciplineValue;  // Always remove helper column
    if (data.hasOwnProperty('CountryCodeValue')) delete data.CountryCodeValue;  // Always remove helper column
    if (data.hasOwnProperty('ContinentCodeValue')) delete data.ContinentCodeValue;  // Always remove helper column
    if (hasPartecipationFlag && data.hasOwnProperty('PartecipationFlagCode')) delete data.PartecipationFlagCode;
    if (hasType && data.hasOwnProperty('TypeCode')) delete data.TypeCode;
    if (hasPhaseType && data.hasOwnProperty('PhaseTypeCode')) delete data.PhaseTypeCode;
    if (hasCompetitionType && data.hasOwnProperty('CompetitionTypeCode')) delete data.CompetitionTypeCode;
    if (hasProgressionType && data.hasOwnProperty('ProgressionTypeCode')) delete data.ProgressionTypeCode;
    if (hasScheduleTypes && data.hasOwnProperty('Schedule_TypesCode')) delete data.Schedule_TypesCode;
    if (hasNonSportFlag && data.hasOwnProperty('NonSportFlagCode')) delete data.NonSportFlagCode;
    if (hasScheduledFlag && data.hasOwnProperty('ScheduledFlagCode')) delete data.ScheduledFlagCode;
    if (hasTeamEvent && data.hasOwnProperty('TeamEventCode')) delete data.TeamEventCode;
    if (hasScheduleFlag && data.hasOwnProperty('ScheduleFlagCode')) delete data.ScheduleFlagCode;
    if (hasCompetitionFlag && data.hasOwnProperty('CompetitionFlagCode')) delete data.CompetitionFlagCode;
    if (hasEventOrder && data.hasOwnProperty('EventOrderCode')) delete data.EventOrderCode;
    if (hasIntFed && data.hasOwnProperty('IntFedCode')) delete data.IntFedCode;
    if (hasPartic && data.hasOwnProperty('ParticCode')) delete data.ParticCode;
    if (hasResults && data.hasOwnProperty('ResultsCode')) delete data.ResultsCode;
    if (hasCategory && data.hasOwnProperty('CategoryCode')) delete data.CategoryCode;
    if (hasMedalCount && data.hasOwnProperty('MedalCountCode')) delete data.MedalCountCode;

    // Always remove versioning columns - these are managed by triggers
    if (data.hasOwnProperty('StartingVersion')) delete data.StartingVersion;
    if (data.hasOwnProperty('Version')) delete data.Version;

    // Auto-populate ODF_Incoming with "Y" for H1ReportTitles Create operations
    if (mode === 'Add' && selectedTable.refTable === 'H1ReportTitles') {
      data.ODF_Incoming = 'Y';
    }

    console.log('Data to be sent:', data);

    closeRecordModal();

    try {
      const endpoint = mode === 'Add' ? '/api/commoncodes/create' : '/api/commoncodes/update';
      const spName = mode === 'Add' ? selectedTable.spCreate : selectedTable.spUpdate;

      const response = await fetch(endpoint, {
        method: mode === 'Add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spName, data })
      });

      const result = await response.json();

      if (response.ok) {
        invalidateLookupCaches(); // Invalidate caches before reloading
        const successMessage = `Record ${mode === 'Add' ? 'created' : 'updated'} successfully`;
        await loadTableData(true, successMessage);
      } else {
        showMessage(result.error || `Error ${mode === 'Add' ? 'creating' : 'updating'} record`, 'error');
      }
    } catch (error) {
      console.error(`Error ${mode === 'Add' ? 'creating' : 'updating'} record:`, error);
      showMessage(`Error ${mode === 'Add' ? 'creating' : 'updating'} record`, 'error');
    }
  };

  // Show loading message
  function showLoading(show) {
    if (show) {
      MessageManager.showLoading();
    } else {
      MessageManager.hide();
    }
  }

  // Show message (wrapper for MessageManager)
  function showMessage(message, type = 'info') {
    MessageManager.show(message, type, 5000);
  }

  // Export to Excel
  async function exportToExcel() {
    if (!selectedTable) {
      showMessage('Please select a table first', 'error');
      return;
    }

    showLoading(true);
    try {
      const response = await fetch(`/api/commoncodes/export/${selectedTable.refTable}`);

      if (!response.ok) {
        const error = await response.json();
        showMessage(error.error || 'Export failed', 'error');
        return;
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable.refTable}_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showMessage(`Exported ${tableData.length} records to Excel`, 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showMessage('Error exporting to Excel', 'error');
    } finally {
      showLoading(false);
    }
  }

  // Import from Excel
  async function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!selectedTable) {
      showMessage('Please select a table first', 'error');
      importFileInput.value = ''; // Reset file input
      return;
    }

    // Confirm action
    if (!confirm(`This will update and/or delete records in "${selectedTable.description}" table based on the Excel file. Continue?`)) {
      importFileInput.value = ''; // Reset file input
      return;
    }

    showLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/commoncodes/import/${selectedTable.refTable}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        showMessage(result.error || 'Import failed', 'error');
        return;
      }

      // Show import results
      const { stats } = result;
      let message = `Import completed: `;
      const parts = [];
      if (stats.inserted > 0) parts.push(`${stats.inserted} inserted`);
      if (stats.updated > 0) parts.push(`${stats.updated} updated`);
      if (stats.deleted > 0) parts.push(`${stats.deleted} deleted`);
      if (stats.unchanged > 0) parts.push(`${stats.unchanged} unchanged`);
      message += parts.join(', ');

      if (stats.errors && stats.errors.length > 0) {
        message += `\nErrors: ${stats.errors.length}`;
        console.error('Import errors:', stats.errors);
      }

      showMessage(message, stats.errors && stats.errors.length > 0 ? 'warning' : 'success');

      // Reload table data
      invalidateLookupCaches();
      await loadTableData();
    } catch (error) {
      console.error('Error importing from Excel:', error);
      showMessage('Error importing from Excel', 'error');
    } finally {
      showLoading(false);
      importFileInput.value = ''; // Reset file input
    }
  }
});

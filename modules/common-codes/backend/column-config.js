// Backend version of column configuration
// This mirrors the frontend configuration but is used server-side

const COLUMN_CONFIG = {
  // Columns that are NEVER shown or editable in the UI
  // These columns are automatically populated by the system
  alwaysHidden: [
    {
      table: '*',                     // Applies to ALL tables
      column: 'UserId',
      populatedBy: 'session',        // Populated from user session
      source: 'userId',               // Session property to use
      location: 'backend'             // Where the population happens
    },
    {
      table: '*',
      column: 'Data_Ins',
      populatedBy: 'trigger',         // Populated by database trigger
      location: 'database'
    },
    {
      table: '*',
      column: 'Data_upd',
      populatedBy: 'trigger',         // Populated by database trigger
      location: 'database'
    },
    {
      table: 'H1ReportTitles',
      column: 'ODF_Incoming',
      populatedBy: 'constant',        // Always the same value
      value: 'Yes',                   // The constant value to use
      location: 'backend'             // Populated in backend before DB insert
    },
    {
      table: '*',
      column: 'StartingVersion',
      populatedBy: 'versioning',      // Populated by versioning system
      location: 'backend'
    },
    {
      table: '*',
      column: 'Version',
      populatedBy: 'versioning',      // Populated by versioning system
      location: 'backend'
    },
    {
      table: 'Organisation',
      column: 'tvdescription',
      populatedBy: 'field',           // Copy from another field
      source: 'longdescription',      // Source field to copy from
      location: 'backend'
    },
    {
      table: 'Discipline',
      column: 'tvdescription',
      populatedBy: 'field',           // Copy from another field
      source: 'description',          // Source field to copy from
      location: 'backend'
    },
    {
      table: 'EventUnit',
      column: 'tvdescription',
      populatedBy: 'field',           // Copy from another field
      source: 'longdescription',      // Source field to copy from
      location: 'backend'
    },
    {
      table: 'Venue',
      column: 'tvdescription',
      populatedBy: 'field',           // Copy from another field
      source: 'longdescription',      // Source field to copy from
      location: 'backend'
    },
    {
      table: 'RecordType',
      column: 'tvdescription',
      populatedBy: 'field',           // Copy from another field
      source: 'description',          // Source field to copy from
      location: 'backend'
    },
    {
      table: 'WeatherConditions',
      column: 'tvdescription',
      populatedBy: 'field',           // Copy from another field
      source: 'description',          // Source field to copy from
      location: 'backend'
    },
    {
      table: 'WindDirection',
      column: 'tvdescription',
      populatedBy: 'field',           // Copy from another field
      source: 'description',          // Source field to copy from
      location: 'backend'
    },
    {
      table: 'Version',
      column: 'File_Excel',
      populatedBy: 'constant',        // Not used currently
      value: null,                    // Always NULL
      location: 'backend'
    },
    {
      table: 'Version',
      column: 'File_ODF',
      populatedBy: 'constant',        // Not used currently
      value: null,                    // Always NULL
      location: 'backend'
    }
  ],

  /**
   * Populate auto-filled columns for a data object
   * @param {object} data - The data object to populate
   * @param {object} session - Express session object
   * @param {string} tableName - The table name (optional, for table-specific rules)
   * @param {string} operation - The operation type: 'create' or 'update' (default: 'create')
   * @returns {object} - The data object with auto-populated fields
   */
  populateAutoFields: function(data, session, tableName = null, operation = 'create') {
    const populated = { ...data };

    this.alwaysHidden.forEach(config => {
      // Check if rule applies to this table (case-insensitive comparison)
      if (config.table !== '*' && config.table.toLowerCase() !== tableName?.toLowerCase()) {
        return; // Skip rules for other tables
      }

      if (typeof config === 'object' && config.location === 'backend') {
        switch (config.populatedBy) {
          case 'session':
            // Populate from session (e.g., UserId)
            // UserId is only populated on CREATE, not UPDATE
            if (operation === 'create' && session && session[config.source]) {
              populated[config.column] = session[config.source];
            }
            break;

          case 'constant':
            // Populate with constant value (e.g., ODF_Incoming = 'Yes')
            // Only on CREATE
            if (operation === 'create') {
              populated[config.column] = config.value;
            }
            break;

          case 'versioning':
            // Versioning logic would be handled by separate versioning module
            // Don't populate here, let versioning system handle it
            break;

          case 'field':
            // Copy value from another field (e.g., tvdescription = description)
            // This applies to both CREATE and UPDATE
            // Case-insensitive search for source field
            const sourceKey = Object.keys(data).find(key => key.toLowerCase() === config.source.toLowerCase());
            if (sourceKey && data[sourceKey] !== undefined) {
              populated[config.column] = data[sourceKey];
            }
            break;

          default:
            // Do nothing for other types (e.g., 'trigger')
            break;
        }
      }
    });

    return populated;
  },

  /**
   * Get list of columns that should be excluded from user input
   * @param {string} tableName - The table name (optional, for table-specific rules)
   * @returns {Array<string>} - Array of column names
   */
  getExcludedColumns: function(tableName = null) {
    return this.alwaysHidden
      .filter(col => {
        // Include rules that apply to all tables or to this specific table (case-insensitive)
        return col.table === '*' || col.table.toLowerCase() === tableName?.toLowerCase();
      })
      .map(col => typeof col === 'string' ? col : col.column);
  },

  /**
   * Clean user input by removing system-managed columns
   * @param {object} data - The data object from user input
   * @param {string} tableName - The table name (optional, for table-specific rules)
   * @returns {object} - Cleaned data object
   */
  cleanUserInput: function(data, tableName = null) {
    const cleaned = { ...data };
    const excludedColumns = this.getExcludedColumns(tableName);

    excludedColumns.forEach(colName => {
      delete cleaned[colName];
    });

    return cleaned;
  },

  /**
   * Check if a column is managed by the system
   * @param {string} columnName - Name of the column
   * @param {string} tableName - The table name (optional, for table-specific rules)
   * @returns {boolean} - True if system-managed
   */
  isSystemManaged: function(columnName, tableName = null) {
    return this.getExcludedColumns(tableName).includes(columnName);
  }
};

// Export for browser (make globally available)
if (typeof window !== 'undefined') {
  window.COLUMN_CONFIG = COLUMN_CONFIG;
}

// Export for Node.js (CommonJS and ES6)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = COLUMN_CONFIG;
}

export default COLUMN_CONFIG;

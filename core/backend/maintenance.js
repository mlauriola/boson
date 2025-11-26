import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read maintenance configuration
export function readMaintenanceConfig() {
  try {
    const maintenancePath = path.join(__dirname, '.maintenance');
    if (fs.existsSync(maintenancePath)) {
      const data = fs.readFileSync(maintenancePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading maintenance config:', error);
  }
  // Default: no maintenance
  return {
    enabled: false,
    message: '',
    allowedRoles: [1],
    estimatedEndTime: null,
    scheduled: {
      enabled: false,
      message: '',
      startTime: null,
      endTime: null,
      showUntil: null
    },
    viewCommonCodesRestricted: {
      enabled: false,
      message: 'This page is temporarily unavailable to the public.'
    }
  };
}

// Function to write maintenance configuration
export function writeMaintenanceConfig(config) {
  try {
    const maintenancePath = path.join(__dirname, '.maintenance');
    fs.writeFileSync(maintenancePath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing maintenance config:', error);
    return false;
  }
}

// Middleware to check maintenance mode
export function checkMaintenanceMode(req, res, next) {
  const maintenanceConfig = readMaintenanceConfig();

  // If maintenance is not enabled, proceed normally
  if (!maintenanceConfig.enabled) {
    // Check if there's a scheduled maintenance to inform the user
    req.scheduledMaintenance = maintenanceConfig.scheduled.enabled ? maintenanceConfig.scheduled : null;
    return next();
  }

  // System is in maintenance mode
  if (req.session && req.session.roleId && maintenanceConfig.allowedRoles.includes(req.session.roleId)) {
    // Administrator can access - set flag for UI banner
    req.maintenanceMode = true;
    req.maintenanceMessage = maintenanceConfig.message;
    return next();
  }

  // Other users are blocked
  return res.status(503).json({
    error: 'System under maintenance',
    message: maintenanceConfig.message,
    estimatedEndTime: maintenanceConfig.estimatedEndTime,
    inMaintenance: true
  });
}

import express from 'express';
import sql from 'mssql';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import nodemailer from 'nodemailer';
import { readMaintenanceConfig, writeMaintenanceConfig, checkMaintenanceMode } from './maintenance.js';
import multer from 'multer';

// Configurazione per ottenere __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica le variabili d'ambiente
dotenv.config({ path: path.join(__dirname, '.env') });

// Carica configurazione app
const configPath = path.join(__dirname, '../../config/app-config.json');
const appConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();
const PORT = process.env.PORT || appConfig.server.port || 3000;

// Configurazione Database
const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || appConfig.database.targetDatabase,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

let pool;

// Middleware Base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || appConfig.server.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static Files - Core Frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/img', express.static(path.join(__dirname, '../frontend/img')));
// Static Files - Modules
app.use('/modules', express.static(path.join(__dirname, '../../modules')));

// Configurazione Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ============= CORE FUNCTIONS =============

async function connectDB() {
  try {
    pool = await sql.connect(dbConfig);
    console.log(`✓ Connected to database [${dbConfig.database}] on ${dbConfig.server}`);
    await verifyCoreTables();
  } catch (err) {
    console.error('✗ Database connection error:', err);
    process.exit(1);
  }
}

async function verifyCoreTables() {
  try {
    // Verify MP_T_USER exists
    const result = await pool.request()
      .input('tableName', sql.NVarChar, 'MP_T_USER')
      .execute('sp_VerifyTableExists');

    if (result.recordset[0].tableCount === 0) {
      console.error('✗ Table MP_T_USER not found');
      process.exit(1);
    }
    console.log('✓ Core tables verified');
  } catch (err) {
    console.error('✗ Table verification error:', err);
    process.exit(1);
  }
}

// Middleware: Authentication
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// Middleware: Roles
function isAdministrator(req, res, next) {
  if (req.session.userId && req.session.roleId === 1) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
}

function isAdministratorOrSuperEditor(req, res, next) {
  if (req.session.userId && (req.session.roleId === 1 || req.session.roleId === 2)) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Administrator or Super Editor privileges required.' });
  }
}

// ============= MODULE LOADER =============

async function loadModules() {
  const modulesConfigPath = path.join(__dirname, '../../config/modules.json');
  if (!fs.existsSync(modulesConfigPath)) {
    console.warn('No modules configuration found.');
    return;
  }

  const modulesConfig = JSON.parse(fs.readFileSync(modulesConfigPath, 'utf8'));
  const modules = modulesConfig.modules;

  for (const [key, module] of Object.entries(modules)) {
    if (module.enabled && key !== 'core') {
      try {
        console.log(`Loading module: ${key}...`);

        // Construct absolute path to module entry point
        const modulePath = path.resolve(__dirname, '../../', module.path, module.entryPoint || 'index.js');

        // Convert to file URL for dynamic import on Windows
        const moduleUrl = pathToFileURL(modulePath).href;

        const moduleInit = await import(moduleUrl);

        // Initialize module
        if (typeof moduleInit.default === 'function') {
          await moduleInit.default(app, {
            pool,
            config: appConfig,
            moduleConfig: module,
            middleware: {
              isAuthenticated,
              isAdministrator,
              isAdministratorOrSuperEditor,
              checkMaintenanceMode
            },
            utils: {
              readMaintenanceConfig,
              transporter
            }
          });

          // Serve module frontend static files if they exist
          const moduleFrontendPath = path.resolve(__dirname, '../../', module.path, 'frontend');
          if (fs.existsSync(moduleFrontendPath)) {
            console.log(`  Serving static files for ${key} from ${moduleFrontendPath}`);
            app.use(express.static(moduleFrontendPath));
          }

          console.log(`✓ Module ${key} loaded successfully`);
        }
      } catch (err) {
        console.error(`✗ Failed to load module ${key}:`, err);
      }
    }
  }
}

// ============= CORE ROUTES =============

// API: Config (Public)
app.get('/api/config', (req, res) => {
  // Return safe public config
  res.json({
    branding: appConfig.branding,
    modules: JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/modules.json'), 'utf8')).modules
  });
});

// API: Update Branding Config (Admin)
app.put('/api/config/branding', isAdministrator, (req, res) => {
  try {
    const newBranding = req.body;
    const configPath = path.join(__dirname, '../../config/app-config.json');
    const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Update config
    currentConfig.branding = { ...currentConfig.branding, ...newBranding };

    // Write to file
    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 4));

    // Update in-memory config
    appConfig.branding = currentConfig.branding;

    res.json({ success: true, branding: appConfig.branding });
  } catch (err) {
    console.error('Error updating branding config:', err);
    res.status(500).json({ error: 'Failed to update branding configuration' });
  }
});

// Configure multer for logo upload
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../core/frontend/img');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Always save as ClientLogo.png
    const ext = path.extname(file.originalname);
    cb(null, 'ClientLogo' + ext);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// API: Upload Logo (Admin)
app.post('/api/upload/logo', isAdministrator, logoUpload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoPath = '/img/' + req.file.filename;

    // Update config with new logo path
    const configPath = path.join(__dirname, '../../config/app-config.json');
    const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    currentConfig.branding.logo = logoPath;
    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 4));
    appConfig.branding.logo = logoPath;

    res.json({ success: true, logoPath });
  } catch (err) {
    console.error('Error uploading logo:', err);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// API: Maintenance Status (Public)
app.get('/api/maintenance/status', (req, res) => {
  const config = readMaintenanceConfig();
  // Only return safe public info
  res.json({
    enabled: config.enabled,
    message: config.message,
    estimatedEndTime: config.estimatedEndTime,

    scheduled: config.scheduled,
    viewCommonCodesRestricted: config.viewCommonCodesRestricted
  });
});

// API: Version (Public)
app.get('/api/version/app', (req, res) => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
  res.json({
    version: packageJson.version,
    name: packageJson.name
  });
});

// API: Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .execute('sp_UserLogin');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.recordset[0];

    if (password !== user.Usr_Pwd) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }



    // Fetch module-specific roles
    try {
      console.log(`DEBUG: Fetching roles for User ${user.Usr_Code}...`);
      const rolesResult = await pool.request()
        .input('userId', sql.Int, user.Usr_Code)
        .query('SELECT ModuleKey, RoleId FROM MP_T_USER_MODULE_ROLE WHERE UserId = @userId');

      const moduleRoles = {};
      rolesResult.recordset.forEach(row => {
        moduleRoles[row.ModuleKey] = row.RoleId;
      });

      console.log(`DEBUG: Fetched roles for User ${user.Usr_Code}:`, moduleRoles);

      req.session.moduleRoles = moduleRoles;

      // Determine Effective Role ID for legacy compatibility / session checks
      // Priority: Core Module Role -> Default (3/Viewer)
      const coreRole = moduleRoles['core'];
      req.session.roleId = coreRole || 3;

    } catch (err) {
      console.error('DEBUG: Error fetching module roles:', err);


      req.session.moduleRoles = {};
      req.session.roleId = 3; // Default fallback
    }

    // Now check maintenance with the determined role
    const maintenanceConfig = readMaintenanceConfig();
    if (maintenanceConfig.enabled) {
      // Logic: Only Admin (Role 1 in Core) can bypass maintenance
      if (!maintenanceConfig.allowedRoles.includes(req.session.roleId)) {
        return res.status(503).json({
          error: 'System under maintenance',
          message: maintenanceConfig.message,
          inMaintenance: true
        });
      }
    }

    req.session.userId = user.Usr_Code;
    req.session.username = user.Usr_Login;
    req.session.referent = user.Usr_Referent;
    // req.session.roleId is set above
    req.session.firstLogin = user.Usr_First_Login;

    res.json({
      success: true,
      username: user.Usr_Login,
      roleId: req.session.roleId, // Returning computed role
      firstLogin: user.Usr_First_Login
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout error' });
    res.json({ success: true });
  });
});

// API: Check Auth
app.get('/api/check-auth', (req, res) => {
  if (req.session.userId) {
    const maintenanceConfig = readMaintenanceConfig();
    let maintenanceBlocked = false;
    if (maintenanceConfig.enabled && !maintenanceConfig.allowedRoles.includes(req.session.roleId)) {
      maintenanceBlocked = true;
    }

    res.json({
      authenticated: true,
      username: req.session.username,
      roleId: req.session.roleId,
      moduleRoles: req.session.moduleRoles || {},
      maintenanceMode: maintenanceConfig.enabled && !maintenanceBlocked,
      maintenanceMessage: maintenanceConfig.enabled && !maintenanceBlocked ? maintenanceConfig.message : null,
      scheduledMaintenance: maintenanceConfig.scheduled.enabled ? maintenanceConfig.scheduled : null,
      maintenanceBlocked
    });
  } else {
    res.json({ authenticated: false });
  }
});

// API: Get User Module Roles
app.get('/api/users/:userId/roles', isAdministrator, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT ModuleKey, RoleId FROM MP_T_USER_MODULE_ROLE WHERE UserId = @userId');

    // Transform to simple object: { 'common-codes': 2, ... }
    const roles = {};
    result.recordset.forEach(row => {
      roles[row.ModuleKey] = row.RoleId;
    });

    res.json(roles);
  } catch (err) {
    console.error('Error fetching user module roles:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Update User Module Roles
app.post('/api/users/:userId/roles', isAdministrator, async (req, res) => {
  try {
    const { userId } = req.params;
    const { moduleRoles } = req.body; // Expects { 'common-codes': 2, ... }

    if (!moduleRoles || typeof moduleRoles !== 'object') {
      return res.status(400).json({ error: 'Invalid data' });
    }

    // Transaction to ensure consistency
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // 1. Delete existing roles for this user
      await request
        .input('userId', sql.Int, userId)
        .query('DELETE FROM MP_T_USER_MODULE_ROLE WHERE UserId = @userId');

      // 2. Insert new roles
      for (const [moduleKey, roleId] of Object.entries(moduleRoles)) {
        if (roleId) { // Only insert if RoleId is valid/truthy
          await request.query(`
            INSERT INTO MP_T_USER_MODULE_ROLE (UserId, ModuleKey, RoleId)
            VALUES (${parseInt(userId)}, '${moduleKey.replace(/'/g, "''")}', ${parseInt(roleId)})
          `);
        }
      }

      await transaction.commit();
      res.json({ success: true });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating user module roles:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Roles (Admin)
app.get('/api/roles', isAdministrator, async (req, res) => {
  try {
    // Try stored procedure first
    const result = await pool.request().execute('sp_GetAllRoles');
    res.json(result.recordset);
  } catch (err) {
    // console.warn('sp_GetAllRoles failed, trying direct query:', err.message);
    try {
      // Fallback to direct query on MP_T_ROLE
      // Assuming columns Rol_Id and Rol_Description based on naming convention
      const result = await pool.request().query('SELECT Rol_Id as Id, Rol_Description as Description FROM MP_T_ROLE');
      res.json(result.recordset);
    } catch (err2) {
      console.error('Error fetching roles:', err2);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// API: Users (Admin)
app.get('/api/users', isAdministrator, async (req, res) => {
  try {
    const result = await pool.request().execute('sp_GetAllUsers');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Create User (Admin)
app.post('/api/users', isAdministrator, async (req, res) => {
  try {
    const { username, password, referent, email, phone, roleId } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await pool.request()
      .input('Username', sql.NVarChar, username)
      .input('Password', sql.NVarChar, password)
      .input('Email', sql.NVarChar, email || '')
      .input('Referent', sql.NVarChar, referent || '')
      .input('Phone', sql.NVarChar, phone || '')
      .input('RoleId', sql.Int, roleId || 3) // Default to Viewer if not specified
      .execute('sp_CreateUser');

    // Check for explicit error result from SP
    if (result.recordset && result.recordset[0] && result.recordset[0].Result === -1) {
       return res.status(400).json({ error: result.recordset[0].ErrorMessage });
    }

    // sp_CreateUser returns default result set on success
    res.status(201).json(result.recordset[0]);

  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Update User (Admin)
app.put('/api/users/:userId', isAdministrator, async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, password, referent, email, phone, roleId, recovery, recoveryOTP } = req.body;

    const result = await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .input('Username', sql.NVarChar, username)
      .input('Password', sql.NVarChar, password) // Pass null/undefined if not changing
      .input('Referent', sql.NVarChar, referent)
      .input('Email', sql.NVarChar, email)
      .input('Phone', sql.NVarChar, phone)
      .input('RoleId', sql.Int, roleId)
      .input('Recovery', sql.Int, recovery)
      .input('RecoveryOTP', sql.NVarChar, recoveryOTP)
      .execute('sp_UpdateUser');

    if (result.recordset && result.recordset[0] && result.recordset[0].Result === -1) {
        return res.status(404).json({ error: result.recordset[0].ErrorMessage });
    }

    res.json(result.recordset[0]);

  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Delete User (Admin) - Soft Delete
app.delete('/api/users/:userId', isAdministrator, async (req, res) => {
  try {
    const { userId } = req.params;

    // Use direct query for soft delete as sp_DeleteUser is missing
    await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .query('UPDATE MP_T_USER SET Usr_IsValid = 0 WHERE Usr_Code = @UserId');

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Profile
app.get('/api/profile', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.request()
      .input('userId', sql.Int, req.session.userId)
      .execute('sp_GetUserById');
    if (result.recordset.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/profile', isAuthenticated, async (req, res) => {
  try {
    const { referent, email, phone } = req.body;

    // Get current user details first to preserve other fields
    const userResult = await pool.request()
      .input('userId', sql.Int, req.session.userId)
      .execute('sp_GetUserById');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = userResult.recordset[0];

    await pool.request()
      .input('UserId', sql.Int, req.session.userId)
      .input('Username', sql.NVarChar, currentUser.Username)
      .input('Password', sql.NVarChar, currentUser.Password)
      .input('Referent', sql.NVarChar, referent)
      .input('Email', sql.NVarChar, email)
      .input('Phone', sql.NVarChar, phone)
      // RoleId removed
      .input('Recovery', sql.Int, currentUser.Recovery)
      .input('RecoveryOTP', sql.NVarChar, currentUser.RecoveryOTP)
      .execute('sp_UpdateUser');

    // Update session
    req.session.referent = referent;

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/change-password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password first
    const checkResult = await pool.request()
      .input('userId', sql.Int, req.session.userId)
      .execute('sp_GetUserById');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = checkResult.recordset[0];

    if (currentUser.Password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password using sp_UpdateUser
    await pool.request()
      .input('UserId', sql.Int, req.session.userId)
      .input('Username', sql.NVarChar, currentUser.Username)
      .input('Password', sql.NVarChar, newPassword)
      .input('Referent', sql.NVarChar, currentUser.Referent)
      .input('Email', sql.NVarChar, currentUser.Email)
      .input('Phone', sql.NVarChar, currentUser.Phone)
      // RoleId removed
      .input('Recovery', sql.Int, currentUser.Recovery)
      .input('RecoveryOTP', sql.NVarChar, currentUser.RecoveryOTP)
      .execute('sp_UpdateUser');

    res.json({ success: true });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Maintenance (Admin)
app.get('/api/maintenance', isAdministrator, (req, res) => {
  res.json(readMaintenanceConfig());
});

app.put('/api/maintenance', isAdministrator, (req, res) => {
  try {
    const config = req.body;
    if (writeMaintenanceConfig(config)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save maintenance config' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Modules (Admin)
app.get('/api/modules', isAdministrator, (req, res) => {
  try {
    const modulesConfigPath = path.join(__dirname, '../../config/modules.json');
    const modulesConfig = JSON.parse(fs.readFileSync(modulesConfigPath, 'utf8'));
    res.json(modulesConfig.modules);
  } catch (err) {
    res.status(500).json({ error: 'Error reading modules config' });
  }
});

app.patch('/api/modules/:key', isAdministrator, (req, res) => {
  try {
    const { key } = req.params;
    const { enabled } = req.body;

    const modulesConfigPath = path.join(__dirname, '../../config/modules.json');
    const modulesConfig = JSON.parse(fs.readFileSync(modulesConfigPath, 'utf8'));

    if (!modulesConfig.modules[key]) {
      return res.status(404).json({ error: 'Module not found' });
    }

    if (key === 'core') {
      return res.status(400).json({ error: 'Cannot disable core module' });
    }

    modulesConfig.modules[key].enabled = enabled;

    fs.writeFileSync(modulesConfigPath, JSON.stringify(modulesConfig, null, 4));

    res.json({ success: true, message: 'Module updated. Server will restart.' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating modules config' });
  }
});

app.put('/api/modules', isAdministrator, (req, res) => {
  try {
    const { modules } = req.body;
    if (!modules || typeof modules !== 'object') {
      return res.status(400).json({ error: 'Invalid modules data' });
    }

    const modulesConfigPath = path.join(__dirname, '../../config/modules.json');
    const modulesConfig = JSON.parse(fs.readFileSync(modulesConfigPath, 'utf8'));
    let changesMade = false;

    for (const [key, value] of Object.entries(modules)) {
      if (modulesConfig.modules[key] && key !== 'core') {
        if (modulesConfig.modules[key].enabled !== value.enabled) {
          modulesConfig.modules[key].enabled = value.enabled;
          changesMade = true;
        }
      }
    }

    if (changesMade) {
      res.json({ success: true, message: 'Modules updated. Server will restart.' });

      // Write file after a short delay to allow response to be sent
      setTimeout(() => {
        fs.writeFileSync(modulesConfigPath, JSON.stringify(modulesConfig, null, 4));
      }, 500);
    } else {
      res.json({ success: true, message: 'No changes made.' });
    }

  } catch (err) {
    res.status(500).json({ error: 'Error updating modules config' });
  }
});

// Start Server
async function startServer() {
  await connectDB();
  await loadModules();

  // API: Get Manual Content
  app.get('/api/manual/:page', (req, res) => {
    try {
      const page = req.params.page;
      // Sanitize page name to prevent directory traversal
      const safePage = page.replace(/[^a-zA-Z0-9-]/g, '');

      const manualPath = path.join(__dirname, '../../core/manuals/en', `${safePage}.md`);

      if (fs.existsSync(manualPath)) {
        const content = fs.readFileSync(manualPath, 'utf8');
        res.set('Content-Type', 'text/markdown');
        res.send(content);
      } else {
        res.status(404).send('Manual not found');
      }
    } catch (err) {
      console.error('Error serving manual:', err);
      res.status(500).send('Server error');
    }
  });

  // API: Get Complete Manual PDF (Placeholder for future implementation)
  app.get('/api/manual/pdf/complete', (req, res) => {
    res.status(501).send('PDF generation not implemented yet');
  });

  // Default Route (SPA fallback)
  app.get('*', (req, res) => {
    // If request is for a file that doesn't exist, send index.html
    // But we need to be careful not to break API 404s
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Microplus BOS Server running on port ${PORT}`);
  });
}

startServer();
// Trigger restart: 2025-11-21 15:45
// Trigger restart: 12/03/2025 23:53:47
// Trigger restart: 12/03/2025 23:57:38
// Trigger restart: 2025-12-05 10:37:00
// Trigger restart: 2025-12-05 12:10:00

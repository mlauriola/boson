
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config
const configPath = path.join(__dirname, '../../config/app-config.json');
const appConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

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
    }
};

async function createTable() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to database.');

        const query = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MP_T_USER_MODULE_ROLE')
      BEGIN
        CREATE TABLE MP_T_USER_MODULE_ROLE (
          UserId INT NOT NULL,
          ModuleKey NVARCHAR(50) NOT NULL,
          RoleId INT NOT NULL,
          CONSTRAINT PK_UserModuleRole PRIMARY KEY (UserId, ModuleKey)
        );
        PRINT 'Table MP_T_USER_MODULE_ROLE created successfully.';
      END
      ELSE
      BEGIN
        PRINT 'Table MP_T_USER_MODULE_ROLE already exists.';
      END
    `;

        await sql.query(query);
        console.log('Schema update complete.');
        await sql.close();
    } catch (err) {
        console.error('Error creating table:', err);
    }
}

createTable();

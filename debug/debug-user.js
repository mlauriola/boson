import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'core/backend/.env') });

// Load config
const configPath = path.join(__dirname, 'config/app-config.json');
const appConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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

async function run() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to DB');

        // Get a valid user ID first
        const users = await sql.query("SELECT TOP 1 Usr_Code FROM MP_T_USER");
        if (users.recordset.length === 0) {
            console.log('No users found.');
            process.exit(0);
        }
        const userId = users.recordset[0].Usr_Code;
        console.log(`Testing with UserID: ${userId}`);

        const request = new sql.Request();
        const result = await request
            .input('userId', sql.Int, userId)
            .execute('sp_GetUserById');

        console.log('sp_GetUserById Result Keys:');
        if (result.recordset.length > 0) {
            console.log(Object.keys(result.recordset[0]));
            console.log('Usr_Login value:', result.recordset[0].Usr_Login);
            console.log('Username value:', result.recordset[0].Username);
            console.log('Login value:', result.recordset[0].Login);
        } else {
            console.log('No user returned by SP.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();

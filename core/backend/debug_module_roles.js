
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function check() {
    try {
        await sql.connect(config);
        console.log('Connected.');

        // Simulate Logic from server.js
        const userId = 8;

        console.log(`Querying for UserId: ${userId}`);

        const result = await new sql.Request() // Use Request object like server.js (pool.request() creates one)
            .input('userId', sql.Int, userId)
            .query('SELECT ModuleKey, RoleId FROM MP_T_USER_MODULE_ROLE WHERE UserId = @userId');

        console.log('Recordset:', result.recordset);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();

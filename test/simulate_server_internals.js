
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

async function run() {
    let pool;
    try {
        pool = await sql.connect(config);
        console.log('Connected to DB.');

        // 1. Login
        const username = 'M+';
        const password = 'duemila25'; // From debug output

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .execute('sp_UserLogin');

        const user = result.recordset[0];
        console.log('User:', user);

        // 2. Fetch Roles (Logic copied from server.js)
        console.log(`DEBUG: Fetching roles for User ${user.Usr_Code}...`);
        const rolesResult = await pool.request()
            .input('userId', sql.Int, user.Usr_Code)
            .query('SELECT ModuleKey, RoleId FROM MP_T_USER_MODULE_ROLE WHERE UserId = @userId');

        const moduleRoles = {};
        rolesResult.recordset.forEach(row => {
            moduleRoles[row.ModuleKey] = row.RoleId;
        });

        console.log(`DEBUG: Fetched roles for User ${user.Usr_Code}:`, moduleRoles);

        process.exit(0);

    } catch (err) {
        console.error('CRASH:', err);
        process.exit(1);
    }
}

run();

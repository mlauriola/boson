
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
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

async function verifyFlow() {
    let pool;
    try {
        // 1. Get Credentials
        console.log('1. Fetching Credentials for User 8...');
        pool = await sql.connect(dbConfig);
        const result = await pool.query('SELECT Usr_Login, Usr_Pwd FROM MP_T_USER WHERE Usr_Code = 8');
        await pool.close();

        if (result.recordset.length === 0) {
            console.error('User 8 not found in DB!');
            return;
        }

        const { Usr_Login, Usr_Pwd } = result.recordset[0];
        console.log(`   User: ${Usr_Login}`);

        // 2. Perform Login
        console.log('2. Calling /login... (Port 3001)');
        const loginRes = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: Usr_Login, password: Usr_Pwd })
        });

        const loginData = await loginRes.json();
        const cookie = loginRes.headers.get('set-cookie');

        console.log('   Login Status:', loginRes.status);
        console.log('   Login Response:', JSON.stringify(loginData, null, 2));

        if (!loginRes.ok) throw new Error('Login failed');

        // 3. Check Auth
        console.log('3. Calling /api/check-auth... (Port 3001)');
        const authRes = await fetch('http://localhost:3001/api/check-auth', {
            headers: { 'Cookie': cookie }
        });

        const authData = await authRes.json();
        console.log('   Check-Auth Response:', JSON.stringify(authData, null, 2));

        // 4. Analysis
        if (authData.roleId === 1 && authData.moduleRoles && authData.moduleRoles.core === 1) {
            console.log('\n[SUCCESS] Backend is returning correct Admin role.');
        } else {
            console.log('\n[FAILURE] Backend is NOT returning Admin role.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

verifyFlow();

import sql from 'mssql';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load .env logic from apply_schema.js
const envPath = path.resolve('core/backend/.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: 'EventManagement',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        console.log('Connecting...');
        await sql.connect(dbConfig);
        console.log('Connected.');

        console.log('Testing sp_Planning_GetEvents...');
        const request = new sql.Request();
        request.input('StartDate', sql.Date, '2025-11-30');
        request.input('EndDate', sql.Date, '2025-12-30');

        const result = await request.execute('sp_Planning_GetEvents');
        console.log('Success!', result.recordset);

    } catch (err) {
        console.error('ERROR executing SP:', err);
    } finally {
        process.exit();
    }
}

run();

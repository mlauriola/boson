import sql from 'mssql';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load .env from core/backend/.env
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

        console.log('Testing sp_Planning_SaveEvent...');
        const request = new sql.Request();

        // Mock Data based on frontend payload
        // id: null
        // client: "WP" (from tags)
        // subClient: ""
        // name: "Test Event"
        // location: "Rome"
        // dateFrom: "2025-01-01"
        // dateTo: "2025-01-05"
        // status: "Draft"
        // managerId: 1 (or whatever app user id)
        // notes: "Test notes"

        request.input('Id', sql.Int, null);
        request.input('ClientId', sql.NVarChar(50), 'WP');
        request.input('SubClient', sql.NVarChar(100), 'Test Sub');
        request.input('Name', sql.NVarChar(255), 'Debug Event Name');
        request.input('Location', sql.NVarChar(150), 'Debug Location');
        request.input('DateFrom', sql.Date, '2025-01-01');
        request.input('DateTo', sql.Date, '2025-01-05');
        request.input('Status', sql.NVarChar(50), 'Draft');
        request.input('ManagerId', sql.Int, 1);
        request.input('Notes', sql.NVarChar(sql.MAX), 'Debug Notes');

        // The SP also has @User parameter if I recall correctly viewing the file?
        // Let's check the SP definition I viewed in step 704.
        // Line 66: @User NVARCHAR(100) = NULL -- Creator/Updater
        // In index.js lines 151-161, I DO NOT see 'User' being passed.
        // It has default NULL so it should be fine.

        const result = await request.execute('sp_Planning_SaveEvent');
        console.log('Success! New ID:', result.recordset[0]);

    } catch (err) {
        console.error('ERROR executing SP:', err);
    } finally {
        process.exit();
    }
}

run();

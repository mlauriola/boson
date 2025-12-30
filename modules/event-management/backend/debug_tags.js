import sql from 'mssql';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve('core/backend/.env');
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
        await sql.connect(dbConfig);
        const result = await sql.query(`SELECT * FROM PlanningTags WHERE Category='Status'`);
        console.table(result.recordset);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();

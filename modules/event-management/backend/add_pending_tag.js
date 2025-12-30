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

        // Check if Pending exists
        const check = await sql.query(`SELECT 1 FROM PlanningTags WHERE Category='Status' AND Name='Pending'`);
        if (check.recordset.length === 0) {
            console.log('Adding Pending status...');
            await sql.query(`INSERT INTO PlanningTags (Category, Name, Color) VALUES ('Status', 'Pending', '#f39c12')`); // Orange
            console.log('Pending status added.');
        } else {
            console.log('Pending status already exists.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();

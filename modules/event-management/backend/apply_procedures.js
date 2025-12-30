import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve('core/backend/.env');
dotenv.config({ path: envPath });

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: 'EventManagement', // Ensure correct DB
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(dbConfig);
        const sqlContent = fs.readFileSync('sql/event-management/05_Create_Planning_Procedures.sql', 'utf8');

        // Split by GO is naive but works if entire file is clean. 
        // Better: execute the specific procedure block or rely on mssql to handle batches if supported, 
        // but Node mssql driver doesn't support GO. 
        // I will extract the sp_Planning_AddAllocation part simplified or just run the whole file splitting by GO.

        const batches = sqlContent.split(/^GO/m); // Regex for GO on new line

        for (const batch of batches) {
            const cleanBatch = batch.trim();
            if (cleanBatch) {
                await sql.query(cleanBatch);
                console.log('Executed batch.');
            }
        }

        console.log('Procedures updated.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();

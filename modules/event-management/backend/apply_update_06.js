import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'M1cr0+', // Default or env
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    database: 'EventManagement',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        const pool = await new sql.ConnectionPool(dbConfig).connect();
        console.log('Connected to DB');

        const sqlContent = fs.readFileSync(path.join(__dirname, '../../../sql/event-management/06_Update_Planning_Schema.sql'), 'utf8');

        // Split GO commands as mssql driver doesn't like them in one batch usually, or maybe it does?
        // Usually safer to split.
        const batches = sqlContent.split(/^GO\s*$/im);

        for (const batch of batches) {
            if (batch.trim()) {
                await pool.request().query(batch);
                console.log('Executed batch.');
            }
        }

        console.log('Update Complete');
        await pool.close();
    } catch (err) {
        console.error('Error', err);
    }
}

run();

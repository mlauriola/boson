import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load .env from core/backend/.env (Running from root)
const envPath = path.resolve('core/backend/.env');
console.log('DEBUG: Loading .env from:', envPath);
dotenv.config({ path: envPath });

console.log('DEBUG: DB_SERVER:', process.env.DB_SERVER);


const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: 'EventManagement', // Hardcoded as per module config
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const sqlFiles = [
    'c:\\microplus-bos\\sql\\event-management\\03_Create_Planning_Tables.sql',
    'c:\\microplus-bos\\sql\\event-management\\04_Create_Planning_View.sql',
    'c:\\microplus-bos\\sql\\event-management\\05_Create_Planning_Procedures.sql',
    'c:\\microplus-bos\\sql\\event-management\\06_Seed_Planning_Tags.sql'
];

async function run() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(dbConfig);
        console.log('Connected.');

        for (const file of sqlFiles) {
            console.log(`Executing ${path.basename(file)}...`);
            const script = fs.readFileSync(file, 'utf8');

            // Split by GO if necessary, but mssql often handles batches or we execute whole file.
            // Procedures with GO usually need splitting.
            // Simple split by 'GO' on new line
            const batches = script.split(/^\s*GO\s*$/gim);

            for (const batch of batches) {
                if (batch.trim()) {
                    await pool.request().query(batch);
                }
            }
            console.log(`✓ ${path.basename(file)} applied.`);
        }

        console.log('All scripts executed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error applying schema:', err);
        process.exit(1);
    }
}

run();

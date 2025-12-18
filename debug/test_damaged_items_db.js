
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../core/backend/.env') });

const config = {
    server: process.env.DB_SERVER,
    database: 'EventManagement', // Explicitly target this DB
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
        console.log('Connecting to EventManagement DB...');
        await sql.connect(config);
        console.log('Connected.');

        console.log('Executing sp_DamagedItems_List...');
        const result = await new sql.Request().query('EXEC sp_DamagedItems_List');
        console.log('Success! Items:', result.recordset);

        process.exit(0);
    } catch (err) {
        console.error('SQL Execution Failed:', err.message);
        if (err.originalError) {
            console.error('Original Error:', err.originalError.message);
            console.error('Code:', err.code);
        }
        process.exit(1);
    }
}

check();

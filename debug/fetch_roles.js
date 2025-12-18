
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct path to .env in core/backend
dotenv.config({ path: path.join(__dirname, '../core/backend/.env') });

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

async function check() {
    try {
        await sql.connect(config);
        console.log('Connected to DB:', config.database);

        // Assumption: There is a table defining roles. Usually MP_T_ROLE or similar.
        // I'll try to find it.
        const tableCheck = await new sql.Request().query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%ROLE%'");
        console.log('Role Tables:', tableCheck.recordset);

        if (tableCheck.recordset.length > 0) {
            // Let's try to read MP_T_ROLE if it exists, or the first one found
            const tableName = tableCheck.recordset.find(t => t.TABLE_NAME === 'MP_T_ROLE')?.TABLE_NAME || tableCheck.recordset[0].TABLE_NAME;
            console.log(`Reading from ${tableName}...`);
            const roles = await new sql.Request().query(`SELECT * FROM ${tableName}`);
            console.log('Roles:', roles.recordset);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();

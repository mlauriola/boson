
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

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

const procedures = [
    'sp_CreateUser',
    'sp_UpdateUser',
    'sp_UserLogin',
    'sp_GetAllUsers',
    'sp_GetUserById',
    'sp_GetAllRoles'
];

async function fetchProcs() {
    try {
        await sql.connect(config);
        console.log('Connected.');

        let output = '';

        for (const proc of procedures) {
            console.log(`Fetching ${proc}...`);
            const result = await sql.query(`SELECT OBJECT_DEFINITION(OBJECT_ID('${proc}')) AS definition`);
            if (result.recordset[0] && result.recordset[0].definition) {
                output += `-------------------------------------------------\n`;
                output += `-- ${proc}\n`;
                output += `-------------------------------------------------\n`;
                output += result.recordset[0].definition + '\n\n';
            } else {
                console.log(`Warning: Could not fetch definition for ${proc}`);
            }
        }

        fs.writeFileSync(path.join(__dirname, 'procedures_dump.sql'), output);
        console.log('Saved to procedures_dump.sql');
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

fetchProcs();

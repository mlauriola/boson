
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config
const configPath = path.join(__dirname, '../../config/app-config.json');
const appConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Load env
dotenv.config({ path: path.join(__dirname, '.env') }); // Assuming .env is in backend dir, adjusting path if needed

// DB Config (copying from server.js logic)
const dbConfig = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || appConfig.database.targetDatabase,
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function inspect() {
    try {
        console.log('Connecting to database...');
        await sql.connect(dbConfig);
        console.log('Connected!');

        // Query to list all tables and their columns
        const query = `
      SELECT 
        t.name AS TableName,
        c.name AS ColumnName,
        ty.name AS DataType,
        c.max_length AS MaxLength
      FROM sys.tables t
      INNER JOIN sys.columns c ON t.object_id = c.object_id
      INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      ORDER BY t.name, c.column_id;
    `;

        const result = await sql.query(query);

        let currentTable = '';
        result.recordset.forEach(row => {
            if (row.TableName !== currentTable) {
                console.log(`\nTable: ${row.TableName}`);
                currentTable = row.TableName;
            }
            console.log(`  - ${row.ColumnName} (${row.DataType})`);
        });

        await sql.close();

    } catch (err) {
        console.error('Error:', err);
    }
}

inspect();

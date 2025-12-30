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

        // 1. Update Pending color to Orange
        await sql.query(`UPDATE PlanningTags SET Color='#f39c12' WHERE Category='Status' AND Name='Pending'`);
        console.log('Updated Pending color.');

        // 2. Insert Draft if missing
        let check = await sql.query(`SELECT 1 FROM PlanningTags WHERE Category='Status' AND Name='Draft'`);
        if (check.recordset.length === 0) {
            await sql.query(`INSERT INTO PlanningTags (Category, Name, Color) VALUES ('Status', 'Draft', '#95a5a6')`);
            console.log('Inserted Draft tag.');
        }

        // 3. Insert Cancelled if missing
        check = await sql.query(`SELECT 1 FROM PlanningTags WHERE Category='Status' AND Name='Cancelled'`);
        if (check.recordset.length === 0) {
            await sql.query(`INSERT INTO PlanningTags (Category, Name, Color) VALUES ('Status', 'Cancelled', '#e74c3c')`);
            console.log('Inserted Cancelled tag.');
        }

        const all = await sql.query(`SELECT * FROM PlanningTags WHERE Category='Status'`);
        console.table(all.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();

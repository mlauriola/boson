
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
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
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function execute() {
    try {
        console.log('Connecting to database...');
        await sql.connect(config);
        console.log('Connected to ' + config.database);

        // 1. Drop Default Constraint (if exists)
        const defaultConstraintQuery = `
            SELECT name 
            FROM sys.default_constraints 
            WHERE parent_object_id = OBJECT_ID('MP_T_USER') 
            AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('MP_T_USER'), 'Usr_Rol_Id', 'ColumnId')
        `;
        const dcResult = await sql.query(defaultConstraintQuery);
        if (dcResult.recordset.length > 0) {
            const dcName = dcResult.recordset[0].name;
            console.log(`Dropping Default Constraint: ${dcName}`);
            await sql.query(`ALTER TABLE MP_T_USER DROP CONSTRAINT ${dcName}`);
        }

        // 2. Drop Foreign Key Constraint (if exists)
        const fkConstraintQuery = `
            SELECT name 
            FROM sys.foreign_keys 
            WHERE parent_object_id = OBJECT_ID('MP_T_USER') 
            AND referenced_object_id = OBJECT_ID('MP_T_ROLES')
        `;
        const fkResult = await sql.query(fkConstraintQuery);
        if (fkResult.recordset.length > 0) {
            const fkName = fkResult.recordset[0].name;
            console.log(`Dropping Foreign Key Constraint: ${fkName}`);
            await sql.query(`ALTER TABLE MP_T_USER DROP CONSTRAINT ${fkName}`);
        }

        // 3. Drop Column
        console.log('Dropping Column Usr_Rol_Id...');
        try {
            await sql.query(`ALTER TABLE MP_T_USER DROP COLUMN Usr_Rol_Id`);
            console.log('Column dropped.');
        } catch (err) {
            if (err.message.includes("Invalid column name")) {
                console.log('Column Usr_Rol_Id already dropped.');
            } else {
                throw err;
            }
        }

        // 4. Update Stored Procedures
        console.log('Updating Stored Procedures...');

        await sql.query(`
            CREATE OR ALTER PROCEDURE [dbo].[sp_CreateUser]
                @Username NVARCHAR(255),
                @Password NVARCHAR(255),
                @Email NVARCHAR(255) = '',
                @Referent NVARCHAR(255),
                @Phone NVARCHAR(50) = ''
                -- Removed @RoleId
            AS
            BEGIN
                SET NOCOUNT ON;
                IF EXISTS (SELECT 1 FROM MP_T_USER WHERE Usr_Login = @Username)
                BEGIN
                    SELECT -1 as Result, 'Username already exists' as ErrorMessage
                    RETURN
                END

                INSERT INTO MP_T_USER (Usr_Login, Usr_Pwd, Usr_Ref_Mail, Usr_Referent, Usr_Ref_Tel, Usr_IsValid, Usr_Recovery)
                VALUES (@Username, @Password, @Email, @Referent, @Phone, -1, 0)

                SELECT Usr_Code as Id, Usr_Login as Username, Usr_Referent as Referent, 
                       Usr_Ref_Mail as Email, Usr_Ref_Tel as Phone, 
                       Usr_IsValid as IsValid
                FROM MP_T_USER WHERE Usr_Code = SCOPE_IDENTITY()
            END
        `);
        console.log('sp_CreateUser updated.');

        await sql.query(`
            CREATE OR ALTER PROCEDURE [dbo].[sp_UpdateUser]
                @UserId INT,
                @Username NVARCHAR(255),
                @Password NVARCHAR(255) = NULL,
                @Referent NVARCHAR(255) = NULL,
                @Email NVARCHAR(255) = NULL,
                @Phone NVARCHAR(255) = NULL,
                @Recovery INT = NULL,
                @RecoveryOTP NVARCHAR(255) = NULL
                -- Removed @RoleId
            AS
            BEGIN
                SET NOCOUNT ON;
                IF NOT EXISTS (SELECT 1 FROM MP_T_USER WHERE Usr_Code = @UserId AND Usr_IsValid = -1)
                BEGIN
                    SELECT -1 as Result, 'User not found' as ErrorMessage
                    RETURN
                END

                UPDATE MP_T_USER
                SET Usr_Login = @Username,
                    Usr_Pwd = CASE WHEN @Password IS NOT NULL AND @Password != '' THEN @Password ELSE Usr_Pwd END,
                    Usr_Referent = ISNULL(@Referent, Usr_Referent),
                    Usr_Ref_Mail = ISNULL(@Email, Usr_Ref_Mail),
                    Usr_Ref_Tel = ISNULL(@Phone, Usr_Ref_Tel),
                    Usr_Recovery = ISNULL(@Recovery, Usr_Recovery),
                    Usr_Recovery_OTP = ISNULL(@RecoveryOTP, Usr_Recovery_OTP),
                    Usr_First_Login = CASE WHEN @Password IS NOT NULL AND @Password != '' THEN 0 ELSE Usr_First_Login END
                WHERE Usr_Code = @UserId

                SELECT Usr_Code as Id, Usr_Login as Username, Usr_Referent as Referent, 
                       Usr_Ref_Mail as Email, Usr_Ref_Tel as Phone, 
                       Usr_IsValid as IsValid, Usr_Recovery as Recovery
                FROM MP_T_USER WHERE Usr_Code = @UserId
            END
        `);
        console.log('sp_UpdateUser updated.');

        await sql.query(`
            CREATE OR ALTER PROCEDURE [dbo].[sp_UserLogin]
                @Username NVARCHAR(255)
            AS
            BEGIN
                SET NOCOUNT ON;
                SELECT Usr_Code, Usr_Login, Usr_Pwd, Usr_Referent, Usr_Ref_Mail, Usr_Ref_Tel, 
                       Usr_IsValid, Usr_First_Login
                FROM MP_T_USER 
                WHERE Usr_Login = @Username AND Usr_IsValid = -1;
            END
        `);
        console.log('sp_UserLogin updated.');

        await sql.query(`
            CREATE OR ALTER PROCEDURE [dbo].[sp_GetAllUsers] AS 
            BEGIN 
                SET NOCOUNT ON; 
                SELECT Usr_Code as Id, Usr_Login as Username, Usr_Referent as Referent, 
                       Usr_Ref_Mail as Email, Usr_Ref_Tel as Phone, 
                       Usr_IsValid as IsValid, Usr_Recovery as Recovery 
                FROM MP_T_USER 
                WHERE Usr_IsValid = -1 ORDER BY Usr_Code 
            END
        `);
        console.log('sp_GetAllUsers updated.');

        await sql.query(`
            CREATE OR ALTER PROCEDURE [dbo].[sp_GetUserById] @UserId INT AS 
            BEGIN 
                SET NOCOUNT ON; 
                SELECT Usr_Code as Id, Usr_Login as Username, Usr_Pwd as Password, 
                       Usr_Referent as Referent, Usr_Ref_Mail as Email, Usr_Ref_Tel as Phone, 
                       Usr_IsValid as IsValid, Usr_Recovery as Recovery 
                FROM MP_T_USER 
                WHERE Usr_Code = @UserId AND Usr_IsValid = -1 
            END
        `);
        console.log('sp_GetUserById updated.');

        console.log('All changes applied successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

execute();

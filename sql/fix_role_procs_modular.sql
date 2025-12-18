-- =============================================
-- FIX PROCEDURES FOR MODULAR ROLES (No Usr_Rol_Id)
-- Maps 'core' module role to legacy Usr_Rol_Id output
-- =============================================

-- 1. sp_UserLogin
IF OBJECT_ID('sp_UserLogin', 'P') IS NOT NULL DROP PROCEDURE sp_UserLogin
GO
CREATE PROCEDURE sp_UserLogin
    @Username NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.Usr_Code, 
        u.Usr_Login, 
        u.Usr_Pwd, 
        u.Usr_Referent, 
        u.Usr_Ref_Mail, 
        u.Usr_Ref_Tel, 
        -- Map 'core' role to Usr_Rol_Id
        ISNULL(mr.RoleId, 4) as Usr_Rol_Id, -- Default to Viewer (4) if no core role
        u.Usr_IsValid, 
        u.Usr_First_Login,
        ISNULL(r.Rol_Descrizione, 'Viewer') AS RoleName
    FROM MP_T_USER u
    LEFT JOIN MP_T_USER_MODULE_ROLE mr ON u.Usr_Code = mr.UserId AND mr.ModuleKey = 'core'
    LEFT JOIN MP_T_ROLES r ON mr.RoleId = r.Rol_Id
    WHERE u.Usr_Login = @Username AND u.Usr_IsValid = -1;
END
GO

-- 2. sp_GetAllUsers
IF OBJECT_ID('sp_GetAllUsers', 'P') IS NOT NULL DROP PROCEDURE sp_GetAllUsers
GO
CREATE PROCEDURE sp_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.Usr_Code as Id, 
        u.Usr_Login as Username, 
        u.Usr_Referent as Referent,
        u.Usr_Ref_Mail as Email, 
        u.Usr_Ref_Tel as Phone, 
        ISNULL(mr.RoleId, 4) as RoleId,
        ISNULL(r.Rol_Descrizione, 'Viewer') as RoleName, 
        u.Usr_IsValid as IsValid
    FROM MP_T_USER u
    LEFT JOIN MP_T_USER_MODULE_ROLE mr ON u.Usr_Code = mr.UserId AND mr.ModuleKey = 'core'
    LEFT JOIN MP_T_ROLES r ON mr.RoleId = r.Rol_Id
    WHERE u.Usr_IsValid = -1
    ORDER BY u.Usr_Code
END
GO

-- 3. sp_GetUserById
IF OBJECT_ID('sp_GetUserById', 'P') IS NOT NULL DROP PROCEDURE sp_GetUserById
GO
CREATE PROCEDURE sp_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.Usr_Code as Id, 
        u.Usr_Login as Username, 
        u.Usr_Referent as Referent,
        u.Usr_Ref_Mail as Email, 
        u.Usr_Ref_Tel as Phone, 
        ISNULL(mr.RoleId, 4) as RoleId,
        ISNULL(r.Rol_Descrizione, 'Viewer') as RoleName, 
        u.Usr_IsValid as IsValid
    FROM MP_T_USER u
    LEFT JOIN MP_T_USER_MODULE_ROLE mr ON u.Usr_Code = mr.UserId AND mr.ModuleKey = 'core'
    LEFT JOIN MP_T_ROLES r ON mr.RoleId = r.Rol_Id
    WHERE Usr_Code = @UserId AND Usr_IsValid = -1
END
GO

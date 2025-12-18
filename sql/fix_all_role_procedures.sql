-- =============================================
-- MASTER FIX: Restore ALL Role/User Stored Procedures
-- Ensures MP_T_ROLES is used (not MP_T_ROLE)
-- =============================================

-- 1. sp_GetAllRoles
IF OBJECT_ID('sp_GetAllRoles', 'P') IS NOT NULL DROP PROCEDURE sp_GetAllRoles
GO
CREATE PROCEDURE sp_GetAllRoles
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Rol_Id as Id, Rol_Descrizione as Description FROM MP_T_ROLES ORDER BY Rol_Id
END
GO

-- 2. sp_UserLogin
IF OBJECT_ID('sp_UserLogin', 'P') IS NOT NULL DROP PROCEDURE sp_UserLogin
GO
CREATE PROCEDURE sp_UserLogin
    @Username NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.Usr_Code, u.Usr_Login, u.Usr_Pwd, u.Usr_Referent, u.Usr_Ref_Mail, u.Usr_Ref_Tel,
        u.Usr_Rol_Id, u.Usr_IsValid, u.Usr_First_Login,
        r.Rol_Descrizione AS RoleName
    FROM MP_T_USER u
    LEFT JOIN MP_T_ROLES r ON u.Usr_Rol_Id = r.Rol_Id
    WHERE u.Usr_Login = @Username AND u.Usr_IsValid = -1;
END
GO

-- 3. sp_GetAllUsers
IF OBJECT_ID('sp_GetAllUsers', 'P') IS NOT NULL DROP PROCEDURE sp_GetAllUsers
GO
CREATE PROCEDURE sp_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.Usr_Code as Id, u.Usr_Login as Username, u.Usr_Referent as Referent,
        u.Usr_Ref_Mail as Email, u.Usr_Ref_Tel as Phone, u.Usr_Rol_Id as RoleId,
        r.Rol_Descrizione as RoleName, u.Usr_IsValid as IsValid
    FROM MP_T_USER u
    LEFT JOIN MP_T_ROLES r ON u.Usr_Rol_Id = r.Rol_Id
    WHERE u.Usr_IsValid = -1
    ORDER BY u.Usr_Code
END
GO

-- 4. sp_GetUserById
IF OBJECT_ID('sp_GetUserById', 'P') IS NOT NULL DROP PROCEDURE sp_GetUserById
GO
CREATE PROCEDURE sp_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.Usr_Code as Id, u.Usr_Login as Username, u.Usr_Referent as Referent,
        u.Usr_Ref_Mail as Email, u.Usr_Ref_Tel as Phone, u.Usr_Rol_Id as RoleId,
        r.Rol_Descrizione as RoleName, u.Usr_IsValid as IsValid
    FROM MP_T_USER u
    LEFT JOIN MP_T_ROLES r ON u.Usr_Rol_Id = r.Rol_Id
    WHERE Usr_Code = @UserId AND Usr_IsValid = -1
END
GO

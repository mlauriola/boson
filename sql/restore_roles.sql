-- =============================================
-- Restore Role Stored Procedures
-- =============================================

-- 1. sp_GetAllRoles
IF OBJECT_ID('sp_GetAllRoles', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetAllRoles
GO

CREATE PROCEDURE sp_GetAllRoles
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Rol_Id as Id,
        Rol_Descrizione as Description
    FROM MP_T_ROLES
    ORDER BY Rol_Id
END
GO

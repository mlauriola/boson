-- =============================================
-- RECREATE DAMAGED ITEMS PROCEDURES (FIXED TABLE NAME)
-- =============================================

-- Ensure Table Exists with Correct FK
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DamagedItems')
BEGIN
    CREATE TABLE DamagedItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ReportId INT NULL,
        ItemCode NVARCHAR(50),
        Description NVARCHAR(MAX),
        Status NVARCHAR(50),
        CreatedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE SET NULL
    );
END
GO

-- 1. sp_DamagedItems_List
IF OBJECT_ID('sp_DamagedItems_List', 'P') IS NOT NULL DROP PROCEDURE sp_DamagedItems_List
GO
CREATE PROCEDURE sp_DamagedItems_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        d.Id,
        d.ReportId,
        ISNULL(r.EventName, 'N/A') as EventName,
        d.ItemCode,
        d.Description,
        d.Status,
        r.CreatedBy as ReportedBy,
        COALESCE(r.DateFrom, d.CreatedDate) as ReportDate,
        r.DateFrom
    FROM DamagedItems d
    LEFT JOIN Reports r ON d.ReportId = r.Id
    ORDER BY d.CreatedDate DESC
END
GO

-- 2. sp_DamagedItems_Add
IF OBJECT_ID('sp_DamagedItems_Add', 'P') IS NOT NULL DROP PROCEDURE sp_DamagedItems_Add
GO
CREATE PROCEDURE sp_DamagedItems_Add
    @ReportId INT = NULL,
    @ItemCode NVARCHAR(50),
    @Description NVARCHAR(MAX),
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DamagedItems (ReportId, ItemCode, Description, Status)
    VALUES (@ReportId, @ItemCode, @Description, @Status)
END
GO

-- 3. sp_DamagedItems_Update
IF OBJECT_ID('sp_DamagedItems_Update', 'P') IS NOT NULL DROP PROCEDURE sp_DamagedItems_Update
GO
CREATE PROCEDURE sp_DamagedItems_Update
    @Id INT,
    @ItemCode NVARCHAR(50),
    @Description NVARCHAR(MAX),
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE DamagedItems
    SET ItemCode = @ItemCode,
        Description = @Description,
        Status = @Status
    WHERE Id = @Id
END
GO

-- 4. sp_DamagedItems_Delete
IF OBJECT_ID('sp_DamagedItems_Delete', 'P') IS NOT NULL DROP PROCEDURE sp_DamagedItems_Delete
GO
CREATE PROCEDURE sp_DamagedItems_Delete
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM DamagedItems WHERE Id = @Id
END
GO

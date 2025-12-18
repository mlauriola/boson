USE [EventManagement]
GO

-- Add missing columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MissingItems' AND COLUMN_NAME = 'Status')
BEGIN
    ALTER TABLE MissingItems ADD Status NVARCHAR(50) DEFAULT 'Missing' WITH VALUES;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MissingItems' AND COLUMN_NAME = 'CreatedDate')
BEGIN
    ALTER TABLE MissingItems ADD CreatedDate DATETIME DEFAULT GETDATE() WITH VALUES;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MissingItems' AND COLUMN_NAME = 'UpdatedDate')
BEGIN
    ALTER TABLE MissingItems ADD UpdatedDate DATETIME NULL;
END
GO

-- =============================================
-- List Missing Items
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_MissingItems_List]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        m.Id,
        m.ItemCode,
        m.Description,
        m.Status,
        m.ReportId,
        r.EventName,
        r.DateFrom,
        r.CreatedBy as ReportedBy,
        COALESCE(r.DateFrom, m.CreatedDate) as ReportDate
    FROM MissingItems m
    LEFT JOIN Reports r ON m.ReportId = r.Id
    ORDER BY ReportDate DESC
END
GO

-- =============================================
-- Add Missing Item
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_MissingItems_Add]
    @ReportId INT = NULL,
    @ItemCode NVARCHAR(50),
    @Description NVARCHAR(MAX),
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO MissingItems (ReportId, ItemCode, Description, Status, CreatedDate)
    VALUES (@ReportId, @ItemCode, @Description, @Status, GETDATE())
    
    SELECT SCOPE_IDENTITY() AS Id
END
GO

-- =============================================
-- Update Missing Item
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_MissingItems_Update]
    @Id INT,
    @ReportId INT = NULL,
    @ItemCode NVARCHAR(50),
    @Description NVARCHAR(MAX),
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE MissingItems
    SET 
        ReportId = @ReportId,
        ItemCode = @ItemCode,
        Description = @Description,
        Status = @Status,
        UpdatedDate = GETDATE()
    WHERE Id = @Id
END
GO

-- =============================================
-- Delete Missing Item
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_MissingItems_Delete]
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM MissingItems WHERE Id = @Id
END
GO

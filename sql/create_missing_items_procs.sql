USE [EventManagement]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
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
        e.EventName,
        r.DateFrom,
        r.CreatedBy as ReportedBy,
        COALESCE(r.DateFrom, m.CreatedDate) as ReportDate
    FROM MissingItems m
    LEFT JOIN Reports r ON m.ReportId = r.Id
    LEFT JOIN Events e ON r.EventId = e.Id
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

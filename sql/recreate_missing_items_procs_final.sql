-- =============================================
-- List Missing Items (Strictly Mirrored from sp_DamagedItems_List)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_MissingItems_List]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        m.Id,
        m.ReportId,
        ISNULL(r.EventName, 'N/A') as EventName,
        m.ItemCode,
        m.Description,
        m.Status,
        r.CreatedBy as ReportedBy,
        COALESCE(r.DateFrom, m.CreatedDate) as ReportDate,
        r.DateFrom
    FROM MissingItems m
    LEFT JOIN Reports r ON m.ReportId = r.Id
    ORDER BY m.CreatedDate DESC
END
GO

-- =============================================
-- Add Missing Item (Strictly Mirrored from sp_DamagedItems_Add)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_MissingItems_Add]
    @ReportId INT = NULL,
    @ItemCode NVARCHAR(50),
    @Description NVARCHAR(MAX),
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO MissingItems (ReportId, ItemCode, Description, Status)
    VALUES (@ReportId, @ItemCode, @Description, @Status)
END
GO

-- =============================================
-- Update Missing Item (Strictly Mirrored from sp_DamagedItems_Update)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_MissingItems_Update]
    @Id INT,
    @ItemCode NVARCHAR(50),
    @Description NVARCHAR(MAX),
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE MissingItems
    SET 
        ItemCode = @ItemCode,
        Description = @Description,
        Status = @Status
    WHERE Id = @Id
END
GO

-- =============================================
-- Delete Missing Item (Mirrored from sp_DamagedItems_Delete)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_MissingItems_Delete]
    @Id int
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM MissingItems
    WHERE Id = @Id
END
GO

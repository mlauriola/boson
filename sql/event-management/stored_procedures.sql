USE EventReport;
GO

-- 1. sp_EventReport_List
CREATE OR ALTER PROCEDURE sp_EventReport_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Reports ORDER BY CreatedAt DESC;
END
GO

-- 2. sp_EventReport_GetFull
-- Returns 5 result sets: Report, Issues, Damaged, Missing, Suggestions
CREATE OR ALTER PROCEDURE sp_EventReport_GetFull
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Set 1: Report
    SELECT * FROM Reports WHERE Id = @Id;

    -- Set 2: Issues
    SELECT * FROM ReportIssues WHERE ReportId = @Id;

    -- Set 3: Damaged
    SELECT * FROM DamagedItems WHERE ReportId = @Id;

    -- Set 4: Missing
    SELECT * FROM MissingItems WHERE ReportId = @Id;

    -- Set 5: Suggestions
    SELECT * FROM Suggestions WHERE ReportId = @Id;
END
GO

-- 3. sp_EventReport_Create
CREATE OR ALTER PROCEDURE sp_EventReport_Create
    @EventName NVARCHAR(255),
    @Location NVARCHAR(255),
    @DateFrom DATE,
    @DateTo DATE,
    @ManagerName NVARCHAR(255),
    @Summary NVARCHAR(MAX),
    @ServicesProvided NVARCHAR(MAX),
    @Status NVARCHAR(50),
    @FinalNotes NVARCHAR(MAX),
    @CreatedBy NVARCHAR(255),
    @NewId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Reports (EventName, Location, DateFrom, DateTo, ManagerName, Summary, ServicesProvided, Status, FinalNotes, CreatedBy)
    VALUES (@EventName, @Location, @DateFrom, @DateTo, @ManagerName, @Summary, @ServicesProvided, @Status, @FinalNotes, @CreatedBy);

    SET @NewId = SCOPE_IDENTITY();
END
GO

-- 4. sp_EventReport_Update
CREATE OR ALTER PROCEDURE sp_EventReport_Update
    @Id INT,
    @EventName NVARCHAR(255),
    @Location NVARCHAR(255),
    @DateFrom DATE,
    @DateTo DATE,
    @ManagerName NVARCHAR(255),
    @Summary NVARCHAR(MAX),
    @ServicesProvided NVARCHAR(MAX),
    @Status NVARCHAR(50),
    @FinalNotes NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Reports SET 
        EventName = @EventName, 
        Location = @Location, 
        DateFrom = @DateFrom, 
        DateTo = @DateTo,
        ManagerName = @ManagerName, 
        Summary = @Summary, 
        ServicesProvided = @ServicesProvided,
        Status = @Status, 
        FinalNotes = @FinalNotes,
        UpdatedAt = GETDATE()
    WHERE Id = @Id;
END
GO

-- 5. sp_EventReport_Delete
CREATE OR ALTER PROCEDURE sp_EventReport_Delete
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    -- ON DELETE CASCADE handles children automatically based on schema.sql logic
    -- But explicitly deleting children is safer if constraints change. 
    -- Given schema has CASCADE, we trust it, or we double down. The prompt wants SP conversion. 
    -- I will replicate the current JS logic which deletes explicitly, just to be robust.
    
    DELETE FROM ReportIssues WHERE ReportId = @Id;
    DELETE FROM DamagedItems WHERE ReportId = @Id;
    DELETE FROM MissingItems WHERE ReportId = @Id;
    DELETE FROM Suggestions WHERE ReportId = @Id;
    DELETE FROM Reports WHERE Id = @Id;
END
GO

-- 6. sp_EventReport_ClearChildren
CREATE OR ALTER PROCEDURE sp_EventReport_ClearChildren
    @ReportId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM ReportIssues WHERE ReportId = @ReportId;
    DELETE FROM DamagedItems WHERE ReportId = @ReportId;
    DELETE FROM MissingItems WHERE ReportId = @ReportId;
    DELETE FROM Suggestions WHERE ReportId = @ReportId;
END
GO

-- 7. Child Inserts
CREATE OR ALTER PROCEDURE sp_EventReport_AddIssue
    @ReportId INT,
    @Problem NVARCHAR(MAX),
    @Impact NVARCHAR(MAX),
    @Solution NVARCHAR(MAX),
    @PreventiveActions NVARCHAR(MAX),
    @Notes NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ReportIssues (ReportId, Problem, Impact, Solution, PreventiveActions, Notes) 
    VALUES (@ReportId, @Problem, @Impact, @Solution, @PreventiveActions, @Notes);
END
GO

CREATE OR ALTER PROCEDURE sp_EventReport_AddDamagedItem
    @ReportId INT,
    @ItemCode NVARCHAR(100),
    @Description NVARCHAR(MAX),
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DamagedItems (ReportId, ItemCode, Description, Status) 
    VALUES (@ReportId, @ItemCode, @Description, @Status);
END
GO

CREATE OR ALTER PROCEDURE sp_EventReport_AddMissingItem
    @ReportId INT,
    @ItemCode NVARCHAR(100),
    @Description NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO MissingItems (ReportId, ItemCode, Description) 
    VALUES (@ReportId, @ItemCode, @Description);
END
GO

CREATE OR ALTER PROCEDURE sp_EventReport_AddSuggestion
    @ReportId INT,
    @Logistics NVARCHAR(MAX),
    @Operations NVARCHAR(MAX),
    @Communication NVARCHAR(MAX),
    @Materials NVARCHAR(MAX),
    @Software NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Suggestions (ReportId, Logistics, Operations, Communication, Materials, Software) 
    VALUES (@ReportId, @Logistics, @Operations, @Communication, @Materials, @Software);
END
GO

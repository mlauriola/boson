-- 1. Add Referent Column if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Events') AND name = 'Referent')
BEGIN
    ALTER TABLE Events ADD Referent NVARCHAR(100);
END
GO

-- 2. Update Save Procedure
CREATE OR ALTER PROCEDURE sp_Planning_SaveEvent
    @Id INT = NULL,
    @ClientId NVARCHAR(50),
    @SubClient NVARCHAR(100) = NULL,
    @Name NVARCHAR(255),
    @Location NVARCHAR(150) = NULL,
    @DateFrom DATE,
    @DateTo DATE,
    @Status NVARCHAR(50),
    @ManagerId INT = NULL,
    @Referent NVARCHAR(100) = NULL, -- New Param
    @Notes NVARCHAR(MAX) = NULL,
    @User NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EventId INT;

    IF @Id IS NULL OR @Id = 0
    BEGIN
        INSERT INTO Events (ClientId, SubClient, Name, Location, DateFrom, DateTo, Status, ManagerId, Referent, Notes)
        VALUES (@ClientId, @SubClient, @Name, @Location, @DateFrom, @DateTo, @Status, @ManagerId, @Referent, @Notes);
        SET @EventId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE Events
        SET ClientId = @ClientId,
            SubClient = @SubClient,
            Name = @Name,
            Location = @Location,
            DateFrom = @DateFrom,
            DateTo = @DateTo,
            Status = @Status,
            ManagerId = @ManagerId,
            Referent = @Referent, -- Update
            Notes = @Notes,
            UpdatedAt = GETDATE()
        WHERE Id = @Id;
        SET @EventId = @Id;
    END

    SELECT @EventId as Id;
END
GO

-- 3. Update Get Procedure
CREATE OR ALTER PROCEDURE sp_Planning_GetEvents
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SELECT 
        e.*,
        -- Priority: Event-specific text Referent > Linked User's 'Referent' > Linked User's Login
        ISNULL(e.Referent, ISNULL(u.Usr_Referent, u.Usr_Login)) as ResolvedManagerName, -- Use Usr_Referent (Name) or Usr_Login (Username)
        u.Usr_Login as LinkedManagerUsername,
        u.Usr_Referent as LinkedManagerFullName, -- Note: Usr_Referent holds the full name usually
        (SELECT COUNT(*) FROM EventAllocations ea WHERE ea.EventId = e.Id) as ResourceCount
    FROM Events e
    LEFT JOIN BOS.dbo.MP_T_USER u ON e.ManagerId = u.Usr_Code
    WHERE (e.DateFrom <= @EndDate AND e.DateTo >= @StartDate)
    ORDER BY e.DateFrom;
END
GO

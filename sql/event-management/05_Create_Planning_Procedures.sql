-- PROCEDURE: sp_Planning_GetEvents
CREATE OR ALTER PROCEDURE sp_Planning_GetEvents
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SELECT 
        e.*,
        u.Usr_Referent as ManagerName,
        -- Count allocations for quick overview
        (SELECT COUNT(*) FROM EventAllocations ea WHERE ea.EventId = e.Id) as ResourceCount
    FROM Events e
    LEFT JOIN BOS.dbo.MP_T_USER u ON e.ManagerId = u.Usr_Code
    WHERE (e.DateFrom <= @EndDate AND e.DateTo >= @StartDate)
    ORDER BY e.DateFrom;
END
GO

-- PROCEDURE: sp_Planning_GetAvailableResources
CREATE OR ALTER PROCEDURE sp_Planning_GetAvailableResources
    @DateFrom DATE,
    @DateTo DATE,
    @ExcludeEventId INT = NULL -- If editing an event, don't count self as conflict
AS
BEGIN
    -- Select all resources
    SELECT v.*,
        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM EventAllocations ea
                JOIN Events e ON ea.EventId = e.Id
                WHERE ea.ResourceId = v.Id 
                  AND ea.ResourceType = v.ResourceType
                  AND e.Id <> ISNULL(@ExcludeEventId, 0)
                  AND (e.DateFrom <= @DateTo AND e.DateTo >= @DateFrom)
            ) THEN 0 -- Busy
            ELSE 1 -- Available
        END as IsAvailable,
        -- Get conflicting event info if busy
        (SELECT TOP 1 e.Name 
         FROM EventAllocations ea
         JOIN Events e ON ea.EventId = e.Id
         WHERE ea.ResourceId = v.Id 
           AND ea.ResourceType = v.ResourceType
           AND e.Id <> ISNULL(@ExcludeEventId, 0)
           AND (e.DateFrom <= @DateTo AND e.DateTo >= @DateFrom)
        ) as ConflictingEvent
    FROM v_AllResources v
    ORDER BY v.FullName;
END
GO

-- PROCEDURE: sp_Planning_SaveEvent
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
    @Notes NVARCHAR(MAX) = NULL,
    @User NVARCHAR(100) = NULL -- Creator/Updater
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EventId INT;

    IF @Id IS NULL OR @Id = 0
    BEGIN
        INSERT INTO Events (ClientId, SubClient, Name, Location, DateFrom, DateTo, Status, ManagerId, Notes)
        VALUES (@ClientId, @SubClient, @Name, @Location, @DateFrom, @DateTo, @Status, @ManagerId, @Notes);
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
            Notes = @Notes,
            UpdatedAt = GETDATE()
        WHERE Id = @Id;
        SET @EventId = @Id;
    END

    SELECT @EventId as Id;
END
GO

-- PROCEDURE: sp_Planning_GetEventDetails (Full Load)
CREATE OR ALTER PROCEDURE sp_Planning_GetEventDetails
    @EventId INT
AS
BEGIN
    -- 1. Event Header
    SELECT * FROM Events WHERE Id = @EventId;

    -- 2. Allocations
    SELECT ea.*, v.FullName, v.Email
    FROM EventAllocations ea
    LEFT JOIN v_AllResources v ON ea.ResourceId = v.Id AND ea.ResourceType = v.ResourceType
    WHERE ea.EventId = @EventId;

    -- 3. Timeline
    SELECT et.*
    FROM EventTimeline et
    JOIN EventAllocations ea ON et.AllocationId = ea.Id
    WHERE ea.EventId = @EventId;
END
GO

-- PROCEDURE: sp_Planning_AddAllocation
CREATE OR ALTER PROCEDURE sp_Planning_AddAllocation
    @EventId INT,
    @Role NVARCHAR(100),
    @ResourceId INT,
    @ResourceType NVARCHAR(20),
    @LogisticsNotes NVARCHAR(255) = NULL
AS
BEGIN
    -- Auto-save new Role tag if not exists
    IF NOT EXISTS (SELECT 1 FROM PlanningTags WHERE Category = 'Role' AND Name = @Role)
    BEGIN
        INSERT INTO PlanningTags (Category, Name, Color) 
        VALUES ('Role', @Role, '#3498db'); -- Default Blue
    END

    INSERT INTO EventAllocations (EventId, Role, ResourceId, ResourceType, LogisticsNotes)
    VALUES (@EventId, @Role, @ResourceId, @ResourceType, @LogisticsNotes);
    SELECT SCOPE_IDENTITY() as Id;
END
GO

-- PROCEDURE: sp_Planning_RemoveAllocation
CREATE OR ALTER PROCEDURE sp_Planning_RemoveAllocation
    @AllocationId INT
AS
BEGIN
    DELETE FROM EventAllocations WHERE Id = @AllocationId;
END
GO

-- PROCEDURE: sp_Planning_SaveTimelineValue
CREATE OR ALTER PROCEDURE sp_Planning_SaveTimelineValue
    @AllocationId INT,
    @Date DATE,
    @Value NVARCHAR(50)
AS
BEGIN
    -- Upsert logic
    MERGE EventTimeline AS target
    USING (SELECT @AllocationId AS AllocationId, @Date AS Date) AS source
    ON (target.AllocationId = source.AllocationId AND target.Date = source.Date)
    WHEN MATCHED AND @Value IS NULL THEN
        DELETE
    WHEN MATCHED THEN
        UPDATE SET Value = @Value
    WHEN NOT MATCHED AND @Value IS NOT NULL THEN
        INSERT (AllocationId, Date, Value) VALUES (@AllocationId, @Date, @Value);
END
GO

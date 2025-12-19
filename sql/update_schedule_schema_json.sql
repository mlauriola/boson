USE [CompetitionManagement]
GO

-- 1. Add JsonData column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ScheduleSessions') AND name = 'JsonData')
BEGIN
    ALTER TABLE ScheduleSessions
    ADD JsonData NVARCHAR(MAX);
END
GO

-- 2. Update Stored Procedure to include JsonData
CREATE OR ALTER PROCEDURE sp_Schedule_AddSession
    @VersionId INT,
    @SheetName NVARCHAR(50),
    @StartTime NVARCHAR(50),
    @EndTime NVARCHAR(50),
    @Activity NVARCHAR(MAX),
    @Location NVARCHAR(100),
    @LocationCode NVARCHAR(50),
    @Venue NVARCHAR(50),
    @SessionCode NVARCHAR(50),
    @RSC NVARCHAR(50),
    @RowIndex INT,
    @JsonData NVARCHAR(MAX) = NULL -- Default to NULL for backward compatibility if needed temporarily
AS
BEGIN
    INSERT INTO ScheduleSessions (VersionId, SheetName, StartTime, EndTime, Activity, Location, LocationCode, Venue, SessionCode, RSC, RowIndex, JsonData)
    VALUES (@VersionId, @SheetName, @StartTime, @EndTime, @Activity, @Location, @LocationCode, @Venue, @SessionCode, @RSC, @RowIndex, @JsonData);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ScheduleSessions') AND name = 'SheetTitle')
BEGIN
    ALTER TABLE ScheduleSessions ADD SheetTitle NVARCHAR(255);
END
GO

CREATE OR ALTER PROCEDURE sp_Schedule_AddSession
    @VersionId INT,
    @SheetName NVARCHAR(50),
    @SheetTitle NVARCHAR(255) = NULL,
    @StartTime NVARCHAR(50),
    @EndTime NVARCHAR(50),
    @Activity NVARCHAR(MAX),
    @Location NVARCHAR(100),
    @LocationCode NVARCHAR(50),
    @Venue NVARCHAR(50),
    @SessionCode NVARCHAR(50),
    @RSC NVARCHAR(50),
    @RowIndex INT,
    @JsonData NVARCHAR(MAX) = NULL
AS
BEGIN
    INSERT INTO ScheduleSessions (VersionId, SheetName, SheetTitle, StartTime, EndTime, Activity, Location, LocationCode, Venue, SessionCode, RSC, RowIndex, JsonData)
    VALUES (@VersionId, @SheetName, @SheetTitle, @StartTime, @EndTime, @Activity, @Location, @LocationCode, @Venue, @SessionCode, @RSC, @RowIndex, @JsonData);
END
GO

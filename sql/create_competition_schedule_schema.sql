USE [CompetitionManagement]
GO

-- 1. Create Tables
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ScheduleVersions')
BEGIN
    CREATE TABLE ScheduleVersions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        VersionName NVARCHAR(100) NOT NULL,
        FileName NVARCHAR(255) NOT NULL,
        UploadDate DATETIME DEFAULT GETDATE(),
        Status NVARCHAR(50) DEFAULT 'Active', -- Active, Archived
        CreatedBy NVARCHAR(100)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ScheduleSessions')
BEGIN
    CREATE TABLE ScheduleSessions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        VersionId INT NOT NULL,
        SheetName NVARCHAR(50), -- e.g. "29.07.22"
        
        -- Excel Columns
        StartTime NVARCHAR(50), 
        EndTime NVARCHAR(50),
        Activity NVARCHAR(MAX),
        Location NVARCHAR(100),
        LocationCode NVARCHAR(50),
        Venue NVARCHAR(50),
        SessionCode NVARCHAR(50), 
        RSC NVARCHAR(50),
        
        -- Meta
        RowIndex INT, 
        CONSTRAINT FK_ScheduleSessions_Version FOREIGN KEY (VersionId) REFERENCES ScheduleVersions(Id) ON DELETE CASCADE
    );
END
GO

-- 2. Stored Procedures

-- Create Version
CREATE OR ALTER PROCEDURE sp_Schedule_CreateVersion
    @VersionName NVARCHAR(100),
    @FileName NVARCHAR(255),
    @CreatedBy NVARCHAR(100),
    @NewId INT OUTPUT
AS
BEGIN
    INSERT INTO ScheduleVersions (VersionName, FileName, CreatedBy)
    VALUES (@VersionName, @FileName, @CreatedBy);
    
    SET @NewId = SCOPE_IDENTITY();
END
GO

-- Add Session
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
    @RowIndex INT
AS
BEGIN
    INSERT INTO ScheduleSessions (VersionId, SheetName, StartTime, EndTime, Activity, Location, LocationCode, Venue, SessionCode, RSC, RowIndex)
    VALUES (@VersionId, @SheetName, @StartTime, @EndTime, @Activity, @Location, @LocationCode, @Venue, @SessionCode, @RSC, @RowIndex);
END
GO

-- Get Versions List
CREATE OR ALTER PROCEDURE sp_Schedule_GetVersions
AS
BEGIN
    SELECT * FROM ScheduleVersions ORDER BY UploadDate DESC;
END
GO

-- Get Sessions by Version
CREATE OR ALTER PROCEDURE sp_Schedule_GetSessionsByVersion
    @VersionId INT
AS
BEGIN
    SELECT * FROM ScheduleSessions 
    WHERE VersionId = @VersionId
    ORDER BY RowIndex ASC; -- Or by Date/Time
END
GO

-- Delete Version
CREATE OR ALTER PROCEDURE sp_Schedule_DeleteVersion
    @VersionId INT
AS
BEGIN
    DELETE FROM ScheduleVersions WHERE Id = @VersionId;
END
GO

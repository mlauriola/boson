USE [CompetitionManagement]
GO

-- 1. Dynamically drop the existing default constraint on 'Status'
DECLARE @ConstraintName nvarchar(200)
SELECT @ConstraintName = Name FROM sys.default_constraints
WHERE PARENT_OBJECT_ID = OBJECT_ID('ScheduleVersions')
AND COL_NAME(PARENT_OBJECT_ID, PARENT_COLUMN_ID) = 'Status';

IF @ConstraintName IS NOT NULL
BEGIN
    PRINT 'Dropping constraint: ' + @ConstraintName;
    EXEC('ALTER TABLE ScheduleVersions DROP CONSTRAINT ' + @ConstraintName);
END
GO

-- 2. Temporarily change the 'Status' values to numeric strings
-- 'Active' -> '1', everything else (including 'Archive') -> '0'
UPDATE ScheduleVersions 
SET Status = CASE 
    WHEN Status = 'Active' THEN '1' 
    WHEN Status = '1' THEN '1'
    ELSE '0' 
END;
GO

-- 3. Alter the column to INT
ALTER TABLE ScheduleVersions
ALTER COLUMN Status INT;
GO

-- 4. Add NEW default value for new rows (Archive = 0)
ALTER TABLE ScheduleVersions
ADD CONSTRAINT DF_ScheduleVersions_Status DEFAULT 0 FOR Status;
GO

-- 5. Update existing stored procedures

-- Create Version
CREATE OR ALTER PROCEDURE sp_Schedule_CreateVersion
    @VersionName NVARCHAR(100),
    @FileName NVARCHAR(255),
    @CreatedBy NVARCHAR(100),
    @NewId INT OUTPUT
AS
BEGIN
    INSERT INTO ScheduleVersions (VersionName, FileName, CreatedBy, Status)
    VALUES (@VersionName, @FileName, @CreatedBy, 0); -- Default to Archive
    
    SET @NewId = SCOPE_IDENTITY();
END
GO

-- Set Active Version
CREATE OR ALTER PROCEDURE sp_Schedule_SetActiveVersion
    @VersionId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Archive everyone
        UPDATE ScheduleVersions SET Status = 0;
        
        -- Activate the selected one
        UPDATE ScheduleVersions SET Status = 1 WHERE Id = @VersionId;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- sp_Schedule_UpdateVersion
CREATE OR ALTER PROCEDURE sp_Schedule_UpdateVersion
    @VersionId INT,
    @VersionName NVARCHAR(100)
AS
BEGIN
    UPDATE ScheduleVersions 
    SET VersionName = @VersionName 
    WHERE Id = @VersionId;
END
GO

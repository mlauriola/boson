USE [EventManagement]
GO

-- Drop SPs
IF OBJECT_ID('sp_Schedule_CreateVersion', 'P') IS NOT NULL DROP PROCEDURE sp_Schedule_CreateVersion;
IF OBJECT_ID('sp_Schedule_AddSession', 'P') IS NOT NULL DROP PROCEDURE sp_Schedule_AddSession;
IF OBJECT_ID('sp_Schedule_GetVersions', 'P') IS NOT NULL DROP PROCEDURE sp_Schedule_GetVersions;
IF OBJECT_ID('sp_Schedule_GetSessionsByVersion', 'P') IS NOT NULL DROP PROCEDURE sp_Schedule_GetSessionsByVersion;
IF OBJECT_ID('sp_Schedule_DeleteVersion', 'P') IS NOT NULL DROP PROCEDURE sp_Schedule_DeleteVersion;

-- Drop Tables
IF OBJECT_ID('ScheduleSessions', 'U') IS NOT NULL DROP TABLE ScheduleSessions;
IF OBJECT_ID('ScheduleVersions', 'U') IS NOT NULL DROP TABLE ScheduleVersions;
GO

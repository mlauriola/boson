USE [master]
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'CompetitionManagement')
BEGIN
    CREATE DATABASE [CompetitionManagement]
END
GO

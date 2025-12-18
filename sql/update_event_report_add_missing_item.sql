USE [EventManagement]
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_EventReport_AddMissingItem]
    @ReportId INT,
    @ItemCode NVARCHAR(100),
    @Description NVARCHAR(MAX),
    @Status NVARCHAR(50) = 'Missing'
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO MissingItems (ReportId, ItemCode, Description, Status) 
    VALUES (@ReportId, @ItemCode, @Description, @Status);
END
GO

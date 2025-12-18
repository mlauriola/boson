-- Database Initialization Script for EventReport Module
-- Intended for database: EventReport
-- Note: Create the database 'EventReport' manually if it does not exist before running this script.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reports')
BEGIN
    CREATE TABLE Reports (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        EventName NVARCHAR(255) NOT NULL,
        Location NVARCHAR(255) NOT NULL,
        DateFrom DATE NOT NULL,
        DateTo DATE NOT NULL,
        ManagerName NVARCHAR(255) NOT NULL,
        Summary NVARCHAR(MAX) NOT NULL,
        ServicesProvided NVARCHAR(MAX) NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Draft', -- 'Draft' or 'Published'
        FinalNotes NVARCHAR(MAX),
        CreatedBy NVARCHAR(255),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReportIssues')
BEGIN
    CREATE TABLE ReportIssues (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ReportId INT NOT NULL,
        Problem NVARCHAR(MAX) NOT NULL,
        Impact NVARCHAR(MAX) NOT NULL,
        Solution NVARCHAR(MAX),
        PreventiveActions NVARCHAR(MAX),
        Notes NVARCHAR(MAX),
        CONSTRAINT FK_ReportIssues_Reports FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DamagedItems')
BEGIN
    CREATE TABLE DamagedItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ReportId INT NOT NULL,
        ItemCode NVARCHAR(100),
        Description NVARCHAR(MAX) NOT NULL,
        Status NVARCHAR(50) NOT NULL, -- 'Damaged', 'NotWorking'
        CONSTRAINT FK_DamagedItems_Reports FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MissingItems')
BEGIN
    CREATE TABLE MissingItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ReportId INT NOT NULL,
        ItemCode NVARCHAR(100),
        Description NVARCHAR(MAX) NOT NULL,
        CONSTRAINT FK_MissingItems_Reports FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Suggestions')
BEGIN
    CREATE TABLE Suggestions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ReportId INT NOT NULL,
        Logistics NVARCHAR(MAX),
        Operations NVARCHAR(MAX),
        Communication NVARCHAR(MAX),
        Materials NVARCHAR(MAX),
        Software NVARCHAR(MAX),
        CONSTRAINT FK_Suggestions_Reports FOREIGN KEY (ReportId) REFERENCES Reports(Id) ON DELETE CASCADE
    );
END
GO

-- Indexes for Foreign Keys (Essential for Delete Performance and preventing Deadlocks)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ReportIssues_ReportId' AND object_id = OBJECT_ID('ReportIssues'))
BEGIN
    CREATE INDEX IX_ReportIssues_ReportId ON ReportIssues(ReportId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DamagedItems_ReportId' AND object_id = OBJECT_ID('DamagedItems'))
BEGIN
    CREATE INDEX IX_DamagedItems_ReportId ON DamagedItems(ReportId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MissingItems_ReportId' AND object_id = OBJECT_ID('MissingItems'))
BEGIN
    CREATE INDEX IX_MissingItems_ReportId ON MissingItems(ReportId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Suggestions_ReportId' AND object_id = OBJECT_ID('Suggestions'))
BEGIN
    CREATE INDEX IX_Suggestions_ReportId ON Suggestions(ReportId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PlanningTags')
BEGIN
    CREATE TABLE PlanningTags (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Category NVARCHAR(50) NOT NULL, -- 'Client', 'Role', 'Status'
        Name NVARCHAR(50) NOT NULL,
        Color NVARCHAR(20) DEFAULT '#3498db'
    );
    
    -- Seed some default data
    INSERT INTO PlanningTags (Category, Name, Color) VALUES 
    ('Client', 'WP', '#e74c3c'),
    ('Client', 'OG', '#f1c40f'),
    ('Client', 'SW', '#3498db'),
    ('Status', 'Confirmed', '#2ecc71'),
    ('Status', 'Pending', '#95a5a6'),
    ('Role', 'Timing', '#9b59b6'),
    ('Role', 'Graphics', '#8e44ad');
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Events')
BEGIN
    CREATE TABLE Events (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ClientId NVARCHAR(50), -- Tag Name or FK to PlanningTags
        SubClient NVARCHAR(100),
        Name NVARCHAR(255) NOT NULL,
        Location NVARCHAR(150),
        DateFrom DATE NOT NULL,
        DateTo DATE NOT NULL,
        Status NVARCHAR(50), -- Tag Name
        ManagerId INT, -- FK to Users (internal App Users)
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EventAllocations')
BEGIN
    CREATE TABLE EventAllocations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        EventId INT NOT NULL,
        Role NVARCHAR(100), -- Tag Name
        ResourceId INT NOT NULL, -- ID from Consultants OR Users
        ResourceType NVARCHAR(20) NOT NULL, -- 'Consultant' or 'User'
        LogisticsNotes NVARCHAR(255),
        FOREIGN KEY (EventId) REFERENCES Events(Id) ON DELETE CASCADE
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EventTimeline')
BEGIN
    CREATE TABLE EventTimeline (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AllocationId INT NOT NULL,
        [Date] DATE NOT NULL,
        Value NVARCHAR(50), -- 'Travel', 'Hotel', 'Work', etc.
        FOREIGN KEY (AllocationId) REFERENCES EventAllocations(Id) ON DELETE CASCADE
    );
END

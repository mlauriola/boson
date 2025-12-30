IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Consultants')
BEGIN
    CREATE TABLE Consultants (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(255),
        Phone NVARCHAR(50),
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Skills')
BEGIN
    CREATE TABLE Skills (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL UNIQUE
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ConsultantSkills')
BEGIN
    CREATE TABLE ConsultantSkills (
        ConsultantId INT NOT NULL,
        SkillId INT NOT NULL,
        PRIMARY KEY (ConsultantId, SkillId),
        FOREIGN KEY (ConsultantId) REFERENCES Consultants(Id) ON DELETE CASCADE,
        FOREIGN KEY (SkillId) REFERENCES Skills(Id) ON DELETE CASCADE
    );
END

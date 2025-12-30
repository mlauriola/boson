-- PROCEDURE: sp_GetConsultants
CREATE OR ALTER PROCEDURE sp_GetConsultants
AS
BEGIN
    SELECT 
        c.Id,
        c.FirstName,
        c.LastName,
        c.Email,
        c.Phone,
        c.Notes,
        STRING_AGG(s.Name, ', ') WITHIN GROUP (ORDER BY s.Name) AS Skills
    FROM Consultants c
    LEFT JOIN ConsultantSkills cs ON c.Id = cs.ConsultantId
    LEFT JOIN Skills s ON cs.SkillId = s.Id
    GROUP BY c.Id, c.FirstName, c.LastName, c.Email, c.Phone, c.Notes
    ORDER BY c.LastName, c.FirstName;
END
GO

-- PROCEDURE: sp_SaveConsultant
CREATE OR ALTER PROCEDURE sp_SaveConsultant
    @Id INT = NULL,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Email NVARCHAR(255) = NULL,
    @Phone NVARCHAR(50) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @SkillsList NVARCHAR(MAX) = NULL -- Comma separated list of skills
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ConsultantId INT;

    -- 1. Insert or Update Consultant
    IF @Id IS NULL OR @Id = 0
    BEGIN
        INSERT INTO Consultants (FirstName, LastName, Email, Phone, Notes)
        VALUES (@FirstName, @LastName, @Email, @Phone, @Notes);
        SET @ConsultantId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE Consultants
        SET FirstName = @FirstName,
            LastName = @LastName,
            Email = @Email,
            Phone = @Phone,
            Notes = @Notes,
            UpdatedAt = GETDATE()
        WHERE Id = @Id;
        SET @ConsultantId = @Id;
    END

    -- 2. Handle Skills
    -- First, ensure all skills exist in Skills table and get their IDs
    -- We can use string_split if available (SQL Server 2016+)
    
    -- Clear existing links
    DELETE FROM ConsultantSkills WHERE ConsultantId = @ConsultantId;

    IF @SkillsList IS NOT NULL AND LEN(@SkillsList) > 0
    BEGIN
        CREATE TABLE #TempSkills (SkillName NVARCHAR(100));
        
        -- Use XML for compatibility with older SQL versions
        DECLARE @xml XML = CAST('<x>' + REPLACE(@SkillsList, ',', '</x><x>') + '</x>' AS XML);
        
        INSERT INTO #TempSkills (SkillName)
        SELECT LTRIM(RTRIM(T.c.value('.', 'NVARCHAR(100)')))
        FROM @xml.nodes('x') AS T(c);

        -- Insert new skills if they don't exist
        INSERT INTO Skills (Name)
        SELECT DISTINCT t.SkillName 
        FROM #TempSkills t
        WHERE NOT EXISTS (SELECT 1 FROM Skills s WHERE s.Name = t.SkillName);

        -- Link skills to consultant
        INSERT INTO ConsultantSkills (ConsultantId, SkillId)
        SELECT @ConsultantId, s.Id
        FROM Skills s
        JOIN #TempSkills t ON s.Name = t.SkillName;

        DROP TABLE #TempSkills;
    END

    -- Return the saved ID
    SELECT @ConsultantId as Id;
END
GO

-- PROCEDURE: sp_DeleteConsultant
CREATE OR ALTER PROCEDURE sp_DeleteConsultant
    @Id INT
AS
BEGIN
    DELETE FROM Consultants WHERE Id = @Id;
END
GO

-- PROCEDURE: sp_GetSkills
CREATE OR ALTER PROCEDURE sp_GetSkills
AS
BEGIN
    SELECT Name FROM Skills ORDER BY Name;
END
GO

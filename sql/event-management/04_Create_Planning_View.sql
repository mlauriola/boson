CREATE OR ALTER VIEW v_AllResources AS
SELECT 
    Id, 
    FirstName + ' ' + LastName AS FullName, 
    Email,
    'Consultant' AS ResourceType
FROM Consultants
UNION ALL
SELECT 
    Usr_Code AS Id, 
    Usr_Referent AS FullName,
    NULL AS Email,
    'User' AS ResourceType
FROM BOS.dbo.MP_T_USER;

-- Seed some tags if table is empty
IF NOT EXISTS (SELECT 1 FROM PlanningTags)
BEGIN
    INSERT INTO PlanningTags (Category, Name, Color) VALUES 
    ('Client', 'WP', '#e74c3c'),
    ('Client', 'OG', '#f1c40f'),
    ('Client', 'SW', '#3498db'),
    ('Client', 'Multi', '#9b59b6'),
    ('Status', 'Confirmed', '#2ecc71'),
    ('Status', 'Draft', '#95a5a6'),
    ('Status', 'Cancelled', '#e74c3c'),
    ('Role', 'Timing', '#1abc9c'),
    ('Role', 'Graphics', '#3498db'),
    ('Role', 'Data', '#9b59b6'),
    ('Role', 'Coordinator', '#f39c12');
END

-- Create a view to easily get program assignments with coach information
CREATE OR REPLACE VIEW program_assignments_with_coach AS
SELECT 
    pa.id,
    pa.program_id,
    pa.athlete_id,
    pa.start_date,
    pa.end_date,
    p.name AS program_name,
    p.description AS program_description,
    p.coach_id,
    c.full_name AS coach_name,
    c.avatar_url AS coach_avatar_url
FROM 
    program_assignments pa
JOIN 
    programs p ON pa.program_id = p.id
JOIN 
    profiles c ON p.coach_id = c.id;

-- Grant access to authenticated users
GRANT SELECT ON program_assignments_with_coach TO authenticated; 
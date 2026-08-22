-- Emergency contact is a family-group attribute, not per-person: it moves
-- from HealthProfile onto the adult's program enrollment (the group anchor).
-- Denormalized across the group's adults so reads stay trivial.
ALTER TABLE ProgramAdultEnrollment ADD COLUMN emergencyContactName TEXT;
ALTER TABLE ProgramAdultEnrollment ADD COLUMN emergencyContactPhone TEXT;
ALTER TABLE ProgramAdultEnrollment ADD COLUMN emergencyContactRelation TEXT;

ALTER TABLE HealthProfile DROP COLUMN emergencyContactName;
ALTER TABLE HealthProfile DROP COLUMN emergencyContactPhone;
ALTER TABLE HealthProfile DROP COLUMN emergencyContactRelation;

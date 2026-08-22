-- The family relationship (father/mother/tutor) is an attribute of the adult,
-- set when they register, and applied to the children they enroll.
ALTER TABLE ProgramAdultEnrollment ADD COLUMN relationship TEXT;

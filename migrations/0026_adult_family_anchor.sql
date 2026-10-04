-- Adults can form a family before any child is enrolled. Co-responsibles
-- point to the family's anchor adult; NULL means the adult is its own anchor.
ALTER TABLE ProgramAdultEnrollment ADD COLUMN familyMemberId INTEGER;
CREATE INDEX ProgramAdultEnrollment_familyMemberId_idx ON ProgramAdultEnrollment(familyMemberId);

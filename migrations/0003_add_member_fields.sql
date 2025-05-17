-- Add new fields to Member table

ALTER TABLE "Member" ADD COLUMN "maritalStatus" TEXT;
ALTER TABLE "Member" ADD COLUMN "currentOccupation" TEXT;
ALTER TABLE "Member" ADD COLUMN "workOrStudyPlace" TEXT;
ALTER TABLE "Member" ADD COLUMN "professionalArea" TEXT;
ALTER TABLE "Member" ADD COLUMN "workExperience" TEXT;
ALTER TABLE "Member" ADD COLUMN "medicalConditions" TEXT;
ALTER TABLE "Member" ADD COLUMN "specialNeeds" TEXT;
ALTER TABLE "Member" ADD COLUMN "interestsHobbies" TEXT;
ALTER TABLE "Member" ADD COLUMN "volunteeringAvailability" TEXT;
ALTER TABLE "Member" ADD COLUMN "preferredContactMethod" TEXT;
ALTER TABLE "Member" ADD COLUMN "pastoralNotes" TEXT;

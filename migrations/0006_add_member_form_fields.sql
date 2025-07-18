-- Add new fields to Member table for parishioner survey form
ALTER TABLE "Member" ADD COLUMN "gender" TEXT;
ALTER TABLE "Member" ADD COLUMN "currentAcceptanceYear" INTEGER;
ALTER TABLE "Member" ADD COLUMN "currentAcceptanceMethod" TEXT;
ALTER TABLE "Member" ADD COLUMN "currentMembershipChurch" TEXT;
ALTER TABLE "Member" ADD COLUMN "transferAuthorization" BOOLEAN;
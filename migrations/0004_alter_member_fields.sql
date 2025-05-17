-- Add new fields to Member table
ALTER TABLE "Member" DROP COLUMN "phone";
ALTER TABLE "Member" DROP COLUMN "birthDate";
ALTER TABLE "Member" DROP COLUMN "address";

-- Add new optional fields
ALTER TABLE "Member" ADD COLUMN "phone" TEXT;
ALTER TABLE "Member" ADD COLUMN "birthDate" DATETIME;
ALTER TABLE "Member" ADD COLUMN "address" TEXT;

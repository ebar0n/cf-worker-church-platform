-- Create Program table
CREATE TABLE "Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create Child table
CREATE TABLE "Child" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "documentID" TEXT NOT NULL UNIQUE,
    "gender" TEXT,
    "birthDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create ChildGuardian table
CREATE TABLE "ChildGuardian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "childId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "relationship" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE("childId", "relationship")
);

-- Create Enrollment table
CREATE TABLE "Enrollment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "programId" INTEGER NOT NULL,
    "childId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE("programId", "childId")
);

-- Create indexes
CREATE INDEX "Program_department_idx" ON "Program"("department");
CREATE INDEX "Program_isActive_idx" ON "Program"("isActive");
CREATE INDEX "Child_createdAt_idx" ON "Child"("createdAt");
CREATE INDEX "Child_documentID_idx" ON "Child"("documentID");
CREATE INDEX "ChildGuardian_childId_idx" ON "ChildGuardian"("childId");
CREATE INDEX "ChildGuardian_memberId_idx" ON "ChildGuardian"("memberId");
CREATE INDEX "ChildGuardian_relationship_idx" ON "ChildGuardian"("relationship");
CREATE INDEX "Enrollment_programId_idx" ON "Enrollment"("programId");
CREATE INDEX "Enrollment_childId_idx" ON "Enrollment"("childId");
CREATE INDEX "Enrollment_createdAt_idx" ON "Enrollment"("createdAt");

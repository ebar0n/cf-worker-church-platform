-- Club enrollment by family group (specs/club-family-enrollment.md)

-- Health record: one per person (child XOR member), program-independent,
-- collected once and reused across programs and years.
CREATE TABLE IF NOT EXISTS HealthProfile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  childId INTEGER UNIQUE,
  memberId INTEGER UNIQUE,
  bloodType TEXT,
  eps TEXT,
  allergies TEXT,
  conditions TEXT,
  medications TEXT,
  emergencyContactName TEXT,
  emergencyContactPhone TEXT,
  emergencyContactRelation TEXT,
  photoUrl TEXT,
  idDocumentUrl TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (childId) REFERENCES Child(id) ON DELETE CASCADE,
  FOREIGN KEY (memberId) REFERENCES Member(id) ON DELETE CASCADE,
  CHECK ((childId IS NULL) <> (memberId IS NULL))
);

-- Adult participation in club programs (tutor/counselor/board roles).
-- Mirrors Enrollment; the tutor's consents cover the children they register.
CREATE TABLE IF NOT EXISTS ProgramAdultEnrollment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  programId INTEGER NOT NULL,
  memberId INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'tutor',
  dataTreatmentAcceptedAt TEXT,
  participationConfirmedAt TEXT,
  physicalFormReceivedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (programId) REFERENCES Program(id) ON DELETE CASCADE,
  FOREIGN KEY (memberId) REFERENCES Member(id),
  UNIQUE (programId, memberId)
);

CREATE INDEX IF NOT EXISTS idx_program_adult_enrollment_programId ON ProgramAdultEnrollment(programId);
CREATE INDEX IF NOT EXISTS idx_program_adult_enrollment_memberId ON ProgramAdultEnrollment(memberId);

-- Per-child signed-form tracking and which tutor registered the child
ALTER TABLE Enrollment ADD COLUMN physicalFormReceivedAt TEXT;
ALTER TABLE Enrollment ADD COLUMN enrolledByMemberId INTEGER REFERENCES Member(id);

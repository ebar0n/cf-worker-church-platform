-- Migration: Create VolunteerRegistration table
-- Description: Table to store volunteer registrations for events

CREATE TABLE IF NOT EXISTS VolunteerRegistration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  volunteerEventId INTEGER NOT NULL,
  memberDocumentID TEXT NOT NULL, -- Document ID to identify the member
  memberId INTEGER, -- Optional: reference to Member table (can be null if member not found initially)
  selectedService TEXT NOT NULL, -- The service the volunteer selected from the event's services list
  hasTransport INTEGER NOT NULL DEFAULT 0, -- 0 = no, 1 = yes
  transportSlots INTEGER, -- Number of available seats if hasTransport = 1
  dietType TEXT NOT NULL DEFAULT 'normal', -- 'normal' or 'vegetariana'
  createdAt TEXT NOT NULL, -- ISO 8601 timestamp
  updatedAt TEXT NOT NULL, -- ISO 8601 timestamp

  FOREIGN KEY (volunteerEventId) REFERENCES VolunteerEvent(id) ON DELETE CASCADE,
  FOREIGN KEY (memberId) REFERENCES Member(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_volunteer_registration_event ON VolunteerRegistration(volunteerEventId);
CREATE INDEX IF NOT EXISTS idx_volunteer_registration_document ON VolunteerRegistration(memberDocumentID);
CREATE INDEX IF NOT EXISTS idx_volunteer_registration_member ON VolunteerRegistration(memberId);
CREATE INDEX IF NOT EXISTS idx_volunteer_registration_created_at ON VolunteerRegistration(createdAt);

-- Create unique constraint to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteer_registration_unique ON VolunteerRegistration(volunteerEventId, memberDocumentID);

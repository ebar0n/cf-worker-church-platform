-- Migration: Create VolunteerEvent table
-- Description: Table to store volunteer events that members can register for

CREATE TABLE IF NOT EXISTS VolunteerEvent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  eventDate TEXT NOT NULL, -- ISO 8601 date format
  services TEXT, -- JSON array of available services (added here for new installs, was 0008/0013 for existing)
  maxCapacities TEXT, -- JSON array of max capacities corresponding to services
  isActive INTEGER NOT NULL DEFAULT 1, -- 0 = inactive, 1 = active
  createdAt TEXT NOT NULL, -- ISO 8601 timestamp
  updatedAt TEXT NOT NULL  -- ISO 8601 timestamp
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_volunteer_event_event_date ON VolunteerEvent(eventDate);
CREATE INDEX IF NOT EXISTS idx_volunteer_event_is_active ON VolunteerEvent(isActive);
CREATE INDEX IF NOT EXISTS idx_volunteer_event_created_at ON VolunteerEvent(createdAt);

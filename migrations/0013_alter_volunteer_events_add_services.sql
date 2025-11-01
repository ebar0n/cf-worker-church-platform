-- Migration: Add services column to VolunteerEvent
-- Description: Add a JSON field to store the list of services offered at the event

ALTER TABLE VolunteerEvent ADD COLUMN services TEXT; -- JSON array of strings

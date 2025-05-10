-- Schema for the birthday invitation application
-- This file defines the structure of the database tables

-- Table: invitation
-- Stores information about each guest invitation
CREATE TABLE IF NOT EXISTS invitation (
  token TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  attendance TEXT NOT NULL,
  vehiclePlate TEXT,
  guests TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitation_token ON invitation(token);

-- Insert default settings if needed
INSERT OR REPLACE INTO invitation (token, name, attendance, vehiclePlate, guests) VALUES
  ('11e4a756-c8f0-4888-9a1e-8c5b6fb7e7d1', 'Niño01', 'pending', NULL, NULL),
  ('22f5b867-d9f1-4999-8b2f-9d6c7fc8e8e2', 'Niño02', 'pending', NULL, NULL);
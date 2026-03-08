-- Migration: Add whatsappGroupUrl to VolunteerEvent and Course tables
-- Description: Allows each event/course to have its own optional WhatsApp group URL

ALTER TABLE VolunteerEvent ADD COLUMN whatsappGroupUrl TEXT;
ALTER TABLE Course ADD COLUMN whatsappGroupUrl TEXT;

-- Migration: Add maxCapacities to VolunteerEvent
-- This field stores JSON array of max capacities corresponding to services

-- Add maxCapacities column to VolunteerEvent table
ALTER TABLE VolunteerEvent ADD COLUMN maxCapacities TEXT;
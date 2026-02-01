-- Migration: Add maxCapacities to VolunteerEvent
-- This field stores JSON array of max capacities corresponding to services
-- 
-- NOTE: This migration is now a no-op. The column is created directly in 
-- 0012_create_volunteer_events.sql for new installations.
-- This file is kept for compatibility with production databases where 
-- it was already executed.

SELECT 1; -- No-op statement to satisfy migration requirement

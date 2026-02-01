-- Migration: Add isMember column to CourseEnrollment
-- This column indicates if the person is a member of the Seventh-day Adventist Church

ALTER TABLE CourseEnrollment ADD COLUMN isMember INTEGER DEFAULT 0;

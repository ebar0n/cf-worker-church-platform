-- Migration: Create Course and CourseEnrollment tables
-- Description: Add support for open courses with enrollment system

-- Create Course table
CREATE TABLE IF NOT EXISTS Course (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  imageUrl TEXT,
  color TEXT NOT NULL DEFAULT '#4b207f',
  cost REAL NOT NULL DEFAULT 0,
  startDate TEXT,
  endDate TEXT,
  capacity INTEGER,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for Course table
CREATE INDEX IF NOT EXISTS idx_course_slug ON Course(slug);
CREATE INDEX IF NOT EXISTS idx_course_isActive ON Course(isActive);
CREATE INDEX IF NOT EXISTS idx_course_createdAt ON Course(createdAt);

-- Create CourseEnrollment table
CREATE TABLE IF NOT EXISTS CourseEnrollment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  courseId INTEGER NOT NULL,
  documentNumber TEXT NOT NULL,
  fullName TEXT NOT NULL,
  phone TEXT NOT NULL,
  birthDate TEXT NOT NULL,
  paymentProofUrl TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE
);

-- Create indexes for CourseEnrollment table
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_enrollment_unique ON CourseEnrollment(courseId, documentNumber);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_courseId ON CourseEnrollment(courseId);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_documentNumber ON CourseEnrollment(documentNumber);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_status ON CourseEnrollment(status);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_createdAt ON CourseEnrollment(createdAt);

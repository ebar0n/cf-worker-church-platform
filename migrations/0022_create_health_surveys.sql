-- Health survey ("Encuesta de Salud") captured by volunteers during a
-- volunteer event. Yes/No answers are nullable so "unanswered" stays
-- distinguishable from "No"; the condition checkboxes default to 0.
CREATE TABLE HealthSurvey (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  volunteerEventId INTEGER NOT NULL,

  hasDiabetes INTEGER NOT NULL DEFAULT 0,
  hasHighBloodPressure INTEGER NOT NULL DEFAULT 0,
  hasHeartDisease INTEGER NOT NULL DEFAULT 0,
  hasHighCholesterol INTEGER NOT NULL DEFAULT 0,
  hasOverweight INTEGER NOT NULL DEFAULT 0,
  hasDepression INTEGER NOT NULL DEFAULT 0,
  otherCondition TEXT,

  familyHistory INTEGER,
  familyHistoryDetail TEXT,

  drinksWater INTEGER,
  exercises INTEGER,
  eatsFruitsVegetables INTEGER,
  sleepsEightHours INTEGER,
  attendsCheckups INTEGER,
  checkupsDetail TEXT,

  wantsHealthyHabitsCourse INTEGER,
  wantsHealthTalk INTEGER,
  wantsHealthyCookingCourse INTEGER,
  wantsEmotionalHealthCourse INTEGER,
  wantsPersonalFinanceCourse INTEGER,

  neighborhoodIssue TEXT,
  neighborhoodImprovement TEXT,

  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,

  capturedBy TEXT,

  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (volunteerEventId) REFERENCES VolunteerEvent(id) ON DELETE CASCADE
);

CREATE INDEX HealthSurvey_volunteerEventId_idx ON HealthSurvey(volunteerEventId);
CREATE INDEX HealthSurvey_createdAt_idx ON HealthSurvey(createdAt);
-- Not unique on purpose: the same phone can legitimately repeat (a household
-- sharing one line, or someone surveyed again at a later event).
CREATE INDEX HealthSurvey_phone_idx ON HealthSurvey(phone);

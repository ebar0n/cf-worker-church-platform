-- Health survey ("Encuesta de Salud") captured by volunteers during a volunteer
-- event. Consolidated: this table was built across several iterations while the
-- questionnaire was being redesigned, and none of those steps ever reached
-- production, so they are collapsed into one readable definition.
--
-- Shape notes:
--  * Habits are TEXT ('si' | 'aveces' | 'no'), not booleans: "¿toma 8 vasos de
--    agua al día?" as a binary pushed every honest "a veces" into "No".
--  * Yes/no and habit columns are nullable so "sin responder" stays different
--    from "No"; checkbox columns default to 0, where unmarked means no.
--  * name and phone are nullable: someone willing to answer about their health
--    but not to leave a phone number must still be recordable, and a survey
--    with no identifiers is not personal data at all.
--  * acceptsDataTreatment is the Ley 1581 consent. The API refuses to store a
--    row without it; the column stays nullable so the rule lives in one place
--    instead of two.
--  * capturedAt is the device's time. With the offline queue, createdAt is when
--    the row reached the server — for a jornada synced hours later that would
--    stamp every survey with the moment the signal came back.
DROP TABLE IF EXISTS HealthSurvey;

CREATE TABLE HealthSurvey (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  volunteerEventId INTEGER NOT NULL,

  -- Ley 1581 consent, asked before anything else
  acceptsDataTreatment INTEGER,

  -- Habits: 'si' | 'aveces' | 'no', NULL = sin responder. Stored as text so a
  -- dump reads without a legend, and constrained here so a direct SQL write
  -- cannot introduce a fourth value the app would not know how to render.
  drinksWater TEXT CHECK (drinksWater IS NULL OR drinksWater IN ('si', 'aveces', 'no')),
  exercises TEXT CHECK (exercises IS NULL OR exercises IN ('si', 'aveces', 'no')),
  eatsFruitsVegetables TEXT CHECK (
    eatsFruitsVegetables IS NULL OR eatsFruitsVegetables IN ('si', 'aveces', 'no')
  ),
  sleepsEightHours TEXT CHECK (
    sleepsEightHours IS NULL OR sleepsEightHours IN ('si', 'aveces', 'no')
  ),
  attendsCheckups INTEGER,

  -- Conditions
  hasDiabetes INTEGER NOT NULL DEFAULT 0,
  hasHighBloodPressure INTEGER NOT NULL DEFAULT 0,
  hasHeartDisease INTEGER NOT NULL DEFAULT 0,
  hasHighCholesterol INTEGER NOT NULL DEFAULT 0,
  hasOverweight INTEGER NOT NULL DEFAULT 0,
  hasDepression INTEGER NOT NULL DEFAULT 0,
  otherCondition TEXT,
  familyHistory INTEGER,
  familyHistoryDetail TEXT,

  -- Interest in courses (one spoken question, several boxes)
  wantsHealthyHabitsCourse INTEGER NOT NULL DEFAULT 0,
  wantsHealthyCookingCourse INTEGER NOT NULL DEFAULT 0,
  wantsEmotionalHealthCourse INTEGER NOT NULL DEFAULT 0,
  wantsPersonalFinanceCourse INTEGER NOT NULL DEFAULT 0,

  -- Open questions about the neighborhood
  neighborhoodIssue TEXT,
  neighborhoodImprovement TEXT,

  -- Contact data, all optional
  name TEXT,
  phone TEXT,
  age INTEGER,
  neighborhood TEXT,

  -- Capture metadata
  clientId TEXT,
  capturedAt TEXT,
  capturedBy TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (volunteerEventId) REFERENCES VolunteerEvent(id) ON DELETE CASCADE
);

-- Every query is event-scoped, so the indexes lead with volunteerEventId and
-- its leftmost prefix already serves "all surveys of this event". This pair
-- covers the list (ordered by capture time) and the duplicate-phone check;
-- single-column indexes on those fields would only add write cost.
CREATE INDEX HealthSurvey_event_captured_idx ON HealthSurvey(volunteerEventId, capturedAt DESC);

-- Not unique on purpose: a household can share one line, and the same person
-- can be surveyed again at a later event.
CREATE INDEX HealthSurvey_event_phone_idx ON HealthSurvey(volunteerEventId, phone);

-- Idempotency key minted on the device: it makes a retried POST (whose response
-- was lost on the way back) store one row instead of two. Partial so the rows
-- with no clientId never collide with each other.
CREATE UNIQUE INDEX HealthSurvey_clientId_key ON HealthSurvey(clientId) WHERE clientId IS NOT NULL;

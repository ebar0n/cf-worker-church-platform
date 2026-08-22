-- Consent to data treatment (Ley 1581). The health answers are "datos
-- sensibles", so the API refuses to store a survey without it; the row's
-- createdAt is the moment the person gave it.
ALTER TABLE HealthSurvey ADD COLUMN acceptsDataTreatment INTEGER;

-- Age for the health survey. The exact age, not a birth date: the answers only
-- mean something read by age group, the number can be re-banded later without
-- asking again, and it is not a "dato sensible" under Ley 1581.
ALTER TABLE HealthSurvey ADD COLUMN age INTEGER;

-- Event date and time as entered by the admin (local, YYYY-MM-DD / HH:MM)
-- and a cover image shown on the program landing
ALTER TABLE Program ADD COLUMN eventDate TEXT;
ALTER TABLE Program ADD COLUMN eventTime TEXT;
ALTER TABLE Program ADD COLUMN imageUrl TEXT;

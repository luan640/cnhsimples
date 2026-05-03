-- Add lesson_purpose column to booking_groups and bookings tables
-- Values: 'exam' (Exame de habilitação) | 'fear' (Perder o medo)
-- Default NULL means exam flow (receipt required) for backwards compatibility

ALTER TABLE booking_groups
  ADD COLUMN IF NOT EXISTS lesson_purpose TEXT
    CHECK (lesson_purpose IN ('exam', 'fear'));

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS lesson_purpose TEXT
    CHECK (lesson_purpose IN ('exam', 'fear'));

alter table public.instructor_profiles
  add column if not exists accepts_highway boolean not null default false,
  add column if not exists accepts_night_driving boolean not null default false,
  add column if not exists accepts_parking_practice boolean not null default false,
  add column if not exists student_chooses_destination boolean not null default false;

alter table public.instructor_profiles
  alter column category drop not null,
  alter column hourly_rate drop not null;

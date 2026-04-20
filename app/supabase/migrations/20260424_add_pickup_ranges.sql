alter table public.instructor_services
  add column if not exists pickup_ranges jsonb not null default '[]'::jsonb;

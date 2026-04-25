alter table public.instructor_profiles
  add column if not exists booking_lead_time_hours integer not null default 2;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'instructor_profiles_booking_lead_time_hours_check'
  ) then
    alter table public.instructor_profiles
      add constraint instructor_profiles_booking_lead_time_hours_check
      check (booking_lead_time_hours between 0 and 24);
  end if;
end
$$;

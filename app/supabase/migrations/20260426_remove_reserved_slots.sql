-- Remove temporary reserved slots from the booking flow.
-- Slots remain available until payment is confirmed.

alter table public.booking_groups
  add column if not exists slot_ids jsonb not null default '[]'::jsonb;

update public.booking_groups bg
set slot_ids = coalesce((
  select jsonb_agg(b.slot_id order by b.created_at)
  from public.bookings b
  where b.booking_group_id = bg.id
), '[]'::jsonb)
where coalesce(jsonb_array_length(bg.slot_ids), 0) = 0;

update public.availability_slots
set status = 'available'
where status = 'reserved';

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'availability_slots_status_check'
  ) then
    alter table public.availability_slots
      drop constraint availability_slots_status_check;
  end if;
end $$;

alter table public.availability_slots
  add constraint availability_slots_status_check
  check (status in ('available', 'booked', 'completed', 'blocked'));

drop policy if exists "Students can read available slots" on public.availability_slots;
create policy "Students can read available slots"
on public.availability_slots
for select
to authenticated
using (status in ('available', 'booked'));

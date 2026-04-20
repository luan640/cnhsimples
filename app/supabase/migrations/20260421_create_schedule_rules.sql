-- Weekly availability rule templates per instructor
-- One row per (instructor_id, day_of_week). Slots are regenerated from these rules.

create table if not exists public.schedule_rules (
  id                    uuid primary key default gen_random_uuid(),
  instructor_id         uuid not null references public.instructor_profiles(id) on delete cascade,
  day_of_week           smallint not null check (day_of_week between 0 and 6),
  is_active             boolean not null default false,
  start_hour            smallint not null default 8,
  start_minute          smallint not null default 0,
  end_hour              smallint not null default 18,
  end_minute            smallint not null default 0,
  slot_duration_minutes smallint not null default 60 check (slot_duration_minutes in (30, 60)),
  break_enabled         boolean not null default false,
  break_start_hour      smallint,
  break_start_minute    smallint default 0,
  break_end_hour        smallint,
  break_end_minute      smallint default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (instructor_id, day_of_week)
);

drop trigger if exists schedule_rules_set_updated_at on public.schedule_rules;
create trigger schedule_rules_set_updated_at
  before update on public.schedule_rules
  for each row execute function public.set_updated_at();

alter table public.schedule_rules enable row level security;

drop policy if exists "Instructors can manage own schedule rules" on public.schedule_rules;
create policy "Instructors can manage own schedule rules"
on public.schedule_rules
for all
to authenticated
using (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = schedule_rules.instructor_id and ip.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = schedule_rules.instructor_id and ip.user_id = auth.uid()
  )
);

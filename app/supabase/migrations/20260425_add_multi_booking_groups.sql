-- Support multi-slot student booking flows
-- Adds booking group/order table, links bookings and payments to the group,
-- and introduces a reserved slot state for pending checkout windows.

create table if not exists public.booking_groups (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.student_profiles(id) on delete cascade,
  instructor_id     uuid not null references public.instructor_profiles(id) on delete cascade,
  service_id        uuid references public.instructor_services(id) on delete set null,
  lesson_mode       text not null default 'meeting'
                      check (lesson_mode in ('meeting', 'pickup')),
  payment_method    text not null default 'mercado_pago'
                      check (payment_method in ('pix', 'card', 'mercado_pago')),
  total_lessons     integer not null default 1 check (total_lessons > 0),
  total_amount      numeric(10,2) not null default 0,
  platform_amount   numeric(10,2) not null default 0,
  instructor_amount numeric(10,2) not null default 0,
  status            text not null default 'pending'
                      check (status in ('pending', 'awaiting_payment', 'paid', 'cancelled', 'expired')),
  notes             text,
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists booking_groups_student_idx
  on public.booking_groups (student_id, created_at desc);

create index if not exists booking_groups_instructor_idx
  on public.booking_groups (instructor_id, created_at desc);

create index if not exists booking_groups_status_idx
  on public.booking_groups (status);

drop trigger if exists booking_groups_set_updated_at on public.booking_groups;
create trigger booking_groups_set_updated_at
before update on public.booking_groups
for each row execute function public.set_updated_at();

alter table public.booking_groups enable row level security;

drop policy if exists "Students can read own booking groups" on public.booking_groups;
create policy "Students can read own booking groups"
on public.booking_groups for select to authenticated
using (
  exists (
    select 1 from public.student_profiles sp
    where sp.id = booking_groups.student_id and sp.user_id = auth.uid()
  )
);

drop policy if exists "Students can insert own booking groups" on public.booking_groups;
create policy "Students can insert own booking groups"
on public.booking_groups for insert to authenticated
with check (
  exists (
    select 1 from public.student_profiles sp
    where sp.id = booking_groups.student_id and sp.user_id = auth.uid()
  )
);

drop policy if exists "Students can update own booking groups" on public.booking_groups;
create policy "Students can update own booking groups"
on public.booking_groups for update to authenticated
using (
  exists (
    select 1 from public.student_profiles sp
    where sp.id = booking_groups.student_id and sp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.student_profiles sp
    where sp.id = booking_groups.student_id and sp.user_id = auth.uid()
  )
);

drop policy if exists "Instructors can read own booking groups" on public.booking_groups;
create policy "Instructors can read own booking groups"
on public.booking_groups for select to authenticated
using (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = booking_groups.instructor_id and ip.user_id = auth.uid()
  )
);

alter table public.bookings
  add column if not exists booking_group_id uuid references public.booking_groups(id) on delete set null,
  add column if not exists service_id uuid references public.instructor_services(id) on delete set null,
  add column if not exists lesson_mode text default 'meeting';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bookings'
      and column_name = 'lesson_mode'
  ) then
    update public.bookings
    set lesson_mode = coalesce(lesson_mode, 'meeting')
    where lesson_mode is null;

    if not exists (
      select 1 from pg_constraint
      where conname = 'bookings_lesson_mode_check'
    ) then
      alter table public.bookings
        add constraint bookings_lesson_mode_check
        check (lesson_mode in ('meeting', 'pickup'));
    end if;
  end if;
end $$;

create index if not exists bookings_booking_group_idx
  on public.bookings (booking_group_id);

alter table public.payments
  add column if not exists booking_group_id uuid references public.booking_groups(id) on delete cascade;

create index if not exists payments_booking_group_idx
  on public.payments (booking_group_id);

create temporary table tmp_booking_group_backfill on commit drop as
select
  gen_random_uuid() as booking_group_id,
  b.id as booking_id,
  b.student_id,
  b.instructor_id,
  coalesce(b.lesson_mode, 'meeting') as lesson_mode,
  'mercado_pago'::text as payment_method,
  1::integer as total_lessons,
  b.value as total_amount,
  b.platform_amount,
  b.instructor_amount,
  case
    when p.status = 'approved' then 'paid'
    when b.status = 'cancelled' then 'cancelled'
    else 'pending'
  end::text as status,
  b.notes,
  b.created_at,
  b.updated_at
from public.bookings b
left join public.payments p on p.booking_id = b.id
where b.booking_group_id is null;

insert into public.booking_groups (
  id,
  student_id,
  instructor_id,
  lesson_mode,
  payment_method,
  total_lessons,
  total_amount,
  platform_amount,
  instructor_amount,
  status,
  notes,
  created_at,
  updated_at
)
select
  booking_group_id,
  student_id,
  instructor_id,
  lesson_mode,
  payment_method,
  total_lessons,
  total_amount,
  platform_amount,
  instructor_amount,
  status,
  notes,
  created_at,
  updated_at
from tmp_booking_group_backfill;

update public.bookings b
set booking_group_id = tmp.booking_group_id
from tmp_booking_group_backfill tmp
where b.id = tmp.booking_id
  and b.booking_group_id is null;

update public.payments p
set booking_group_id = b.booking_group_id
from public.bookings b
where p.booking_id = b.id
  and p.booking_group_id is null;

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
  check (status in ('available', 'reserved', 'booked', 'completed', 'blocked'));

drop policy if exists "Students can read available slots" on public.availability_slots;
create policy "Students can read available slots"
on public.availability_slots
for select
to authenticated
using (status in ('available', 'reserved', 'booked'));

drop policy if exists "Instructors can read own payments" on public.payments;
create policy "Instructors can read own payments"
on public.payments for select to authenticated
using (
  exists (
    select 1
    from public.booking_groups bg
    join public.instructor_profiles ip on ip.id = bg.instructor_id
    where bg.id = payments.booking_group_id
      and ip.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.bookings b
    join public.instructor_profiles ip on ip.id = b.instructor_id
    where b.id = payments.booking_id
      and ip.user_id = auth.uid()
  )
);

-- Core tables for scheduling, bookings, and wallets
-- Uses `if not exists` / `add column if not exists` to be safe on existing DBs

-- ─── availability_slots ────────────────────────────────────────────────────
create table if not exists public.availability_slots (
  id                    uuid primary key default gen_random_uuid(),
  instructor_id         uuid not null references public.instructor_profiles(id) on delete cascade,
  date                  date not null,
  hour                  integer not null check (hour >= 0 and hour <= 23),
  minute                integer not null default 0 check (minute in (0, 30)),
  slot_duration_minutes integer not null default 60 check (slot_duration_minutes in (30, 60, 90, 120)),
  status                text not null default 'available'
                          check (status in ('available', 'booked', 'completed', 'blocked')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Add new columns to existing tables (safe no-op if already there)
alter table public.availability_slots
  add column if not exists minute integer not null default 0;

alter table public.availability_slots
  add column if not exists slot_duration_minutes integer not null default 60;

create unique index if not exists availability_slots_unique_idx
  on public.availability_slots (instructor_id, date, hour, minute);

create index if not exists availability_slots_instructor_date_idx
  on public.availability_slots (instructor_id, date);

create index if not exists availability_slots_status_idx
  on public.availability_slots (status);

drop trigger if exists availability_slots_set_updated_at on public.availability_slots;
create trigger availability_slots_set_updated_at
before update on public.availability_slots
for each row execute function public.set_updated_at();

alter table public.availability_slots enable row level security;

drop policy if exists "Instructors can manage own slots" on public.availability_slots;
create policy "Instructors can manage own slots"
on public.availability_slots
for all
to authenticated
using (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = availability_slots.instructor_id
      and ip.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = availability_slots.instructor_id
      and ip.user_id = auth.uid()
  )
);

drop policy if exists "Students can read available slots" on public.availability_slots;
create policy "Students can read available slots"
on public.availability_slots
for select
to authenticated
using (status in ('available', 'booked'));

-- ─── bookings ──────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.student_profiles(id) on delete cascade,
  instructor_id     uuid not null references public.instructor_profiles(id) on delete cascade,
  slot_id           uuid not null references public.availability_slots(id) on delete cascade,
  value             numeric(10,2) not null,
  platform_amount   numeric(10,2) not null default 0,
  instructor_amount numeric(10,2) not null default 0,
  status            text not null default 'pending'
                      check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_id        uuid,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (slot_id)
);

create index if not exists bookings_instructor_idx on public.bookings (instructor_id);
create index if not exists bookings_student_idx    on public.bookings (student_id);
create index if not exists bookings_slot_idx       on public.bookings (slot_id);
create index if not exists bookings_status_idx     on public.bookings (status);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

drop policy if exists "Instructors can read own bookings" on public.bookings;
create policy "Instructors can read own bookings"
on public.bookings for select to authenticated
using (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = bookings.instructor_id and ip.user_id = auth.uid()
  )
);

drop policy if exists "Students can read own bookings" on public.bookings;
create policy "Students can read own bookings"
on public.bookings for select to authenticated
using (
  exists (
    select 1 from public.student_profiles sp
    where sp.id = bookings.student_id and sp.user_id = auth.uid()
  )
);

drop policy if exists "Students can insert bookings" on public.bookings;
create policy "Students can insert bookings"
on public.bookings for insert to authenticated
with check (
  exists (
    select 1 from public.student_profiles sp
    where sp.id = bookings.student_id and sp.user_id = auth.uid()
  )
);

drop policy if exists "Instructors can update own bookings" on public.bookings;
create policy "Instructors can update own bookings"
on public.bookings for update to authenticated
using (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = bookings.instructor_id and ip.user_id = auth.uid()
  )
);

-- ─── payments ──────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null references public.bookings(id) on delete cascade,
  total_amount      numeric(10,2) not null,
  platform_amount   numeric(10,2) not null,
  instructor_amount numeric(10,2) not null,
  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected', 'refunded')),
  mp_payment_id     text,
  paid_at           timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_id);
create index if not exists payments_status_idx  on public.payments (status);

alter table public.payments enable row level security;

drop policy if exists "Instructors can read own payments" on public.payments;
create policy "Instructors can read own payments"
on public.payments for select to authenticated
using (
  exists (
    select 1 from public.bookings b
    join public.instructor_profiles ip on ip.id = b.instructor_id
    where b.id = payments.booking_id and ip.user_id = auth.uid()
  )
);

-- ─── wallets ───────────────────────────────────────────────────────────────
create table if not exists public.wallets (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null,
  owner_type  text not null check (owner_type in ('instructor', 'platform')),
  balance     numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, owner_type)
);

drop trigger if exists wallets_set_updated_at on public.wallets;
create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

alter table public.wallets enable row level security;

drop policy if exists "Instructors can read own wallet" on public.wallets;
create policy "Instructors can read own wallet"
on public.wallets for select to authenticated
using (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = wallets.owner_id
      and wallets.owner_type = 'instructor'
      and ip.user_id = auth.uid()
  )
);

-- ─── wallet_transactions ───────────────────────────────────────────────────
create table if not exists public.wallet_transactions (
  id           uuid primary key default gen_random_uuid(),
  wallet_id    uuid not null references public.wallets(id) on delete cascade,
  type         text not null check (type in ('credit', 'debit')),
  amount       numeric(10,2) not null,
  description  text not null,
  reference_id uuid,
  created_at   timestamptz not null default now()
);

create index if not exists wallet_transactions_wallet_idx on public.wallet_transactions (wallet_id);
create index if not exists wallet_transactions_created_idx on public.wallet_transactions (created_at desc);

alter table public.wallet_transactions enable row level security;

drop policy if exists "Instructors can read own transactions" on public.wallet_transactions;
create policy "Instructors can read own transactions"
on public.wallet_transactions for select to authenticated
using (
  exists (
    select 1 from public.wallets w
    join public.instructor_profiles ip on ip.id = w.owner_id
    where w.id = wallet_transactions.wallet_id
      and w.owner_type = 'instructor'
      and ip.user_id = auth.uid()
  )
);

-- ─── absence_blocks ────────────────────────────────────────────────────────
create table if not exists public.absence_blocks (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.instructor_profiles(id) on delete cascade,
  start_date    date not null,
  end_date      date not null,
  start_time    time,
  end_time      time,
  reason        text,
  all_day       boolean not null default true,
  created_at    timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists absence_blocks_instructor_idx
  on public.absence_blocks (instructor_id);

create index if not exists absence_blocks_dates_idx
  on public.absence_blocks (instructor_id, start_date, end_date);

alter table public.absence_blocks enable row level security;

drop policy if exists "Instructors can manage own absences" on public.absence_blocks;
create policy "Instructors can manage own absences"
on public.absence_blocks
for all
to authenticated
using (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = absence_blocks.instructor_id and ip.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = absence_blocks.instructor_id and ip.user_id = auth.uid()
  )
);

-- Allow instructors to read student profiles linked to their bookings
drop policy if exists "Instructors can read students in their bookings" on public.student_profiles;
create policy "Instructors can read students in their bookings"
on public.student_profiles
for select
to authenticated
using (
  exists (
    select 1 from public.bookings b
    join public.instructor_profiles ip on ip.id = b.instructor_id
    where b.student_id = student_profiles.id
      and ip.user_id = auth.uid()
  )
);

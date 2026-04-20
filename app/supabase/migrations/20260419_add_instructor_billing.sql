alter table public.instructor_profiles
  add column if not exists rejection_reason text;

create table if not exists public.instructor_subscriptions (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.instructor_profiles(id) on delete cascade,
  plan text not null default 'monthly',
  value numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  external_reference text not null unique,
  mp_preference_id text,
  mp_preapproval_id text,
  mp_payment_id text,
  payment_url text,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instructor_subscriptions_instructor_idx
  on public.instructor_subscriptions (instructor_id);

create index if not exists instructor_subscriptions_status_idx
  on public.instructor_subscriptions (status);

create index if not exists instructor_subscriptions_expires_idx
  on public.instructor_subscriptions (expires_at);

drop trigger if exists instructor_subscriptions_set_updated_at on public.instructor_subscriptions;
create trigger instructor_subscriptions_set_updated_at
before update on public.instructor_subscriptions
for each row
execute function public.set_updated_at();

alter table public.instructor_subscriptions enable row level security;

drop policy if exists "Instructors can read own subscriptions" on public.instructor_subscriptions;
create policy "Instructors can read own subscriptions"
on public.instructor_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.instructor_profiles profiles
    where profiles.id = instructor_subscriptions.instructor_id
      and profiles.user_id = auth.uid()
  )
);

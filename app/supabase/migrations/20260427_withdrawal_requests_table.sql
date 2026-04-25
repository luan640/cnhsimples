-- withdrawal_requests: instructor saque requests, processed manually by admin

create table if not exists public.withdrawal_requests (
  id             uuid primary key default gen_random_uuid(),
  instructor_id  uuid not null references public.instructor_profiles(id) on delete cascade,
  amount         numeric(10,2) not null check (amount > 0),
  pix_key        text not null,
  pix_key_type   text not null,
  status         text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  admin_note     text,
  processed_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists withdrawal_requests_instructor_idx
  on public.withdrawal_requests (instructor_id, created_at desc);

create index if not exists withdrawal_requests_status_idx
  on public.withdrawal_requests (status);

alter table public.withdrawal_requests enable row level security;

drop policy if exists "Instructors can read own withdrawals" on public.withdrawal_requests;
create policy "Instructors can read own withdrawals"
on public.withdrawal_requests for select to authenticated
using (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = withdrawal_requests.instructor_id
      and ip.user_id = auth.uid()
  )
);

drop policy if exists "Instructors can insert own withdrawals" on public.withdrawal_requests;
create policy "Instructors can insert own withdrawals"
on public.withdrawal_requests for insert to authenticated
with check (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = withdrawal_requests.instructor_id
      and ip.user_id = auth.uid()
  )
);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  cpf text not null unique,
  birth_date date not null,
  phone text not null,
  photo_url text,
  cep text not null,
  neighborhood text not null,
  city text not null,
  latitude double precision,
  longitude double precision,
  has_cnh boolean not null default false,
  category_interest text not null check (category_interest in ('A', 'B', 'AB')),
  lesson_goals text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_profiles_city_idx
  on public.student_profiles (city);

create index if not exists student_profiles_category_interest_idx
  on public.student_profiles (category_interest);

create index if not exists student_profiles_created_at_idx
  on public.student_profiles (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_profiles_set_updated_at on public.student_profiles;

create trigger student_profiles_set_updated_at
before update on public.student_profiles
for each row
execute function public.set_updated_at();

alter table public.student_profiles enable row level security;

drop policy if exists "Students can read own profile" on public.student_profiles;
create policy "Students can read own profile"
on public.student_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Students can insert own profile" on public.student_profiles;
create policy "Students can insert own profile"
on public.student_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Students can update own profile" on public.student_profiles;
create policy "Students can update own profile"
on public.student_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

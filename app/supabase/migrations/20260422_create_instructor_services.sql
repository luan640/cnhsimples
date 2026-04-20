-- Instructor service catalog: individual lessons and packages

create table if not exists public.instructor_services (
  id                       uuid primary key default gen_random_uuid(),
  instructor_id            uuid not null references public.instructor_profiles(id) on delete cascade,
  title                    text not null,
  description              text,
  category                 text check (category in ('A', 'B', 'AB')),
  service_type             text not null default 'individual'
                             check (service_type in ('individual', 'package')),
  lesson_count             integer not null default 1 check (lesson_count >= 1),
  price                    numeric(10,2) not null check (price > 0),
  accepts_home_pickup      boolean not null default false,
  accepts_student_vehicle  boolean not null default false,
  accepts_highway          boolean not null default false,
  accepts_night_driving    boolean not null default false,
  accepts_parking_practice boolean not null default false,
  provides_vehicle         boolean not null default true,
  notes                    text,
  is_active                boolean not null default true,
  sort_order               integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists instructor_services_instructor_idx
  on public.instructor_services (instructor_id);

create index if not exists instructor_services_active_idx
  on public.instructor_services (instructor_id, is_active);

drop trigger if exists instructor_services_set_updated_at on public.instructor_services;
create trigger instructor_services_set_updated_at
  before update on public.instructor_services
  for each row execute function public.set_updated_at();

alter table public.instructor_services enable row level security;

drop policy if exists "Instructors can manage own services" on public.instructor_services;
create policy "Instructors can manage own services"
on public.instructor_services
for all
to authenticated
using (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = instructor_services.instructor_id and ip.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.instructor_profiles ip
    where ip.id = instructor_services.instructor_id and ip.user_id = auth.uid()
  )
);

drop policy if exists "Students can read active services" on public.instructor_services;
create policy "Students can read active services"
on public.instructor_services
for select
to authenticated
using (is_active = true);

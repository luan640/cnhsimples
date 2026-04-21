-- Allow a slot to be booked again after the previous booking was cancelled.
-- The old global unique(slot_id) constraint blocks retries forever, even when
-- the slot was released back to "available".

-- First, reconcile stale booking rows left behind by rollback paths.
update public.bookings b
set status = 'cancelled'
from public.booking_groups bg
where bg.id = b.booking_group_id
  and bg.status = 'cancelled'
  and b.status = 'pending';

-- Replace the global uniqueness constraint with a partial unique index that
-- only applies to active bookings.
alter table public.bookings
  drop constraint if exists bookings_slot_id_key;

drop index if exists bookings_slot_id_active_idx;

create unique index if not exists bookings_slot_id_active_idx
  on public.bookings (slot_id)
  where status in ('pending', 'confirmed', 'completed');

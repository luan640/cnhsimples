-- Allow payments linked only to a booking_group (multi-slot orders)
-- without requiring a specific booking_id, and add external_reference
-- for reliable Mercado Pago webhook lookup.

-- 1. Make booking_id nullable so a payment can belong to a group without
--    a single canonical booking row.
ALTER TABLE public.payments
  ALTER COLUMN booking_id DROP NOT NULL;

-- 2. Add external_reference column used to match Mercado Pago webhook
--    notifications back to local payment records.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS external_reference text;

CREATE INDEX IF NOT EXISTS payments_external_reference_idx
  ON public.payments (external_reference)
  WHERE external_reference IS NOT NULL;

-- 3. Allow students to see their own payments (via booking_group or direct booking).
--    Guard the booking_group join so the policy works even if 20260425 runs after this.
DROP POLICY IF EXISTS "Students can read own payments" ON public.payments;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_groups'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Students can read own payments"
      ON public.payments FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.booking_groups bg
          JOIN public.student_profiles sp ON sp.id = bg.student_id
          WHERE bg.id = payments.booking_group_id
            AND sp.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.bookings b
          JOIN public.student_profiles sp ON sp.id = b.student_id
          WHERE b.id = payments.booking_id
            AND sp.user_id = auth.uid()
        )
      )
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Students can read own payments"
      ON public.payments FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.bookings b
          JOIN public.student_profiles sp ON sp.id = b.student_id
          WHERE b.id = payments.booking_id
            AND sp.user_id = auth.uid()
        )
      )
    $policy$;
  END IF;
END $$;

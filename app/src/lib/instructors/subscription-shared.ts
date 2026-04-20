export type InstructorSubscriptionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'

export type InstructorSubscription = {
  id: string
  instructor_id: string
  plan: string
  value: number
  status: InstructorSubscriptionStatus
  external_reference: string
  mp_preference_id: string | null
  mp_payment_id: string | null
  payment_url: string | null
  paid_at: string | null
  expires_at: string | null
  created_at: string
}

const DEFAULT_MEMBERSHIP_AMOUNT = Number(process.env.MERCADO_PAGO_MEMBERSHIP_AMOUNT ?? '1')

export function getInstructorMembershipAmount() {
  return DEFAULT_MEMBERSHIP_AMOUNT
}

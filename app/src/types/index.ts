export type UserRole = 'admin' | 'instructor' | 'student'

export type InstructorStatus =
  | 'pending'
  | 'docs_rejected'
  | 'docs_approved'
  | 'active'
  | 'inactive'
  | 'suspended'

export type CNHCategory = 'A' | 'B' | 'AB'

export type SlotStatus = 'available' | 'booked' | 'completed' | 'blocked'

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded'

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected'

export type WalletTransactionType = 'credit' | 'debit'

export type InstructorSubscriptionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'

export type PixKeyType = 'cpf' | 'email' | 'phone' | 'random'

export type LessonGoal =
  | 'first_cnh'
  | 'detran_exam'
  | 'fear'
  | 'practice'
  | 'specific'
  | 'other'

export type DocumentType = 'cnh' | 'detran_credential'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export interface InstructorProfile {
  id: string
  user_id: string
  full_name: string
  cpf: string
  birth_date: string
  phone: string
  photo_url: string | null
  bio: string | null
  hourly_rate: number | null
  experience_years: number | null
  category: CNHCategory | null
  cnh_number: string
  cnh_expires_at: string
  detran_credential_number: string
  detran_credential_expires_at: string
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  latitude: number
  longitude: number
  service_radius_km: number
  pix_key_type: PixKeyType | null
  pix_key: string | null
  rating: number
  status: InstructorStatus
  created_at: string
}

export interface StudentProfile {
  id: string
  user_id: string
  full_name: string
  cpf: string
  birth_date: string
  phone: string
  photo_url: string | null
  cep: string
  neighborhood: string
  city: string
  latitude: number | null
  longitude: number | null
  has_cnh: boolean
  category_interest: CNHCategory
  lesson_goals: LessonGoal[]
  created_at: string
}

export interface AvailabilitySlot {
  id: string
  instructor_id: string
  date: string
  hour: number
  status: SlotStatus
}

export interface Booking {
  id: string
  student_id: string
  instructor_id: string
  booking_group_id?: string | null
  service_id?: string | null
  slot_id: string
  value: number
  platform_amount: number
  instructor_amount: number
  status: BookingStatus
  payment_id: string | null
  lesson_mode?: 'meeting' | 'pickup'
  created_at: string
}

export interface BookingGroup {
  id: string
  student_id: string
  instructor_id: string
  service_id: string | null
  lesson_mode: 'meeting' | 'pickup'
  payment_method: 'pix' | 'card' | 'mercado_pago'
  total_lessons: number
  total_amount: number
  platform_amount: number
  instructor_amount: number
  status: 'pending' | 'awaiting_payment' | 'paid' | 'cancelled' | 'expired'
  notes?: string | null
  expires_at?: string | null
  created_at: string
  updated_at?: string
}

export interface Wallet {
  id: string
  owner_id: string
  owner_type: 'instructor' | 'platform'
  balance: number
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  type: WalletTransactionType
  amount: number
  description: string
  reference_id: string | null
  created_at: string
}

export interface WithdrawalRequest {
  id: string
  instructor_id: string
  amount: number
  pix_key: string
  pix_key_type: PixKeyType
  status: WithdrawalStatus
  admin_note: string | null
  processed_at: string | null
  created_at: string
}

export interface InstructorSubscription {
  id: string
  instructor_id: string
  plan: string
  value: number
  status: InstructorSubscriptionStatus
  expires_at: string | null
  mp_payment_id: string | null
  created_at: string
}

export interface InstructorCard {
  id: string
  full_name: string
  photo_url: string | null
  category: CNHCategory
  neighborhood: string
  city: string
  hourly_rate: number
  rating: number
  review_count: number
  lesson_count: number
  student_count: number
  distance_km?: number
  is_super_instructor: boolean
  is_new: boolean
  is_trending: boolean
  bio: string | null
  individual_prices: Partial<Record<CNHCategory, number>>
  accepts_highway: boolean
  accepts_night_driving: boolean
  accepts_parking_practice: boolean
  student_chooses_destination: boolean
  status: InstructorStatus
}

export interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address: {
    road?: string
    suburb?: string
    neighbourhood?: string
    quarter?: string
    city_district?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    postcode?: string
  }
}

export interface CepLookupResult {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
  latitude: string
  longitude: string
  display_name: string
}

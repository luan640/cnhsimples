import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type InstructorFullProfile = {
  id: string
  user_id: string
  full_name: string
  cpf: string | null
  birth_date: string | null
  phone: string | null
  photo_url: string | null
  bio: string | null
  hourly_rate: number | null
  experience_years: number | null
  category: 'A' | 'B' | 'AB' | null
  cnh_number: string | null
  cnh_expires_at: string | null
  detran_credential_number: string | null
  detran_credential_expires_at: string | null
  cep: string | null
  street: string | null
  number: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  service_radius_km: number | null
  accepts_highway: boolean
  accepts_night_driving: boolean
  accepts_parking_practice: boolean
  student_chooses_destination: boolean
  pix_key_type: string | null
  pix_key: string | null
  rating: number
  status: string
}

export async function getInstructorFullProfile(userId: string): Promise<InstructorFullProfile | null> {
  noStore()
  const admin = createAdminClient()

  const { data } = await admin
    .from('instructor_profiles')
    .select(`
      id, user_id, full_name, cpf, birth_date, phone, photo_url, bio,
      hourly_rate, experience_years, category,
      cnh_number, cnh_expires_at, detran_credential_number, detran_credential_expires_at,
      cep, street, number, neighborhood, city, state, latitude, longitude, service_radius_km,
      accepts_highway, accepts_night_driving, accepts_parking_practice, student_chooses_destination,
      pix_key_type, pix_key, rating, status
    `)
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    user_id: data.user_id,
    full_name: data.full_name ?? '',
    cpf: data.cpf ?? null,
    birth_date: data.birth_date ?? null,
    phone: data.phone ?? null,
    photo_url: data.photo_url ?? null,
    bio: data.bio ?? null,
    hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : null,
    experience_years: data.experience_years ?? null,
    category: (data.category as 'A' | 'B' | 'AB' | null) ?? null,
    cnh_number: data.cnh_number ?? null,
    cnh_expires_at: data.cnh_expires_at ?? null,
    detran_credential_number: data.detran_credential_number ?? null,
    detran_credential_expires_at: data.detran_credential_expires_at ?? null,
    cep: data.cep ?? null,
    street: data.street ?? null,
    number: data.number ?? null,
    neighborhood: data.neighborhood ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    latitude: data.latitude ? Number(data.latitude) : null,
    longitude: data.longitude ? Number(data.longitude) : null,
    service_radius_km: data.service_radius_km ? Number(data.service_radius_km) : null,
    accepts_highway: data.accepts_highway ?? false,
    accepts_night_driving: data.accepts_night_driving ?? false,
    accepts_parking_practice: data.accepts_parking_practice ?? false,
    student_chooses_destination: data.student_chooses_destination ?? false,
    pix_key_type: data.pix_key_type ?? null,
    pix_key: data.pix_key ?? null,
    rating: Number(data.rating ?? 0),
    status: data.status ?? 'pending',
  }
}

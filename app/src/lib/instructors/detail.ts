import { unstable_noStore as noStore } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CNHCategory } from '@/types'
import type { PickupRange } from '@/lib/instructors/services'

export type { PickupRange }

export type PublicInstructorServiceOption = {
  id: string
  service_type: 'individual' | 'package'
  title: string
  description: string | null
  category: CNHCategory | null
  lesson_count: number
  price: number
  accepts_home_pickup: boolean
  pickup_ranges: PickupRange[]
  accepts_student_vehicle: boolean
  provides_vehicle: boolean
}

export type PublicInstructorAvailableSlot = {
  id: string
  date: string
  hour: number
  minute: number
  slot_duration_minutes: number
}

export type PublicInstructorDetail = {
  id: string
  full_name: string
  photo_url: string | null
  bio: string | null
  category: CNHCategory | null
  neighborhood: string
  city: string
  latitude: number | null
  longitude: number | null
  rating: number
  review_count: number
  lesson_count: number
  student_count: number
  experience_years: number | null
  accepts_highway: boolean
  accepts_night_driving: boolean
  accepts_parking_practice: boolean
  student_chooses_destination: boolean
  services: PublicInstructorServiceOption[]
  available_slots: PublicInstructorAvailableSlot[]
}

function toCategory(value: string | null | undefined): CNHCategory | null {
  if (value === 'A' || value === 'B' || value === 'AB') {
    return value
  }

  return null
}

function formatDate(offsetDays: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

export async function getPublicInstructorAvailableSlots(
  profileId: string
): Promise<PublicInstructorAvailableSlot[]> {
  noStore()

  const admin = createAdminClient()
  const startDate = formatDate(0)
  const endDate = formatDate(21)

  const { data, error } = await admin
    .from('availability_slots')
    .select('id, date, hour, minute, slot_duration_minutes')
    .eq('instructor_id', profileId)
    .eq('status', 'available')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('hour')
    .order('minute')

  if (error) {
    console.error('[instructors/detail] available slots error:', error.message)
    return []
  }

  return (data ?? []).map((slot) => ({
    id: slot.id,
    date: slot.date,
    hour: slot.hour,
    minute: slot.minute ?? 0,
    slot_duration_minutes: slot.slot_duration_minutes ?? 60,
  }))
}

export async function getPublicInstructorDetail(
  profileId: string
): Promise<PublicInstructorDetail | null> {
  noStore()

  const admin = createAdminClient()
  const startDate = formatDate(0)
  const endDate = formatDate(21)

  const [profileResult, servicesResult, slotsResult, bookingsResult] = await Promise.all([
    admin
      .from('instructor_profiles')
      .select(
        'id, full_name, photo_url, bio, category, neighborhood, city, latitude, longitude, rating, experience_years, status, accepts_highway, accepts_night_driving, accepts_parking_practice, student_chooses_destination'
      )
      .eq('id', profileId)
      .maybeSingle(),
    admin
      .from('instructor_services')
      .select(
        'id, service_type, title, description, category, lesson_count, price, accepts_home_pickup, pickup_ranges, accepts_student_vehicle, provides_vehicle'
      )
      .eq('instructor_id', profileId)
      .eq('is_active', true)
      .order('service_type')
      .order('sort_order')
      .order('created_at'),
    admin
      .from('availability_slots')
      .select('id, date, hour, minute, slot_duration_minutes')
      .eq('instructor_id', profileId)
      .eq('status', 'available')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('hour')
      .order('minute'),
    admin
      .from('bookings')
      .select('id, student_id, status')
      .eq('instructor_id', profileId)
      .in('status', ['pending', 'confirmed', 'completed']),
  ])

  const profile = profileResult.data

  if (!profile || (profile.status && profile.status !== 'active')) {
    return null
  }

  const bookings = bookingsResult.data ?? []
  const uniqueStudents = new Set(
    bookings.map((booking) => booking.student_id).filter((studentId): studentId is string => Boolean(studentId))
  )

  return {
    id: profile.id,
    full_name: profile.full_name ?? 'Instrutor',
    photo_url: profile.photo_url ?? null,
    bio: profile.bio ?? null,
    category: toCategory(profile.category),
    neighborhood: profile.neighborhood ?? 'Fortaleza',
    city: profile.city ?? 'Fortaleza',
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    rating: Number(profile.rating ?? 0),
    review_count: 0,
    lesson_count: bookings.length,
    student_count: uniqueStudents.size,
    experience_years: profile.experience_years ?? null,
    accepts_highway: profile.accepts_highway ?? false,
    accepts_night_driving: profile.accepts_night_driving ?? false,
    accepts_parking_practice: profile.accepts_parking_practice ?? false,
    student_chooses_destination: profile.student_chooses_destination ?? false,
    services: (servicesResult.data ?? []).map((service) => ({
      id: service.id,
      service_type: (service.service_type === 'package' ? 'package' : 'individual') as 'individual' | 'package',
      title: service.title ?? '',
      description: service.description ?? null,
      category: toCategory(service.category),
      lesson_count: Number(service.lesson_count ?? 1),
      price: Number(service.price ?? 0),
      accepts_home_pickup: service.accepts_home_pickup ?? false,
      pickup_ranges: (service.pickup_ranges as PickupRange[]) ?? [],
      accepts_student_vehicle: service.accepts_student_vehicle ?? false,
      provides_vehicle: service.provides_vehicle ?? true,
    })),
    available_slots: (slotsResult.data ?? []).map((slot) => ({
      id: slot.id,
      date: slot.date,
      hour: slot.hour,
      minute: slot.minute ?? 0,
      slot_duration_minutes: slot.slot_duration_minutes ?? 60,
    })),
  }
}

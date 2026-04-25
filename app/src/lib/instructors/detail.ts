import { unstable_noStore as noStore } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CNHCategory } from '@/types'
import type { PickupRange } from '@/lib/instructors/services'
import { getRevenueSplitConfig, studentPriceFromInstructorAmount } from '@/lib/revenue-split'

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
  starting_price: number | null
  services: PublicInstructorServiceOption[]
  available_slots: PublicInstructorAvailableSlot[]
}

const BOOKING_TIMEZONE = 'America/Fortaleza'
const DEFAULT_BOOKING_LEAD_TIME_HOURS = 2

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

function normalizeLeadTimeHours(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_BOOKING_LEAD_TIME_HOURS
  return Math.min(24, Math.max(0, Math.round(parsed)))
}

function getNowInBookingTimezoneParts() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  }
}

function toTimelineValue(date: string, hour: number, minute: number) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return Number.NaN
  return Date.UTC(year, month - 1, day, hour, minute, 0, 0)
}

function filterSlotsByLeadTime<T extends { date: string; hour: number; minute: number }>(
  slots: T[],
  leadTimeHours: number
) {
  const now = getNowInBookingTimezoneParts()
  const threshold =
    Date.UTC(now.year, now.month - 1, now.day, now.hour, now.minute, 0, 0) +
    leadTimeHours * 60 * 60 * 1000

  return slots.filter((slot) => {
    const slotTimeline = toTimelineValue(slot.date, slot.hour, slot.minute ?? 0)
    return Number.isFinite(slotTimeline) && slotTimeline >= threshold
  })
}

export async function getPublicInstructorAvailableSlots(
  profileId: string
): Promise<PublicInstructorAvailableSlot[]> {
  noStore()

  const admin = createAdminClient()
  const startDate = formatDate(0)
  const endDate = formatDate(21)
  const { data: profile } = await admin
    .from('instructor_profiles')
    .select('booking_lead_time_hours')
    .eq('id', profileId)
    .maybeSingle()
  const leadTimeHours = normalizeLeadTimeHours(profile?.booking_lead_time_hours)

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

  return filterSlotsByLeadTime((data ?? []).map((slot) => ({
    id: slot.id,
    date: slot.date,
    hour: slot.hour,
    minute: slot.minute ?? 0,
    slot_duration_minutes: slot.slot_duration_minutes ?? 60,
  })), leadTimeHours)
}

export async function getPublicInstructorDetail(
  profileId: string
): Promise<PublicInstructorDetail | null> {
  noStore()

  const admin = createAdminClient()
  const startDate = formatDate(0)
  const endDate = formatDate(21)
  const revenueSplitConfigPromise = getRevenueSplitConfig(profileId)

  const [profileResult, servicesResult, slotsResult, bookingsResult, revenueSplitConfig] =
    await Promise.all([
    admin
      .from('instructor_profiles')
      .select(
        'id, full_name, photo_url, bio, category, neighborhood, city, latitude, longitude, rating, experience_years, status, accepts_highway, accepts_night_driving, accepts_parking_practice, student_chooses_destination, booking_lead_time_hours'
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
    revenueSplitConfigPromise,
  ])

  const profile = profileResult.data

  if (!profile || (profile.status && profile.status !== 'active')) {
    return null
  }

  const bookings = bookingsResult.data ?? []
  const leadTimeHours = normalizeLeadTimeHours(profile.booking_lead_time_hours)
  const normalizedServices = (servicesResult.data ?? []).map((service) => ({
    id: service.id,
    service_type: (service.service_type === 'package' ? 'package' : 'individual') as
      | 'individual'
      | 'package',
    title: service.title ?? '',
    description: service.description ?? null,
    category: toCategory(service.category),
    lesson_count: Number(service.lesson_count ?? 1),
    price: studentPriceFromInstructorAmount(
      Number(service.price ?? 0),
      revenueSplitConfig.platformSplitRate
    ),
    accepts_home_pickup: service.accepts_home_pickup ?? false,
    pickup_ranges: ((service.pickup_ranges as PickupRange[]) ?? [])
      .map((range) => ({
        from_km: Number(range.from_km ?? 0),
        to_km: Number(range.to_km ?? 0),
        price: Number(range.price ?? 0),
      }))
      .filter(
        (range) =>
          Number.isFinite(range.from_km) &&
          Number.isFinite(range.to_km) &&
          Number.isFinite(range.price) &&
          range.to_km > range.from_km
      ),
    accepts_student_vehicle: service.accepts_student_vehicle ?? false,
    provides_vehicle: service.provides_vehicle ?? true,
  }))
  const uniqueStudents = new Set(
    bookings.map((booking) => booking.student_id).filter((studentId): studentId is string => Boolean(studentId))
  )
  const startingPrice =
    normalizedServices.length > 0
      ? normalizedServices.reduce(
          (lowest, service) => (service.price > 0 && service.price < lowest ? service.price : lowest),
          Number.POSITIVE_INFINITY
        )
      : null

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
    starting_price: startingPrice && Number.isFinite(startingPrice) ? startingPrice : null,
    services: normalizedServices,
    available_slots: filterSlotsByLeadTime((slotsResult.data ?? []).map((slot) => ({
      id: slot.id,
      date: slot.date,
      hour: slot.hour,
      minute: slot.minute ?? 0,
      slot_duration_minutes: slot.slot_duration_minutes ?? 60,
    })), leadTimeHours),
  }
}

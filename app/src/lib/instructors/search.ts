import { createClient } from '@supabase/supabase-js'

import type { CNHCategory, InstructorCard } from '@/types'
import { FALLBACK_PLATFORM_SPLIT_RATE, studentPriceFromInstructorAmount } from '@/lib/revenue-split'

export type InstructorSearchItem = InstructorCard & {
  lesson_goals: string[]
}

type UserCoords = { lat: number; lng: number }

type CanonicalInstructorPricing = {
  hourly_rate?: number | string | null
  platform_split_rate?: number | string | null
}

type RawInstructorRecord = {
  id?: string
  user_id?: string
  full_name?: string
  name?: string
  photo_url?: string | null
  avatar_url?: string | null
  category?: string | null
  cnh_category?: string | null
  neighborhood?: string | null
  district?: string | null
  city?: string | null
  hourly_rate?: number | string | null
  price_per_hour?: number | string | null
  rating?: number | string | null
  review_count?: number | string | null
  reviews_count?: number | string | null
  lesson_count?: number | string | null
  lessons_count?: number | string | null
  student_count?: number | string | null
  students_count?: number | string | null
  distance_km?: number | string | null
  bio?: string | null
  status?: string | null
  platform_split_rate?: number | string | null
  accepts_highway?: boolean | null
  accepts_night_driving?: boolean | null
  accepts_parking_practice?: boolean | null
  student_chooses_destination?: boolean | null
  lesson_goals?: string[] | null
  goals?: string[] | null
  latitude?: number | string | null
  longitude?: number | string | null
  booking_lead_time_hours?: number | string | null
  service_radius_km?: number | string | null
}

type RawIndividualServiceRecord = {
  instructor_id?: string | null
  category?: string | null
  price?: number | string | null
}

const TABLE_CANDIDATES = [
  'instructor_profiles',
  'instructors',
  'public_instructors',
  'search_instructors',
] as const

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function toCategory(value?: string | null): 'A' | 'B' | 'AB' {
  const normalized = (value ?? 'B').toUpperCase()
  if (normalized === 'A' || normalized === 'B' || normalized === 'AB') return normalized
  return 'B'
}

function toRate(value: number | string | null | undefined, fallback: number) {
  if (value == null) return fallback
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0 || n >= 1) return fallback
  return n
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildIndividualPriceMap(
  records: RawIndividualServiceRecord[],
  platformSplitRateByInstructor: Map<string, number>,
  defaultPlatformSplitRate: number
) {
  const pricesByInstructor = new Map<string, Partial<Record<CNHCategory, number>>>()

  for (const record of records) {
    const instructorId = record.instructor_id ?? ''
    const category = record.category ? toCategory(record.category) : null
    const basePrice = toNumber(record.price, 0)
    const platformSplitRate =
      platformSplitRateByInstructor.get(instructorId) ?? defaultPlatformSplitRate
    const price = studentPriceFromInstructorAmount(basePrice, platformSplitRate)

    if (!instructorId || !category || price <= 0) continue

    const current = pricesByInstructor.get(instructorId) ?? {}
    if (current[category] == null) {
      current[category] = price
      pricesByInstructor.set(instructorId, current)
    }
  }

  return pricesByInstructor
}

function buildPlatformSplitMap(records: RawInstructorRecord[], defaultPlatformSplitRate: number) {
  const ratesByInstructor = new Map<string, number>()

  for (const record of records) {
    const id = record.id ?? record.user_id
    if (!id) continue
    const customRate = toRate(record.platform_split_rate, defaultPlatformSplitRate)
    ratesByInstructor.set(id, customRate)
  }

  return ratesByInstructor
}

function normalizeInstructor(
  record: RawInstructorRecord,
  canonicalPricing: CanonicalInstructorPricing | null,
  individualPricesByInstructor: Map<string, Partial<Record<CNHCategory, number>>>,
  defaultPlatformSplitRate: number,
  userCoords: UserCoords | null
): InstructorSearchItem | null {
  const id = record.id ?? record.user_id
  const fullName = record.full_name ?? record.name

  if (!id || !fullName) return null

  const rating = toNumber(record.rating, 0)
  const reviewCount = toNumber(record.review_count ?? record.reviews_count, 0)
  const lessonCount = toNumber(record.lesson_count ?? record.lessons_count, 0)
  const studentCount = toNumber(record.student_count ?? record.students_count, 0)
  const individualPrices = individualPricesByInstructor.get(id) ?? {}
  const platformSplitRate = toRate(
    canonicalPricing?.platform_split_rate ?? record.platform_split_rate,
    defaultPlatformSplitRate
  )
  const fallbackHourlyRate = studentPriceFromInstructorAmount(
    toNumber(canonicalPricing?.hourly_rate ?? record.hourly_rate ?? record.price_per_hour, 0),
    platformSplitRate
  )
  const hourlyRate =
    individualPrices.A ?? individualPrices.B ?? individualPrices.AB ?? fallbackHourlyRate

  // Calculate distance from user location if both sets of coords are available
  let distanceKm: number | undefined
  const instructorLat = toNumber(record.latitude, NaN)
  const instructorLng = toNumber(record.longitude, NaN)
  const hasValidCoords =
    Number.isFinite(instructorLat) &&
    Number.isFinite(instructorLng) &&
    instructorLat !== 0 &&
    instructorLng !== 0

  if (userCoords && hasValidCoords) {
    distanceKm = haversineKm(userCoords.lat, userCoords.lng, instructorLat, instructorLng)
  } else if (record.distance_km != null) {
    distanceKm = toNumber(record.distance_km)
  }

  return {
    id,
    full_name: fullName,
    photo_url: record.photo_url ?? record.avatar_url ?? null,
    category: toCategory(record.category ?? record.cnh_category),
    neighborhood: record.neighborhood ?? record.district ?? 'Fortaleza',
    city: record.city ?? 'Fortaleza',
    hourly_rate: hourlyRate,
    rating,
    review_count: reviewCount,
    lesson_count: lessonCount,
    student_count: studentCount,
    distance_km: distanceKm,
    is_super_instructor: rating >= 4.8 && lessonCount >= 50,
    is_new: reviewCount === 0 || lessonCount < 20,
    is_trending: lessonCount >= 5 && lessonCount < 40,
    bio: record.bio ?? null,
    individual_prices: individualPrices,
    accepts_highway: record.accepts_highway ?? false,
    accepts_night_driving: record.accepts_night_driving ?? false,
    accepts_parking_practice: record.accepts_parking_practice ?? false,
    student_chooses_destination: record.student_chooses_destination ?? false,
    booking_lead_time_hours: toNumber(record.booking_lead_time_hours, 2),
    latitude: hasValidCoords ? instructorLat : null,
    longitude: hasValidCoords ? instructorLng : null,
    status:
      record.status === 'pending' ||
      record.status === 'docs_rejected' ||
      record.status === 'docs_approved' ||
      record.status === 'inactive' ||
      record.status === 'suspended'
        ? record.status
        : 'active',
    lesson_goals: record.lesson_goals ?? record.goals ?? [],
  }
}

async function geocodeNeighborhood(
  neighborhood: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${neighborhood}, ${city}, Ceará, Brasil`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      {
        headers: { 'User-Agent': 'CNHSimples/1.0 (contato@cnhsimples.com.br)' },
        next: { revalidate: 86400 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || !data[0]) return null
    const lat = parseFloat(data[0].lat)
    const lng = parseFloat(data[0].lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}

export async function getInstructorSearchItems(userCoords?: UserCoords | null) {
  const supabase = createAdminClient()
  if (!supabase) return []

  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .not('hidden_from_search', 'eq', true)
      .limit(100)

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') continue
      console.error(`[buscar] Supabase query failed for ${table}:`, error.message)
      continue
    }

    const { data: serviceData } = await supabase
      .from('instructor_services')
      .select('instructor_id, category, price')
      .eq('is_active', true)
      .eq('service_type', 'individual')
      .order('sort_order')
      .order('created_at')

    const { data: platformSettingsData } = await supabase
      .from('platform_settings')
      .select('default_platform_split_rate')
      .eq('id', true)
      .maybeSingle()

    const defaultPlatformSplitRate = toRate(
      platformSettingsData?.default_platform_split_rate,
      FALLBACK_PLATFORM_SPLIT_RATE
    )
    const rawRecords = (data ?? []) as RawInstructorRecord[]
    const instructorIds = rawRecords
      .map((record) => record.id ?? null)
      .filter((id): id is string => Boolean(id))

    const { data: canonicalPricingRows } =
      instructorIds.length > 0
        ? await supabase
            .from('instructor_profiles')
            .select('id, hourly_rate, platform_split_rate, latitude, longitude, booking_lead_time_hours')
            .in('id', instructorIds)
        : { data: [] as { id: string; hourly_rate?: number | string | null; platform_split_rate?: number | string | null; latitude?: number | null; longitude?: number | null; booking_lead_time_hours?: number | null }[] }

    const canonicalPricingMap = new Map<string, CanonicalInstructorPricing>(
      (canonicalPricingRows ?? []).map((row) => [
        row.id,
        { hourly_rate: row.hourly_rate, platform_split_rate: row.platform_split_rate },
      ])
    )

    // Merge canonical lat/lng into raw records so normalizeInstructor can use them
    const canonicalLocMap = new Map(
      (canonicalPricingRows ?? []).map((row) => [
        row.id,
        {
          latitude: row.latitude,
          longitude: row.longitude,
          booking_lead_time_hours: row.booking_lead_time_hours,
        },
      ])
    )

    const platformSplitRateByInstructor = buildPlatformSplitMap(
      rawRecords.map((record) => ({
        ...record,
        platform_split_rate:
          canonicalPricingMap.get(record.id ?? '')?.platform_split_rate ?? record.platform_split_rate,
      })),
      defaultPlatformSplitRate
    )

    const individualPricesByInstructor = buildIndividualPriceMap(
      (serviceData ?? []) as RawIndividualServiceRecord[],
      platformSplitRateByInstructor,
      defaultPlatformSplitRate
    )

    const normalized = rawRecords
      .map((item) => {
        const loc = canonicalLocMap.get(item.id ?? '')
        const merged: RawInstructorRecord = {
          ...item,
          latitude: item.latitude ?? loc?.latitude,
          longitude: item.longitude ?? loc?.longitude,
          booking_lead_time_hours: item.booking_lead_time_hours ?? loc?.booking_lead_time_hours,
        }
        return normalizeInstructor(
          merged,
          canonicalPricingMap.get(item.id ?? '') ?? null,
          individualPricesByInstructor,
          defaultPlatformSplitRate,
          userCoords ?? null
        )
      })
      .filter((item): item is InstructorSearchItem => Boolean(item))

    // Geocode missing coordinates using neighborhood as fallback
    const withoutCoords = normalized.filter((i) => i.latitude == null && i.neighborhood)
    if (withoutCoords.length > 0) {
      const uniqueKeys = [...new Set(withoutCoords.map((i) => `${i.neighborhood}|${i.city}`))]
      const geocodeResults = await Promise.all(
        uniqueKeys.map(async (key) => {
          const [neighbourhood, city] = key.split('|')
          const coords = await geocodeNeighborhood(neighbourhood, city)
          return { key, coords }
        })
      )
      const coordByKey = new Map(geocodeResults.map(({ key, coords }) => [key, coords]))

      // Apply tiny jitter so stacked same-location markers don't overlap
      const jitterCounters = new Map<string, number>()
      for (const instructor of normalized) {
        if (instructor.latitude != null) continue
        const key = `${instructor.neighborhood}|${instructor.city}`
        const coords = coordByKey.get(key)
        if (!coords) continue
        const count = jitterCounters.get(key) ?? 0
        jitterCounters.set(key, count + 1)
        const angle = (count * 137.5 * Math.PI) / 180
        const radius = 0.0008 * Math.ceil(count / 8)
        instructor.latitude = coords.lat + radius * Math.cos(angle)
        instructor.longitude = coords.lng + radius * Math.sin(angle)
        if (userCoords) {
          instructor.distance_km = haversineKm(
            userCoords.lat,
            userCoords.lng,
            instructor.latitude,
            instructor.longitude
          )
        }
      }
    }

    return normalized
  }

  return []
}

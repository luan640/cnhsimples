import { createClient } from '@supabase/supabase-js'

import type { InstructorCard } from '@/types'

type InstructorSearchItem = InstructorCard & {
  lesson_goals: string[]
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
  lesson_goals?: string[] | null
  goals?: string[] | null
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

  if (!url || !key) {
    return null
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
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
  if (normalized === 'A' || normalized === 'B' || normalized === 'AB') {
    return normalized
  }
  return 'B'
}

function normalizeInstructor(record: RawInstructorRecord): InstructorSearchItem | null {
  const id = record.id ?? record.user_id
  const fullName = record.full_name ?? record.name

  if (!id || !fullName) {
    return null
  }

  const rating = toNumber(record.rating, 0)
  const reviewCount = toNumber(record.review_count ?? record.reviews_count, 0)
  const lessonCount = toNumber(record.lesson_count ?? record.lessons_count, 0)
  const studentCount = toNumber(record.student_count ?? record.students_count, 0)

  return {
    id,
    full_name: fullName,
    photo_url: record.photo_url ?? record.avatar_url ?? null,
    category: toCategory(record.category ?? record.cnh_category),
    neighborhood: record.neighborhood ?? record.district ?? 'Fortaleza',
    city: record.city ?? 'Fortaleza',
    hourly_rate: toNumber(record.hourly_rate ?? record.price_per_hour, 0),
    rating,
    review_count: reviewCount,
    lesson_count: lessonCount,
    student_count: studentCount,
    distance_km: record.distance_km == null ? undefined : toNumber(record.distance_km),
    is_super_instructor: rating >= 4.8 && lessonCount >= 50,
    is_new: reviewCount === 0 || lessonCount < 20,
    is_trending: lessonCount >= 5 && lessonCount < 40,
    bio: record.bio ?? null,
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

export async function getInstructorSearchItems() {
  const supabase = createAdminClient()

  if (!supabase) {
    return []
  }

  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase.from(table).select('*').limit(100)

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        continue
      }

      console.error(`[buscar] Supabase query failed for ${table}:`, error.message)
      continue
    }

    return (data ?? [])
      .map((item) => normalizeInstructor(item as RawInstructorRecord))
      .filter((item): item is InstructorSearchItem => Boolean(item))
  }

  return []
}

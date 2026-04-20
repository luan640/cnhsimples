import { createClient } from '@supabase/supabase-js'

import type { CNHCategory, LessonGoal } from '@/types'

type StudentSignupPayload = {
  userId: string
  email: string
  fullName: string
  cpf: string
  birthDate: string
  phone: string
  photoUrl: string
  cep: string
  neighborhood: string
  city: string
  latitude: number | null
  longitude: number | null
  hasCnh: boolean
  categoryInterest: CNHCategory
  lessonGoals: LessonGoal[]
  customGoal: string
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

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

function buildMetadata(payload: StudentSignupPayload) {
  return {
    role: 'student',
    full_name: payload.fullName,
    cpf: payload.cpf,
    birth_date: payload.birthDate,
    phone: payload.phone,
    photo_url: payload.photoUrl || null,
    cep: payload.cep,
    neighborhood: payload.neighborhood,
    city: payload.city,
    latitude: payload.latitude,
    longitude: payload.longitude,
    has_cnh: payload.hasCnh,
    category_interest: payload.categoryInterest,
    lesson_goals: payload.lessonGoals,
    custom_goal: payload.customGoal || null,
  }
}

function buildTablePayload(payload: StudentSignupPayload) {
  return {
    user_id: payload.userId,
    full_name: payload.fullName,
    cpf: payload.cpf,
    birth_date: payload.birthDate,
    phone: payload.phone,
    photo_url: payload.photoUrl || null,
    cep: payload.cep,
    neighborhood: payload.neighborhood,
    city: payload.city,
    latitude: payload.latitude,
    longitude: payload.longitude,
    has_cnh: payload.hasCnh,
    category_interest: payload.categoryInterest,
    lesson_goals: payload.lessonGoals,
  }
}

export async function syncStudentProfile(payload: StudentSignupPayload) {
  const admin = createAdminClient()

  if (!admin) {
    throw new Error('Supabase service role nao configurada.')
  }

  const metadata = buildMetadata(payload)

  const { error: updateError } = await admin.auth.admin.updateUserById(payload.userId, {
    user_metadata: metadata,
  })

  if (updateError) {
    throw new Error(updateError.message)
  }

  const { error: profileError } = await admin
    .from('student_profiles')
    .upsert(buildTablePayload(payload), { onConflict: 'user_id' })

  if (profileError) {
    throw new Error(profileError.message)
  }

  return { storedProfile: true }
}

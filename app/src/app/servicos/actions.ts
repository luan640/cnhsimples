'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getInstructorProfileId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('instructor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return data?.id ?? null
}

export type ServicePayload = {
  id?: string
  category: 'A' | 'B' | 'AB' | null
  service_type: 'individual' | 'package'
  lesson_count: number
  price: number
  accepts_home_pickup: boolean
  pickup_ranges: { from_km: number; to_km: number; price: number }[]
  accepts_student_vehicle: boolean
  accepts_highway: boolean
  accepts_night_driving: boolean
  accepts_parking_practice: boolean
  provides_vehicle: boolean
  notes: string
  is_active: boolean
}

function generateTitle(serviceType: 'individual' | 'package', category: 'A' | 'B' | 'AB' | null, lessonCount: number): string {
  const cat = category ? ` — Categoria ${category}` : ''
  if (serviceType === 'package') return `Pacote ${lessonCount} Aulas${cat}`
  return `Aula Avulsa${cat}`
}

export async function upsertServiceAction(
  payload: ServicePayload
): Promise<{ error: string | null }> {
  const profileId = await getInstructorProfileId()
  if (!profileId) return { error: 'Não autenticado.' }

  const admin = createAdminClient()

  const row = {
    instructor_id: profileId,
    title: generateTitle(payload.service_type, payload.category, payload.lesson_count),
    category: payload.category,
    service_type: payload.service_type,
    lesson_count: payload.service_type === 'package' ? payload.lesson_count : 1,
    price: payload.price,
    accepts_home_pickup: payload.accepts_home_pickup,
    pickup_ranges: payload.accepts_home_pickup ? payload.pickup_ranges : [],
    accepts_student_vehicle: payload.accepts_student_vehicle,
    accepts_highway: payload.accepts_highway,
    accepts_night_driving: payload.accepts_night_driving,
    accepts_parking_practice: payload.accepts_parking_practice,
    provides_vehicle: payload.provides_vehicle,
    notes: payload.notes.trim() || null,
    is_active: payload.is_active,
  }

  if (payload.id) {
    const { data: existing } = await admin
      .from('instructor_services')
      .select('id, instructor_id')
      .eq('id', payload.id)
      .maybeSingle()

    if (!existing || existing.instructor_id !== profileId) {
      return { error: 'Serviço não encontrado.' }
    }

    const { error } = await admin
      .from('instructor_services')
      .update(row)
      .eq('id', payload.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await admin
      .from('instructor_services')
      .insert(row)

    if (error) return { error: error.message }
  }

  revalidatePath('/servicos')
  return { error: null }
}

export async function deleteServiceAction(
  serviceId: string
): Promise<{ error: string | null }> {
  const profileId = await getInstructorProfileId()
  if (!profileId) return { error: 'Não autenticado.' }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('instructor_services')
    .select('id, instructor_id')
    .eq('id', serviceId)
    .maybeSingle()

  if (!existing || existing.instructor_id !== profileId) {
    return { error: 'Serviço não encontrado.' }
  }

  const { error } = await admin
    .from('instructor_services')
    .delete()
    .eq('id', serviceId)

  if (error) return { error: error.message }

  revalidatePath('/servicos')
  return { error: null }
}

export async function toggleServiceActiveAction(
  serviceId: string,
  active: boolean
): Promise<{ error: string | null }> {
  const profileId = await getInstructorProfileId()
  if (!profileId) return { error: 'Não autenticado.' }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('instructor_services')
    .select('id, instructor_id')
    .eq('id', serviceId)
    .maybeSingle()

  if (!existing || existing.instructor_id !== profileId) {
    return { error: 'Serviço não encontrado.' }
  }

  const { error } = await admin
    .from('instructor_services')
    .update({ is_active: active })
    .eq('id', serviceId)

  if (error) return { error: error.message }

  revalidatePath('/servicos')
  return { error: null }
}

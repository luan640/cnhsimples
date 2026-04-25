'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type StudentProfilePayload = {
  birthDate: string
  gender: string
  cep: string
  neighborhood: string
  city: string
  latitude: number | null
  longitude: number | null
}

export async function updateStudentProfileAction(payload: StudentProfilePayload) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado.')

  // Save to auth metadata (always works)
  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      birth_date: payload.birthDate || null,
      gender: payload.gender || null,
      cep: payload.cep || null,
      neighborhood: payload.neighborhood || null,
      city: payload.city || null,
      latitude: payload.latitude,
      longitude: payload.longitude,
    },
  })
  if (metaError) throw new Error(metaError.message)

  // Also try to sync to student_profiles if the row exists
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await admin.from('student_profiles').update({
      birth_date: payload.birthDate || null,
      cep: payload.cep || null,
      neighborhood: payload.neighborhood || null,
      city: payload.city || null,
      latitude: payload.latitude,
      longitude: payload.longitude,
    }).eq('user_id', user.id)
  }

  revalidatePath('/aluno/perfil')
}

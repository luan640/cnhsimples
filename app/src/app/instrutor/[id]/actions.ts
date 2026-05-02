'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function saveStudentPhone(phone: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) {
    return { ok: false, error: 'Informe um número válido com DDD (ex: 85 91234-5678).' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('student_profiles')
    .update({ phone: phone.trim() })
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

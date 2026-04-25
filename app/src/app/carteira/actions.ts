'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInstructorProfile } from '@/lib/instructors/dashboard'

export type SolicitarSaqueResult =
  | { ok: true }
  | { ok: false; error: string }

const PIX_KEY_TYPES = new Set(['cpf', 'email', 'phone', 'random'])

export async function salvarChavePix(formData: FormData): Promise<SolicitarSaqueResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Não autenticado.' }

  const profile = await getInstructorProfile(user.id)
  if (!profile) return { ok: false, error: 'Perfil não encontrado.' }

  const pixKey = String(formData.get('pix_key') ?? '').trim()
  const pixKeyType = String(formData.get('pix_key_type') ?? '').trim().toLowerCase()

  if (!pixKey) return { ok: false, error: 'Chave PIX é obrigatória.' }
  if (!PIX_KEY_TYPES.has(pixKeyType)) {
    return { ok: false, error: 'Tipo de chave PIX inválido.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('instructor_profiles')
    .update({
      pix_key: pixKey,
      pix_key_type: pixKeyType,
    })
    .eq('id', profile.id)

  if (error) {
    console.error('[carteira] salvarChavePix:', error.message)
    return { ok: false, error: 'Não foi possível salvar a chave PIX.' }
  }

  revalidatePath('/carteira')
  return { ok: true }
}

export async function solicitarSaque(
  amount: number,
  pixKey: string,
  pixKeyType: string
): Promise<SolicitarSaqueResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Não autenticado.' }

  const profile = await getInstructorProfile(user.id)
  if (!profile) return { ok: false, error: 'Perfil não encontrado.' }

  if (!amount || amount <= 0) return { ok: false, error: 'Valor inválido.' }
  if (!pixKey?.trim()) return { ok: false, error: 'Chave PIX é obrigatória.' }

  const admin = createAdminClient()

  const { data: wallet } = await admin
    .from('wallets')
    .select('balance')
    .eq('owner_id', profile.id)
    .eq('owner_type', 'instructor')
    .maybeSingle()

  const balance = Number(wallet?.balance ?? 0)
  if (amount > balance) {
    return { ok: false, error: 'Valor solicitado maior que o saldo disponível.' }
  }

  const { data: pending } = await admin
    .from('withdrawal_requests')
    .select('id')
    .eq('instructor_id', profile.id)
    .eq('status', 'pending')
    .limit(1)

  if (pending && pending.length > 0) {
    return { ok: false, error: 'Você já tem um saque pendente. Aguarde a aprovação.' }
  }

  const { error } = await admin.from('withdrawal_requests').insert({
    instructor_id: profile.id,
    amount,
    pix_key: pixKey.trim(),
    pix_key_type: pixKeyType,
  })

  if (error) {
    console.error('[carteira] solicitarSaque:', error.message)
    return { ok: false, error: 'Erro ao criar solicitação. Tente novamente.' }
  }

  revalidatePath('/carteira')
  return { ok: true }
}


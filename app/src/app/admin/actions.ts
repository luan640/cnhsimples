'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'

function parsePercent(rawValue: string) {
  const normalized = rawValue.replace(',', '.').trim()
  const percent = Number(normalized)

  if (!Number.isFinite(percent)) {
    throw new Error('Informe um percentual válido.')
  }

  if (percent < 0 || percent >= 100) {
    throw new Error('O percentual da plataforma deve estar entre 0% e 99,99%.')
  }

  return Number((percent / 100).toFixed(4))
}

export async function updateDefaultPlatformSplitAction(formData: FormData) {
  const admin = createAdminClient()
  const platformSplitRate = parsePercent(String(formData.get('platform_split_percent') ?? ''))

  const { error } = await admin.from('platform_settings').upsert(
    {
      id: true,
      default_platform_split_rate: platformSplitRate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (error) {
    throw new Error('Não foi possível salvar o split padrão da plataforma.')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/instrutores')
}

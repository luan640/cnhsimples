import { NextResponse } from 'next/server'

import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { cancelInstructorSubscription } from '@/lib/instructors/subscriptions'
import { createClient } from '@/lib/supabase/server'

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Nao foi possivel cancelar a assinatura.'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 })
  }

  if (user.user_metadata?.role !== 'instructor') {
    return NextResponse.json({ error: 'Apenas instrutores podem gerenciar assinatura.' }, { status: 403 })
  }

  const profile = await getInstructorProfile(user.id)

  if (!profile) {
    return NextResponse.json({ error: 'Perfil do instrutor nao encontrado.' }, { status: 404 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    if (reason) {
      console.info('[mercadopago] instructor membership cancellation reason:', {
        instructorId: profile.id,
        reason,
      })
    }

    const subscription = await cancelInstructorSubscription(profile.id)

    return NextResponse.json({
      ok: true,
      subscription,
    })
  } catch (error) {
    console.error('[mercadopago] cancel instructor membership failed:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { getInstructorMembershipStatus } from '@/lib/instructors/subscriptions'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 })
  }

  if (user.user_metadata?.role !== 'instructor') {
    return NextResponse.json({ error: 'Apenas instrutores podem consultar mensalidade.' }, { status: 403 })
  }

  const profile = await getInstructorProfile(user.id)
  if (!profile) {
    return NextResponse.json({ error: 'Perfil do instrutor nao encontrado.' }, { status: 404 })
  }

  const subscriptionId = request.nextUrl.searchParams.get('subscription_id')?.trim() ?? ''
  if (!subscriptionId) {
    return NextResponse.json({ error: 'subscription_id obrigatorio.' }, { status: 400 })
  }

  try {
    const result = await getInstructorMembershipStatus(profile.id, subscriptionId)
    if (!result) {
      return NextResponse.json({ error: 'Mensalidade nao encontrada.' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[instructor-membership/status] Error:', error)
    return NextResponse.json({ error: 'Falha ao consultar mensalidade.' }, { status: 500 })
  }
}

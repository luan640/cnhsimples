import { NextRequest, NextResponse } from 'next/server'

import { getPublicInstructorAvailableSlots } from '@/lib/instructors/detail'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = await context.params
  const slots = await getPublicInstructorAvailableSlots(id)
  return NextResponse.json({ slots })
}

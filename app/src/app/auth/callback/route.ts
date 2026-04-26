import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

function getSafeNextPath(next?: string | null) {
  if (!next || !next.startsWith('/')) {
    return '/aluno'
  }
  return next
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = getSafeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login/aluno?error=oauth_failed`)
}

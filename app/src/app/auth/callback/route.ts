import { NextRequest, NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function getSafeNextPath(next?: string | null) {
  if (!next || !next.startsWith('/')) {
    return '/aluno'
  }
  return next
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

async function ensureStudentProfile(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}) {
  const admin = createAdminClient()
  const { data: existing, error: selectError } = await admin
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (selectError) {
    throw new Error(selectError.message)
  }

  if (existing) {
    return
  }

  const metadata = user.user_metadata ?? {}
  const fullName =
    readString(metadata.full_name) ??
    readString(metadata.name) ??
    readString(user.email)?.split('@')[0] ??
    'Aluno'
  const categoryInterest = readString(metadata.category_interest)
  const normalizedCategory =
    categoryInterest === 'A' || categoryInterest === 'B' || categoryInterest === 'AB'
      ? categoryInterest
      : 'B'
  const lessonGoals = Array.isArray(metadata.lesson_goals)
    ? metadata.lesson_goals.filter((value): value is string => typeof value === 'string')
    : []

  const { error: insertError } = await admin.from('student_profiles').insert({
    user_id: user.id,
    full_name: fullName,
    cpf: readString(metadata.cpf) ?? `oauth-${user.id}`,
    birth_date: readString(metadata.birth_date) ?? '2000-01-01',
    photo_url: readString(metadata.avatar_url) ?? readString(metadata.photo_url),
    phone: readString(metadata.phone) ?? '',
    cep: readString(metadata.cep) ?? '',
    city: readString(metadata.city) ?? '',
    neighborhood: readString(metadata.neighborhood) ?? '',
    latitude: readNumber(metadata.latitude),
    longitude: readNumber(metadata.longitude),
    has_cnh: typeof metadata.has_cnh === 'boolean' ? metadata.has_cnh : false,
    category_interest: normalizedCategory,
    lesson_goals: lessonGoals,
  })

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = getSafeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const roleParam = searchParams.get('role')
      if (roleParam === 'student' || roleParam === 'instructor') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.auth.updateUser({ data: { role: roleParam } })

          if (roleParam === 'student') {
            await ensureStudentProfile(user).catch((err) => {
              console.error('[auth/callback] ensureStudentProfile falhou:', err)
            })
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login/aluno?error=oauth_failed`)
}

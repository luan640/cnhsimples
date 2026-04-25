import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

type StudentSignupRequest = {
  accountMethod: 'google' | 'email'
  fullName: string
  email: string
  password?: string
}

function validate(body: StudentSignupRequest) {
  if (body.accountMethod === 'email') {
    if (!body.fullName?.trim()) return 'Nome completo é obrigatório.'
    if (!body.email?.trim()) return 'E-mail é obrigatório.'
    if (!body.password || body.password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
  }
  return null
}

export async function POST(request: Request) {
  const body = (await request.json()) as StudentSignupRequest
  const validationError = validate(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  if (body.accountMethod === 'email') {
    const { data, error } = await supabase.auth.signUp({
      email: body.email.trim().toLowerCase(),
      password: body.password!,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/confirmacao-email?role=student`,
        data: {
          role: 'student',
          full_name: body.fullName.trim(),
        },
      },
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? 'Não foi possível criar a conta.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      nextStep: data.session ? 'signed_in' : 'confirm_email',
    })
  }

  // Google: user is already authenticated via OAuth
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json(
      { error: 'Sessão Google não encontrada.' },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true, nextStep: 'signed_in' })
}

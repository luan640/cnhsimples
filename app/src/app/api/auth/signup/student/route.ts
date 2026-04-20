import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { syncStudentProfile } from '@/lib/students/profile'
import type { CNHCategory, LessonGoal } from '@/types'

type StudentSignupRequest = {
  accountMethod: 'google' | 'email'
  fullName: string
  email: string
  password?: string
  cpf: string
  birthDate: string
  phone: string
  photoUrl?: string
  cep: string
  neighborhood: string
  city: string
  latitude: number | null
  longitude: number | null
  hasCnh: boolean
  categoryInterest: CNHCategory
  lessonGoals: LessonGoal[]
  customGoal?: string
}

function validateBody(body: StudentSignupRequest) {
  if (!body.fullName?.trim()) return 'Nome completo e obrigatorio.'
  if (!body.email?.trim()) return 'E-mail e obrigatorio.'
  if (!body.cpf?.trim()) return 'CPF e obrigatorio.'
  if (!body.birthDate) return 'Data de nascimento e obrigatoria.'
  if (!body.phone?.trim()) return 'Telefone e obrigatorio.'
  if (!body.cep?.trim()) return 'CEP e obrigatorio.'
  if (!body.neighborhood?.trim()) return 'Bairro e obrigatorio.'
  if (!body.city?.trim()) return 'Cidade e obrigatoria.'
  if (!body.lessonGoals?.length) return 'Selecione pelo menos um objetivo.'
  if (body.accountMethod === 'email' && (!body.password || body.password.length < 8)) {
    return 'A senha deve ter no minimo 8 caracteres.'
  }

  return null
}

function normalizeBody(body: StudentSignupRequest) {
  return {
    ...body,
    email: body.email.trim().toLowerCase(),
    fullName: body.fullName.trim(),
    cpf: body.cpf.replace(/\D/g, ''),
    phone: body.phone.replace(/\D/g, ''),
    cep: body.cep.replace(/\D/g, ''),
    photoUrl: body.photoUrl?.trim() ?? '',
    customGoal: body.customGoal?.trim() ?? '',
  }
}

function buildProfilePayload(
  payload: ReturnType<typeof normalizeBody>,
  userId: string,
  fallbackEmail: string
) {
  return {
    userId,
    email: fallbackEmail,
    fullName: payload.fullName,
    cpf: payload.cpf,
    birthDate: payload.birthDate,
    phone: payload.phone,
    photoUrl: payload.photoUrl,
    cep: payload.cep,
    neighborhood: payload.neighborhood,
    city: payload.city,
    latitude: payload.latitude,
    longitude: payload.longitude,
    hasCnh: payload.hasCnh,
    categoryInterest: payload.categoryInterest,
    lessonGoals: payload.lessonGoals,
    customGoal: payload.customGoal,
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as StudentSignupRequest
  const validationError = validateBody(body)

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const payload = normalizeBody(body)
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  if (payload.accountMethod === 'email') {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password!,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/confirmacao-email?role=student`,
        data: {
          role: 'student',
          full_name: payload.fullName,
          cpf: payload.cpf,
        },
      },
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? 'Nao foi possivel criar a conta.' },
        { status: 400 }
      )
    }

    try {
      await syncStudentProfile(buildProfilePayload(payload, data.user.id, payload.email))
    } catch (profileError) {
      const message =
        profileError instanceof Error
          ? profileError.message
          : 'Nao foi possivel salvar o perfil do aluno.'

      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      nextStep: data.session ? 'signed_in' : 'confirm_email',
    })
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Sessao Google nao encontrada. Continue com Google novamente.' },
      { status: 401 }
    )
  }

  try {
    await syncStudentProfile(buildProfilePayload(payload, user.id, user.email ?? payload.email))
  } catch (profileError) {
    const message =
      profileError instanceof Error
        ? profileError.message
        : 'Nao foi possivel salvar o perfil do aluno.'

    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, nextStep: 'signed_in' })
}

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { syncInstructorProfile } from '@/lib/instructors/profile'
import type { CNHCategory, DocumentType, PixKeyType } from '@/types'

type InstructorSignupPayload = {
  fullName: string
  email: string
  password: string
  cpf: string
  birthDate: string
  phone: string
  bio: string
  hourlyRate: number | null
  experienceYears: number | null
  category: CNHCategory | null
  cnhNumber: string
  cnhExpiresAt: string
  detranCredentialNumber: string
  detranCredentialExpiresAt: string
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  latitude: number | null
  longitude: number | null
  serviceRadiusKm: number
  pixKeyType: PixKeyType | null
  pixKey: string | null
}

const DOCUMENT_FIELDS: Array<{ field: string; type: DocumentType }> = [
  { field: 'cnhDocument', type: 'cnh' },
  { field: 'credentialDocument', type: 'detran_credential' },
]

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return null
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function validatePayload(payload: InstructorSignupPayload) {
  const birthDate = new Date(payload.birthDate)
  const age = Number.isNaN(birthDate.getTime())
    ? 0
    : new Date().getFullYear() -
      birthDate.getFullYear() -
      (new Date().toISOString().slice(5, 10) < payload.birthDate.slice(5, 10) ? 1 : 0)

  if (!payload.fullName.trim()) return 'Nome completo e obrigatorio.'
  if (!payload.email.trim()) return 'E-mail e obrigatorio.'
  if (!payload.password || payload.password.length < 8) return 'A senha deve ter no minimo 8 caracteres.'
  if (!payload.cpf.trim()) return 'CPF e obrigatorio.'
  if (!payload.birthDate) return 'Data de nascimento e obrigatoria.'
  if (age < 21) return 'O instrutor precisa ter pelo menos 21 anos.'
  if (!payload.phone.trim()) return 'Telefone e obrigatorio.'
  if (!payload.cnhNumber.trim()) return 'Numero da CNH e obrigatorio.'
  if (!payload.cnhExpiresAt) return 'Validade da CNH e obrigatoria.'
  if (!payload.detranCredentialNumber.trim()) return 'Numero do registro DETRAN e obrigatorio.'
  if (!payload.detranCredentialExpiresAt) return 'Validade da credencial DETRAN e obrigatoria.'
  if (!payload.cep.trim()) return 'CEP e obrigatorio.'
  if (!payload.street.trim()) return 'Logradouro e obrigatorio.'
  if (!payload.number.trim()) return 'Numero do endereco e obrigatorio.'
  if (!payload.neighborhood.trim()) return 'Bairro e obrigatorio.'
  if (!payload.city.trim()) return 'Cidade e obrigatoria.'
  if (!payload.state.trim()) return 'Estado e obrigatorio.'
  if (!payload.serviceRadiusKm || payload.serviceRadiusKm <= 0) return 'Informe um raio de atendimento valido.'

  return null
}

function normalizePayload(payload: InstructorSignupPayload) {
  return {
    ...payload,
    email: payload.email.trim().toLowerCase(),
    fullName: payload.fullName.trim(),
    cpf: payload.cpf.replace(/\D/g, ''),
    phone: payload.phone.replace(/\D/g, ''),
    cep: payload.cep.replace(/\D/g, ''),
    cnhNumber: payload.cnhNumber.trim(),
    detranCredentialNumber: payload.detranCredentialNumber.trim(),
    street: payload.street.trim(),
    number: payload.number.trim(),
    neighborhood: payload.neighborhood.trim(),
    city: payload.city.trim(),
    state: payload.state.trim().toUpperCase(),
    bio: payload.bio.trim(),
    pixKey: payload.pixKey?.trim() || null,
  }
}

function getExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()

  if (fromName) {
    return fromName
  }

  if (file.type === 'application/pdf') {
    return 'pdf'
  }

  if (file.type === 'image/png') {
    return 'png'
  }

  return 'jpg'
}

async function uploadFile(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  path: string,
  file: File
) {
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = Buffer.from(arrayBuffer)

  const { error } = await admin.storage.from('instructor-assets').upload(path, fileBuffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  })

  if (error) {
    throw new Error(error.message)
  }

  const {
    data: { publicUrl },
  } = admin.storage.from('instructor-assets').getPublicUrl(path)

  return publicUrl
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const rawPayload = formData.get('payload')

  if (typeof rawPayload !== 'string') {
    return NextResponse.json({ error: 'Payload do cadastro nao enviado.' }, { status: 400 })
  }

  let parsedPayload: InstructorSignupPayload

  try {
    parsedPayload = JSON.parse(rawPayload) as InstructorSignupPayload
  } catch {
    return NextResponse.json({ error: 'Payload do cadastro invalido.' }, { status: 400 })
  }

  const validationError = validatePayload(parsedPayload)

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const photo = formData.get('photo')

  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: 'A foto de perfil e obrigatoria.' }, { status: 400 })
  }

  for (const documentField of DOCUMENT_FIELDS) {
    const file = formData.get(documentField.field)

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: `O documento ${documentField.type} e obrigatorio.` },
        { status: 400 }
      )
    }
  }

  const payload = normalizePayload(parsedPayload)
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

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/confirmacao-email?role=instructor`,
      data: {
        role: 'instructor',
        full_name: payload.fullName,
        cpf: payload.cpf,
      },
    },
  })

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? 'Nao foi possivel criar a conta do instrutor.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  if (!admin) {
    return NextResponse.json({ error: 'Supabase service role nao configurada.' }, { status: 500 })
  }

  const user = data.user

  try {
    const safeCpf = payload.cpf.replace(/\D/g, '')
    const photoPath = `profiles/${user.id}/photo.${getExtension(photo)}`
    const photoUrl = await uploadFile(admin, photoPath, photo)

    const documentUploads = await Promise.all(
      DOCUMENT_FIELDS.map(async ({ field, type }) => {
        const file = formData.get(field)

        if (!(file instanceof File)) {
          throw new Error(`Documento ${type} nao enviado.`)
        }

        const filePath = `documents/${user.id}/${type}.${getExtension(file)}`
        const fileUrl = await uploadFile(admin, filePath, file)

        return { type, fileUrl }
      })
    )

    await syncInstructorProfile(
      {
        userId: user.id,
        email: payload.email,
        fullName: payload.fullName,
        cpf: safeCpf,
        birthDate: payload.birthDate,
        phone: payload.phone,
        photoUrl,
        bio: payload.bio,
        hourlyRate: payload.hourlyRate ?? null,
        experienceYears: payload.experienceYears,
        category: payload.category ?? null,
        cnhNumber: payload.cnhNumber,
        cnhExpiresAt: payload.cnhExpiresAt,
        detranCredentialNumber: payload.detranCredentialNumber,
        detranCredentialExpiresAt: payload.detranCredentialExpiresAt,
        cep: payload.cep,
        street: payload.street,
        number: payload.number,
        neighborhood: payload.neighborhood,
        city: payload.city,
        state: payload.state,
        latitude: payload.latitude,
        longitude: payload.longitude,
        serviceRadiusKm: payload.serviceRadiusKm,
        pixKeyType: payload.pixKeyType,
        pixKey: payload.pixKey,
      },
      documentUploads
    )
  } catch (profileError) {
    return NextResponse.json(
      {
        error:
          profileError instanceof Error
            ? profileError.message
            : 'Nao foi possivel salvar o cadastro do instrutor.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    nextStep: data.session ? 'signed_in' : 'confirm_email',
    status: 'pending',
  })
}

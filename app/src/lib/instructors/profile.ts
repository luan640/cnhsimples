import { createClient } from '@supabase/supabase-js'

import type { CNHCategory, DocumentType } from '@/types'

type InstructorSignupPayload = {
  userId: string
  email: string
  fullName: string
  cpf: string
  birthDate: string
  phone: string
  photoUrl: string
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
  pixKeyType: string | null
  pixKey: string | null
}

type InstructorDocumentPayload = {
  type: DocumentType
  fileUrl: string
}

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

function buildMetadata(payload: InstructorSignupPayload) {
  return {
    role: 'instructor',
    full_name: payload.fullName,
    cpf: payload.cpf,
    birth_date: payload.birthDate,
    phone: payload.phone,
    photo_url: payload.photoUrl || null,
    bio: payload.bio || null,
    hourly_rate: payload.hourlyRate,
    experience_years: payload.experienceYears,
    category: payload.category,
    cnh_number: payload.cnhNumber,
    cnh_expires_at: payload.cnhExpiresAt,
    detran_credential_number: payload.detranCredentialNumber,
    detran_credential_expires_at: payload.detranCredentialExpiresAt,
    cep: payload.cep,
    street: payload.street,
    number: payload.number,
    neighborhood: payload.neighborhood,
    city: payload.city,
    state: payload.state,
    latitude: payload.latitude,
    longitude: payload.longitude,
    service_radius_km: payload.serviceRadiusKm,
    pix_key_type: payload.pixKeyType,
    pix_key: payload.pixKey,
    status: 'pending',
  }
}

function buildProfilePayload(payload: InstructorSignupPayload) {
  return {
    user_id: payload.userId,
    full_name: payload.fullName,
    cpf: payload.cpf,
    birth_date: payload.birthDate,
    phone: payload.phone,
    photo_url: payload.photoUrl || null,
    bio: payload.bio || null,
    hourly_rate: payload.hourlyRate,
    experience_years: payload.experienceYears,
    category: payload.category,
    cnh_number: payload.cnhNumber,
    cnh_expires_at: payload.cnhExpiresAt,
    detran_credential_number: payload.detranCredentialNumber,
    detran_credential_expires_at: payload.detranCredentialExpiresAt,
    cep: payload.cep,
    street: payload.street,
    number: payload.number,
    neighborhood: payload.neighborhood,
    city: payload.city,
    state: payload.state,
    latitude: payload.latitude,
    longitude: payload.longitude,
    service_radius_km: payload.serviceRadiusKm,
    pix_key_type: payload.pixKeyType,
    pix_key: payload.pixKey,
    status: 'pending',
  }
}

export async function syncInstructorProfile(
  payload: InstructorSignupPayload,
  documents: InstructorDocumentPayload[]
) {
  const admin = createAdminClient()

  if (!admin) {
    throw new Error('Supabase service role nao configurada.')
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(payload.userId, {
    user_metadata: buildMetadata(payload),
  })

  if (updateError) {
    throw new Error(updateError.message)
  }

  const { data: profile, error: profileError } = await admin
    .from('instructor_profiles')
    .upsert(buildProfilePayload(payload), { onConflict: 'user_id' })
    .select('id')
    .single()

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? 'Nao foi possivel salvar o perfil do instrutor.')
  }

  const rows = documents.map((document) => ({
    instructor_id: profile.id,
    type: document.type,
    file_url: document.fileUrl,
  }))

  const { error: documentsError } = await admin
    .from('instructor_documents')
    .upsert(rows, { onConflict: 'instructor_id,type' })

  if (documentsError) {
    throw new Error(documentsError.message)
  }

  return { instructorProfileId: profile.id }
}

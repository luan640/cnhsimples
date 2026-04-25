'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createStorageSupabaseClient } from '@supabase/supabase-js'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function createStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase service role nao configurada.')
  }

  return createStorageSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function getCurrentInstructorContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuario nao autenticado.')
  }

  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('instructor_profiles')
    .select('user_id, photo_url, cnh_number, detran_credential_number, accepts_highway, accepts_night_driving, accepts_parking_practice, student_chooses_destination, booking_lead_time_hours')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !profile) {
    throw new Error(error?.message ?? 'Perfil do instrutor nao encontrado.')
  }

  return { user, profile, admin }
}

function getExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()

  if (fromName) return fromName
  if (file.type === 'image/png') return 'png'
  return 'jpg'
}

async function uploadAvatar(userId: string, file: File) {
  const storage = createStorageClient()
  const path = `profiles/${userId}/photo.${getExtension(file)}`
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = Buffer.from(arrayBuffer)

  const { error } = await storage.storage.from('instructor-assets').upload(path, fileBuffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  })

  if (error) {
    throw new Error(error.message)
  }

  const {
    data: { publicUrl },
  } = storage.storage.from('instructor-assets').getPublicUrl(path)

  return publicUrl
}

function revalidateInstructorProfilePaths() {
  revalidatePath('/perfil/instrutor')
  revalidatePath('/perfil/instrutor/editar')
  revalidatePath('/perfil/instrutor/senha')
  revalidatePath('/perfil/instrutor/documentos')
  revalidatePath('/perfil/instrutor/localizacao')
  revalidatePath('/painel')
}

export async function updateInstructorGeneralAction(formData: FormData) {
  try {
    const { user, profile, admin } = await getCurrentInstructorContext()

    const fullName = String(formData.get('fullName') ?? '').trim()
    const bio = String(formData.get('bio') ?? '').trim()
    const experienceYearsRaw = String(formData.get('experienceYears') ?? '').trim()

    if (!fullName) {
      return { ok: false, error: 'Nome completo e obrigatorio.' }
    }

    const experienceYears = experienceYearsRaw ? Number(experienceYearsRaw) : null

    if (
      experienceYearsRaw &&
      (experienceYears === null || !Number.isFinite(experienceYears) || experienceYears < 0)
    ) {
      return { ok: false, error: 'Anos de experiencia invalido.' }
    }

    let photoUrl = profile.photo_url ?? null
    const photo = formData.get('photo')

    if (photo instanceof File && photo.size > 0) {
      photoUrl = await uploadAvatar(user.id, photo)
    }

    const { error: dbError } = await admin
      .from('instructor_profiles')
      .update({
        full_name: fullName,
        bio: bio || null,
        experience_years: experienceYears,
        photo_url: photoUrl,
      })
      .eq('user_id', user.id)

    if (dbError) {
      return { ok: false, error: dbError.message }
    }

    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: fullName,
        bio: bio || null,
        experience_years: experienceYears,
        photo_url: photoUrl,
      },
    })

    if (authError) {
      return { ok: false, error: authError.message }
    }

    revalidateInstructorProfilePaths()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao atualizar perfil.' }
  }
}

export async function updateInstructorDocumentsAction(_formData: FormData) {
  return { ok: false, error: 'Dados cadastrais nao podem ser alterados pelo perfil.' }
}

export async function updateInstructorLocationAction(formData: FormData) {
  try {
    const { user, admin } = await getCurrentInstructorContext()

    const phone = String(formData.get('phone') ?? '').replace(/\D/g, '')
    const cep = String(formData.get('cep') ?? '').replace(/\D/g, '')
    const street = String(formData.get('street') ?? '').trim()
    const number = String(formData.get('number') ?? '').trim()
    const neighborhood = String(formData.get('neighborhood') ?? '').trim()
    const city = String(formData.get('city') ?? '').trim()
    const state = String(formData.get('state') ?? '').trim().toUpperCase()
    const latitudeRaw = String(formData.get('latitude') ?? '').trim()
    const longitudeRaw = String(formData.get('longitude') ?? '').trim()
    const serviceRadiusKmRaw = String(formData.get('serviceRadiusKm') ?? '').trim()

    if (!phone || phone.length < 10) {
      return { ok: false, error: 'Telefone invalido.' }
    }

    if (!cep || cep.length !== 8 || !street || !number || !neighborhood || !city || !state) {
      return { ok: false, error: 'Preencha todos os campos obrigatorios de localizacao.' }
    }

    const serviceRadiusKm = Number(serviceRadiusKmRaw)
    const latitude = latitudeRaw ? Number(latitudeRaw) : null
    const longitude = longitudeRaw ? Number(longitudeRaw) : null

    if (!Number.isFinite(serviceRadiusKm) || serviceRadiusKm <= 0) {
      return { ok: false, error: 'Informe um raio de atendimento valido.' }
    }

    const { error: dbError } = await admin
      .from('instructor_profiles')
      .update({
        phone,
        cep,
        street,
        number,
        neighborhood,
        city,
        state,
        latitude: latitude !== null && Number.isFinite(latitude) ? latitude : null,
        longitude: longitude !== null && Number.isFinite(longitude) ? longitude : null,
        service_radius_km: serviceRadiusKm,
      })
      .eq('user_id', user.id)

    if (dbError) {
      return { ok: false, error: dbError.message }
    }

    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        phone,
        cep,
        street,
        number,
        neighborhood,
        city,
        state,
        latitude: latitude !== null && Number.isFinite(latitude) ? latitude : null,
        longitude: longitude !== null && Number.isFinite(longitude) ? longitude : null,
        service_radius_km: serviceRadiusKm,
      },
    })

    if (authError) {
      return { ok: false, error: authError.message }
    }

    revalidateInstructorProfilePaths()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao atualizar localizacao.' }
  }
}

export async function updateInstructorPreferencesAction(formData: FormData) {
  try {
    const { user, admin } = await getCurrentInstructorContext()

    const acceptsHighway = formData.get('acceptsHighway') === 'true'
    const acceptsNightDriving = formData.get('acceptsNightDriving') === 'true'
    const acceptsParkingPractice = formData.get('acceptsParkingPractice') === 'true'
    const studentChoosesDestination = formData.get('studentChoosesDestination') === 'true'
    const leadTimeRaw = String(
      formData.get('bookingLeadTimeHours') ?? formData.get('booking_lead_time_hours') ?? ''
    ).trim()
    const parsedLeadTime = Number(leadTimeRaw)
    const bookingLeadTimeHours =
      leadTimeRaw.length > 0 && Number.isFinite(parsedLeadTime)
        ? Math.min(24, Math.max(0, Math.round(parsedLeadTime)))
        : 2

    const { error: dbError } = await admin
      .from('instructor_profiles')
      .update({
        accepts_highway: acceptsHighway,
        accepts_night_driving: acceptsNightDriving,
        accepts_parking_practice: acceptsParkingPractice,
        student_chooses_destination: studentChoosesDestination,
        booking_lead_time_hours: bookingLeadTimeHours,
      })
      .eq('user_id', user.id)

    if (dbError) {
      return { ok: false, error: dbError.message }
    }

    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        accepts_highway: acceptsHighway,
        accepts_night_driving: acceptsNightDriving,
        accepts_parking_practice: acceptsParkingPractice,
        student_chooses_destination: studentChoosesDestination,
        booking_lead_time_hours: bookingLeadTimeHours,
      },
    })

    if (authError) {
      return { ok: false, error: authError.message }
    }

    revalidateInstructorProfilePaths()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao atualizar preferencias.' }
  }
}

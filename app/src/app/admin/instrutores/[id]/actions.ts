'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendInstructorActivatedEmail,
  sendInstructorDocsApprovedEmail,
} from '@/lib/email/notifications'

async function mergeUserMetadata(userId: string, patch: Record<string, unknown>) {
  const admin = createAdminClient()
  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const currentMetadata =
    authUser.user?.user_metadata && typeof authUser.user.user_metadata === 'object'
      ? authUser.user.user_metadata
      : {}

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...currentMetadata,
      ...patch,
    },
  })
}

export async function approveInstructorDocs(instructorId: string, userId: string) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('instructor_profiles')
    .update({ status: 'docs_approved' })
    .eq('id', instructorId)

  if (error) throw new Error(error.message)

  await mergeUserMetadata(userId, { status: 'docs_approved' })

  try {
    const { data: authUser } = await admin.auth.admin.getUserById(userId)
    const email = authUser.user?.email
    const name = authUser.user?.user_metadata?.full_name ?? authUser.user?.email ?? 'instrutor'

    if (email) {
      await sendInstructorDocsApprovedEmail({
        to: email,
        name,
      })
    }
  } catch (error) {
    console.error('[email] Falha ao enviar aprovacao documental:', error)
  }

  revalidatePath(`/admin/instrutores/${instructorId}`)
  revalidatePath('/admin/instrutores')
  revalidatePath('/admin')
}

export async function rejectInstructorDocs(
  instructorId: string,
  userId: string,
  reason: string,
) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('instructor_profiles')
    .update({ status: 'docs_rejected', rejection_reason: reason })
    .eq('id', instructorId)

  if (error) throw new Error(error.message)

  await mergeUserMetadata(userId, {
    status: 'docs_rejected',
    rejection_reason: reason,
  })

  revalidatePath(`/admin/instrutores/${instructorId}`)
  revalidatePath('/admin/instrutores')
  revalidatePath('/admin')
}

export async function activateInstructor(instructorId: string, userId: string) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('instructor_profiles')
    .update({ status: 'active' })
    .eq('id', instructorId)

  if (error) throw new Error(error.message)

  await mergeUserMetadata(userId, { status: 'active' })

  try {
    const { data: authUser } = await admin.auth.admin.getUserById(userId)
    const email = authUser.user?.email
    const name = authUser.user?.user_metadata?.full_name ?? authUser.user?.email ?? 'instrutor'

    if (email) {
      await sendInstructorActivatedEmail({
        to: email,
        name,
      })
    }
  } catch (error) {
    console.error('[email] Falha ao enviar ativacao do cadastro:', error)
  }

  revalidatePath(`/admin/instrutores/${instructorId}`)
  revalidatePath('/admin/instrutores')
  revalidatePath('/admin')
}

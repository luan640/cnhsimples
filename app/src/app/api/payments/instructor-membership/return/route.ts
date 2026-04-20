import { NextRequest, NextResponse } from 'next/server'

import { getInstructorProfile } from '@/lib/instructors/dashboard'
import {
  syncInstructorSubscriptionPreApproval,
  syncInstructorSubscriptionPreApprovalForInstructor,
} from '@/lib/instructors/subscriptions'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const preApprovalId = searchParams.get('preapproval_id') ?? searchParams.get('id')
  const collectionStatus = searchParams.get('status')
  const subscriptionId = searchParams.get('subscription_id')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin

  if (!preApprovalId) {
    return NextResponse.redirect(`${appUrl}/painel?mensalidade=${collectionStatus ?? 'pending'}`)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let subscription = null

    if (user) {
      const profile = await getInstructorProfile(user.id)

      if (profile) {
        subscription = await syncInstructorSubscriptionPreApprovalForInstructor(
          profile.id,
          preApprovalId,
          subscriptionId
        )
      }
    }

    if (!subscription) {
      subscription = await syncInstructorSubscriptionPreApproval(preApprovalId)
    }

    const state = subscription?.status === 'approved' ? 'success' : subscription?.status ?? 'pending'
    return NextResponse.redirect(`${appUrl}/painel?mensalidade=${state}`)
  } catch (error) {
    console.error('[mercadopago] return sync failed:', error)
    return NextResponse.redirect(`${appUrl}/painel?mensalidade=error`)
  }
}

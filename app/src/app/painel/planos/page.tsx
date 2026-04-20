import { redirect } from 'next/navigation'

import {
  CreditCard,
  ShieldCheck,
} from 'lucide-react'

import { CancelMembershipButton } from '@/components/painel/CancelMembershipButton'
import { MembershipPaymentButton } from '@/components/painel/MembershipPaymentButton'
import { getInstructorProfile, resolveInstructorStatus } from '@/lib/instructors/dashboard'
import {
  getLatestInstructorSubscription,
  syncLatestInstructorPlanSubscriptionByEmail,
} from '@/lib/instructors/subscriptions'
import { getInstructorMembershipAmount } from '@/lib/instructors/subscription-shared'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PlanosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (user.user_metadata?.role && user.user_metadata.role !== 'instructor') {
    redirect('/buscar')
  }

  const profile = await getInstructorProfile(user.id)
  const metaStatus = user.user_metadata?.status ?? 'pending'
  const status = resolveInstructorStatus(profile?.status, metaStatus)

  if (!profile || status !== 'active') {
    redirect('/painel')
  }

  let membership = await getLatestInstructorSubscription(profile.id)

  if (user.email && membership?.status === 'pending') {
    try {
      const syncedMembership = await syncLatestInstructorPlanSubscriptionByEmail(profile.id, user.email)
      if (syncedMembership) {
        membership = syncedMembership
      }
    } catch (error) {
      console.error('[planos] failed to sync latest plan subscription:', error)
    }
  }

  const membershipAmount = getInstructorMembershipAmount()
  const membershipStatusLabel =
    membership?.status === 'approved'
      ? 'Plano ativo'
      : membership?.status === 'pending'
        ? 'Pagamento pendente'
        : membership?.status === 'cancelled'
          ? 'Plano cancelado'
          : membership?.status === 'expired'
            ? 'Plano expirado'
            : 'Plano indisponivel'
  const membershipExpiresAt = membership?.expires_at
    ? new Date(membership.expires_at).toLocaleDateString('pt-BR')
    : null

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <div className="mb-7">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
          Plano
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
          Gerencie a mensalidade da plataforma em um lugar separado do painel principal.
        </p>
      </div>

      <div
        className="bg-white rounded-[12px] border border-[#E2E8F0] p-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: membership?.status === 'approved' ? '#ECFDF5' : '#EFF6FF' }}
          >
            {membership?.status === 'approved' ? (
              <ShieldCheck size={20} style={{ color: '#059669' }} />
            ) : (
              <CreditCard size={20} style={{ color: '#0284C7' }} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
              Mensalidade do instrutor
            </p>
            <p className="text-sm" style={{ color: '#64748B' }}>
              {membershipStatusLabel}
              {membershipExpiresAt ? ` - vence em ${membershipExpiresAt}` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="rounded-[10px] border border-[#E2E8F0] p-4">
            <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Valor</p>
            <p className="text-base font-semibold" style={{ color: '#0F172A' }}>
              R$ {membershipAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-[10px] border border-[#E2E8F0] p-4">
            <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Status</p>
            <p className="text-base font-semibold" style={{ color: '#0F172A' }}>
              {membershipStatusLabel}
            </p>
          </div>
          <div className="rounded-[10px] border border-[#E2E8F0] p-4">
            <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Proxima vigencia</p>
            <p className="text-base font-semibold" style={{ color: '#0F172A' }}>
              {membershipExpiresAt ?? 'Sem data registrada'}
            </p>
          </div>
        </div>

        {membership?.status === 'approved' ? (
          <div className="flex flex-col gap-3">
            <div
              className="rounded-[10px] p-4 text-sm"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B' }}
            >
              <p className="font-medium mb-2" style={{ color: '#0F172A' }}>
                Seu plano ja esta ativo
              </p>
              <p>
                O cancelamento interrompe a renovacao recorrente da assinatura atual no Mercado Pago.
              </p>
            </div>
            <CancelMembershipButton />
          </div>
        ) : (
          <div>
            <MembershipPaymentButton
              amount={membershipAmount}
              label={membership?.status === 'pending' ? 'Continuar pagamento da mensalidade' : undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}

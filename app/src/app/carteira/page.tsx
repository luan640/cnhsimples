export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import {
  getInstructorWallet,
  getWalletTransactions,
  getWithdrawalRequests,
  getInstructorPixInfo,
} from '@/lib/instructors/wallet'
import { SolicitarSaqueModal } from '@/components/carteira/SolicitarSaqueModal'
import { CadastrarPixCard } from '@/components/carteira/CadastrarPixCard'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const WITHDRAWAL_STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:  { label: 'Pendente',  color: '#D97706', bg: '#FFFBEB', icon: Clock },
  approved: { label: 'Aprovado',  color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
}

const PIX_LABEL: Record<string, string> = {
  cpf: 'CPF',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave aleatória',
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function CarteiraPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const fromOnboarding = params.from === 'onboarding'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorProfile(user.id)
  if (!profile) redirect('/painel')

  const [wallet, transactions, withdrawals, pixInfo] = await Promise.all([
    getInstructorWallet(profile.id),
    getWalletTransactions(profile.id),
    getWithdrawalRequests(profile.id),
    getInstructorPixInfo(profile.id),
  ])

  const hasPendingWithdrawal = withdrawals.some((w) => w.status === 'pending')
  const hasPixKey = Boolean(pixInfo.pix_key?.trim() && pixInfo.pix_key_type?.trim())

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: '#ECFDF5' }}
        >
          <Wallet size={18} style={{ color: '#3ECF8E' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Carteira</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Seu saldo e histórico de movimentações</p>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Saldo disponível */}
        <div
          className="rounded-[12px] border p-5 flex flex-col gap-3"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: '#3ECF8E' }} />
            <p className="text-sm font-medium" style={{ color: '#64748B' }}>Saldo disponível</p>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#0F172A' }}>
            {fmt(wallet.balance)}
          </p>
          <p className="text-xs" style={{ color: '#94A3B8' }}>
            Disponível para saque imediato
          </p>
          <div className="mt-1">
            {hasPendingWithdrawal ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9999px] text-xs font-medium"
                style={{ background: '#FFFBEB', color: '#D97706' }}
              >
                <Clock size={12} />
                Saque pendente em análise
              </div>
            ) : !hasPixKey ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9999px] text-xs font-medium"
                style={{ background: '#FEF2F2', color: '#B91C1C' }}
              >
                Cadastre uma chave PIX para solicitar saque
              </div>
            ) : (
              <SolicitarSaqueModal
                balance={wallet.balance}
                defaultPixKey={pixInfo.pix_key}
                defaultPixKeyType={pixInfo.pix_key_type}
              />
            )}
          </div>
        </div>

        {/* Aguardando confirmação MP */}
        <div
          className="rounded-[12px] border p-5 flex flex-col gap-3"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: '#F97316' }} />
            <p className="text-sm font-medium" style={{ color: '#64748B' }}>Aguardando confirmação</p>
          </div>
          <p className="text-3xl font-bold" style={{ color: wallet.pendingAmount > 0 ? '#F97316' : '#0F172A' }}>
            {fmt(wallet.pendingAmount)}
          </p>
          <p className="text-xs" style={{ color: '#94A3B8' }}>
            Pagamentos aguardando confirmação do Mercado Pago
          </p>
          <div className="mt-1">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9999px] text-xs"
              style={{ background: '#FFF7ED', color: '#C2410C' }}
            >
              <Banknote size={12} />
              {wallet.pendingAmount > 0
                ? 'Será creditado após confirmação do MP'
                : 'Nenhum pagamento pendente'}
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-[12px] border px-4 py-3 text-sm"
        style={{ background: '#FFF7ED', borderColor: '#FDBA74', color: '#9A3412' }}
      >
        <span className="font-semibold">Atenção:</span> a solicitação de saque irá demorar até 2 dias úteis para ser creditada em sua conta.
      </div>

      {!hasPixKey ? <CadastrarPixCard fromOnboarding={fromOnboarding} /> : null}

      {/* Saques */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>
          Histórico de saques
        </h2>

        {withdrawals.length === 0 ? (
          <div
            className="rounded-[12px] border p-8 text-center"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            <Banknote size={32} className="mx-auto mb-2" style={{ color: '#CBD5E1' }} />
            <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma solicitação de saque ainda</p>
          </div>
        ) : (
          <div
            className="rounded-[12px] border overflow-hidden"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            {withdrawals.map((w, i) => {
              const st = WITHDRAWAL_STATUS[w.status] ?? WITHDRAWAL_STATUS.pending
              const StatusIcon = st.icon
              return (
                <div
                  key={w.id}
                  className="px-4 py-3.5 flex items-start gap-3"
                  style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: st.bg }}
                  >
                    <StatusIcon size={15} style={{ color: st.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: '#0F172A' }}>
                        {fmt(w.amount)}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      Chave {PIX_LABEL[w.pix_key_type] ?? w.pix_key_type}:{' '}
                      <span className="font-mono">{w.pix_key}</span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                      Solicitado em {fmtDate(w.created_at)}
                      {w.processed_at && ` · Processado em ${fmtDate(w.processed_at)}`}
                    </p>
                    {w.admin_note && (
                      <p
                        className="text-xs mt-1 px-2 py-1 rounded-[6px]"
                        style={{ background: '#FEF2F2', color: '#DC2626' }}
                      >
                        {w.admin_note}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Transações */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>
          Histórico da carteira
        </h2>

        {transactions.length === 0 ? (
          <div
            className="rounded-[12px] border p-8 text-center"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            <Wallet size={32} className="mx-auto mb-2" style={{ color: '#CBD5E1' }} />
            <p className="text-sm" style={{ color: '#94A3B8' }}>Nenhuma movimentação ainda</p>
          </div>
        ) : (
          <div
            className="rounded-[12px] border overflow-hidden"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                className="px-4 py-3.5 flex items-center gap-3"
                style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: tx.type === 'credit' ? '#F0FDF4' : '#FEF2F2',
                  }}
                >
                  {tx.type === 'credit' ? (
                    <ArrowDownLeft size={15} style={{ color: '#16A34A' }} />
                  ) : (
                    <ArrowUpRight size={15} style={{ color: '#DC2626' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#0F172A' }}>
                    {tx.description}
                  </p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    {fmtDate(tx.created_at)}
                  </p>
                </div>
                <p
                  className="text-sm font-semibold shrink-0"
                  style={{ color: tx.type === 'credit' ? '#16A34A' : '#DC2626' }}
                >
                  {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}



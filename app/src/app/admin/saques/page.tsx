import Link from 'next/link'
import { listWithdrawals } from '@/lib/admin/queries'
import { WithdrawalRowActions } from '@/components/admin/WithdrawalRow'
import { Banknote } from 'lucide-react'

const TABS = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Aprovados', value: 'approved' },
  { label: 'Rejeitados', value: 'rejected' },
]

export default async function AdminSaquesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = 'all' } = await searchParams
  const withdrawals = await listWithdrawals(status === 'all' ? undefined : status)

  const totalPending = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Banknote size={20} style={{ color: '#3ECF8E' }} />
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Saques</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Gerenciar solicitações de saque</p>
        </div>
      </div>

      {totalPending > 0 && (
        <div
          className="rounded-[12px] border p-4 flex items-center gap-3"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
        >
          <Banknote size={18} style={{ color: '#D97706' }} />
          <p className="text-sm" style={{ color: '#92400E' }}>
            Total a transferir (pendentes):{' '}
            <strong>{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(tab => (
          <Link
            key={tab.value}
            href={`/admin/saques?status=${tab.value}`}
            className="px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors"
            style={{
              background: status === tab.value ? '#1c1c1c' : '#F1F5F9',
              color: status === tab.value ? '#fff' : '#64748B',
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {withdrawals.length === 0 ? (
        <div
          className="rounded-[12px] border p-12 text-center"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <Banknote size={36} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
          <p className="font-medium" style={{ color: '#0F172A' }}>Nenhum saque encontrado</p>
        </div>
      ) : (
        <div
          className="rounded-[12px] border overflow-hidden"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Instrutor</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: '#64748B' }}>Chave PIX</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Valor</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell" style={{ color: '#64748B' }}>Solicitado em</th>
                <th className="px-4 py-3 font-semibold text-right" style={{ color: '#64748B' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w, i) => (
                <tr
                  key={w.id}
                  style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#0F172A' }}>
                    {w.instructor_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell" style={{ color: '#64748B' }}>
                    <span className="font-mono text-xs">{w.pix_key}</span>
                    <span className="ml-1 text-xs" style={{ color: '#94A3B8' }}>({w.pix_key_type})</span>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#0F172A' }}>
                    {w.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm" style={{ color: '#94A3B8' }}>
                    {new Date(w.created_at).toLocaleDateString('pt-BR')}
                    {w.admin_note && (
                      <p className="text-xs mt-0.5" style={{ color: '#EF4444' }}>{w.admin_note}</p>
                    )}
                  </td>
                  <WithdrawalRowActions withdrawal={w} index={i} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

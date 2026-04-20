import Link from 'next/link'
import { getAdminStats, listInstructors, listWithdrawals } from '@/lib/admin/queries'
import { Users, Banknote, CheckCircle2, Clock, LayoutDashboard } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div
      className="rounded-[12px] border p-5 flex items-center gap-4"
      style={{ background: '#fff', borderColor: '#E2E8F0' }}
    >
      <div
        className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: '#0F172A' }}>{value}</p>
        <p className="text-sm" style={{ color: '#64748B' }}>{label}</p>
      </div>
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  docs_rejected: 'Doc. Rejeitados',
  docs_approved: 'Doc. Aprovados',
  active: 'Ativo',
  inactive: 'Inativo',
  suspended: 'Suspenso',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  docs_rejected: '#EF4444',
  docs_approved: '#3B82F6',
  active: '#3ECF8E',
  inactive: '#94A3B8',
  suspended: '#F97316',
}

export default async function AdminDashboard() {
  const [stats, pendingInstructors, pendingWithdrawals] = await Promise.all([
    getAdminStats(),
    listInstructors('pending'),
    listWithdrawals('pending'),
  ])

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard size={20} style={{ color: '#3ECF8E' }} />
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Visão Geral</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Resumo da plataforma</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aguardando análise" value={stats.pendingInstructors} icon={Clock} color="#F59E0B" />
        <StatCard label="Instrutores ativos" value={stats.activeInstructors} icon={CheckCircle2} color="#3ECF8E" />
        <StatCard label="Saques pendentes" value={stats.pendingWithdrawals} icon={Banknote} color="#F97316" />
        <StatCard label="Total de alunos" value={stats.totalStudents} icon={Users} color="#3B82F6" />
      </div>

      {/* Pending Instructors */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>
            Instrutores aguardando análise
          </h2>
          <Link href="/admin/instrutores" className="text-sm font-medium" style={{ color: '#3ECF8E' }}>
            Ver todos →
          </Link>
        </div>

        {pendingInstructors.length === 0 ? (
          <div
            className="rounded-[12px] border p-8 text-center"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: '#3ECF8E' }} />
            <p className="text-sm font-medium" style={{ color: '#0F172A' }}>Tudo em dia!</p>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Nenhum instrutor aguardando análise.</p>
          </div>
        ) : (
          <div
            className="rounded-[12px] border overflow-hidden"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Nome</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: '#64748B' }}>Cidade</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: '#64748B' }}>Status</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell" style={{ color: '#64748B' }}>Cadastro</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pendingInstructors.map((inst, i) => (
                  <tr
                    key={inst.id}
                    style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: '#0F172A' }}>{inst.full_name}</td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: '#64748B' }}>
                      {inst.city ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: `${STATUS_COLOR[inst.status] ?? '#94A3B8'}18`,
                          color: STATUS_COLOR[inst.status] ?? '#94A3B8',
                        }}
                      >
                        {STATUS_LABEL[inst.status] ?? inst.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm" style={{ color: '#94A3B8' }}>
                      {new Date(inst.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/instrutores/${inst.id}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors"
                        style={{ background: '#F1F5F9', color: '#0F172A' }}
                      >
                        Analisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pending Withdrawals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>
            Saques pendentes
          </h2>
          <Link href="/admin/saques" className="text-sm font-medium" style={{ color: '#3ECF8E' }}>
            Ver todos →
          </Link>
        </div>

        {pendingWithdrawals.length === 0 ? (
          <div
            className="rounded-[12px] border p-8 text-center"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: '#3ECF8E' }} />
            <p className="text-sm font-medium" style={{ color: '#0F172A' }}>Nenhum saque pendente.</p>
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
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pendingWithdrawals.map((w, i) => (
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
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/admin/saques"
                        className="text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors"
                        style={{ background: '#F1F5F9', color: '#0F172A' }}
                      >
                        Processar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

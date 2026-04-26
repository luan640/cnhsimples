import Link from 'next/link'
import { listInstructors } from '@/lib/admin/queries'
import { Users, Eye, EyeOff } from 'lucide-react'

const TABS = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Doc. Rejeitados', value: 'docs_rejected' },
  { label: 'Doc. Aprovados', value: 'docs_approved' },
  { label: 'Ativos', value: 'active' },
  { label: 'Suspensos', value: 'suspended' },
]

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

export default async function AdminInstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = 'all' } = await searchParams
  const instructors = await listInstructors(status === 'all' ? undefined : status)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users size={20} style={{ color: '#3ECF8E' }} />
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Instrutores</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Gerenciar cadastros de instrutores</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(tab => (
          <Link
            key={tab.value}
            href={`/admin/instrutores?status=${tab.value}`}
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
      {instructors.length === 0 ? (
        <div
          className="rounded-[12px] border p-12 text-center"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <Users size={36} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
          <p className="font-medium" style={{ color: '#0F172A' }}>Nenhum instrutor encontrado</p>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Nenhum resultado para o filtro selecionado.</p>
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
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: '#64748B' }}>Categoria</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: '#64748B' }}>Cidade</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Status</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: '#64748B' }}>Busca</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell" style={{ color: '#64748B' }}>Cadastro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {instructors.map((inst, i) => (
                <tr
                  key={inst.id}
                  style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#0F172A' }}>{inst.full_name}</td>
                  <td className="px-4 py-3 hidden md:table-cell" style={{ color: '#64748B' }}>
                    {inst.category ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell" style={{ color: '#64748B' }}>
                    {inst.city ?? '—'}
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 hidden md:table-cell">
                    {inst.hidden_from_search ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: '#FEF3C7', color: '#92400E' }}
                      >
                        <EyeOff size={11} />
                        Oculto
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: '#F0FDF4', color: '#16A34A' }}
                      >
                        <Eye size={11} />
                        Visível
                      </span>
                    )}
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
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

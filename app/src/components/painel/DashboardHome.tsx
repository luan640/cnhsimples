'use client'

import {
  ArrowUpRight,
  BarChart2,
  BookOpen,
  CalendarCheck,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import {
  type InstructorSubscription,
} from '@/lib/instructors/subscription-shared'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { DashboardStats, InstructorProfile } from '@/lib/instructors/dashboard'

interface Props {
  profile: InstructorProfile
  stats: DashboardStats
  membership: InstructorSubscription | null
  membershipFlash?: string | null
}

type ChartTooltipProps = {
  active?: boolean
  payload?: Array<{ value: number | string }>
  label?: string
  prefix?: string
  suffix?: string
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  accent = '#3ECF8E',
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div
      className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 flex flex-col gap-3"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-[8px] flex items-center justify-center"
          style={{ background: `${accent}1A` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        <ArrowUpRight size={14} style={{ color: '#CBD5E1' }} />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums" style={{ color: '#0F172A' }}>
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
          {label}
        </p>
        {sub ? (
          <p className="text-[11px] mt-1" style={{ color: '#94A3B8' }}>
            {sub}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="px-3 py-2 rounded-[8px] text-xs"
      style={{ background: '#0F172A', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
    >
      <p className="font-medium mb-1">{label}</p>
      <p style={{ color: '#3ECF8E' }}>
        {prefix}
        {payload[0].value}
        {suffix}
      </p>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-[180px]">
      <BarChart2 size={28} style={{ color: '#CBD5E1' }} />
      <p className="text-xs text-center" style={{ color: '#94A3B8' }}>
        {message}
      </p>
    </div>
  )
}

export function DashboardHome({ profile, stats }: Props) {
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const firstName = profile.full_name.split(' ')[0]
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const proximaAula = stats.proximasAulas[0]

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto">
      <div className="mb-7">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
          {saudacao}, {firstName}
        </h1>
        <p className="text-sm capitalize mt-0.5" style={{ color: '#64748B' }}>
          {hoje}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <KPICard
          icon={BookOpen}
          label="Aulas hoje"
          value={String(stats.aulasHoje)}
          sub={proximaAula ? `proxima as ${proximaAula.hora}` : 'nenhuma agendada'}
          accent="#0284C7"
        />
        <KPICard
          icon={TrendingUp}
          label="Aulas no mes"
          value={String(stats.aulasMes)}
          sub="agendadas ou concluidas"
        />
        <KPICard
          icon={DollarSign}
          label="Receita do mes"
          value={
            stats.receitaMes > 0
              ? `R$ ${stats.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'R$ 0,00'
          }
          sub="sua parte (80%)"
          accent="#0284C7"
        />
        <KPICard
          icon={Wallet}
          label="Saldo disponivel"
          value={`R$ ${stats.saldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          sub="disponivel para saque"
        />
        <KPICard
          icon={Star}
          label="Avaliacao media"
          value={profile.rating > 0 ? profile.rating.toFixed(1) : '-'}
          sub={profile.rating > 0 ? 'media dos alunos' : 'ainda sem avaliacoes'}
          accent="#F59E0B"
        />
        <KPICard
          icon={Clock}
          label="Proxima aula"
          value={proximaAula?.hora ?? '-'}
          sub={proximaAula ? `Cat. ${proximaAula.categoria}` : 'nenhuma agendada'}
          accent="#F97316"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div
          className="bg-white rounded-[12px] border border-[#E2E8F0] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>
            Aulas - ultimos 7 dias
          </h2>
          {stats.aulasPorDia.length > 0 && stats.aulasPorDia.some((day) => day.aulas > 0) ? (
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.aulasPorDia} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip suffix=" aulas" />} />
                  <Line
                    type="monotone"
                    dataKey="aulas"
                    stroke="#0284C7"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#0284C7', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#0284C7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Nenhuma aula registrada nos ultimos 7 dias." />
          )}
        </div>

        <div
          className="bg-white rounded-[12px] border border-[#E2E8F0] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>
            Receita - ultimas 4 semanas
          </h2>
          {stats.receitaPorSemana.length > 0 && stats.receitaPorSemana.some((week) => week.valor > 0) ? (
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.receitaPorSemana} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="sem" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip prefix="R$ " />} />
                  <Bar dataKey="valor" fill="#3ECF8E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Nenhuma receita registrada nas ultimas semanas." />
          )}
        </div>
      </div>

      <div
        className="bg-white rounded-[12px] border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #F1F5F9' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>
            Proximas aulas
          </h2>
          <a
            href="/agenda"
            className="text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: '#3ECF8E' }}
          >
            Ver agenda completa -
          </a>
        </div>

        {stats.proximasAulas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
            <CalendarCheck size={36} style={{ color: '#CBD5E1' }} />
            <p className="text-sm font-medium" style={{ color: '#64748B' }}>
              Nenhuma aula agendada
            </p>
            <p className="text-xs max-w-xs" style={{ color: '#94A3B8' }}>
              Seus horarios disponiveis aparecerao aqui assim que um aluno agendar.
            </p>
          </div>
        ) : (
          <div>
            {stats.proximasAulas.map((aula, index) => (
              <div
                key={`${aula.hora}-${index}`}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: index < stats.proximasAulas.length - 1 ? '1px solid #F8FAFC' : undefined }}
              >
                <div className="w-14 shrink-0 text-center">
                  <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
                    {aula.hora}
                  </span>
                </div>

                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: '#F1F5F9', color: '#64748B' }}
                >
                  <User size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#0F172A' }}>
                    {aula.aluno}
                  </p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    Categoria {aula.categoria}
                  </p>
                </div>

                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={
                    aula.status === 'confirmed'
                      ? { background: '#D1FAE5', color: '#065F46' }
                      : { background: '#FEF3C7', color: '#92400E' }
                  }
                >
                  {aula.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

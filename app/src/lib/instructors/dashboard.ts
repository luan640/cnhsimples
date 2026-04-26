import { unstable_noStore as noStore } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { settleCompletedLessons } from '@/lib/bookings/payments'

export type InstructorProfile = {
  id: string
  user_id: string
  full_name: string
  photo_url: string | null
  rating: number
  status: string
  rejection_reason: string | null
  hourly_rate: number | null
  neighborhood: string | null
  city: string | null
}

export type ProximaAula = {
  hora: string
  aluno: string
  categoria: string
  status: string
}

export type DashboardStats = {
  aulasHoje: number
  aulasMes: number
  receitaMes: number
  saldoDisponivel: number
  proximasAulas: ProximaAula[]
  aulasPorDia: Array<{ dia: string; aulas: number }>
  receitaPorSemana: Array<{ sem: string; valor: number }>
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  docs_rejected: 0,
  docs_approved: 1,
  inactive: 1,
  suspended: 1,
  active: 2,
}

export function resolveInstructorStatus(
  profileStatus: string | null | undefined,
  metadataStatus: string
) {
  const profileRank = STATUS_RANK[profileStatus ?? ''] ?? -1
  const metadataRank = STATUS_RANK[metadataStatus] ?? -1

  return metadataRank > profileRank ? metadataStatus : (profileStatus ?? metadataStatus)
}

export async function getInstructorProfile(userId: string): Promise<InstructorProfile | null> {
  noStore()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('instructor_profiles')
    .select(
      'id, user_id, full_name, photo_url, rating, status, rejection_reason, hourly_rate, neighborhood, city'
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[dashboard] getInstructorProfile error:', error.message)
    return null
  }

  if (!data) {
    console.error('[dashboard] getInstructorProfile: nenhum perfil encontrado para user_id =', userId)
    return null
  }

  return {
    id: data.id,
    user_id: data.user_id,
    full_name: data.full_name ?? '',
    photo_url: data.photo_url ?? null,
    rating: Number(data.rating ?? 0),
    status: data.status ?? 'pending',
    rejection_reason: data.rejection_reason ?? null,
    hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : null,
    neighborhood: data.neighborhood ?? null,
    city: data.city ?? null,
  }
}

export async function getDashboardStats(profileId: string): Promise<DashboardStats> {
  await settleCompletedLessons(profileId).catch(() => {})
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  const empty: DashboardStats = {
    aulasHoje: 0,
    aulasMes: 0,
    receitaMes: 0,
    saldoDisponivel: 0,
    proximasAulas: [],
    aulasPorDia: [],
    receitaPorSemana: [],
  }

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('owner_id', profileId)
    .eq('owner_type', 'instructor')
    .maybeSingle()

  empty.saldoDisponivel = Number(wallet?.balance ?? 0)

  const { data: slots, error: slotsError } = await supabase
    .from('availability_slots')
    .select('id, date, hour, status')
    .eq('instructor_id', profileId)
    .eq('status', 'booked')
    .order('date', { ascending: true })
    .order('hour', { ascending: true })

  if (!slotsError && slots) {
    const todaySlots = slots.filter((slot) => slot.date === todayStr)
    empty.aulasHoje = todaySlots.length

    const startMonth = startOfMonth.split('T')[0]
    empty.aulasMes = slots.filter((slot) => slot.date >= startMonth).length

    empty.aulasPorDia = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - 6 + index)
      const dateStr = date.toISOString().split('T')[0]

      return {
        dia: DIAS[date.getDay()],
        aulas: slots.filter((slot) => slot.date === dateStr).length,
      }
    })

    const futuros = slots.filter((slot) => slot.date >= todayStr).slice(0, 5)

    if (futuros.length > 0) {
      const slotIds = futuros.map((slot) => slot.id)

      const { data: bookings } = await supabase
        .from('bookings')
        .select('slot_id, status, value')
        .in('slot_id', slotIds)
        .in('status', ['confirmed', 'pending'])

      empty.proximasAulas = futuros.map((slot) => {
        const booking = bookings?.find((item) => item.slot_id === slot.id)

        return {
          hora: `${String(slot.hour).padStart(2, '0')}:00`,
          aluno: 'Aluno',
          categoria: 'B',
          status: booking?.status ?? 'pendente',
        }
      })
    }
  }

  const { data: transactions, error: txError } = await supabase
    .from('wallet_transactions')
    .select('amount, created_at')
    .eq('wallet_id', profileId)
    .eq('type', 'credit')
    .gte('created_at', startOfMonth)

  if (!txError && transactions) {
    empty.receitaMes = transactions.reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0)

    empty.receitaPorSemana = Array.from({ length: 4 }, (_, index) => {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 7 * (3 - index))

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const valor = transactions
        .filter((transaction) => {
          const date = new Date(transaction.created_at)
          return date >= weekStart && date <= weekEnd
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0)

      return {
        sem: `Sem ${index + 1}`,
        valor,
      }
    })
  }

  return empty
}

import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type ScheduleRule = {
  id: string
  day_of_week: number
  is_active: boolean
  start_hour: number
  start_minute: number
  end_hour: number
  end_minute: number
  slot_duration_minutes: number
  break_enabled: boolean
  break_start_hour: number
  break_start_minute: number
  break_end_hour: number
  break_end_minute: number
}

const DEFAULT_RULE: Omit<ScheduleRule, 'id' | 'day_of_week'> = {
  is_active: false,
  start_hour: 8,
  start_minute: 0,
  end_hour: 18,
  end_minute: 0,
  slot_duration_minutes: 60,
  break_enabled: false,
  break_start_hour: 12,
  break_start_minute: 0,
  break_end_hour: 13,
  break_end_minute: 0,
}

export async function getScheduleRules(profileId: string): Promise<ScheduleRule[]> {
  noStore()
  const admin = createAdminClient()
  const { data } = await admin
    .from('schedule_rules')
    .select('id, day_of_week, is_active, start_hour, start_minute, end_hour, end_minute, slot_duration_minutes, break_enabled, break_start_hour, break_start_minute, break_end_hour, break_end_minute')
    .eq('instructor_id', profileId)
    .order('day_of_week')

  const existing = data ?? []
  return Array.from({ length: 7 }, (_, dow) => {
    const found = existing.find((r) => r.day_of_week === dow)
    if (!found) return { id: '', day_of_week: dow, ...DEFAULT_RULE }
    return {
      id: found.id,
      day_of_week: found.day_of_week,
      is_active: found.is_active,
      start_hour: found.start_hour,
      start_minute: found.start_minute ?? 0,
      end_hour: found.end_hour,
      end_minute: found.end_minute ?? 0,
      slot_duration_minutes: found.slot_duration_minutes,
      break_enabled: found.break_enabled ?? false,
      break_start_hour: found.break_start_hour ?? 12,
      break_start_minute: found.break_start_minute ?? 0,
      break_end_hour: found.break_end_hour ?? 13,
      break_end_minute: found.break_end_minute ?? 0,
    }
  })
}

export type AgendaSlot = {
  id: string
  date: string
  hour: number
  minute: number
  slot_duration_minutes: number
  status: 'available' | 'reserved' | 'booked' | 'completed' | 'blocked'
  booking: {
    id: string
    status: string
    value: number
    student_name: string
    student_phone: string
    student_photo: string | null
    notes: string | null
  } | null
}

export type AbsenceBlock = {
  id: string
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  reason: string | null
  all_day: boolean
}

export type AgendaData = {
  slots: AgendaSlot[]
  absences: AbsenceBlock[]
}

export async function autoExtendScheduleSlots(
  profileId: string,
  rules: ScheduleRule[],
  startDate: string,
  endDate: string
): Promise<void> {
  const activeRules = rules.filter((r) => r.is_active)
  if (activeRules.length === 0) return

  const admin = createAdminClient()

  type SlotRow = { instructor_id: string; date: string; hour: number; minute: number; slot_duration_minutes: number; status: string }
  const slots: SlotRow[] = []

  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const rule = activeRules.find((r) => r.day_of_week === d.getDay())
    if (!rule) continue

    const ds = d.toISOString().split('T')[0]
    const endMin = rule.end_hour * 60 + rule.end_minute
    const bs = rule.break_enabled ? rule.break_start_hour * 60 + rule.break_start_minute : null
    const be = rule.break_enabled ? rule.break_end_hour * 60 + rule.break_end_minute : null

    let cur = rule.start_hour * 60 + rule.start_minute
    while (cur + rule.slot_duration_minutes <= endMin) {
      if (bs === null || be === null || cur < bs || cur >= be) {
        slots.push({ instructor_id: profileId, date: ds, hour: Math.floor(cur / 60), minute: cur % 60, slot_duration_minutes: rule.slot_duration_minutes, status: 'available' })
      }
      cur += rule.slot_duration_minutes
    }
  }

  if (slots.length === 0) return

  for (let i = 0; i < slots.length; i += 500) {
    await admin.from('availability_slots').upsert(slots.slice(i, i + 500), { onConflict: 'instructor_id,date,hour,minute', ignoreDuplicates: true })
  }
}

export async function getAgendaData(
  profileId: string,
  startDate: string,
  endDate: string
): Promise<AgendaData> {
  noStore()
  const admin = createAdminClient()

  const [slotsResult, bookingsResult, absencesResult] = await Promise.all([
    admin
      .from('availability_slots')
      .select('id, date, hour, minute, slot_duration_minutes, status')
      .eq('instructor_id', profileId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('hour')
      .order('minute'),

    admin
      .from('bookings')
      .select(`
        id, slot_id, status, value, notes,
        student_profiles ( full_name, phone, photo_url )
      `)
      .eq('instructor_id', profileId),

    admin
      .from('absence_blocks')
      .select('id, start_date, end_date, start_time, end_time, reason, all_day')
      .eq('instructor_id', profileId)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .order('start_date'),
  ])

  const slots = slotsResult.data ?? []
  const bookings = bookingsResult.data ?? []
  const absences = absencesResult.data ?? []

  const agendaSlots: AgendaSlot[] = slots.map((slot) => {
    const booking = bookings.find((b) => b.slot_id === slot.id)
    const rawStudent = booking?.student_profiles as unknown
    const student = booking && rawStudent
      ? (Array.isArray(rawStudent) ? rawStudent[0] : rawStudent) as { full_name: string; phone: string; photo_url: string | null } | null
      : null

    return {
      id: slot.id,
      date: slot.date,
      hour: slot.hour,
      minute: slot.minute ?? 0,
      slot_duration_minutes: slot.slot_duration_minutes ?? 60,
      status: slot.status,
      booking: booking && student
        ? {
            id: booking.id,
            status: booking.status,
            value: Number(booking.value),
            student_name: student.full_name,
            student_phone: student.phone,
            student_photo: student.photo_url,
            notes: booking.notes ?? null,
          }
        : null,
    }
  })

  const absenceBlocks: AbsenceBlock[] = absences.map((a) => ({
    id: a.id,
    start_date: a.start_date,
    end_date: a.end_date,
    start_time: a.start_time ?? null,
    end_time: a.end_time ?? null,
    reason: a.reason ?? null,
    all_day: a.all_day ?? true,
  }))

  return { slots: agendaSlots, absences: absenceBlocks }
}

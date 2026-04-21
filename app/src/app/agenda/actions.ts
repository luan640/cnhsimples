'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getInstructorProfileId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('instructor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()


  return data?.id ?? null
}

export async function createSlotsAction(payload: {
  dates: string[]
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  durationMinutes: number
}): Promise<{ error: string | null }> {
  const profileId = await getInstructorProfileId()
  if (!profileId) return { error: 'Não autenticado.' }

  const admin = createAdminClient()
  const { dates, startHour, startMinute, endHour, endMinute, durationMinutes } = payload

  const slots: { instructor_id: string; date: string; hour: number; minute: number; slot_duration_minutes: number; status: string }[] = []

  for (const date of dates) {
    let currentMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    while (currentMinutes + durationMinutes <= endTotalMinutes) {
      const hour = Math.floor(currentMinutes / 60)
      const minute = currentMinutes % 60
      slots.push({
        instructor_id: profileId,
        date,
        hour,
        minute,
        slot_duration_minutes: durationMinutes,
        status: 'available',
      })
      currentMinutes += durationMinutes
    }
  }

  if (slots.length === 0) return { error: 'Nenhum slot gerado com os horários informados.' }

  const { error } = await admin
    .from('availability_slots')
    .upsert(slots, { onConflict: 'instructor_id,date,hour,minute', ignoreDuplicates: true })

  if (error) return { error: error.message }

  revalidatePath('/agenda')
  return { error: null }
}

export async function deleteSlotAction(slotId: string): Promise<{ error: string | null }> {
  const profileId = await getInstructorProfileId()
  if (!profileId) return { error: 'Não autenticado.' }

  const admin = createAdminClient()

  const { data: slot } = await admin
    .from('availability_slots')
    .select('id, status, instructor_id')
    .eq('id', slotId)
    .maybeSingle()

  if (!slot || slot.instructor_id !== profileId) return { error: 'Slot não encontrado.' }
  if (slot.status === 'booked') return { error: 'Não é possível remover um slot com agendamento.' }

  const { error } = await admin.from('availability_slots').delete().eq('id', slotId)
  if (error) return { error: error.message }

  revalidatePath('/agenda')
  return { error: null }
}

export async function toggleSlotBlockAction(
  slotId: string,
  block: boolean
): Promise<{ error: string | null }> {
  const profileId = await getInstructorProfileId()
  if (!profileId) return { error: 'Não autenticado.' }

  const admin = createAdminClient()

  const { data: slot } = await admin
    .from('availability_slots')
    .select('id, status, instructor_id')
    .eq('id', slotId)
    .maybeSingle()

  if (!slot || slot.instructor_id !== profileId) return { error: 'Slot não encontrado.' }
  if (slot.status === 'booked') return { error: 'Não é possível bloquear um slot com agendamento.' }

  const newStatus = block ? 'blocked' : 'available'
  const { error } = await admin
    .from('availability_slots')
    .update({ status: newStatus })
    .eq('id', slotId)

  if (error) return { error: error.message }

  revalidatePath('/agenda')
  return { error: null }
}

export async function createAbsenceAction(payload: {
  startDate: string
  endDate: string
  allDay: boolean
  startTime?: string
  endTime?: string
  reason?: string
}): Promise<{ error: string | null }> {
  const profileId = await getInstructorProfileId()
  if (!profileId) return { error: 'Não autenticado.' }

  const admin = createAdminClient()

  const { error } = await admin.from('absence_blocks').insert({
    instructor_id: profileId,
    start_date: payload.startDate,
    end_date: payload.endDate,
    all_day: payload.allDay,
    start_time: payload.allDay ? null : (payload.startTime ?? null),
    end_time: payload.allDay ? null : (payload.endTime ?? null),
    reason: payload.reason ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/agenda')
  return { error: null }
}

export async function deleteAbsenceAction(absenceId: string): Promise<{ error: string | null }> {
  const profileId = await getInstructorProfileId()
  if (!profileId) return { error: 'Não autenticado.' }

  const admin = createAdminClient()

  const { data: absence } = await admin
    .from('absence_blocks')
    .select('id, instructor_id')
    .eq('id', absenceId)
    .maybeSingle()

  if (!absence || absence.instructor_id !== profileId) return { error: 'Ausência não encontrada.' }

  const { error } = await admin.from('absence_blocks').delete().eq('id', absenceId)
  if (error) return { error: error.message }

  revalidatePath('/agenda')
  return { error: null }
}

export async function saveScheduleRulesAction(
  rules: Array<{
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
  }>
): Promise<{ error: string | null }> {
  const profileId = await getInstructorProfileId()
  if (!profileId) return { error: 'Não autenticado.' }

  const admin = createAdminClient()

  const { error: rulesError } = await admin
    .from('schedule_rules')
    .upsert(
      rules.map((r) => ({ ...r, instructor_id: profileId })),
      { onConflict: 'instructor_id,day_of_week' }
    )
  if (rulesError) return { error: rulesError.message }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const rangeEnd = new Date(today)
  rangeEnd.setDate(rangeEnd.getDate() + 90)

  function dateStr(d: Date) {
    return d.toISOString().split('T')[0]
  }

  const { error: deleteError } = await admin
    .from('availability_slots')
    .delete()
    .eq('instructor_id', profileId)
    .gte('date', dateStr(today))
    .lte('date', dateStr(rangeEnd))
    .eq('status', 'available')

  if (deleteError) return { error: deleteError.message }

  const activeRules = rules.filter((r) => r.is_active)
  if (activeRules.length === 0) {
    revalidatePath('/agenda')
    return { error: null }
  }

  type SlotRow = {
    instructor_id: string
    date: string
    hour: number
    minute: number
    slot_duration_minutes: number
    status: string
  }

  const newSlots: SlotRow[] = []

  for (let i = 0; i <= 90; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    const rule = activeRules.find((r) => r.day_of_week === dow)
    if (!rule) continue

    const ds = dateStr(d)
    const endMin = rule.end_hour * 60 + rule.end_minute
    const bs = rule.break_enabled ? rule.break_start_hour * 60 + rule.break_start_minute : null
    const be = rule.break_enabled ? rule.break_end_hour * 60 + rule.break_end_minute : null

    let cur = rule.start_hour * 60 + rule.start_minute
    while (cur + rule.slot_duration_minutes <= endMin) {
      const inBreak = bs !== null && be !== null && cur >= bs && cur < be
      if (!inBreak) {
        newSlots.push({
          instructor_id: profileId,
          date: ds,
          hour: Math.floor(cur / 60),
          minute: cur % 60,
          slot_duration_minutes: rule.slot_duration_minutes,
          status: 'available',
        })
      }
      cur += rule.slot_duration_minutes
    }
  }

  for (let i = 0; i < newSlots.length; i += 500) {
    const { error } = await admin
      .from('availability_slots')
      .upsert(newSlots.slice(i, i + 500), {
        onConflict: 'instructor_id,date,hour,minute',
        ignoreDuplicates: true,
      })
    if (error) return { error: error.message }
  }

  revalidatePath('/agenda')
  return { error: null }
}



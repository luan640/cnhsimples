import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type InstructorLesson = {
  id: string
  student_id: string
  slot_id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  slot_date: string
  slot_hour: number
  slot_minute: number
  student_name: string
  student_phone: string | null
  value: number
  instructor_amount: number
  platform_amount: number
  lesson_mode: 'meeting' | 'pickup' | null
  receipt_url: string | null
  confirmed_at: string | null
  created_at: string | null
}

export async function getInstructorLessons(instructorId: string): Promise<InstructorLesson[]> {
  noStore()

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      student_id,
      slot_id,
      status,
      value,
      instructor_amount,
      platform_amount,
      lesson_mode,
      receipt_url,
      confirmed_at,
      created_at,
      availability_slots ( date, hour, minute ),
      student_profiles ( full_name, phone )
    `)
    .eq('instructor_id', instructorId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []

  return (data as any[]).map((row) => {
    const slot = Array.isArray(row.availability_slots)
      ? row.availability_slots[0]
      : row.availability_slots
    const student = Array.isArray(row.student_profiles)
      ? row.student_profiles[0]
      : row.student_profiles

    return {
      id: row.id,
      student_id: row.student_id,
      slot_id: row.slot_id,
      status: row.status as InstructorLesson['status'],
      slot_date: slot?.date ?? '',
      slot_hour: slot?.hour ?? 0,
      slot_minute: slot?.minute ?? 0,
      student_name: student?.full_name ?? 'Aluno',
      student_phone: student?.phone ?? null,
      value: Number(row.value ?? 0),
      instructor_amount: Number(row.instructor_amount ?? 0),
      platform_amount: Number(row.platform_amount ?? 0),
      lesson_mode: (row.lesson_mode as InstructorLesson['lesson_mode']) ?? null,
      receipt_url: row.receipt_url ?? null,
      confirmed_at: row.confirmed_at ?? null,
      created_at: row.created_at ?? null,
    }
  })
}

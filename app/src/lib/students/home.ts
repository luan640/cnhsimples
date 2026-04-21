import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type StudentBooking = {
  id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  slot_date: string
  slot_hour: number
  slot_minute: number
  instructor_name: string
  instructor_photo: string | null
  value: number
  lesson_mode: 'meeting' | 'pickup' | null
}

export async function getStudentBookings(studentId: string): Promise<StudentBooking[]> {
  noStore()

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      value,
      lesson_mode,
      availability_slots ( date, hour, minute ),
      instructor_profiles ( full_name, photo_url )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  return data.map((row) => {
    const slot = Array.isArray(row.availability_slots)
      ? row.availability_slots[0]
      : row.availability_slots
    const instructor = Array.isArray(row.instructor_profiles)
      ? row.instructor_profiles[0]
      : row.instructor_profiles

    return {
      id: row.id,
      status: row.status as StudentBooking['status'],
      slot_date: slot?.date ?? '',
      slot_hour: slot?.hour ?? 0,
      slot_minute: slot?.minute ?? 0,
      instructor_name: instructor?.full_name ?? 'Instrutor',
      instructor_photo: instructor?.photo_url ?? null,
      value: Number(row.value ?? 0),
      lesson_mode: (row.lesson_mode as StudentBooking['lesson_mode']) ?? null,
    }
  })
}

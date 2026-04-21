import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type StudentBooking = {
  id: string
  booking_group_id: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  slot_date: string
  slot_hour: number
  slot_minute: number
  instructor_name: string
  instructor_photo: string | null
  instructor_phone: string | null
  value: number
  lesson_mode: 'meeting' | 'pickup' | null
  created_at: string | null
  payment_method: 'pix' | 'card' | null
  service_type: 'individual' | 'package'
  package_lesson_index: number | null
  package_total_lessons: number | null
}

export async function getStudentBookings(studentId: string): Promise<StudentBooking[]> {
  noStore()

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      booking_group_id,
      status,
      value,
      lesson_mode,
      created_at,
      availability_slots ( date, hour, minute ),
      instructor_profiles ( full_name, photo_url, phone ),
      booking_groups (
        payment_method,
        total_lessons,
        instructor_services ( service_type, lesson_count )
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  const bookings = data.map((row) => {
    const slot = Array.isArray(row.availability_slots)
      ? row.availability_slots[0]
      : row.availability_slots
    const instructor = Array.isArray(row.instructor_profiles)
      ? row.instructor_profiles[0]
      : row.instructor_profiles

    const group = Array.isArray(row.booking_groups)
      ? row.booking_groups[0]
      : row.booking_groups
    const service = Array.isArray(group?.instructor_services)
      ? group?.instructor_services[0]
      : group?.instructor_services
    const totalLessons = Number(group?.total_lessons ?? service?.lesson_count ?? 1)
    const serviceType: StudentBooking['service_type'] =
      service?.service_type === 'package' || totalLessons > 1 ? 'package' : 'individual'

    return {
      id: row.id,
      booking_group_id: row.booking_group_id ?? null,
      status: row.status as StudentBooking['status'],
      slot_date: slot?.date ?? '',
      slot_hour: slot?.hour ?? 0,
      slot_minute: slot?.minute ?? 0,
      instructor_name: instructor?.full_name ?? 'Instrutor',
      instructor_photo: instructor?.photo_url ?? null,
      instructor_phone: instructor?.phone ?? null,
      value: Number(row.value ?? 0),
      lesson_mode: (row.lesson_mode as StudentBooking['lesson_mode']) ?? null,
      created_at: row.created_at ?? null,
      payment_method: (group?.payment_method as StudentBooking['payment_method']) ?? null,
      service_type: serviceType,
      package_lesson_index: null,
      package_total_lessons: serviceType === 'package' ? totalLessons : null,
    }
  })

  const packageGroups = new Map<string, StudentBooking[]>()

  for (const booking of bookings) {
    if (booking.service_type !== 'package' || !booking.booking_group_id) continue
    const groupBookings = packageGroups.get(booking.booking_group_id) ?? []
    groupBookings.push(booking)
    packageGroups.set(booking.booking_group_id, groupBookings)
  }

  for (const groupBookings of packageGroups.values()) {
    groupBookings
      .sort((a, b) => {
        const aKey = `${a.slot_date}-${String(a.slot_hour).padStart(2, '0')}-${String(a.slot_minute).padStart(2, '0')}`
        const bKey = `${b.slot_date}-${String(b.slot_hour).padStart(2, '0')}-${String(b.slot_minute).padStart(2, '0')}`
        return aKey.localeCompare(bKey)
      })
      .forEach((booking, index) => {
        booking.package_lesson_index = index + 1
      })
  }

  return bookings
}

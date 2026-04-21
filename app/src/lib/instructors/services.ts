import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export const PLATFORM_SPLIT = 0.20 // 20% platform fee — configurable by admin in the future

export function studentPrice(instructorPrice: number): number {
  return instructorPrice / (1 - PLATFORM_SPLIT)
}

export type PickupRange = {
  from_km: number
  to_km: number
  price: number
}

export type InstructorService = {
  id: string
  category: 'A' | 'B' | 'AB' | null
  service_type: 'individual' | 'package'
  lesson_count: number
  price: number
  accepts_home_pickup: boolean
  pickup_ranges: PickupRange[]
  accepts_student_vehicle: boolean
  provides_vehicle: boolean
  notes: string | null
  is_active: boolean
  sort_order: number
}

export function serviceTitle(service: Pick<InstructorService, 'service_type' | 'category' | 'lesson_count'>): string {
  const cat = service.category ? ` — Categoria ${service.category}` : ''
  if (service.service_type === 'package') return `Pacote ${service.lesson_count} Aulas${cat}`
  return `Aula Avulsa${cat}`
}

export async function getInstructorServices(profileId: string): Promise<InstructorService[]> {
  noStore()
  const admin = createAdminClient()
  const { data } = await admin
    .from('instructor_services')
    .select('id, category, service_type, lesson_count, price, accepts_home_pickup, pickup_ranges, accepts_student_vehicle, provides_vehicle, notes, is_active, sort_order')
    .eq('instructor_id', profileId)
    .order('sort_order')
    .order('created_at')

  return (data ?? []).map((r) => ({
    id: r.id,
    category: (r.category as 'A' | 'B' | 'AB' | null) ?? null,
    service_type: r.service_type as 'individual' | 'package',
    lesson_count: r.lesson_count ?? 1,
    price: Number(r.price),
    accepts_home_pickup: r.accepts_home_pickup ?? false,
    pickup_ranges: (r.pickup_ranges as PickupRange[]) ?? [],
    accepts_student_vehicle: r.accepts_student_vehicle ?? false,
    provides_vehicle: r.provides_vehicle ?? true,
    notes: r.notes ?? null,
    is_active: r.is_active ?? true,
    sort_order: r.sort_order ?? 0,
  }))
}

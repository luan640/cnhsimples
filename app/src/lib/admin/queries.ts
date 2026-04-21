import { createAdminClient } from '@/lib/supabase/admin'

export type InstructorRow = {
  id: string
  user_id: string
  full_name: string
  status: string
  category: string | null
  neighborhood: string | null
  city: string | null
  created_at: string
  cnh_expires_at: string | null
  hourly_rate: number | null
  rating: number | null
}

export type InstructorDetail = InstructorRow & {
  cpf: string | null
  phone: string | null
  bio: string | null
  photo_url: string | null
  experience_years: number | null
  cnh_number: string | null
  detran_credential_number: string | null
  detran_credential_expires_at: string | null
  cep: string | null
  street: string | null
  number: string | null
  state: string | null
  service_radius_km: number | null
  pix_key_type: string | null
  pix_key: string | null
  platform_split_rate: number | null
  email: string | null
  rejection_reason: string | null
}

export type RevenueSplitSettings = {
  defaultPlatformSplitRate: number
}

export type DocumentRow = {
  id: string
  instructor_id: string
  type: string
  file_url: string
}

export type WithdrawalRow = {
  id: string
  instructor_id: string
  amount: number
  pix_key: string
  pix_key_type: string
  status: string
  admin_note: string | null
  processed_at: string | null
  created_at: string
  instructor_name: string | null
}

export type AdminStats = {
  pendingInstructors: number
  activeInstructors: number
  pendingWithdrawals: number
  totalStudents: number
}

type InstructorProfileSummary = Pick<InstructorRow, 'id' | 'user_id' | 'full_name' | 'status' | 'category' | 'neighborhood' | 'city' | 'created_at' | 'cnh_expires_at' | 'hourly_rate' | 'rating'>

type InstructorProfileName = {
  id: string
  full_name: string
}

type WithdrawalBaseRow = Omit<WithdrawalRow, 'instructor_name'> & {
  instructor_name?: string | null
}

// ── Stats ────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient()

  const [r0, r1, r2, r3] = await Promise.allSettled([
    admin.from('instructor_profiles').select('*', { count: 'exact', head: true }).in('status', ['pending', 'docs_rejected']),
    admin.from('instructor_profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('student_profiles').select('*', { count: 'exact', head: true }),
  ])

  return {
    pendingInstructors: r0.status === 'fulfilled' ? (r0.value.count ?? 0) : 0,
    activeInstructors:  r1.status === 'fulfilled' ? (r1.value.count ?? 0) : 0,
    pendingWithdrawals: r2.status === 'fulfilled' ? (r2.value.count ?? 0) : 0,
    totalStudents:      r3.status === 'fulfilled' ? (r3.value.count ?? 0) : 0,
  }
}

// ── Instructors ──────────────────────────────────────────

export async function listInstructors(status?: string): Promise<InstructorRow[]> {
  const admin = createAdminClient()

  const baseQuery = admin
    .from('instructor_profiles')
    .select('id, user_id, full_name, status, category, neighborhood, city, created_at, cnh_expires_at, hourly_rate, rating')
    .order('created_at', { ascending: false })

  const query = status && status !== 'all' ? baseQuery.eq('status', status) : baseQuery

  const { data, error } = await query
  if (error) console.error('[admin] listInstructors:', error.message)
  return (data ?? []) as InstructorProfileSummary[]
}

export async function getInstructorDetail(id: string): Promise<{
  profile: InstructorDetail
  documents: DocumentRow[]
} | null> {
  const admin = createAdminClient()

  const [profileRes, docsRes] = await Promise.all([
    admin.from('instructor_profiles').select('*').eq('id', id).single(),
    admin.from('instructor_documents').select('*').eq('instructor_id', id),
  ])

  if (profileRes.error || !profileRes.data) {
    console.error('[admin] getInstructorDetail:', profileRes.error?.message)
    return null
  }

  // busca email pelo auth
  let email: string | null = null
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(profileRes.data.user_id)
    email = authUser?.user?.email ?? null
  } catch {}

  return {
    profile: { ...(profileRes.data as InstructorDetail), email },
    documents: (docsRes.data ?? []) as DocumentRow[],
  }
}

export async function getRevenueSplitSettings(): Promise<RevenueSplitSettings> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('platform_settings')
    .select('default_platform_split_rate')
    .eq('id', true)
    .maybeSingle()

  if (error && !error.message.includes('does not exist')) {
    console.error('[admin] getRevenueSplitSettings:', error.message)
  }

  return {
    defaultPlatformSplitRate: Number(data?.default_platform_split_rate ?? 0.2),
  }
}

// ── Withdrawals ──────────────────────────────────────────

export async function listWithdrawals(status?: string): Promise<WithdrawalRow[]> {
  const admin = createAdminClient()

  const baseQuery = admin
    .from('withdrawal_requests')
    .select('id, instructor_id, amount, pix_key, pix_key_type, status, admin_note, processed_at, created_at')
    .order('created_at', { ascending: false })

  const query = status && status !== 'all' ? baseQuery.eq('status', status) : baseQuery

  const { data, error } = await query
  if (error) {
    if (!error.message.includes('does not exist')) {
      console.error('[admin] listWithdrawals:', error.message)
    }
    return []
  }

  if (!data?.length) return []

  // busca nomes dos instrutores em lote
  const withdrawalRows = data as WithdrawalBaseRow[]
  const ids = [...new Set(withdrawalRows.map((w) => w.instructor_id))]
  const { data: profiles } = await admin
    .from('instructor_profiles')
    .select('id, full_name')
    .in('id', ids)

  const nameMap = Object.fromEntries(
    ((profiles ?? []) as InstructorProfileName[]).map((profile) => [profile.id, profile.full_name])
  )

  return withdrawalRows.map((withdrawal) => ({
    ...withdrawal,
    amount: Number(withdrawal.amount),
    instructor_name: nameMap[withdrawal.instructor_id] ?? null,
  })) as WithdrawalRow[]
}

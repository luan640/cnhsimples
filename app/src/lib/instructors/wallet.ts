import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type WalletData = {
  walletId: string | null
  balance: number
  pendingAmount: number
}

export type WalletTransaction = {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  created_at: string
}

export type WithdrawalRequest = {
  id: string
  amount: number
  pix_key: string
  pix_key_type: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  processed_at: string | null
  created_at: string
}

export type InstructorPixInfo = {
  pix_key: string | null
  pix_key_type: string | null
}

export async function getInstructorWallet(profileId: string): Promise<WalletData> {
  noStore()
  const supabase = await createClient()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('owner_id', profileId)
    .eq('owner_type', 'instructor')
    .maybeSingle()

  const { data: pending } = await supabase
    .from('booking_groups')
    .select('instructor_amount')
    .eq('instructor_id', profileId)
    .eq('status', 'awaiting_payment')

  const pendingAmount = (pending ?? []).reduce(
    (sum, bg) => sum + Number(bg.instructor_amount ?? 0),
    0
  )

  return {
    walletId: wallet?.id ?? null,
    balance: Number(wallet?.balance ?? 0),
    pendingAmount,
  }
}

export async function getWalletTransactions(profileId: string): Promise<WalletTransaction[]> {
  noStore()
  const supabase = await createClient()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('owner_id', profileId)
    .eq('owner_type', 'instructor')
    .maybeSingle()

  if (!wallet) return []

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('id, type, amount, description, created_at')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[wallet] getWalletTransactions:', error.message)
    return []
  }

  return (data ?? []).map((t) => ({
    ...t,
    amount: Number(t.amount),
  })) as WalletTransaction[]
}

export async function getWithdrawalRequests(profileId: string): Promise<WithdrawalRequest[]> {
  noStore()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('id, amount, pix_key, pix_key_type, status, admin_note, processed_at, created_at')
    .eq('instructor_id', profileId)
    .order('created_at', { ascending: false })

  if (error) {
    if (!error.message.includes('does not exist')) {
      console.error('[wallet] getWithdrawalRequests:', error.message)
    }
    return []
  }

  return (data ?? []).map((w) => ({
    ...w,
    amount: Number(w.amount),
  })) as WithdrawalRequest[]
}

export async function getInstructorPixInfo(profileId: string): Promise<InstructorPixInfo> {
  noStore()
  const supabase = await createClient()

  const { data } = await supabase
    .from('instructor_profiles')
    .select('pix_key, pix_key_type')
    .eq('id', profileId)
    .maybeSingle()

  return {
    pix_key: data?.pix_key ?? null,
    pix_key_type: data?.pix_key_type ?? null,
  }
}

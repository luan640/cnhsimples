'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function approveWithdrawal(withdrawalId: string, instructorId: string, amount: number) {
  const admin = createAdminClient()

  const now = new Date().toISOString()

  const { error: wError } = await admin
    .from('withdrawal_requests')
    .update({ status: 'approved', processed_at: now })
    .eq('id', withdrawalId)

  if (wError) throw new Error(wError.message)

  // Debita da carteira do instrutor
  const { data: wallet } = await admin
    .from('wallets')
    .select('id, balance')
    .eq('owner_id', instructorId)
    .eq('owner_type', 'instructor')
    .maybeSingle()

  if (wallet) {
    const newBalance = Number(wallet.balance) - amount
    await admin.from('wallets').update({ balance: newBalance }).eq('id', wallet.id)

    await admin.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'debit',
      amount,
      description: 'Saque aprovado pelo administrador',
      reference_id: withdrawalId,
    })
  }

  revalidatePath('/admin/saques')
  revalidatePath('/admin')
}

export async function rejectWithdrawal(withdrawalId: string, note: string) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('withdrawal_requests')
    .update({ status: 'rejected', admin_note: note, processed_at: new Date().toISOString() })
    .eq('id', withdrawalId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/saques')
  revalidatePath('/admin')
}

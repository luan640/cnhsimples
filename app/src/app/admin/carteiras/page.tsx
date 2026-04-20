import { Wallet } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

async function getWallets() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('wallets')
    .select('id, owner_id, owner_type, balance')
    .order('balance', { ascending: false })
  return data ?? []
}

export default async function AdminCarteirasPage() {
  const wallets = await getWallets()

  const instructorWallets = wallets.filter(w => w.owner_type === 'instructor')
  const platformWallet = wallets.find(w => w.owner_type === 'platform')

  const totalInstructor = instructorWallets.reduce((sum, w) => sum + Number(w.balance), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Wallet size={20} style={{ color: '#3ECF8E' }} />
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Carteiras</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Saldos de carteiras virtuais</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-[12px] border p-5"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <p className="text-sm" style={{ color: '#64748B' }}>Carteira da plataforma</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#0F172A' }}>
            {Number(platformWallet?.balance ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div
          className="rounded-[12px] border p-5"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <p className="text-sm" style={{ color: '#64748B' }}>Total a pagar a instrutores</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#F97316' }}>
            {totalInstructor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Instructor wallets */}
      {instructorWallets.length > 0 && (
        <div
          className="rounded-[12px] border overflow-hidden"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Owner ID (Instrutor)</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: '#64748B' }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {instructorWallets.map((w, i) => (
                <tr key={w.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : undefined }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#64748B' }}>{w.owner_id}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: '#0F172A' }}>
                    {Number(w.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

'use client'

import { CreditCard } from 'lucide-react'

type Props = {
  amount: number
  label?: string
  className?: string
}

export function MembershipPaymentButton({ amount, label, className }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <a
        href="/api/payments/instructor-membership/create-preference"
        className={
          className ??
          'flex items-center justify-center gap-2 rounded-[6px] px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-70'
        }
        style={{ background: '#3ECF8E', color: '#0F172A' }}
      >
        <CreditCard size={16} />
        {label ?? `Assinar mensalidade - R$ ${amount.toFixed(2).replace('.', ',')}/mes`}
      </a>

      <p className="text-xs" style={{ color: '#64748B' }}>
        O redirecionamento leva direto para o checkout recorrente do Mercado Pago.
      </p>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { MembershipStripeCheckout } from '@/components/painel/MembershipStripeCheckout'

type Props = {
  amount: number
  label?: string
  className?: string
}

export function MembershipPaymentButton({ amount }: Props) {
  const router = useRouter()

  function handleSuccess() {
    router.refresh()
  }

  return <MembershipStripeCheckout amount={amount} onSuccess={handleSuccess} />
}

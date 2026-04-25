import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function isValidCpf(digits: string): boolean {
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  if (rem !== parseInt(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  return rem === parseInt(digits[10])
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const field = searchParams.get('field')
  const value = searchParams.get('value')

  if (!field || !value) {
    return NextResponse.json({ error: 'field e value sao obrigatorios.' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'Configuracao do servidor invalida.' }, { status: 500 })
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (field === 'cpf') {
    const digits = value.replace(/\D/g, '')

    if (!isValidCpf(digits)) {
      return NextResponse.json({ valid: false, taken: false })
    }

    const { data } = await admin
      .from('instructor_profiles')
      .select('id')
      .eq('cpf', digits)
      .maybeSingle()

    return NextResponse.json({ valid: true, taken: Boolean(data) })
  }

  if (field === 'email') {
    const email = value.trim().toLowerCase()
    const { data } = await admin.rpc('check_email_taken', { check_email: email })
    return NextResponse.json({ taken: Boolean(data) })
  }

  return NextResponse.json({ error: 'Campo nao suportado.' }, { status: 400 })
}

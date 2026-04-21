import { redirect } from 'next/navigation'

import { AuthLoginForm } from '@/components/auth/AuthLoginForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  searchParams: Promise<{
    next?: string
    oauth?: string
  }>
}

function getSafeNextPath(next?: string) {
  if (!next || !next.startsWith('/')) {
    return '/aluno'
  }

  return next
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const nextPath = getSafeNextPath(resolvedSearchParams.next)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(nextPath)
  }

  return (
    <AuthShell eyebrow="Login do aluno">
      <AuthLoginForm role="student" nextPath={nextPath} />
    </AuthShell>
  )
}

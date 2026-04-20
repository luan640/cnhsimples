import { Suspense } from 'react'
import type { Metadata } from 'next'

import { AuthShell } from '@/components/auth/AuthShell'
import { StudentSignupForm } from '@/components/auth/StudentSignupForm'

export const metadata: Metadata = {
  title: 'Cadastro do Aluno | CNH Simples',
  description: 'Crie sua conta de aluno, informe sua localização e defina seu perfil de aprendizado.',
}

export default function Page() {
  return (
    <AuthShell eyebrow="Cadastro do aluno">
      <Suspense>
        <StudentSignupForm />
      </Suspense>
    </AuthShell>
  )
}

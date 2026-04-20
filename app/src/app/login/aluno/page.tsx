import { AuthLoginForm } from '@/components/auth/AuthLoginForm'
import { AuthShell } from '@/components/auth/AuthShell'

export default function Page() {
  return (
    <AuthShell eyebrow="Login do aluno">
      <AuthLoginForm role="student" />
    </AuthShell>
  )
}

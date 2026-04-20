import { AuthShell } from '@/components/auth/AuthShell'
import { InstructorSignupForm } from '@/components/auth/InstructorSignupForm'

export default function Page() {
  return (
    <AuthShell eyebrow="Cadastro do instrutor">
      <InstructorSignupForm />
    </AuthShell>
  )
}

import Link from 'next/link'
import { CheckCircle2, GraduationCap, ShieldCheck } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined
  const role = readParam(params?.role)
  const isInstructor = role === 'instructor'
  const loginHref = isInstructor ? '/login/instrutor' : '/login/aluno'
  const loginLabel = isInstructor ? 'Ir para o login do instrutor' : 'Ir para o login do aluno'

  return (
    <AuthShell eyebrow="Confirmacao de e-mail">
      <div
        className="w-full max-w-2xl rounded-[20px] border border-[#E2E8F0] bg-white p-6 md:p-8"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#065F46]">
          <CheckCircle2 size={14} />
          E-mail confirmado
        </div>

        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#0F172A]">
          {isInstructor ? <ShieldCheck size={22} /> : <GraduationCap size={22} />}
        </div>

        <h1 className="text-[28px] font-bold leading-tight text-[#0F172A]">
          Sua conta foi confirmada com sucesso
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">
          {isInstructor
            ? 'Seu e-mail foi validado. Agora voce pode entrar para acompanhar o status da analise do cadastro.'
            : 'Seu e-mail foi validado. Agora voce pode entrar normalmente e continuar sua jornada na plataforma.'}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={loginHref}
            className="inline-flex min-h-11 items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-[#0F172A]"
            style={{ background: '#3ECF8E' }}
          >
            {loginLabel}
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[#E2E8F0] px-4 text-sm font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC]"
          >
            Voltar ao inicio
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}

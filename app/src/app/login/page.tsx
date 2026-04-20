import Link from 'next/link'
import { ArrowRight, CarFront, GraduationCap, ShieldCheck } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'

export default function Page() {
  return (
    <AuthShell eyebrow="Acesso">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[20px] bg-[#0F172A] p-7 text-white md:p-10">
          <div className="max-w-lg">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
              Fluxo de login
            </div>
            <h1 className="text-[32px] font-bold leading-tight md:text-[42px]">
              Entre na sua conta e continue de onde parou.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/72 md:text-base">
              O clique em “Entrar” agora leva para uma rota dedicada de autenticação, no mesmo
              ritmo do Preply: página exclusiva, escolha clara do fluxo e entrada direta para cada
              perfil.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/login/aluno"
                className="rounded-[14px] border border-white/10 bg-white/6 p-4 transition-colors hover:bg-white/10"
              >
                <GraduationCap size={24} className="mb-3 text-[#3ECF8E]" />
                <div className="text-lg font-semibold">Sou Aluno</div>
                <div className="mt-1 text-sm text-white/72">
                  Buscar instrutor, agendar aula e acompanhar sua evolução.
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white">
                  Entrar agora
                  <ArrowRight size={16} />
                </div>
              </Link>

              <Link
                href="/login/instrutor"
                className="rounded-[14px] border border-white/10 bg-white/6 p-4 transition-colors hover:bg-white/10"
              >
                <ShieldCheck size={24} className="mb-3 text-[#3ECF8E]" />
                <div className="text-lg font-semibold">Sou Instrutor</div>
                <div className="mt-1 text-sm text-white/72">
                  Gerenciar agenda, carteira, documentos e mensalidade.
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white">
                  Entrar agora
                  <ArrowRight size={16} />
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section
          className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 md:p-8"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
            <CarFront size={14} />
            Como funciona
          </div>

          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Escolha seu perfil</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                O CNH Simples mantém a separação explícita do md: aluno e instrutor têm jornadas
                diferentes desde o início.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[14px] bg-[#F8FAFC] p-4">
                <div className="text-sm font-semibold text-[#0F172A]">Aluno</div>
                <div className="mt-1 text-sm text-[#64748B]">
                  Login social primeiro, depois e-mail/senha como alternativa.
                </div>
              </div>
              <div className="rounded-[14px] bg-[#F8FAFC] p-4">
                <div className="text-sm font-semibold text-[#0F172A]">Instrutor</div>
                <div className="mt-1 text-sm text-[#64748B]">
                  Entrada controlada por e-mail e senha, alinhada à validação documental.
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-5 text-sm text-[#64748B]">
              Ainda não tem conta?{' '}
              <Link href="/cadastro/aluno" className="font-semibold text-[#0F172A] hover:text-[#0284C7]">
                Criar conta de aluno
              </Link>{' '}
              ou{' '}
              <Link
                href="/cadastro/instrutor"
                className="font-semibold text-[#0F172A] hover:text-[#0284C7]"
              >
                cadastrar-se como instrutor
              </Link>
              .
            </div>
          </div>
        </section>
      </div>
    </AuthShell>
  )
}

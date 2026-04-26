'use client'

import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { completeOnboarding } from './actions'
import type { OnboardingStep } from '@/lib/instructors/onboarding'

const STEP_CONFIG = {
  service: {
    title: 'Crie seu primeiro serviço',
    description: 'Defina os tipos de aula que você oferece, duração e preços.',
    cta: 'Criar serviço',
    href: '/servicos?from=onboarding',
  },
  agenda: {
    title: 'Configure sua agenda',
    description: 'Defina os dias e horários em que você está disponível para dar aulas.',
    cta: 'Configurar agenda',
    href: '/agenda?from=onboarding',
  },
  pix: {
    title: 'Adicione sua chave PIX',
    description: 'Informe a chave PIX que receberá seus pagamentos pela plataforma.',
    cta: 'Adicionar chave PIX',
    href: '/carteira?from=onboarding',
  },
  done: {
    title: 'Tudo pronto!',
    description: '',
    cta: '',
    href: '',
  },
}

type Props = {
  steps: OnboardingStep[]
  firstName: string
}

export function OnboardingWizard({ steps, firstName }: Props) {
  const visibleSteps = steps.filter(s => s.id !== 'done')
  const currentStep = visibleSteps.find(s => !s.completed) ?? null
  const allDone = currentStep === null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#F8FAFC' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{ background: '#ECFDF5' }}
          >
            🎉
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#0F172A' }}>
            {allDone ? `Tudo pronto, ${firstName}!` : `Quase lá, ${firstName}!`}
          </h1>
          <p className="text-sm" style={{ color: '#64748B' }}>
            {allDone
              ? 'Seu perfil está completo. Os alunos já conseguem te encontrar na busca.'
              : 'Complete os passos abaixo para ativar seu perfil completamente.'}
          </p>
        </div>

        {/* Steps */}
        <div
          className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden mb-4"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
        >
          {visibleSteps.map((step, index) => {
            const config = STEP_CONFIG[step.id]
            const isCurrent = !allDone && step.id === currentStep?.id

            return (
              <div
                key={step.id}
                className={`px-6 py-5 ${index < visibleSteps.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}
                style={{
                  background: isCurrent ? '#F0FFF8' : 'white',
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    {step.completed ? (
                      <CheckCircle2 size={22} style={{ color: '#3ECF8E' }} />
                    ) : isCurrent ? (
                      <div
                        className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: '#3ECF8E' }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3ECF8E' }} />
                      </div>
                    ) : (
                      <Circle size={22} style={{ color: '#CBD5E1' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold"
                      style={{
                        color: step.completed ? '#059669' : isCurrent ? '#0F172A' : '#94A3B8',
                      }}
                    >
                      {config.title}
                    </p>
                    {!step.completed && (
                      <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                        {config.description}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  {isCurrent && (
                    <a
                      href={config.href}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[9999px] text-xs font-semibold transition-opacity hover:opacity-90"
                      style={{ background: '#3ECF8E', color: '#0F172A' }}
                    >
                      {config.cta}
                      <ArrowRight size={13} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Final CTA */}
        {allDone && (
          <div
            className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 mb-4 text-center"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
          >
            <p className="text-sm mb-4" style={{ color: '#64748B' }}>
              Seu perfil está visível para alunos na busca. Você receberá notificações quando um aluno entrar em contato.
            </p>
            <form action={completeOnboarding}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-[9999px] text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#3ECF8E', color: '#0F172A' }}
              >
                Ir para o painel
                <ArrowRight size={15} />
              </button>
            </form>
          </div>
        )}

        {/* Progress indicator */}
        {!allDone && (
          <p className="text-center text-xs" style={{ color: '#94A3B8' }}>
            {visibleSteps.filter(s => s.completed).length} de {visibleSteps.length} passos concluídos
          </p>
        )}
      </div>
    </div>
  )
}

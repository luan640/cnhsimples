import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Clock, FileText, Mail } from 'lucide-react'

import { MembershipPaymentButton } from '@/components/painel/MembershipPaymentButton'
import type { InstructorSubscription } from '@/lib/instructors/subscriptions'
import type { InstructorStatus } from '@/types'

interface Props {
  status: Exclude<InstructorStatus, 'active' | 'inactive' | 'suspended'>
  rejectionReason?: string | null
  instructorName?: string
  membership?: InstructorSubscription | null
  membershipFlash?: string | null
}

const STEPS = [
  { label: 'Cadastro enviado' },
  { label: 'Analise de documentos' },
  { label: 'Pagamento da mensalidade' },
  { label: 'Perfil ativo na plataforma' },
]

function getActiveStep(status: Props['status']): number {
  if (status === 'docs_rejected') return 1
  if (status === 'pending') return 1
  if (status === 'docs_approved') return 2
  return 0
}

export function AwaitingScreen({
  status,
  rejectionReason,
  instructorName = 'Instrutor',
  membership,
  membershipFlash,
}: Props) {
  const activeStep = getActiveStep(status)
  const isRejected = status === 'docs_rejected'
  const needsPayment = status === 'docs_approved'
  const isPending = status === 'pending'
  const membershipAmount = membership?.value ?? 1
  const firstName = instructorName.split(' ')[0]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#F8FAFC' }}
    >
      <div className="w-full max-w-md">
        <div
          className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
        >
          <div
            className="px-8 pt-8 pb-7 text-center"
            style={{
              background: isRejected
                ? 'linear-gradient(135deg, #FEF2F2 0%, #FFF8F8 100%)'
                : needsPayment
                  ? 'linear-gradient(135deg, #ECFDF5 0%, #F0FFF8 100%)'
                  : 'linear-gradient(135deg, #FFFBEB 0%, #FFFFF8 100%)',
            }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: isRejected ? '#FEE2E2' : needsPayment ? '#D1FAE5' : '#FEF3C7',
              }}
            >
              {isRejected ? (
                <AlertTriangle size={36} style={{ color: '#DC2626' }} />
              ) : needsPayment ? (
                <CheckCircle2 size={36} style={{ color: '#3ECF8E' }} />
              ) : (
                <Clock size={36} style={{ color: '#F59E0B' }} strokeWidth={1.5} />
              )}
            </div>

            <h1
              className="text-xl font-bold mb-1.5"
              style={{ color: isRejected ? '#DC2626' : '#0F172A' }}
            >
              {isRejected
                ? 'Atencao necessaria'
                : needsPayment
                  ? 'Documentos aprovados'
                  : `Quase la, ${firstName}!`}
            </h1>

            <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
              {isRejected
                ? 'Um ou mais documentos nao foram aprovados. Veja o motivo abaixo e reenvie.'
                : needsPayment
                  ? 'Seu cadastro foi validado. Ative seu perfil pagando a mensalidade.'
                  : 'Seu cadastro esta sendo analisado pela nossa equipe. Prazo: ate 2 dias uteis.'}
            </p>
          </div>

          {isRejected && (
            <div className="mx-6 mt-5">
              <div
                className="flex gap-3 p-4 rounded-[8px] text-sm"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
              >
                <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#991B1B' }}>
                    Motivo da recusa:
                  </p>
                  <p style={{ color: '#DC2626' }}>
                    {rejectionReason ?? 'Documento ilegivel ou vencido. Envie uma nova foto nitida e valida.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="px-8 py-6">
            {needsPayment && membershipFlash && (
              <div
                className="mb-5 rounded-[10px] p-4 text-sm"
                style={{
                  background:
                    membershipFlash === 'success'
                      ? '#ECFDF5'
                      : membershipFlash === 'error'
                        ? '#FEF2F2'
                        : '#FFFBEB',
                  border:
                    membershipFlash === 'success'
                      ? '1px solid #A7F3D0'
                      : membershipFlash === 'error'
                        ? '1px solid #FECACA'
                        : '1px solid #FDE68A',
                  color:
                    membershipFlash === 'success'
                      ? '#065F46'
                      : membershipFlash === 'error'
                        ? '#B91C1C'
                        : '#92400E',
                }}
              >
                {membershipFlash === 'success'
                  ? 'Pagamento confirmado. Estamos liberando seu acesso.'
                  : membershipFlash === 'error'
                    ? 'Nao foi possivel confirmar o pagamento automaticamente.'
                    : 'Seu pagamento ainda esta em processamento no Mercado Pago.'}
              </div>
            )}

            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#94A3B8' }}>
              Seu progresso
            </p>

            <div className="space-y-4">
              {STEPS.map((step, index) => {
                const done = index < activeStep && !isRejected
                const current = index === activeStep
                const rejected = isRejected && index === 1

                return (
                  <div key={step.label} className="flex items-start gap-3">
                    <div className="relative shrink-0 mt-0.5">
                      {done ? (
                        <CheckCircle2 size={20} style={{ color: '#3ECF8E' }} />
                      ) : rejected ? (
                        <AlertTriangle size={20} style={{ color: '#DC2626' }} />
                      ) : current ? (
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: needsPayment ? '#3ECF8E' : '#F59E0B' }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: needsPayment ? '#3ECF8E' : '#F59E0B',
                              animation: !needsPayment ? 'pulse 1.5s infinite' : undefined,
                            }}
                          />
                        </div>
                      ) : (
                        <Circle size={20} style={{ color: '#E2E8F0' }} />
                      )}

                      {index < STEPS.length - 1 && (
                        <div
                          className="absolute top-5 left-2.5 -translate-x-1/2 w-px h-5"
                          style={{ background: done ? '#3ECF8E' : '#E2E8F0' }}
                        />
                      )}
                    </div>

                    <div className="pb-1">
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: done
                            ? '#059669'
                            : rejected
                              ? '#DC2626'
                              : current
                                ? '#0F172A'
                                : '#CBD5E1',
                        }}
                      >
                        {step.label}
                      </p>
                      {current && isPending && (
                        <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                          Em andamento - voce recebera um e-mail ao finalizar
                        </p>
                      )}
                      {current && needsPayment && (
                        <p className="text-xs mt-0.5" style={{ color: '#059669' }}>
                          Aguardando seu pagamento
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="px-8 pb-8 flex flex-col gap-3">
            {isRejected && (
              <Link
                href="/perfil/instrutor?tab=documentos"
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-[6px] text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#3ECF8E', color: '#0F172A' }}
              >
                <FileText size={16} />
                Reenviar documentos
              </Link>
            )}

            {needsPayment && (
              <div
                className="rounded-[10px] p-4"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: '#0F172A' }}>
                  Mensalidade da plataforma
                </p>
                <p className="text-sm mb-4" style={{ color: '#64748B' }}>
                  Ative seu perfil agora e comece a receber alunos na busca.
                </p>
                <MembershipPaymentButton amount={membershipAmount} />
              </div>
            )}

            {isPending && (
              <div
                className="rounded-[10px] p-4 text-sm"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <p className="font-medium mb-3" style={{ color: '#0F172A' }}>
                  Enquanto aguarda, voce pode:
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Completar seu perfil com foto e bio',
                    'Configurar seus horarios de atendimento',
                    'Definir o valor por aula',
                  ].map((tip) => (
                    <li key={tip} className="flex items-center gap-2.5" style={{ color: '#64748B' }}>
                      <ArrowRight size={13} style={{ color: '#3ECF8E', flexShrink: 0 }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-[8px] text-sm"
              style={{ background: '#EFF6FF', color: '#1D4ED8' }}
            >
              <Mail size={15} className="shrink-0" />
              <span>Voce sera notificado por e-mail sobre atualizacoes.</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#94A3B8' }}>
          Alguma duvida?{' '}
          <Link
            href="/contato"
            className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: '#3ECF8E' }}
          >
            Fale com o suporte
          </Link>
        </p>
      </div>
    </div>
  )
}

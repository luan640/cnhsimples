import Link from 'next/link'
import { Clock, CreditCard, BadgeCheck } from 'lucide-react'

const benefits = [
  { Icon: Clock, text: 'Defina seus próprios horários' },
  { Icon: CreditCard, text: 'Receba por cada aula realizada' },
  { Icon: BadgeCheck, text: 'Sem taxa de matrícula — só mensalidade acessível' },
]

export function InstructorCTA() {
  return (
    <section className="py-16 md:py-24" style={{ background: '#1c1c1c' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10">

          {/* left: copy */}
          <div className="text-center md:text-left max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#3ECF8E' }}>
              Para instrutores autônomos
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-snug">
              Você é instrutor autônomo?<br />
              Conecte-se com alunos em Fortaleza.
            </h2>
            <p className="text-[#a1a1aa] leading-relaxed mb-8">
              Crie seu perfil, configure sua agenda e comece a receber alunos.
              Você decide quando e onde atende.
            </p>

            <Link
              href="/cadastro/instrutor"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[6px] text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#3ECF8E', color: '#0F172A' }}
            >
              Cadastre-se como instrutor
            </Link>
          </div>

          {/* right: benefits */}
          <div className="flex flex-col gap-5 w-full md:w-auto md:min-w-[280px]">
            {benefits.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(62,207,142,0.12)' }}
                >
                  <Icon size={20} style={{ color: '#3ECF8E' }} />
                </div>
                <p className="text-sm text-[#f4f4f5]">{text}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

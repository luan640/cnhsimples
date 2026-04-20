import { Search, CalendarCheck, Car } from 'lucide-react'

const steps = [
  {
    Icon: Search,
    title: 'Encontre seu instrutor',
    description:
      'Busque pelo seu bairro ou CEP e filtre por categoria, preço e disponibilidade.',
  },
  {
    Icon: CalendarCheck,
    title: 'Agende um horário',
    description:
      'Escolha o horário que encaixa na sua rotina e confirme com pagamento seguro.',
  },
  {
    Icon: Car,
    title: 'Dirija com confiança',
    description:
      'Receba aulas práticas com instrutores credenciados pelo DETRAN-CE.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24" style={{ background: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-3">
            Como funciona
          </h2>
          <p className="text-[#64748B] max-w-md mx-auto">
            Em poucos passos você começa a aprender a dirigir com quem realmente sabe.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* connector line — desktop only */}
          <div
            className="hidden md:block absolute top-8 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px"
            style={{ background: '#E2E8F0' }}
          />

          {steps.map(({ Icon, title, description }, i) => (
            <div key={title} className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
              {/* step indicator + icon */}
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: '#D1FAE5' }}
                >
                  <Icon size={28} style={{ color: '#3ECF8E' }} />
                </div>
                <span
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: '#3ECF8E' }}
                >
                  {i + 1}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-[#0F172A] mb-1">{title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

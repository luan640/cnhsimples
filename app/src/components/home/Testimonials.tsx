import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Mariana Souza',
    neighborhood: 'Aldeota, Fortaleza',
    rating: 5,
    text: 'Tinha muito medo de dirigir, mas o Carlos foi extremamente paciente. Em 10 aulas já me sentia segura para fazer o exame. Recomendo demais!',
    initials: 'MS',
    color: '#3ECF8E',
  },
  {
    name: 'Pedro Henrique',
    neighborhood: 'Meireles, Fortaleza',
    rating: 5,
    text: 'A plataforma é super fácil de usar. Agendei em 5 minutos, o pagamento foi seguro e o instrutor chegou no horário combinado. Nota 10.',
    initials: 'PH',
    color: '#F97316',
  },
  {
    name: 'Fernanda Lima',
    neighborhood: 'Maraponga, Fortaleza',
    rating: 5,
    text: 'Passei na primeira tentativa! O Rafael me preparou muito bem para as manobras do DETRAN. Preço justo e atendimento incrível.',
    initials: 'FL',
    color: '#0284C7',
  },
]

export function Testimonials() {
  return (
    <section className="py-16 md:py-24" style={{ background: '#F1F5F9' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-3">
            O que nossos alunos dizem
          </h2>
          <p className="text-[#64748B]">
            Histórias reais de quem aprendeu a dirigir com a CNH Simples.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, neighborhood, rating, text, initials, color }) => (
            <div
              key={name}
              className="bg-white rounded-[12px] p-6 border border-[#E2E8F0]"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              {/* stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} size={14} fill="#F59E0B" className="text-[#F59E0B]" />
                ))}
              </div>

              <p className="text-sm text-[#334155] leading-relaxed mb-6">&ldquo;{text}&rdquo;</p>

              {/* author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: color }}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{name}</p>
                  <p className="text-xs text-[#94A3B8]">{neighborhood}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

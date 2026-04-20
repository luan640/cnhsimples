const metrics = [
  { value: '+50', label: 'Instrutores ativos' },
  { value: '4.9★', label: 'Avaliação média' },
  { value: '+200', label: 'Alunos formados' },
  { value: '100%', label: 'Credenciados DETRAN-CE' },
]

export function SocialProof() {
  return (
    <section className="py-12 border-y" style={{ background: '#ffffff', borderColor: '#E2E8F0' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-center">
              <span
                className="text-3xl md:text-4xl font-bold tabular-nums"
                style={{ color: '#3ECF8E' }}
              >
                {value}
              </span>
              <span className="text-sm text-[#64748B]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

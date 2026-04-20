'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Search, Car, Bike } from 'lucide-react'

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'A' | 'B' | null>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (category) params.set('categoria', category)
    router.push(`/buscar?${params.toString()}`)
  }

  return (
    <section
      className="relative flex items-center min-h-[100dvh] pt-16"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #ffffff 60%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full py-12 md:py-20">
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16">

          {/* ── left: text + search ── */}
          <div className="flex-1 text-center md:text-left">
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#3ECF8E] mb-4">
              <span className="w-5 h-px bg-[#3ECF8E]" />
              Fortaleza e Região Metropolitana
            </p>

            <h1 className="text-[28px] md:text-[44px] lg:text-[52px] font-bold text-[#0F172A] leading-[1.15] mb-5">
              Aprenda a dirigir com<br />
              <span style={{ color: '#3ECF8E' }}>quem entende de verdade.</span>
            </h1>

            <p className="text-base md:text-lg text-[#64748B] leading-relaxed mb-8 max-w-md mx-auto md:mx-0">
              Instrutores autônomos credenciados pelo DETRAN-CE, perto de você,
              com horários flexíveis e pagamento seguro.
            </p>

            {/* search form */}
            <form onSubmit={handleSearch} className="w-full max-w-lg mx-auto md:mx-0">
              <div
                className="flex items-center gap-2 bg-white border rounded-[8px] px-3 py-2.5 mb-4 transition-all"
                style={{
                  borderColor: '#E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <MapPin size={18} className="text-[#94A3B8] shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Seu CEP ou bairro em Fortaleza..."
                  className="flex-1 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none bg-transparent min-w-0"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-[6px] shrink-0 transition-opacity hover:opacity-90 active:opacity-80"
                  style={{ background: '#F97316' }}
                >
                  <Search size={14} />
                  Buscar
                </button>
              </div>

              {/* category pills */}
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <span className="text-sm text-[#94A3B8]">Filtrar:</span>
                {([
                  { key: 'B' as const, label: 'Categoria B', Icon: Car },
                  { key: 'A' as const, label: 'Categoria A', Icon: Bike },
                ]).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(prev => prev === key ? null : key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all"
                    style={{
                      background: category === key ? '#3ECF8E' : 'white',
                      borderColor: category === key ? '#3ECF8E' : '#E2E8F0',
                      color: category === key ? '#0F172A' : '#64748B',
                      fontWeight: category === key ? 600 : 400,
                    }}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* ── right: hero image ── */}
          <div className="flex-1 w-full max-w-md md:max-w-none">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-rVFlPceH4gA?w=900&q=80&auto=format&fit=crop"
                alt="Instrutor sorridente ensinando aluna a dirigir"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* credential badge */}
              <div
                className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-[8px] text-xs font-medium backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.92)', color: '#0F172A' }}
              >
                <span className="w-2 h-2 rounded-full bg-[#3ECF8E]" />
                Credenciados pelo DETRAN-CE
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

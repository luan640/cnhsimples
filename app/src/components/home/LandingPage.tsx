import Image from 'next/image'
import Link from 'next/link'
import {
  BadgeCheck,
  CalendarDays,
  Car,
  CircleUserRound,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Bike,
  UserRoundPlus,
} from 'lucide-react'

type FeaturedInstructor = {
  name: string
  category: string
  neighborhood: string
  rating: number
  reviews: number
  price: number
  image: string
}

const FEATURED_INSTRUCTORS: FeaturedInstructor[] = [
  {
    name: 'Ana Costa',
    category: 'Categoria A',
    neighborhood: 'Aldeota, Fortaleza',
    rating: 4.9,
    reviews: 27,
    price: 60,
    image:
      'https://images.pexels.com/photos/3777946/pexels-photo-3777946.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    name: 'Ricardo Silva',
    category: 'Categoria B',
    neighborhood: 'Meireles, Fortaleza',
    rating: 4.9,
    reviews: 17,
    price: 60,
    image:
      'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    name: 'Juliana Lima',
    category: 'Categoria A',
    neighborhood: 'Papicu, Fortaleza',
    rating: 4.9,
    reviews: 77,
    price: 60,
    image:
      'https://images.pexels.com/photos/3812743/pexels-photo-3812743.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    name: 'Juliana Lima',
    category: 'Categoria A',
    neighborhood: 'Aldeota, Fortaleza',
    rating: 4.9,
    reviews: 3,
    price: 60,
    image:
      'https://images.pexels.com/photos/3812743/pexels-photo-3812743.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    name: 'Paulo Costa',
    category: 'Categoria B',
    neighborhood: 'Papicu, Fortaleza',
    rating: 4.9,
    reviews: 3,
    price: 60,
    image:
      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    name: 'Ricardo Silva',
    category: 'Categoria B',
    neighborhood: 'Meireles, Fortaleza',
    rating: 4.9,
    reviews: 2,
    price: 60,
    image:
      'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
]

const TRUST_ITEMS = [
  { icon: Bike, label: 'Categoria A (Moto)' },
  { icon: Car, label: 'Categoria B (Carro)' },
  { icon: BadgeCheck, label: 'DETRAN-CE Certificado' },
]

const STEPS = [
  {
    icon: Search,
    title: '1. Encontre seu instrutor',
    description: 'Pesquise por localização, categoria e avaliações.',
  },
  {
    icon: CalendarDays,
    title: '2. Agende seu horário',
    description: 'Escolha os melhores horários e reserve online com facilidade.',
  },
  {
    icon: Car,
    title: '3. Comece suas aulas',
    description: 'Aprenda na prática com profissionais qualificados.',
  },
]

const REVIEWS = [
  {
    name: 'Mariana',
    text: 'Consegui marcar com uma instrutora perto de casa e resolver tudo sem autoescola tradicional.',
  },
  {
    name: 'Pedro',
    text: 'O agendamento ficou muito mais claro. Vi o valor, a localização e fechei a aula no mesmo dia.',
  },
  {
    name: 'Fernanda',
    text: 'Foi a primeira vez que senti confiança no processo. Plataforma limpa e instrutores bons de verdade.',
  },
]

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  })
}

function InstructorCard({ instructor }: { instructor: FeaturedInstructor }) {
  return (
    <article className="rounded-[18px] border border-[#E5E7EB] bg-white p-2.5 shadow-[0_18px_35px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative mb-3 aspect-[1.2/0.86] overflow-hidden rounded-[14px]">
        <Image
          src={instructor.image}
          alt={instructor.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 16vw"
        />
        <button
          type="button"
          aria-label={`Salvar ${instructor.name}`}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#6B7280] shadow-sm"
        >
          <CircleUserRound size={14} />
        </button>
      </div>

      <div className="space-y-1 px-1 pb-1">
        <h3 className="text-[1.02rem] font-bold tracking-tight text-[#111827]">{instructor.name}</h3>
        <p className="text-xs font-semibold text-[#1D4ED8]">{instructor.category}</p>
        <p className="flex items-center gap-1 text-xs text-[#374151]">
          <Star size={12} className="fill-[#FBBF24] text-[#FBBF24]" />
          {instructor.rating.toFixed(1)} ({instructor.reviews} reviews)
        </p>
        <p className="flex items-center gap-1 text-xs text-[#6B7280]">
          <MapPin size={11} />
          {instructor.neighborhood}
        </p>
        <p className="pt-1 text-sm font-bold text-[#111827]">
          {formatBRL(instructor.price)}
          <span className="font-semibold text-[#374151]">/aula</span>
        </p>
      </div>
    </article>
  )
}

function AgendaMock() {
  const rows = [
    ['9:00', 'Livre', 'Livre', 'Ocupado', 'Livre', 'Livre'],
    ['10:00', 'Ocupado', 'Livre', 'Livre', 'Livre', 'Ocupado'],
    ['11:00', 'Livre', 'Livre', 'Livre', 'Ocupado', 'Livre'],
    ['12:00', 'Livre', 'Ocupado', 'Livre', 'Livre', 'Livre'],
  ]

  return (
    <div className="rounded-[18px] border border-white/70 bg-white/85 p-3 shadow-[0_18px_40px_rgba(29,78,216,0.12)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between border-b border-[#E5E7EB] pb-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FCA5A5]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FCD34D]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#86EFAC]" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
          Agenda
        </span>
      </div>

      <div className="grid grid-cols-[52px_repeat(5,minmax(0,1fr))] gap-1.5 text-[10px]">
        <div />
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((day) => (
          <div
            key={day}
            className="rounded-md bg-[#EFF6FF] px-1 py-1 text-center font-semibold text-[#1D4ED8]"
          >
            {day}
          </div>
        ))}
        {rows.map(([hour, ...slots]) => (
          <div key={hour} className="contents">
            <div className="rounded-md bg-[#F8FAFC] px-1 py-2 text-center font-semibold text-[#64748B]">
              {hour}
            </div>
            {slots.map((slot, index) => (
              <div
                key={`${hour}-${index}`}
                className={`rounded-md px-1 py-2 text-center font-semibold ${
                  slot === 'Livre'
                    ? 'bg-[#DCFCE7] text-[#15803D]'
                    : 'bg-[#E5E7EB] text-[#6B7280]'
                }`}
              >
                {slot}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_48%,#f9fbff_100%)] px-3 py-4 text-[#111827] md:px-6 md:py-10">
      <div className="mx-auto max-w-[1240px] rounded-[30px] border border-white/80 bg-white/92 p-3 shadow-[0_30px_80px_rgba(15,23,42,0.16)] backdrop-blur md:p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[#E5E7EB] bg-white px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2 text-[#111827]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2FF] text-[#1D4ED8]">
              <Car size={16} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Direção<span className="text-[#1D4ED8]">Fácil</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#374151] lg:flex">
            <Link href="/buscar" className="transition-colors hover:text-[#1D4ED8]">
              Encontrar Instrutor
            </Link>
            <Link href="/como-funciona" className="transition-colors hover:text-[#1D4ED8]">
              Como Funciona
            </Link>
            <Link href="/cadastro/instrutor" className="transition-colors hover:text-[#1D4ED8]">
              Para Instrutores
            </Link>
            <Link href="/login/aluno" className="transition-colors hover:text-[#1D4ED8]">
              Login
            </Link>
            <Link
              href="/cadastro/aluno"
              className="rounded-[10px] bg-[#111827] px-4 py-2 text-white transition-opacity hover:opacity-90"
            >
              Cadastre-se
            </Link>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/login/aluno"
              className="rounded-[10px] border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827]"
            >
              Login
            </Link>
            <Link
              href="/buscar"
              className="rounded-[10px] bg-[#111827] px-3 py-2 text-sm font-medium text-white"
            >
              Buscar
            </Link>
          </div>
        </header>

        <main className="space-y-5">
          <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[26px] border border-[#E5E7EB] bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-4">
              <div className="relative overflow-hidden rounded-[20px]">
                <div className="relative min-h-[420px] md:min-h-[510px]">
                  <Image
                    src="https://images.pexels.com/photos/8867431/pexels-photo-8867431.jpeg?auto=compress&cs=tinysrgb&w=1400"
                    alt="Aluna dirigindo com instrutor"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 55vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.62))]" />

                  <div className="absolute inset-x-0 top-0 flex justify-center px-5 pt-8 md:px-10 md:pt-12">
                    <div className="max-w-[560px] text-center text-white">
                      <h1 className="text-[2rem] font-extrabold leading-[1.05] tracking-tight text-white md:text-[3.35rem]">
                        Aprenda a dirigir com instrutores certificados perto de você
                      </h1>
                      <p className="mt-4 text-sm leading-6 text-white/88 md:text-base">
                        Flexibilidade de horários, segurança e a melhor experiência de aprendizagem
                        na sua região. Comece hoje mesmo.
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 px-4 pb-4 md:px-8 md:pb-7">
                    <form
                      action="/buscar"
                      className="mx-auto flex max-w-[470px] items-center gap-3 rounded-full border border-white/70 bg-white px-4 py-3 shadow-[0_15px_30px_rgba(15,23,42,0.18)]"
                    >
                      <Search size={18} className="shrink-0 text-[#9CA3AF]" />
                      <input
                        type="text"
                        name="q"
                        placeholder="Busque por bairro ou nome do instrutor..."
                        className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        Buscar
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-[#E5E7EB] pt-4">
                {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                  <Link
                    key={label}
                    href="/buscar"
                    className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-xs font-semibold text-[#374151] transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF]"
                  >
                    <Icon size={14} className="text-[#1D4ED8]" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <section className="rounded-[26px] border border-[#E5E7EB] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[1.65rem] font-extrabold tracking-tight text-[#111827]">
                      Instrutores em Destaque em Fortaleza
                    </h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Perfis aprovados, próximos e com agenda online.
                    </p>
                  </div>
                  <Link href="/buscar" className="hidden text-sm font-semibold text-[#1D4ED8] md:block">
                    Ver todos
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
                  {FEATURED_INSTRUCTORS.slice(0, 3).map((instructor) => (
                    <InstructorCard
                      key={`${instructor.name}-${instructor.neighborhood}`}
                      instructor={instructor}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-[26px] border border-[#DCEBFF] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(239,246,255,0.94)_52%,_rgba(219,234,254,0.92)_100%)] p-6 shadow-[0_18px_45px_rgba(59,130,246,0.08)]">
                <div className="text-center">
                  <h2 className="text-[1.75rem] font-extrabold tracking-tight text-[#111827]">
                    How It Works
                  </h2>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-3">
                  {STEPS.map(({ icon: Icon, title, description }) => (
                    <div key={title} className="text-center">
                      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#BFDBFE] bg-white text-[#1D4ED8] shadow-sm">
                        <Icon size={25} />
                      </div>
                      <h3 className="mt-4 text-base font-extrabold text-[#111827]">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#4B5563]">{description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid items-center gap-6 rounded-[22px] bg-white/60 p-5 md:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <h3 className="text-[1.35rem] font-extrabold tracking-tight text-[#111827]">
                      Agendamento Descomplicado
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                      Escolha as práticas com profissionais e visualize a agenda qualificada.
                    </p>
                  </div>
                  <AgendaMock />
                </div>
              </section>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[26px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[1.7rem] font-extrabold tracking-tight text-[#111827]">
                    Instrutores em Destaque em Fortaleza
                  </h2>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Veja preço, avaliações e bairro antes de decidir.
                  </p>
                </div>
                <Link href="/buscar" className="hidden text-sm font-semibold text-[#1D4ED8] md:block">
                  Explorar
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {FEATURED_INSTRUCTORS.map((instructor, index) => (
                  <InstructorCard key={`${instructor.name}-${index}`} instructor={instructor} />
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <section className="rounded-[26px] border border-[#E5E7EB] bg-[linear-gradient(135deg,#9FE8C8_0%,#A7F3D0_18%,#D9F99D_100%)] p-6 shadow-[0_18px_45px_rgba(16,185,129,0.14)]">
                <div className="rounded-[22px] bg-white/35 p-6 backdrop-blur">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#047857] shadow-sm">
                    <UserRoundPlus size={22} />
                  </div>
                  <h2 className="mt-4 text-[1.9rem] font-extrabold leading-tight tracking-tight text-[#111827]">
                    Você é instrutor de trânsito?
                    <br />
                    Junte-se à nossa comunidade!
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#1F2937]">
                    Cadastre seu perfil, organize sua agenda e receba alunos da sua região.
                  </p>
                  <Link
                    href="/cadastro/instrutor"
                    className="mt-5 inline-flex rounded-[12px] bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Registrar como Instrutor
                  </Link>
                </div>
              </section>

              <section className="rounded-[26px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[1.45rem] font-extrabold tracking-tight text-[#111827]">
                    Depoimentos
                  </h2>
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]">
                    4.9 de média
                  </span>
                </div>

                <div className="space-y-3">
                  {REVIEWS.map((review) => (
                    <div
                      key={review.name}
                      className="rounded-[18px] border border-[#E5E7EB] bg-[#F9FAFB] p-4"
                    >
                      <div className="mb-2 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} size={14} className="fill-[#FBBF24] text-[#FBBF24]" />
                        ))}
                      </div>
                      <p className="text-sm leading-6 text-[#374151]">{review.text}</p>
                      <p className="mt-3 text-sm font-bold text-[#111827]">{review.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </main>

        <footer className="mt-5 rounded-[24px] border border-[#E5E7EB] bg-white px-5 py-4">
          <div className="flex flex-col gap-4 text-sm text-[#4B5563] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 font-semibold text-[#111827]">
                <ShieldCheck size={15} className="text-[#94A3B8]" />
                Pagamento Seguro
              </span>
              <span className="inline-flex items-center gap-2 font-semibold text-[#111827]">
                <BadgeCheck size={15} className="text-[#16A34A]" />
                DETRAN-CE Aprovado
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="#" className="transition-colors hover:text-[#1D4ED8]">
                Sobre Nós
              </Link>
              <Link href="#" className="transition-colors hover:text-[#1D4ED8]">
                Termos de Uso
              </Link>
              <Link href="#" className="transition-colors hover:text-[#1D4ED8]">
                Política de Privacidade
              </Link>
              <Link href="#" className="transition-colors hover:text-[#1D4ED8]">
                Contato
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

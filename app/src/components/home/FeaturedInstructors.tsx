import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { InstructorCard } from '@/components/instructor/InstructorCard'
import type { InstructorCard as InstructorCardType } from '@/types'

const MOCK_INSTRUCTORS: InstructorCardType[] = [
  {
    id: '1',
    full_name: 'Carlos Eduardo Silva',
    photo_url: null,
    category: 'B',
    neighborhood: 'Meireles',
    city: 'Fortaleza',
    hourly_rate: 120,
    rating: 4.9,
    review_count: 87,
    lesson_count: 320,
    student_count: 95,
    is_super_instructor: true,
    is_new: false,
    is_trending: false,
    bio: 'Instrutor com 8 anos de experiência, especialista em alunos com ansiedade ao volante.',
    status: 'active',
  },
  {
    id: '2',
    full_name: 'Ana Paula Freitas',
    photo_url: null,
    category: 'AB',
    neighborhood: 'Aldeota',
    city: 'Fortaleza',
    hourly_rate: 100,
    rating: 4.8,
    review_count: 52,
    lesson_count: 180,
    student_count: 61,
    is_super_instructor: false,
    is_new: false,
    is_trending: true,
    bio: 'Instrutora certificada, foco em preparação para o exame do DETRAN-CE.',
    status: 'active',
  },
  {
    id: '3',
    full_name: 'Rafael Mendonça',
    photo_url: null,
    category: 'B',
    neighborhood: 'Maraponga',
    city: 'Fortaleza',
    hourly_rate: 90,
    rating: 4.7,
    review_count: 29,
    lesson_count: 95,
    student_count: 34,
    is_super_instructor: false,
    is_new: false,
    is_trending: false,
    bio: 'Atendo Maraponga, Mondubim e arredores. Horários flexíveis inclusive nos fins de semana.',
    status: 'active',
  },
  {
    id: '4',
    full_name: 'Juliana Rocha',
    photo_url: null,
    category: 'A',
    neighborhood: 'Benfica',
    city: 'Fortaleza',
    hourly_rate: 85,
    rating: 5.0,
    review_count: 11,
    lesson_count: 38,
    student_count: 12,
    is_super_instructor: false,
    is_new: true,
    is_trending: false,
    bio: 'Nova na plataforma. Especialista em Categoria A, motociclismo para iniciantes.',
    status: 'active',
  },
]

export function FeaturedInstructors() {
  return (
    <section className="py-16 md:py-24" style={{ background: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">
              Conheça alguns instrutores
            </h2>
            <p className="text-[#64748B]">Todos credenciados pelo DETRAN-CE</p>
          </div>
          <Link
            href="/buscar"
            className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-80"
            style={{ color: '#3ECF8E' }}
          >
            Ver todos
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* cards: horizontal scroll on mobile, grid on desktop */}
        <div className="flex md:grid md:grid-cols-4 gap-5 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory md:snap-none -mx-4 md:mx-0 px-4 md:px-0">
          {MOCK_INSTRUCTORS.map(instructor => (
            <div
              key={instructor.id}
              className="snap-start shrink-0 w-[260px] md:w-auto"
            >
              <InstructorCard instructor={instructor} />
            </div>
          ))}
        </div>

        {/* mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/buscar"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[6px] text-sm font-medium border border-[#E2E8F0] text-[#0F172A] hover:border-[#3ECF8E] transition-colors"
          >
            Ver todos os instrutores
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

import { GraduationCap, MapPin, Phone, UserCheck, Users } from 'lucide-react'

import { listStudents } from '@/lib/admin/queries'

const CATEGORY_LABEL: Record<string, string> = {
  A: 'Categoria A',
  B: 'Categoria B',
  AB: 'Categoria AB',
}

function formatCategory(value: string | null) {
  if (!value) return 'Nao informado'
  return CATEGORY_LABEL[value] ?? value
}

function formatPhone(value: string | null) {
  if (!value) return 'Nao informado'
  return value
}

function formatLocation(city: string | null, neighborhood: string | null) {
  if (city && neighborhood) return `${neighborhood}, ${city}`
  if (city) return city
  if (neighborhood) return neighborhood
  return 'Nao informado'
}

export default async function AdminStudentsPage() {
  const students = await listStudents()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users size={20} style={{ color: '#3ECF8E' }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
              Alunos
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Lista de alunos que ja se cadastraram na plataforma
            </p>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
          style={{ background: '#E0F2FE', color: '#0369A1' }}
        >
          <GraduationCap size={15} />
          {students.length} cadastrados
        </div>
      </div>

      {students.length === 0 ? (
        <div
          className="rounded-[12px] border p-12 text-center"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <Users size={36} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
          <p className="font-medium" style={{ color: '#0F172A' }}>
            Nenhum aluno encontrado
          </p>
          <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
            Quando novos alunos se cadastrarem, eles aparecerao aqui.
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-[12px] border"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: '#64748B' }}>
                  Nome
                </th>
                <th
                  className="hidden px-4 py-3 text-left font-semibold md:table-cell"
                  style={{ color: '#64748B' }}
                >
                  Telefone
                </th>
                <th
                  className="hidden px-4 py-3 text-left font-semibold lg:table-cell"
                  style={{ color: '#64748B' }}
                >
                  Localizacao
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: '#64748B' }}>
                  Interesse
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: '#64748B' }}>
                  CNH
                </th>
                <th
                  className="hidden px-4 py-3 text-left font-semibold lg:table-cell"
                  style={{ color: '#64748B' }}
                >
                  Cadastro
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  style={{ borderTop: index > 0 ? '1px solid #F1F5F9' : undefined }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: '#0F172A' }}>
                      {student.full_name}
                    </div>
                    <div className="mt-1 text-xs md:hidden" style={{ color: '#94A3B8' }}>
                      {formatPhone(student.phone)}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell" style={{ color: '#64748B' }}>
                    <span className="inline-flex items-center gap-2">
                      <Phone size={14} />
                      {formatPhone(student.phone)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell" style={{ color: '#64748B' }}>
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={14} />
                      {formatLocation(student.city, student.neighborhood)}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#64748B' }}>
                    {formatCategory(student.category_interest)}
                  </td>
                  <td className="px-4 py-3">
                    {student.has_cnh ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: '#F0FDF4', color: '#15803D' }}
                      >
                        <UserCheck size={11} />
                        Possui
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: '#FEF3C7', color: '#92400E' }}
                      >
                        Nao possui
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-sm lg:table-cell" style={{ color: '#94A3B8' }}>
                    {new Date(student.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { updateInstructorPlatformSplit } from '@/app/admin/instrutores/[id]/actions'
import { InstructorActions } from '@/components/admin/InstructorActions'
import { RevenueSplitSettingsCard } from '@/components/admin/RevenueSplitSettingsCard'
import { getInstructorDetail, getRevenueSplitSettings } from '@/lib/admin/queries'
import { formatSplitPercent } from '@/lib/revenue-split'
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  docs_rejected: 'Doc. Rejeitados',
  docs_approved: 'Doc. Aprovados',
  active: 'Ativo',
  inactive: 'Inativo',
  suspended: 'Suspenso',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  docs_rejected: '#EF4444',
  docs_approved: '#3B82F6',
  active: '#3ECF8E',
  inactive: '#94A3B8',
  suspended: '#F97316',
}

const DOC_LABEL: Record<string, string> = {
  cnh: 'CNH',
  detran_credential: 'Credencial DETRAN',
  formation_certificate: 'Certif. de Formação',
  criminal_record: 'Cert. Antecedentes Criminais',
  address_proof: 'Comprovante de Residência',
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: '#0F172A' }}>
        {value}
      </span>
    </div>
  )
}

export default async function InstructorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [result, revenueSplitSettings] = await Promise.all([
    getInstructorDetail(id),
    getRevenueSplitSettings(),
  ])
  if (!result) notFound()

  const { profile, documents } = result
  const defaultPlatformSplitPercent = formatSplitPercent(
    revenueSplitSettings.defaultPlatformSplitRate
  )
  const instructorPlatformSplitPercent = formatSplitPercent(
    profile.platform_split_rate ?? revenueSplitSettings.defaultPlatformSplitRate
  )

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Link
        href="/admin/instrutores"
        className="inline-flex items-center gap-1.5 text-sm"
        style={{ color: '#64748B' }}
      >
        <ArrowLeft size={15} />
        Instrutores
      </Link>

      <div className="flex items-start gap-4 flex-wrap">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
          style={{ background: '#1c1c1c', color: '#3ECF8E' }}
        >
          {profile.full_name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
            {profile.full_name}
          </h1>
          <p className="text-sm" style={{ color: '#64748B' }}>
            {profile.email}
          </p>
          <span
            className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: `${STATUS_COLOR[profile.status] ?? '#94A3B8'}18`,
              color: STATUS_COLOR[profile.status] ?? '#94A3B8',
            }}
          >
            {STATUS_LABEL[profile.status] ?? profile.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div
            className="rounded-[12px] border p-5"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>
              Dados Pessoais
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Row label="CPF" value={profile.cpf} />
              <Row label="Telefone" value={profile.phone} />
              <Row label="CEP" value={profile.cep} />
              <Row
                label="Cidade / Estado"
                value={profile.city ? `${profile.city} / ${profile.state ?? 'CE'}` : null}
              />
              <Row label="Bairro" value={profile.neighborhood} />
              <Row
                label="Endereço"
                value={profile.street ? `${profile.street}, ${profile.number ?? 'S/N'}` : null}
              />
            </div>
          </div>

          <div
            className="rounded-[12px] border p-5"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>
              Dados Profissionais
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Categoria CNH" value={profile.category} />
              <Row label="Número da CNH" value={profile.cnh_number} />
              <Row
                label="Validade CNH"
                value={
                  profile.cnh_expires_at
                    ? new Date(profile.cnh_expires_at).toLocaleDateString('pt-BR')
                    : null
                }
              />
              <Row label="Credencial DETRAN" value={profile.detran_credential_number} />
              <Row
                label="Validade Credencial"
                value={
                  profile.detran_credential_expires_at
                    ? new Date(profile.detran_credential_expires_at).toLocaleDateString('pt-BR')
                    : null
                }
              />
              <Row label="Experiência (anos)" value={profile.experience_years} />
              <Row
                label="Valor/hora"
                value={profile.hourly_rate ? `R$ ${Number(profile.hourly_rate).toFixed(2)}` : null}
              />
              <Row
                label="Raio de atendimento"
                value={profile.service_radius_km ? `${profile.service_radius_km} km` : null}
              />
            </div>
            {profile.bio && (
              <div className="mt-4">
                <span className="text-xs font-medium block mb-1" style={{ color: '#94A3B8' }}>
                  Bio
                </span>
                <p className="text-sm" style={{ color: '#0F172A' }}>
                  {profile.bio}
                </p>
              </div>
            )}
          </div>

          <div
            className="rounded-[12px] border p-5"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>
              Dados para Saque (PIX)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Tipo de Chave" value={profile.pix_key_type} />
              <Row label="Chave PIX" value={profile.pix_key} />
            </div>
          </div>

          <div
            className="rounded-[12px] border p-5"
            style={{ background: '#fff', borderColor: '#E2E8F0' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>
              Documentos enviados
            </p>
            {documents.length === 0 ? (
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                Nenhum documento enviado.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-[8px] transition-colors"
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    <FileText size={16} style={{ color: '#64748B', flexShrink: 0 }} />
                    <span className="flex-1 text-sm font-medium" style={{ color: '#0F172A' }}>
                      {DOC_LABEL[doc.type] ?? doc.type}
                    </span>
                    <ExternalLink size={14} style={{ color: '#94A3B8' }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <InstructorActions instructorId={profile.id} userId={profile.user_id} status={profile.status} />

          <RevenueSplitSettingsCard
            title="Split deste instrutor"
            description="Opcionalmente sobrescreva o split padrão apenas para este instrutor. O percentual vale para novos pagamentos."
            defaultPlatformSplitPercent={defaultPlatformSplitPercent}
            currentPlatformSplitPercent={instructorPlatformSplitPercent}
            inherited={profile.platform_split_rate == null}
            onSave={updateInstructorPlatformSplit.bind(null, profile.id)}
          />

          {profile.rejection_reason && (
            <div
              className="rounded-[12px] border p-4"
              style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: '#DC2626' }}>
                Motivo da rejeição
              </p>
              <p className="text-sm" style={{ color: '#DC2626' }}>
                {profile.rejection_reason}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'

type Props = {
  title: string
  description: string
  defaultPlatformSplitPercent: number
  currentPlatformSplitPercent: number
  inherited: boolean
  showInheritanceOptions?: boolean
  onSave: (formData: FormData) => Promise<void>
}

function formatPercent(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export function RevenueSplitSettingsCard({
  title,
  description,
  defaultPlatformSplitPercent,
  currentPlatformSplitPercent,
  inherited,
  showInheritanceOptions = true,
  onSave,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'default' | 'custom'>(
    showInheritanceOptions ? (inherited ? 'default' : 'custom') : 'custom'
  )
  const [value, setValue] = useState(String(formatPercent(currentPlatformSplitPercent)))
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await onSave(formData)
        setFeedback({ type: 'success', message: 'Split salvo com sucesso.' })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível salvar o split.'
        setFeedback({ type: 'error', message })
      }
    })
  }

  return (
    <div
      className="rounded-[12px] border p-5 space-y-4"
      style={{ background: '#fff', borderColor: '#E2E8F0' }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
          {title}
        </p>
        <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
          {description}
        </p>
      </div>

      <div
        className="rounded-[10px] border px-4 py-3 text-sm"
        style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }}
      >
        Plataforma: <strong>{formatPercent(currentPlatformSplitPercent)}%</strong>
        {' · '}
        Instrutor: <strong>{formatPercent(100 - currentPlatformSplitPercent)}%</strong>
        {inherited ? <span style={{ color: '#94A3B8' }}> · herdado do padrão</span> : null}
      </div>

      {feedback && (
        <div
          className="px-4 py-3 rounded-[8px] text-sm"
          style={{
            background: feedback.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            color: feedback.type === 'success' ? '#16A34A' : '#DC2626',
            border: `1px solid ${feedback.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        {showInheritanceOptions ? (
          <div className="space-y-2">
            <label className="flex items-start gap-3 text-sm" style={{ color: '#0F172A' }}>
              <input
                type="radio"
                name="mode"
                value="default"
                checked={mode === 'default'}
                onChange={() => setMode('default')}
                disabled={isPending}
                className="mt-0.5"
              />
              <span>
                Usar padrão do sistema
                <span className="block text-xs" style={{ color: '#94A3B8' }}>
                  Plataforma {formatPercent(defaultPlatformSplitPercent)}% · Instrutor{' '}
                  {formatPercent(100 - defaultPlatformSplitPercent)}%
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm" style={{ color: '#0F172A' }}>
              <input
                type="radio"
                name="mode"
                value="custom"
                checked={mode === 'custom'}
                onChange={() => setMode('custom')}
                disabled={isPending}
                className="mt-0.5"
              />
              <span>
                Usar percentual próprio
                <span className="block text-xs" style={{ color: '#94A3B8' }}>
                  Defina quanto fica com a plataforma para este contexto.
                </span>
              </span>
            </label>
          </div>
        ) : (
          <input type="hidden" name="mode" value="custom" />
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium" style={{ color: '#64748B' }}>
            Percentual da plataforma
          </label>
          <div
            className="flex items-center overflow-hidden rounded-[8px] border"
            style={{ borderColor: '#E2E8F0', opacity: mode === 'custom' ? 1 : 0.55 }}
          >
            <input
              type="number"
              name="platform_split_percent"
              min={0}
              max={99.99}
              step={0.01}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              disabled={isPending || mode !== 'custom'}
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ color: '#0F172A' }}
            />
            <span
              className="border-l px-3 text-sm font-medium"
              style={{ borderColor: '#E2E8F0', color: '#94A3B8' }}
            >
              %
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-[8px] py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ background: '#3ECF8E', color: '#0F172A' }}
        >
          {isPending ? 'Salvando...' : 'Salvar split'}
        </button>
      </form>
    </div>
  )
}

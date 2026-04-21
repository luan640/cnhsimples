import { createAdminClient } from '@/lib/supabase/admin'

export const FALLBACK_PLATFORM_SPLIT_RATE = 0.2

export type RevenueSplitConfig = {
  platformSplitRate: number
  instructorSplitRate: number
  source: 'fallback' | 'global_default' | 'instructor_override'
}

function normalizeRate(value: unknown, fallback = FALLBACK_PLATFORM_SPLIT_RATE) {
  if (value == null) return fallback
  const rate = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(rate) || rate < 0 || rate >= 1) {
    return fallback
  }

  return rate
}

export function formatSplitPercent(rate: number) {
  return Number((normalizeRate(rate) * 100).toFixed(2))
}

export function studentPriceFromInstructorAmount(
  instructorAmount: number,
  platformSplitRate: number
) {
  const rate = normalizeRate(platformSplitRate)
  if (rate >= 1) {
    return instructorAmount
  }

  return instructorAmount / (1 - rate)
}

export async function getRevenueSplitConfig(
  instructorId?: string | null
): Promise<RevenueSplitConfig> {
  const admin = createAdminClient()

  const [settingsResult, instructorResult] = await Promise.all([
    admin
      .from('platform_settings')
      .select('default_platform_split_rate')
      .eq('id', true)
      .maybeSingle(),
    instructorId
      ? admin
          .from('instructor_profiles')
          .select('platform_split_rate')
          .eq('id', instructorId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const defaultPlatformSplitRate = normalizeRate(
    settingsResult.data?.default_platform_split_rate,
    FALLBACK_PLATFORM_SPLIT_RATE
  )

  const instructorPlatformSplitRate = instructorResult.data?.platform_split_rate
  const hasInstructorOverride =
    instructorPlatformSplitRate != null &&
    Number.isFinite(Number(instructorPlatformSplitRate))

  const platformSplitRate = hasInstructorOverride
    ? normalizeRate(instructorPlatformSplitRate, defaultPlatformSplitRate)
    : defaultPlatformSplitRate

  return {
    platformSplitRate,
    instructorSplitRate: Math.max(0, Number((1 - platformSplitRate).toFixed(4))),
    source: hasInstructorOverride
      ? 'instructor_override'
      : settingsResult.data
        ? 'global_default'
        : 'fallback',
  }
}

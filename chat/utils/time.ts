export function formatRelativeTime(epochMs: number | undefined): string {
  if (!epochMs) return ""
  const diffMs = Date.now() - epochMs
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000))
  if (diffSeconds < 60) return `${diffSeconds}s`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}
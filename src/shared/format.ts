const pad = (n: number) => String(n).padStart(2, "0")

/** 1117 → "18:37", 3723 → "1:02:03" */
export const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}

/** 9600 → "2h 40m", 1300 → "21m" */
export const humanDuration = (sec: number) => {
  const m = Math.round(sec / 60)
  if (m < 60) {
    return `${m}m`
  }
  const h = Math.floor(m / 60)
  return m % 60 ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${h}h`
}

/** 1762700000000 → "5m ago", "3h ago", "2d ago" */
export const timeAgo = (ms: number, now = Date.now()) => {
  const s = Math.max(0, Math.round((now - ms) / 1000))
  if (s < 60) {
    return "just now"
  }
  if (s < 3600) {
    return `${Math.floor(s / 60)}m ago`
  }
  if (s < 86400) {
    return `${Math.floor(s / 3600)}h ago`
  }
  return `${Math.floor(s / 86400)}d ago`
}

/** What the UI shows for a UUID: the part before the first dash. Copy actions always use the full id. */
export const displayId = (id: string) => id.split("-")[0]

export const watchUrl = (videoId: string, atSec = 0) =>
  `https://www.youtube.com/watch?v=${videoId}${atSec ? `&t=${Math.floor(atSec)}s` : ""}`

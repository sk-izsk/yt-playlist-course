import { lineFor } from "@/shared/lines"
import type { CourseSummary } from "@/shared/types"

// Lays your real courses out as an octilinear metro map (viewBox 560×420):
// each line enters on the left in its own lane, bends 45° into a shared trunk
// through the middle (the interchange), and leaves on the right in the mirrored lane.

type Pt = [number, number]
export interface MapRoute {
  token: string
  title: string
  hex: string
  d: string
  travelled: string | null
  stops: { x: number; y: number; done: boolean }[]
  label: Pt
  progress: number
}

export const MAX_LINES = 5
const L = 24,
  R = 536,
  HUB_IN = 200,
  HUB_OUT = 360,
  MID = 210,
  TRUNK_GAP = 14
export const HUBS = [HUB_IN, HUB_OUT] as const

const toD = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${+x.toFixed(1)} ${+y.toFixed(1)}`).join(" ")
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1])

/** The polyline cut at fraction t (0..1) of its length; the last point is the cut point. */
export const slice = (pts: Pt[], t: number): Pt[] => {
  const total = pts.slice(1).reduce((s, p, i) => s + dist(pts[i], p), 0)
  let left = Math.max(0, Math.min(1, t)) * total
  const out: Pt[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]]
    const seg = dist(a, b)
    if (left <= seg) {
      const k = seg ? left / seg : 0
      out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k])
      return out
    }
    left -= seg
    out.push(b)
  }
  return out
}

const lane = (i: number, n: number) => (n === 1 ? MID : 50 + (i * 320) / (n - 1))

export const trunkY = (i: number, n: number) => MID + (i - (n - 1) / 2) * TRUNK_GAP

const pathFor = (i: number, n: number): Pt[] => {
  const yIn = lane(i, n),
    yOut = lane(n - 1 - i, n),
    trunk = trunkY(i, n)
  return [
    [L, yIn],
    [HUB_IN - Math.abs(yIn - trunk), yIn],
    [HUB_IN, trunk],
    [HUB_OUT, trunk],
    [HUB_OUT + Math.abs(yOut - trunk), yOut],
    [R, yOut],
  ]
}

// ponytail: stops are sampled (max 8), not one per lesson; a 125-lesson line would be a solid bead chain.
export const layoutRoutes = (courses: CourseSummary[]): MapRoute[] => {
  const picked = courses.toSorted((a, b) => Number(b.pinned) - Number(a.pinned)).slice(0, MAX_LINES)
  return picked.map((c, i) => {
    const pts = pathFor(i, picked.length)
    const progress = c.lessonCount ? c.completedCount / c.lessonCount : 0
    // Stops sit on the outer legs only: on the shared trunk every line's stops would pile up.
    const lens = pts.slice(1).map((p, j) => dist(pts[j], p))
    const total = lens.reduce((s, l) => s + l, 0)
    const legEnd = (lens[0] + lens[1] * 0.4) / total // just before the left interchange
    const legStart = 1 - (lens[4] + lens[3] * 0.6) / total // just after the right interchange
    const k = Math.min(Math.max(c.lessonCount, 2), 8)
    const kLeft = Math.ceil(k / 2),
      kRight = k - kLeft
    const ts = [
      ...Array.from({ length: kLeft }, (_, s) => (kLeft === 1 ? 0 : (s * legEnd) / (kLeft - 1))),
      ...Array.from({ length: kRight }, (_, s) => (kRight === 1 ? 1 : legStart + (s * (1 - legStart)) / (kRight - 1))),
    ]
    const stops = ts.map((t) => {
      const [x, y] = slice(pts, t).at(-1)!
      return { x, y, done: progress > 0 && t <= progress + 1e-9 }
    })
    return {
      token: c.token,
      title: c.title.length > 24 ? `${c.title.slice(0, 23)}…` : c.title,
      hex: lineFor(c.line).hex,
      d: toD(pts),
      travelled: progress > 0 ? toD(slice(pts, progress)) : null,
      stops,
      label: [L, pts[0][1] - 14],
      progress,
    }
  })
}

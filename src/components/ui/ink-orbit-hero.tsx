"use client"

// The hero from ink-orbit-saas-template, standalone: a hatched page, a banded
// headline whose serif line cycles through phrases with a blur, a lede, a
// primary and a bracketed "watch demo" button that opens a live workflow-run
// dialog, a row of drawn faces, and — beside it — the generative 3D ink
// sculpture you can drag, tilt and click to reforge.
//
// No dependencies, no assets. React is the only import.

import React from "react"

export type InkDemoStep = { label: string; detail: string }

export type InkOrbitHeroProps = {
  /** `auto` follows prefers-color-scheme. */
  theme?: "light" | "dark" | "auto"
  titleTop?: string
  /** The serif line. Several entries cycle. */
  titleAccent?: string[]
  description?: string
  primaryCta?: string
  onPrimary?: () => void
  secondaryCta?: string
  /** Called when the secondary button is pressed (the demo dialog still opens unless `demoSteps` is empty). */
  onSecondary?: () => void
  /** The steps the demo dialog plays through. `[]` = no dialog. */
  demoSteps?: InkDemoStep[]
  /** "Loved by <value> teams". `null` hides the row. */
  proof?: { before: string; value: string; after: string } | null
  sculptureSeed?: number
  onReforge?: (seed: number) => void
  sculptureLabel?: string
  /** Under the sculpture. Empty hides it. */
  sculptureHint?: string
  /** Minimum height of the hero panel. Must be a definite length. */
  minHeight?: string
  className?: string
  style?: React.CSSProperties
}

/* --------------------------------------------------------------- defaults */

const D_ACCENTS = ["Intelligent Automation", "Adaptive Workflows", "Autonomous Agents"]
const D_STEPS: InkDemoStep[] = [
  { label: "Ingest", detail: "Pulling 2,184 rows from Sheets, CRM and support inbox" },
  { label: "Classify", detail: "Tagging intents and routing to the right owners" },
  { label: "Predict", detail: "Forecasting next-week churn risk across 312 accounts" },
  { label: "Report", detail: "Drafting the weekly ops report with charts and highlights" },
  { label: "Notify", detail: "Posting the summary to #ops and emailing 6 stakeholders" },
]

/* -------------------------------------------------------------- component */

export default function InkOrbitHero({
  theme = "auto",
  titleTop = "Build Faster With",
  titleAccent = D_ACCENTS,
  description = "NeuraForge AI helps you automate workflows, generate insights, and scale your productivity with next-generation machine intelligence.",
  primaryCta = "Start Free Trial",
  onPrimary,
  secondaryCta = "Watch Demo",
  onSecondary,
  demoSteps = D_STEPS,
  proof = { before: "Loved by", value: "12,400+", after: "teams" },
  sculptureSeed = 7,
  onReforge,
  sculptureLabel = "FORGE · 3D",
  sculptureHint = "Drag to rotate · Click to reforge",
  minHeight = "min(620px, 100svh)",
  className = "",
  style,
}: InkOrbitHeroProps) {
  const uid = "ih" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const accents = titleAccent.length ? titleAccent : [""]

  const [dark, setDark] = React.useState(theme === "dark")
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setDark(theme === "dark")
      return
    }
    const scheme = window.matchMedia("(prefers-color-scheme: dark)")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      setDark(theme === "auto" ? scheme.matches : theme === "dark")
      setReduced(motion.matches)
    }
    sync()
    scheme.addEventListener?.("change", sync)
    motion.addEventListener?.("change", sync)
    return () => {
      scheme.removeEventListener?.("change", sync)
      motion.removeEventListener?.("change", sync)
    }
  }, [theme])

  /* the serif line cycles: blur out, swap, blur in */
  const [wordIx, setWordIx] = React.useState(0)
  const [wordOut, setWordOut] = React.useState(false)
  React.useEffect(() => {
    if (accents.length < 2 || reduced) return
    let out = 0
    const t = setInterval(() => {
      setWordOut(true)
      out = window.setTimeout(() => {
        setWordIx((i) => (i + 1) % accents.length)
        setWordOut(false)
      }, 420)
    }, 3600)
    return () => {
      clearInterval(t)
      clearTimeout(out)
    }
  }, [accents.length, reduced])

  const [demo, setDemo] = React.useState(false)
  const closeDemo = React.useCallback(() => setDemo(false), [])

  return (
    <div className={"ih-root " + className} data-theme={dark ? "dark" : "light"} style={style}>
      <style>{IH_CSS}</style>
      <div className="ih-shell">
        <section className="ih-sec ih-hero" aria-label="Intro" style={{ minHeight }}>
          <div className="ih-hero-copy">
            <div className="ih-band">
              <h1 className="ih-h1">
                <span className="ih-h1-top">{titleTop}</span>
                <span className="ih-h1-acc" aria-live="polite">
                  <span key={wordIx} className={"ih-word" + (wordOut ? " ih-word-out" : "")}>
                    {accents[wordIx % accents.length]}
                  </span>
                </span>
              </h1>
            </div>
            <div className="ih-hero-body">
              {description && <p className="ih-lede">{description}</p>}
              <div className="ih-hero-ctas">
                {primaryCta && (
                  <button type="button" className="ih-btn ih-btn-dark" onClick={onPrimary}>
                    {primaryCta}
                    <Arrow />
                  </button>
                )}
                {secondaryCta && (
                  <span className="ih-frame ih-frame-hover">
                    <Brackets />
                    <button
                      type="button"
                      className="ih-btn ih-btn-ghost"
                      onClick={() => {
                        if (demoSteps.length) setDemo(true)
                        onSecondary?.()
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M3 1.8v8.4L10 6z" fill="currentColor" />
                      </svg>
                      {secondaryCta}
                    </button>
                  </span>
                )}
              </div>
              {proof && (
                <div className="ih-proof">
                  <span className="ih-proof-faces">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i}>
                        <Portrait index={i} size={24} uid={uid + "h"} />
                      </span>
                    ))}
                  </span>
                  <span>
                    {proof.before} <b style={{ color: "var(--ih-ink)", fontWeight: 600 }}>{proof.value}</b> {proof.after}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="ih-art">
            <div className="ih-art-fill">
              <InkOrbitSculpture
                height="100%"
                theme={dark ? "dark" : "light"}
                background={dark ? "#121212" : "#fbfbfb"}
                seed={sculptureSeed}
                onReforge={onReforge}
                label={sculptureLabel}
                hint={sculptureHint}
              />
            </div>
          </div>
        </section>
      </div>
      {demo && <DemoDialog steps={demoSteps} onClose={closeDemo} reduced={reduced} />}
    </div>
  )
}

/* ---------------------------------------------------------------- pieces */

function Brackets() {
  return (
    <>
      <span className="ih-c ih-c-tl" aria-hidden="true" />
      <span className="ih-c ih-c-tr" aria-hidden="true" />
      <span className="ih-c ih-c-bl" aria-hidden="true" />
      <span className="ih-c ih-c-br" aria-hidden="true" />
    </>
  )
}

function Arrow({ size = 14 }: { size?: number }) {
  return (
    <svg className="ih-arr" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 6.4 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* drawn portraits — greyscale, so they sit in the palette */
const PORTRAITS = [
  { hair: "short", beard: true, glasses: false, skin: "#b9b4ae", hairC: "#2b2a29", shirt: "#3a3a3a", bg: "#d9d6d2" },
  { hair: "long", beard: false, glasses: false, skin: "#d6d0c9", hairC: "#8d7f6c", shirt: "#7b7b7b", bg: "#e6e3df" },
  { hair: "buzz", beard: false, glasses: true, skin: "#a7a19a", hairC: "#3d3c3a", shirt: "#1f1f1f", bg: "#cfcfcf" },
  { hair: "bun", beard: false, glasses: true, skin: "#9a8f84", hairC: "#1e1d1c", shirt: "#5a5a5a", bg: "#dedbd6" },
  { hair: "curly", beard: false, glasses: false, skin: "#7f746a", hairC: "#1a1918", shirt: "#8a8a8a", bg: "#d3d0cb" },
  { hair: "side", beard: true, glasses: true, skin: "#c7c0b8", hairC: "#5b5650", shirt: "#2c2c2c", bg: "#e1ded9" },
]

function Portrait({ index, size = 38, uid }: { index: number; size?: number; uid: string }) {
  const p = PORTRAITS[((index % PORTRAITS.length) + PORTRAITS.length) % PORTRAITS.length]
  const id = uid + "pt" + index
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.bg} />
          <stop offset="1" stopColor="#9d9a96" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={"url(#" + id + ")"} />
      {p.hair === "long" && <path d="M18 30c0-12 6-19 14-19s14 7 14 19v20H18z" fill={p.hairC} />}
      {p.hair === "curly" &&
        [[22, 20], [28, 15], [36, 15], [42, 20], [45, 28], [19, 28]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={p.hairC} />)}
      <path d="M8 64c2-12 12-18 24-18s22 6 24 18z" fill={p.shirt} />
      <rect x="27.5" y="36" width="9" height="11" rx="3" fill={p.skin} />
      <path d="M27.5 44c3 2.5 6 2.5 9 0v3h-9z" fill="#000" opacity=".12" />
      <ellipse cx="32" cy="28" rx="11" ry="13" fill={p.skin} />
      {p.hair === "short" && <path d="M21 25c0-9 5-13 11-13s11 4 11 13c-2-4-6-6-11-6s-9 2-11 6z" fill={p.hairC} />}
      {p.hair === "buzz" && <path d="M21.5 24c.5-8 5-11.5 10.5-11.5S42 16 42.5 24c-3-3-6.5-4-10.5-4s-7.5 1-10.5 4z" fill={p.hairC} opacity=".85" />}
      {p.hair === "bun" && (
        <>
          <circle cx="32" cy="11" r="6" fill={p.hairC} />
          <path d="M21 26c0-10 5-14 11-14s11 4 11 14c-2-5-6-7.5-11-7.5S23 21 21 26z" fill={p.hairC} />
        </>
      )}
      {p.hair === "long" && <path d="M21 27c0-10 5-15 11-15s11 5 11 15c-3-6-8-8-14-7-3 .5-6 3-8 7z" fill={p.hairC} />}
      {p.hair === "side" && <path d="M21 26c-1-9 5-14 12-14 6 0 11 4 10 12-4-5-10-6-17-3-2 1-4 3-5 5z" fill={p.hairC} />}
      {p.beard && <path d="M21.5 30c1 9 5 12 10.5 12s9.5-3 10.5-12c-2 4-5 5-10.5 5s-8.5-1-10.5-5z" fill={p.hairC} opacity=".9" />}
      <circle cx="27.5" cy="28" r="1.2" fill="#1a1a1a" />
      <circle cx="36.5" cy="28" r="1.2" fill="#1a1a1a" />
      {p.glasses && (
        <g fill="none" stroke="#1a1a1a" strokeWidth="1.1">
          <circle cx="27.5" cy="28" r="3.6" />
          <circle cx="36.5" cy="28" r="3.6" />
          <path d="M31.1 28h1.8" />
        </g>
      )}
      <path d="M29 34.5c1.8 1.2 4.2 1.2 6 0" fill="none" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

function DemoDialog({ steps, onClose, reduced }: { steps: InkDemoStep[]; onClose: () => void; reduced: boolean }) {
  const [elapsed, setElapsed] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const closeRef = React.useRef(null as HTMLButtonElement | null)
  const per = 1.6
  const total = steps.length * per
  React.useEffect(() => {
    closeRef.current?.focus()
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    addEventListener("keydown", onKey)
    return () => {
      removeEventListener("keydown", onKey)
      prev?.focus?.()
    }
  }, [onClose])
  React.useEffect(() => {
    setElapsed(reduced ? total : 0)
    if (reduced) return
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const e = (now - t0) / 1000
      setElapsed(Math.min(total, e))
      if (e < total) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, total, reduced])
  const done = elapsed >= total
  return (
    <div className="ih-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ih-dialog" role="dialog" aria-modal="true" aria-label="Product demo">
        <div className="ih-dialog-head">
          <span>
            <i className="ih-live" />
            {done ? "run complete · " + total.toFixed(1) + "s" : "workflow running · " + elapsed.toFixed(1) + "s"}
          </span>
          <button ref={closeRef} type="button" className="ih-icon-btn" onClick={onClose} aria-label="Close demo">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ol className="ih-steps" aria-live="polite">
          {steps.map((s, i) => {
            const state = elapsed >= (i + 1) * per ? "done" : elapsed >= i * per ? "run" : "wait"
            return (
              <li key={i} className="ih-step" data-state={state}>
                <span className="ih-step-ix">{state === "done" ? <Check /> : state === "run" ? <i className="ih-spin" /> : String(i + 1).padStart(2, "0")}</span>
                <span>
                  <b>{s.label}</b>
                  <small>{s.detail}</small>
                </span>
                <span className="ih-step-t">{state === "done" ? per.toFixed(1) + "s" : state === "run" ? "…" : ""}</span>
              </li>
            )
          })}
        </ol>
        <div className="ih-bar">
          <i style={{ width: (elapsed / total) * 100 + "%" }} />
        </div>
        <div className="ih-dialog-foot">
          <span>{done ? "Saved ~3h 40m of manual work." : "Sit back — nothing here needs a human."}</span>
          <button type="button" className="ih-btn ih-btn-ghost" onClick={() => setRun((r) => r + 1)} disabled={!done}>
            Replay
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- sculpture */

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1)
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2
}

function hexToRgb(hex: string): [number, number, number] {
  let h = String(hex).replace("#", "").trim()
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  const k = clamp(t, 0, 1)
  return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",") + ")"
}

function rgba(a: string, b: string, t: number, alpha: number): string {
  return mixHex(a, b, t).replace("rgb(", "rgba(").replace(")", "," + alpha + ")")
}

// the next seed after a reforge: a Lehmer step, kept to five digits for the HUD
function nextSeed(seed: number): number {
  const s = Math.abs(Math.floor(seed)) || 1
  const n = ((s * 48271 + 11) % 2147483647) % 100000
  return n === s ? (n + 7919) % 100000 : n
}

// yaw in radians → a compass heading 0–359 for the HUD
function headingOf(yaw: number): number {
  const d = Math.round((yaw * 180) / Math.PI) % 360
  return (d + 360) % 360
}

/* ink loops + bridges, sampled to a fixed-size point cloud so any two seeds
   with the same counts can morph grain-for-grain */
type Cloud = { core: Float32Array; grain: Float32Array; spikes: Float32Array }
const CORE_N = 2800
const GRAIN_N = 16000
const SPIKE_N = 16
const SPHERE_R = 0.3

function buildCloud(seed: number, coreN: number, grainN: number, spikeN: number): Cloud {
  const rand = mulberry32(seed * 2654435761 + 1)
  const unit = (): [number, number, number] => {
    const z = rand() * 2 - 1
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(1 - z * z)
    return [r * Math.cos(a), r * Math.sin(a), z]
  }
  const cross = (a: number[], b: number[]): [number, number, number] => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
  const norm = (v: number[]): [number, number, number] => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1
    return [v[0] / l, v[1] / l, v[2] / l]
  }
  // polylines: x,y,z,width per vertex
  const curves: number[][] = []
  const loops = 3 + Math.floor(rand() * 2)
  const W = 0.092
  for (let k = 0; k < loops; k++) {
    const n = unit()
    const u = norm(cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]))
    const v = cross(n, u)
    const p = Array.from({ length: 8 }, () => rand() * Math.PI * 2)
    const R = 0.9 + rand() * 0.16
    const pts: number[] = []
    const RES = 220
    for (let i = 0; i <= RES; i++) {
      const t = (i / RES) * Math.PI * 2
      const r = R * (1 + 0.15 * Math.sin(2 * t + p[0]) + 0.07 * Math.sin(3 * t + p[1]) + 0.04 * Math.sin(5 * t + p[2]))
      const h = R * (0.24 * Math.sin(2 * t + p[3]) + 0.08 * Math.sin(3 * t + p[4]))
      const c = Math.cos(t) * r
      const s = Math.sin(t) * r
      const w = W * (0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(3 * t + p[5]), 1.5)) * (0.72 + 0.28 * Math.sin(7 * t + p[6]))
      pts.push(u[0] * c + v[0] * s + n[0] * h, u[1] * c + v[1] * s + n[1] * h, u[2] * c + v[2] * s + n[2] * h, Math.max(0.018, w))
    }
    curves.push(pts)
  }
  // bridges: bowed tubes between two loops, thick in the middle
  for (let b = 0; b < 3; b++) {
    const A = curves[Math.floor(rand() * loops)]
    const B = curves[Math.floor(rand() * loops)]
    const ia = Math.floor(rand() * (A.length / 4)) * 4
    const ib = Math.floor(rand() * (B.length / 4)) * 4
    const a = [A[ia], A[ia + 1], A[ia + 2]]
    const c = [B[ib], B[ib + 1], B[ib + 2]]
    const mid = norm([(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2])
    const lift = 1.08 + rand() * 0.18
    const m = [mid[0] * lift, mid[1] * lift, mid[2] * lift]
    const pts: number[] = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const q = 1 - t
      pts.push(
        q * q * a[0] + 2 * q * t * m[0] + t * t * c[0],
        q * q * a[1] + 2 * q * t * m[1] + t * t * c[1],
        q * q * a[2] + 2 * q * t * m[2] + t * t * c[2],
        W * (0.16 + 0.42 * Math.sin(Math.PI * t)),
      )
    }
    curves.push(pts)
  }
  // resample everything by arc length into exactly coreN cores
  const segs: { c: number[]; i: number; len: number }[] = []
  let total = 0
  for (const c of curves) {
    for (let i = 0; i + 4 < c.length; i += 4) {
      const len = Math.hypot(c[i + 4] - c[i], c[i + 5] - c[i + 1], c[i + 6] - c[i + 2])
      segs.push({ c, i, len })
      total += len
    }
  }
  const core = new Float32Array(coreN * 4)
  const tan = new Float32Array(coreN * 3)
  let si = 0
  let acc = 0
  for (let k = 0; k < coreN; k++) {
    const target = ((k + 0.5) / coreN) * total
    while (si < segs.length - 1 && acc + segs[si].len < target) acc += segs[si++].len
    const { c, i, len } = segs[si]
    const f = len ? clamp((target - acc) / len, 0, 1) : 0
    for (let d = 0; d < 4; d++) core[k * 4 + d] = c[i + d] + (c[i + 4 + d] - c[i + d]) * f
    tan.set(norm([c[i + 4] - c[i], c[i + 5] - c[i + 1], c[i + 6] - c[i + 2]]), k * 3)
  }
  // grain: inside and just past each tube's skin, plus a little loose dust
  const grain = new Float32Array(grainN * 3)
  for (let g = 0; g < grainN; g++) {
    const k = Math.floor(rand() * coreN)
    const T = [tan[k * 3], tan[k * 3 + 1], tan[k * 3 + 2]]
    const d = unit()
    const dot = d[0] * T[0] + d[1] * T[1] + d[2] * T[2]
    const o = norm([d[0] - dot * T[0], d[1] - dot * T[1], d[2] - dot * T[2]])
    const w = core[k * 4 + 3]
    const dust = rand() < 0.05
    const r = dust ? w * (1.3 + rand() * 1.6) : w * (0.35 + 0.82 * Math.sqrt(rand()))
    for (let a = 0; a < 3; a++) grain[g * 3 + a] = core[k * 4 + a] + o[a] * r
  }
  // spikes: thin needles bristling outward
  const spikes = new Float32Array(spikeN * 6)
  for (let s = 0; s < spikeN; s++) {
    const k = Math.floor(rand() * coreN)
    const p = [core[k * 4], core[k * 4 + 1], core[k * 4 + 2]]
    const j = unit()
    const dir = norm([p[0] + j[0] * 0.45, p[1] + j[1] * 0.45, p[2] + j[2] * 0.45])
    const len = 0.18 + rand() * 0.42
    spikes.set([p[0], p[1], p[2], p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len], s * 6)
  }
  return { core, grain, spikes }
}

// yaw about Y, then pitch about X; returns screen x, y, depth and scale
function project(x: number, y: number, z: number, yaw: number, pitch: number, f: number): [number, number, number, number] {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const y2 = y * cp - z1 * sp
  const z2 = y * sp + z1 * cp
  const s = f / (f - z2)
  return [x1 * s, y2 * s, z2, s]
}
// #endregion logic

/* -------------------------------------------------------------- component */

type InkOrbitSculptureProps = {
  /** Must be a definite length — the canvas fills this box. */
  height?: string
  /** `auto` follows prefers-color-scheme. */
  theme?: "light" | "dark" | "auto"
  /** 6-digit hex; overrides the theme's ink. */
  ink?: string
  /** 6-digit hex; overrides the theme's paper. */
  background?: string
  /** Starting shape. Change it to morph to a new one. */
  seed?: number
  /** Called with the new seed whenever a click, Enter or the timer reforges. */
  onReforge?: (seed: number) => void
  /** Reforge on its own every N seconds; 0 = never. */
  autoReforge?: number
  /** Idle spin in radians per second. */
  spin?: number
  /** Grain multiplier, 0.25–1.5. Lower it for small or low-power placements. */
  density?: number
  /** The refracting glass sphere at the core. */
  glass?: boolean
  /** Corner readouts: live heading, label, hint and seed. */
  hud?: boolean
  label?: string
  hint?: string
  interactive?: boolean
  maxDpr?: number
  className?: string
}

const THEMES = {
  light: { ink: "#141414", bg: "#fbfbfb" },
  dark: { ink: "#ececec", bg: "#121212" },
}

export function InkOrbitSculpture({
  height = "100svh",
  theme = "auto",
  ink,
  background,
  seed: seedProp = 4211,
  onReforge,
  autoReforge = 0,
  spin = 0.16,
  density = 1,
  glass = true,
  hud = true,
  label = "FORGE · 3D",
  hint = "Drag to rotate · Click to reforge",
  interactive = true,
  maxDpr = 2,
  className = "",
}: InkOrbitSculptureProps) {
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const headingRef = React.useRef(null as HTMLSpanElement | null)
  const [seed, setSeed] = React.useState(seedProp)
  React.useEffect(() => setSeed(seedProp), [seedProp])

  const [dark, setDark] = React.useState(theme === "dark")
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setDark(theme === "dark")
      return
    }
    const scheme = window.matchMedia("(prefers-color-scheme: dark)")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      setDark(theme === "auto" ? scheme.matches : theme === "dark")
      setReduced(motion.matches)
    }
    sync()
    scheme.addEventListener?.("change", sync)
    motion.addEventListener?.("change", sync)
    return () => {
      scheme.removeEventListener?.("change", sync)
      motion.removeEventListener?.("change", sync)
    }
  }, [theme])

  const base = dark ? THEMES.dark : THEMES.light
  const colors = { ink: ink || base.ink, bg: background || base.bg }
  const grainN = Math.round(GRAIN_N * clamp(density, 0.25, 1.5))

  const st = React.useRef({
    yaw: 0.6,
    pitch: 0.18,
    vyaw: 0,
    vpitch: 0,
    leanYaw: 0,
    leanPitch: 0,
    tLeanYaw: 0,
    tLeanPitch: 0,
    drag: false,
    lastX: 0,
    lastY: 0,
    downX: 0,
    downY: 0,
    lastT: 0,
    from: null as Cloud | null,
    to: null as Cloud | null,
    morphT: 1,
    ring: 0,
    dirty: true,
    visible: true,
    heading: -1,
    colors,
    reduced,
    spin,
    glass,
  })
  const s0 = st.current
  s0.colors = colors
  s0.reduced = reduced
  s0.spin = spin
  s0.glass = glass
  s0.dirty = true

  const seedRef = React.useRef(seed)
  seedRef.current = seed
  const onReforgeRef = React.useRef(onReforge)
  onReforgeRef.current = onReforge
  const reforge = React.useCallback(() => {
    const n = nextSeed(seedRef.current)
    seedRef.current = n
    setSeed(n)
    onReforgeRef.current?.(n)
  }, [])

  // a new seed morphs every grain from where it is now to where it's going
  const builtFor = React.useRef({ seed: NaN, grainN: 0 })
  React.useEffect(() => {
    const s = st.current
    const prev = builtFor.current
    const next = buildCloud(seed, CORE_N, grainN, SPIKE_N)
    const canMorph = s.to && prev.grainN === grainN && prev.seed !== seed
    s.from = canMorph ? s.to : null
    s.to = next
    s.morphT = canMorph && !s.reduced ? 0 : 1
    if (canMorph) s.ring = s.reduced ? 0 : 1
    s.dirty = true
    builtFor.current = { seed, grainN }
  }, [seed, grainN])

  React.useEffect(() => {
    if (!autoReforge || autoReforge <= 0 || reduced) return
    const t = setInterval(() => {
      if (st.current.visible && !st.current.drag) reforge()
    }, Math.max(2, autoReforge) * 1000)
    return () => clearInterval(t)
  }, [autoReforge, reduced, reforge])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const lens = document.createElement("canvas")
    const lctx = lens.getContext("2d")
    const s = st.current
    let W = 0
    let H = 0
    let dpr = 1
    const resize = () => {
      dpr = clamp(window.devicePixelRatio || 1, 1, Math.max(1, maxDpr))
      W = Math.max(1, Math.round(canvas.clientWidth * dpr))
      H = Math.max(1, Math.round(canvas.clientHeight * dpr))
      canvas.width = W
      canvas.height = H
      s.dirty = true
    }
    resize()
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null
    ro?.observe(canvas)
    const io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver((es) => {
            s.visible = es.some((e) => e.isIntersecting)
            s.dirty = true
          })
        : null
    io?.observe(canvas)

    const NB = 7
    const px = new Float32Array(CORE_N + grainN)
    const py = new Float32Array(CORE_N + grainN)
    const pr = new Float32Array(CORE_N)
    const bin = new Uint8Array(CORE_N + grainN)
    let raf = 0

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = s.lastT ? Math.min(0.05, (now - s.lastT) / 1000) : 0.016
      s.lastT = now
      const B = s.to
      if (!s.visible || !B || B.grain.length !== grainN * 3) return
      // motion: idle spin eases back in after a flick; pitch springs home
      if (!s.drag) {
        const target = s.reduced ? 0 : s.spin
        s.vyaw += (target - s.vyaw) * Math.min(1, dt * 1.6)
        s.yaw += s.vyaw * dt
        s.pitch += s.vpitch * dt
        s.vpitch *= Math.pow(0.04, dt)
        s.pitch += (0.18 - s.pitch) * Math.min(1, dt * 0.9)
      }
      s.pitch = clamp(s.pitch, -0.95, 1.25)
      s.leanYaw += (s.tLeanYaw - s.leanYaw) * Math.min(1, dt * 3)
      s.leanPitch += (s.tLeanPitch - s.leanPitch) * Math.min(1, dt * 3)
      if (s.morphT < 1) s.morphT = Math.min(1, s.morphT + dt / 1.3)
      if (s.ring > 0) s.ring = Math.max(0, s.ring - dt / 1.1)
      const moving =
        !s.reduced || s.drag || Math.abs(s.vyaw) > 0.002 || Math.abs(s.vpitch) > 0.002 || s.morphT < 1 || s.ring > 0 ||
        Math.abs(s.tLeanYaw - s.leanYaw) > 0.001 || Math.abs(s.tLeanPitch - s.leanPitch) > 0.001
      if (!moving && !s.dirty) return
      s.dirty = false

      const yaw = s.yaw + s.leanYaw
      const pitch = s.pitch + s.leanPitch
      const hd = headingOf(yaw)
      if (hd !== s.heading && headingRef.current) {
        s.heading = hd
        headingRef.current.textContent = "N " + String(hd).padStart(3, "0") + "°"
      }

      const { ink: inkC, bg } = s.colors
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const cx = W / 2
      const cy = H / 2
      const scale = Math.min(W, H) * 0.34
      const f = 3.4
      const m = easeInOutCubic(s.morphT)
      const A = s.from && s.from.grain.length === B.grain.length ? s.from : null
      const mixP = (arrB: Float32Array, arrA: Float32Array | undefined, i: number) => (arrA && m < 1 ? arrA[i] + (arrB[i] - arrA[i]) * m : arrB[i])

      // crosshair behind everything
      const reach = scale * 1.38
      const grad = (x1: number, y1: number, x2: number, y2: number) => {
        const g = ctx.createLinearGradient(x1, y1, x2, y2)
        g.addColorStop(0, mixHex(inkC, bg, 1))
        g.addColorStop(0.5, mixHex(inkC, bg, 0.35))
        g.addColorStop(1, mixHex(inkC, bg, 1))
        return g
      }
      ctx.lineWidth = Math.max(1, dpr)
      ctx.strokeStyle = grad(cx, cy - reach, cx, cy + reach)
      ctx.beginPath()
      ctx.moveTo(cx, cy - reach)
      ctx.lineTo(cx, cy + reach)
      ctx.stroke()
      ctx.strokeStyle = grad(cx - reach, cy, cx + reach, cy)
      ctx.beginPath()
      ctx.moveTo(cx - reach, cy)
      ctx.lineTo(cx + reach, cy)
      ctx.stroke()

      // reforge shock ring
      if (s.ring > 0) {
        const k = 1 - s.ring
        ctx.strokeStyle = rgba(inkC, bg, 0.2 + 0.7 * k, s.ring * 0.8)
        ctx.lineWidth = Math.max(1, dpr * (1 + 2 * s.ring))
        ctx.beginPath()
        ctx.arc(cx, cy, scale * (0.32 + k * 1.25), 0, Math.PI * 2)
        ctx.stroke()
      }

      // project
      for (let i = 0; i < CORE_N; i++) {
        const [x, y, z, sc] = project(mixP(B.core, A?.core, i * 4), mixP(B.core, A?.core, i * 4 + 1), mixP(B.core, A?.core, i * 4 + 2), yaw, pitch, f)
        px[i] = cx + x * scale
        py[i] = cy + y * scale
        pr[i] = mixP(B.core, A?.core, i * 4 + 3) * scale * sc * 0.78
        bin[i] = clamp(Math.floor(((z + 1.25) / 2.5) * NB), 0, NB - 1)
      }
      for (let g = 0; g < grainN; g++) {
        const i = CORE_N + g
        const [x, y, z] = project(mixP(B.grain, A?.grain, g * 3), mixP(B.grain, A?.grain, g * 3 + 1), mixP(B.grain, A?.grain, g * 3 + 2), yaw, pitch, f)
        px[i] = cx + x * scale
        py[i] = cy + y * scale
        bin[i] = clamp(Math.floor(((z + 1.25) / 2.5) * NB), 0, NB - 1)
      }
      const gs = Math.max(1, 1.15 * dpr)
      const pass = (b: number) => {
        const fade = 0.62 * (1 - b / (NB - 1))
        ctx.fillStyle = mixHex(inkC, bg, fade)
        ctx.beginPath()
        for (let i = 0; i < CORE_N; i++) {
          if (bin[i] !== b) continue
          ctx.moveTo(px[i] + pr[i], py[i])
          ctx.arc(px[i], py[i], pr[i], 0, Math.PI * 2)
        }
        ctx.fill()
        ctx.fillStyle = mixHex(inkC, bg, Math.min(0.85, fade + 0.12))
        for (let i = CORE_N; i < CORE_N + grainN; i++) if (bin[i] === b) ctx.fillRect(px[i], py[i], gs, gs)
      }
      const spikes = (front: boolean) => {
        ctx.lineWidth = Math.max(0.75, 0.8 * dpr)
        for (let k = 0; k < SPIKE_N; k++) {
          const o = k * 6
          const a = project(mixP(B.spikes, A?.spikes, o), mixP(B.spikes, A?.spikes, o + 1), mixP(B.spikes, A?.spikes, o + 2), yaw, pitch, f)
          const e = project(mixP(B.spikes, A?.spikes, o + 3), mixP(B.spikes, A?.spikes, o + 4), mixP(B.spikes, A?.spikes, o + 5), yaw, pitch, f)
          if (a[2] >= 0 !== front) continue
          const g = ctx.createLinearGradient(cx + a[0] * scale, cy + a[1] * scale, cx + e[0] * scale, cy + e[1] * scale)
          g.addColorStop(0, mixHex(inkC, bg, front ? 0.1 : 0.5))
          g.addColorStop(1, mixHex(inkC, bg, 1))
          ctx.strokeStyle = g
          ctx.beginPath()
          ctx.moveTo(cx + a[0] * scale, cy + a[1] * scale)
          ctx.lineTo(cx + e[0] * scale, cy + e[1] * scale)
          ctx.stroke()
        }
      }

      spikes(false)
      for (let b = 0; b < Math.floor(NB / 2) + 1; b++) pass(b)

      if (s.glass) {
        // the glass sphere: an inverted, shrunken copy of what's behind it
        const rs = SPHERE_R * scale
        const span = rs * 3.1
        if (lctx) {
          const ls = Math.max(1, Math.ceil(rs * 2))
          if (lens.width !== ls) {
            lens.width = ls
            lens.height = ls
          }
          lctx.setTransform(1, 0, 0, 1, 0, 0)
          lctx.fillStyle = bg
          lctx.fillRect(0, 0, ls, ls)
          lctx.drawImage(canvas, cx - span, cy - span, span * 2, span * 2, 0, 0, ls, ls)
        }
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, rs, 0, Math.PI * 2)
        ctx.clip()
        ctx.fillStyle = bg
        ctx.fillRect(cx - rs, cy - rs, rs * 2, rs * 2)
        if (lctx) {
          ctx.translate(cx, cy)
          ctx.rotate(Math.PI + yaw * 0.15)
          ctx.globalAlpha = 0.85
          ctx.drawImage(lens, -rs, -rs, rs * 2, rs * 2)
          ctx.globalAlpha = 1
          ctx.setTransform(1, 0, 0, 1, 0, 0)
        }
        // rim darkening + soft fill
        const rim = ctx.createRadialGradient(cx - rs * 0.25, cy - rs * 0.3, rs * 0.1, cx, cy, rs)
        rim.addColorStop(0, "rgba(255,255,255,.55)")
        rim.addColorStop(0.55, "rgba(255,255,255,.12)")
        rim.addColorStop(0.86, rgba(inkC, bg, 0.82, 0.25))
        rim.addColorStop(1, rgba(inkC, bg, 0.3, 0.7))
        ctx.fillStyle = rim
        ctx.fillRect(cx - rs, cy - rs, rs * 2, rs * 2)
        // highlight
        const hl = ctx.createRadialGradient(cx - rs * 0.38, cy - rs * 0.42, 0, cx - rs * 0.38, cy - rs * 0.42, rs * 0.42)
        hl.addColorStop(0, "rgba(255,255,255,.9)")
        hl.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = hl
        ctx.fillRect(cx - rs, cy - rs, rs * 2, rs * 2)
        ctx.restore()
        ctx.strokeStyle = mixHex(inkC, bg, 0.45)
        ctx.lineWidth = Math.max(1, dpr)
        ctx.beginPath()
        ctx.arc(cx, cy, rs, 0, Math.PI * 2)
        ctx.stroke()
      }

      for (let b = Math.floor(NB / 2) + 1; b < NB; b++) pass(b)
      spikes(true)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      io?.disconnect()
    }
  }, [grainN, maxDpr])

  const onPointerDown = (e: PointerCanvasEv) => {
    if (!interactive) return
    const s = st.current
    s.drag = true
    s.lastX = s.downX = e.clientX
    s.lastY = s.downY = e.clientY
    s.vyaw = 0
    s.vpitch = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: PointerCanvasEv) => {
    if (!interactive) return
    const s = st.current
    if (s.drag) {
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.yaw += dx * 0.01
      s.pitch += dy * 0.008
      s.vyaw = dx * 0.6
      s.vpitch = dy * 0.45
    } else if (e.pointerType === "mouse") {
      const r = e.currentTarget.getBoundingClientRect()
      s.tLeanYaw = ((e.clientX - r.left) / r.width - 0.5) * 0.5
      s.tLeanPitch = ((e.clientY - r.top) / r.height - 0.5) * 0.5
    }
    s.dirty = true
  }
  const onPointerUp = (e: PointerCanvasEv) => {
    const s = st.current
    if (!s.drag) return
    s.drag = false
    s.vyaw = clamp(s.vyaw, -6, 6)
    s.vpitch = clamp(s.vpitch, -3, 3)
    if (Math.hypot(e.clientX - s.downX, e.clientY - s.downY) < 4) reforge()
  }
  const onLeave = () => {
    st.current.tLeanYaw = 0
    st.current.tLeanPitch = 0
  }
  const onKey = (e: KeyCanvasEv) => {
    if (!interactive) return
    const s = st.current
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      s.vyaw = e.key === "ArrowLeft" ? -2.4 : 2.4
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      s.vpitch = e.key === "ArrowUp" ? -1.6 : 1.6
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      reforge()
    } else return
    s.dirty = true
  }

  const faint = rgba(colors.ink, colors.bg, 0.55, 1)
  return (
    <div
      className={"ios-root relative w-full overflow-hidden " + className}
      style={{
        height,
        background: "radial-gradient(60% 55% at 50% 50%, " + mixHex(colors.ink, colors.bg, 0.94) + ", " + colors.bg + ")",
        color: faint,
      }}
    >
      <style>{IOS_CSS}</style>
      <canvas
        ref={canvasRef}
        role="img"
        tabIndex={interactive ? 0 : -1}
        aria-label={interactive ? "Ink sculpture. Drag or use the arrow keys to rotate; press Enter to reforge it." : "Ink sculpture"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onLeave}
        onKeyDown={onKey}
        className="ios-canvas motion-reduce:animate-none"
        style={{ cursor: interactive ? undefined : "default" }}
      />
      {hud && (
        <>
          <div className="ios-hud ios-top" aria-hidden="true">
            <span ref={headingRef}>N 000°</span>
            {label && <span>{label}</span>}
          </div>
          <div className="ios-hud ios-bottom" aria-hidden="true">
            <span>{interactive ? hint : ""}</span>
            <span>{"seed " + String(seed).padStart(5, "0")}</span>
          </div>
        </>
      )}
    </div>
  )
}

const IOS_CSS = `
.ios-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;max-width:none;touch-action:pan-y;cursor:grab;outline:none;animation:ios-fade 1.4s .1s ease both}
.ios-canvas:active{cursor:grabbing}
.ios-canvas:focus-visible{box-shadow:inset 0 0 0 2px currentColor}
.ios-hud{position:absolute;left:14px;right:14px;display:flex;justify-content:space-between;gap:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;letter-spacing:.04em;pointer-events:none;font-variant-numeric:tabular-nums}
.ios-top{top:12px}
.ios-bottom{bottom:12px}
@keyframes ios-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.ios-canvas{animation:none}}
`

const IH_CSS = `
.ih-root{--ih-page:#efefef;--ih-hatch:rgba(0,0,0,.06);--ih-paper:#fbfbfb;--ih-card:#f4f4f4;--ih-raise:#ffffff;--ih-ink:#151515;--ih-soft:#3d3d3d;--ih-muted:#7b7b7b;--ih-faint:#a8a8a8;--ih-line:#e2e2e2;--ih-line-strong:#cfcfcf;--ih-bracket:#c9c9c9;--ih-band:#e9e9e9;--ih-inv:#161616;--ih-inv-ink:#f5f5f5;--ih-shadow:0 1px 2px rgba(0,0,0,.05),0 8px 24px -12px rgba(0,0,0,.12);--ih-sans:"Manrope","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--ih-serif:"Newsreader","Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,"Times New Roman",serif;--ih-mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;position:relative;width:100%;box-sizing:border-box;background-color:var(--ih-page);background-image:repeating-linear-gradient(135deg,var(--ih-hatch) 0 1px,transparent 1px 10px);color:var(--ih-ink);font-family:var(--ih-sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;padding:28px clamp(10px,2.4vw,28px);transition:background-color .45s ease,color .45s ease}
.ih-root[data-theme="dark"]{--ih-page:#0b0b0b;--ih-hatch:rgba(255,255,255,.05);--ih-paper:#121212;--ih-card:#181818;--ih-raise:#1e1e1e;--ih-ink:#eeeeee;--ih-soft:#c9c9c9;--ih-muted:#8d8d8d;--ih-faint:#5d5d5d;--ih-line:#262626;--ih-line-strong:#363636;--ih-bracket:#444444;--ih-band:#1d1d1d;--ih-inv:#efefef;--ih-inv-ink:#121212;--ih-shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.7)}
.ih-root :where(*){box-sizing:border-box}
.ih-root :focus-visible{outline:2px solid var(--ih-ink);outline-offset:2px}
.ih-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;letter-spacing:inherit}
.ih-root :where(svg){display:block;max-width:none;flex:none}
.ih-root :where(h1,p,ol,li){margin:0;padding:0;font-size:inherit;font-weight:inherit;list-style:none}
.ih-shell{width:100%;max-width:1180px;margin:0 auto;container-type:inline-size}
.ih-sec{position:relative;background:var(--ih-paper);border:1px solid var(--ih-line);transition:background-color .45s,border-color .45s}
.ih-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ih-frame{position:relative}
.ih-c{position:absolute;width:12px;height:12px;border-color:var(--ih-bracket);border-style:solid;border-width:0;pointer-events:none;transition:border-color .3s,transform .35s cubic-bezier(.2,.8,.2,1)}
.ih-c-tl{top:-6px;left:-6px;border-top-width:1.5px;border-left-width:1.5px}
.ih-c-tr{top:-6px;right:-6px;border-top-width:1.5px;border-right-width:1.5px}
.ih-c-bl{bottom:-6px;left:-6px;border-bottom-width:1.5px;border-left-width:1.5px}
.ih-c-br{bottom:-6px;right:-6px;border-bottom-width:1.5px;border-right-width:1.5px}
.ih-frame-hover:hover>.ih-c{border-color:var(--ih-ink)}
.ih-frame-hover:hover>.ih-c-tl{transform:translate(-3px,-3px)}
.ih-frame-hover:hover>.ih-c-tr{transform:translate(3px,-3px)}
.ih-frame-hover:hover>.ih-c-bl{transform:translate(-3px,3px)}
.ih-frame-hover:hover>.ih-c-br{transform:translate(3px,3px)}
.ih-icon-btn{display:inline-grid;place-items:center;width:34px;height:34px;color:var(--ih-muted);border:1px solid transparent;transition:color .2s,border-color .2s}
.ih-icon-btn:hover{color:var(--ih-ink);border-color:var(--ih-line)}
.ih-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;font-size:13.5px;font-weight:500;line-height:1;white-space:nowrap;border-radius:2px;transition:background-color .2s,color .2s,box-shadow .25s,transform .2s cubic-bezier(.2,.8,.2,1)}
.ih-btn-dark{background:var(--ih-inv);color:var(--ih-inv-ink);box-shadow:0 0 0 3px var(--ih-paper),0 0 0 4px var(--ih-line-strong),0 6px 16px -8px rgba(0,0,0,.5)}
.ih-btn-dark:hover{box-shadow:0 0 0 3px var(--ih-paper),0 0 0 4px var(--ih-ink),0 10px 22px -10px rgba(0,0,0,.6);transform:translateY(-1px)}
.ih-btn-ghost{background:var(--ih-raise);color:var(--ih-ink);border:1px solid var(--ih-line-strong)}
.ih-btn-ghost:hover{border-color:var(--ih-ink)}
.ih-btn:active{transform:translateY(0) scale(.98)}
.ih-btn .ih-arr{transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.ih-btn:hover .ih-arr{transform:translateX(3px)}
.ih-btn[disabled]{opacity:.6;cursor:default}
.ih-hero{display:grid;grid-template-columns:minmax(0,1fr);min-height:min(620px,calc(var(--ih-h,100svh) - 110px))}
@container (min-width:860px){.ih-hero{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.ih-hero-copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(40px,7cqw,80px) 0 clamp(36px,6cqw,64px)}
.ih-band{position:relative;padding:clamp(18px,2.6cqw,28px) clamp(16px,3cqw,32px);background:linear-gradient(90deg,var(--ih-band) 0%,var(--ih-band) 55%,transparent 100%);border-top:1px solid var(--ih-line);border-bottom:1px solid var(--ih-line)}
.ih-h1{font-size:clamp(34px,5.2cqw,58px);line-height:1.04;letter-spacing:-.03em;font-weight:400}
.ih-h1-top{display:block;animation:ih-blur-in 1s cubic-bezier(.2,.7,.2,1) both}
.ih-h1-acc{display:block;font-family:var(--ih-serif);font-stretch:condensed;letter-spacing:-.02em;color:var(--ih-soft);min-height:1.1em}
.ih-word{display:inline-block;animation:ih-blur-in .9s cubic-bezier(.2,.7,.2,1) both}
.ih-word-out{animation:ih-blur-out .45s ease both}
.ih-hero-body{padding:22px clamp(16px,3cqw,32px) 0}
.ih-lede{font-size:clamp(14px,1.35cqw,15.5px);line-height:1.6;color:var(--ih-soft);max-width:48ch;animation:ih-rise .9s .15s cubic-bezier(.2,.7,.2,1) both}
.ih-hero-ctas{display:flex;flex-wrap:wrap;gap:16px;margin-top:26px;animation:ih-rise .9s .28s cubic-bezier(.2,.7,.2,1) both}
.ih-hero-ctas .ih-frame>.ih-c{width:7px;height:7px;top:-4px;left:-4px}
.ih-hero-ctas .ih-frame>.ih-c-tr{left:auto;right:-4px}
.ih-hero-ctas .ih-frame>.ih-c-bl{top:auto;bottom:-4px}
.ih-hero-ctas .ih-frame>.ih-c-br{top:auto;left:auto;bottom:-4px;right:-4px}
.ih-proof{display:flex;align-items:center;gap:10px;margin-top:30px;font-size:12.5px;color:var(--ih-muted);animation:ih-rise .9s .4s cubic-bezier(.2,.7,.2,1) both}
.ih-proof-faces{display:flex}
.ih-proof-faces>*{margin-left:-7px;border:2px solid var(--ih-paper);border-radius:999px;overflow:hidden}
.ih-proof-faces>*:first-child{margin-left:0}
.ih-art{position:relative;min-height:360px;border-top:1px solid var(--ih-line);overflow:hidden;background:radial-gradient(60% 55% at 50% 50%,var(--ih-raise),var(--ih-paper))}
@container (min-width:860px){.ih-art{border-top:0;border-left:1px solid var(--ih-line);min-height:0}}
.ih-spin{width:14px;height:14px;border-radius:99px;border:2px solid currentColor;border-right-color:transparent;animation:ih-spin .7s linear infinite}
.ih-live{width:7px;height:7px;border-radius:99px;background:var(--ih-accent-live,#22c55e);box-shadow:0 0 0 0 var(--ih-accent-live,#22c55e);animation:ih-ping 2.4s ease-out infinite}
.ih-modal{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(10,10,10,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:ih-fade .25s ease both}
.ih-dialog{position:relative;width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--ih-paper);color:var(--ih-ink);border:1px solid var(--ih-line-strong);box-shadow:0 30px 80px -20px rgba(0,0,0,.45);animation:ih-pop .4s cubic-bezier(.2,.8,.2,1) both;font-family:var(--ih-sans)}
.ih-dialog-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--ih-line);font-size:13px}
.ih-dialog-head span{display:inline-flex;align-items:center;gap:8px;font-family:var(--ih-mono);font-size:11.5px;color:var(--ih-muted)}
.ih-steps{display:grid;gap:4px;padding:16px}
.ih-step{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:12px;padding:10px 12px;border:1px solid transparent;transition:background-color .3s,border-color .3s,opacity .3s;opacity:.45}
.ih-step[data-state="run"]{opacity:1;background:var(--ih-card);border-color:var(--ih-line)}
.ih-step[data-state="done"]{opacity:1}
.ih-step b{font-size:13.5px;font-weight:600;display:block}
.ih-step small{font-size:12px;color:var(--ih-muted)}
.ih-step-ix{display:grid;place-items:center;width:26px;height:26px;border:1px solid var(--ih-line-strong);font-family:var(--ih-mono);font-size:11px}
.ih-step[data-state="done"] .ih-step-ix{background:var(--ih-inv);color:var(--ih-inv-ink);border-color:var(--ih-inv)}
.ih-step-t{font-family:var(--ih-mono);font-size:11px;color:var(--ih-faint)}
.ih-bar{height:2px;margin:0 16px;background:var(--ih-line)}
.ih-bar>i{display:block;height:2px;background:var(--ih-ink);transition:width .3s linear}
.ih-dialog-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;font-size:12.5px;color:var(--ih-muted)}
@keyframes ih-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes ih-fade{from{opacity:0}to{opacity:1}}
@keyframes ih-blur-in{from{opacity:0;filter:blur(8px);transform:translateY(10px)}to{opacity:1;filter:blur(0);transform:none}}
@keyframes ih-blur-out{from{opacity:1;filter:blur(0)}to{opacity:0;filter:blur(8px);transform:translateY(-8px)}}
@keyframes ih-pop{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
@keyframes ih-spin{to{transform:rotate(360deg)}}
@keyframes ih-ping{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}80%,100%{box-shadow:0 0 0 7px rgba(34,197,94,0)}}
.ih-art-fill{position:absolute;inset:0}
@media (prefers-reduced-motion:reduce){
.ih-h1-top,.ih-word,.ih-word-out,.ih-lede,.ih-hero-ctas,.ih-proof,.ih-modal,.ih-dialog{animation:none}
.ih-live{animation:none}
.ih-spin{animation-duration:2s}
.ih-btn,.ih-c,.ih-step,.ih-bar>i{transition:none}
}
`

// event aliases live after the JSX so the 21st CLI tokenizer stays linear
type PointerCanvasEv = React.PointerEvent<HTMLCanvasElement>
type KeyCanvasEv = React.KeyboardEvent<HTMLCanvasElement>

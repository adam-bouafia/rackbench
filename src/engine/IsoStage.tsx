import { useEffect, useRef } from 'react'
import type { Actor, ActorKind, Flow, Proto } from './types'
import { protoColor } from './types'
import { ActorIcon } from './Icons'
import { stateUpTo } from './MapView'

// The lesson diagram. Devices are isometric blocks; the message of the current step is a route
// along the isometric grid that draws itself, then a packet loops along it until paused. Replay
// restarts the step's animation. Devices appear at the step where they join the story.

type Tone = 'slate' | 'teal' | 'violet' | 'amber' | 'blue' | 'green' | 'neutral'
const KIND: Record<ActorKind, { w: number; h: number; tone: Tone }> = {
  laptop: { w: 160, h: 14, tone: 'neutral' },
  switch: { w: 186, h: 24, tone: 'teal' },
  bmc: { w: 152, h: 42, tone: 'violet' },
  chip: { w: 152, h: 42, tone: 'violet' },
  server: { w: 176, h: 58, tone: 'blue' },
  service: { w: 150, h: 84, tone: 'amber' },
  disk: { w: 120, h: 44, tone: 'slate' },
  person: { w: 110, h: 12, tone: 'neutral' },
  os: { w: 150, h: 46, tone: 'green' },
  nic: { w: 160, h: 22, tone: 'green' },
}
const DEPTH = 0.58
const TALL = 40 // blocks at least this high carry their name on the block
// The name sits just below the centre of the top face, where the diamond is still wide. Its size is
// chosen so the text stays inside the face: the face narrows toward the front corner.
const NAME_BASE = 9
const nameSize = (label: string, w: number, d: number) => {
  const room = w * (1 - NAME_BASE / (d / 2)) * 0.86
  return Math.max(9, Math.min(15, room / (label.length * 0.62)))
}

type Pt = [number, number]
const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k]
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]]
const len = (v: Pt) => Math.hypot(v[0], v[1]) || 1
const unit = (v: Pt): Pt => [v[0] / len(v), v[1] / len(v)]
const pts = (list: Pt[]) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
const TONES: Tone[] = ['slate', 'teal', 'violet', 'amber', 'blue', 'green', 'neutral']

function Block({ a, active }: { a: Actor; active: boolean }) {
  const { w, h, tone } = KIND[a.kind]
  const d = w * DEPTH
  const { x, y } = a
  const T: Pt = [x, y - h - d / 2]
  const R: Pt = [x + w / 2, y - h]
  const B: Pt = [x, y - h + d / 2]
  const L: Pt = [x - w / 2, y - h]
  const down: Pt = [0, h]
  const uL: Pt = [w / 2, d / 2]
  const uR: Pt = [w / 2, -d / 2]
  const onLeft = (s: number, t: number) => add(add(L, uL, s), down, t)
  const onRight = (s: number, t: number) => add(add(B, uR, s), down, t)
  const tall = h >= TALL

  const details = []
  if (a.kind === 'server' || a.kind === 'disk') {
    for (const t of [0.3, 0.62]) details.push(<polyline key={t} points={pts([onLeft(0.1, t), onLeft(0.9, t)])} className="iso-line" />)
    details.push(<circle key="led" cx={onRight(0.16, 0.45)[0]} cy={onRight(0.16, 0.45)[1]} r="3" className="iso-led" />)
  }
  if (a.kind === 'switch' || a.kind === 'nic') {
    for (let i = 0; i < 7; i++) {
      const s = 0.1 + i * 0.115
      details.push(<polygon key={i} points={pts([onLeft(s, 0.28), onLeft(s + 0.07, 0.28), onLeft(s + 0.07, 0.74), onLeft(s, 0.74)])} className="iso-port" />)
    }
  }
  if (a.kind === 'service') {
    for (const t of [0.3, 0.55, 0.8]) details.push(<polyline key={t} points={pts([onLeft(0.1, t), onLeft(0.9, t)])} className="iso-line" />)
  }
  let screen = null
  if (a.kind === 'laptop') {
    const up: Pt = [0, -88]
    const s1 = add(L, uL, 0.1)
    const s2 = add(T, uL, 0.1)
    screen = (
      <g>
        <polygon points={pts([s1, s2, add(s2, up), add(s1, up)])} className="iso-face" fill="url(#g-r-neutral)" />
        <polygon points={pts([add(s1, [9, -3]), add(s2, [-5, 4]), add(add(s2, up), [-5, 11]), add(add(s1, up), [9, 6])])} className="iso-screen" />
        {[0.32, 0.5].map((k) => (
          <polyline key={k} points={pts([add(add(s1, up, k + 0.08), [14, 0]), add(add(s1, up, k + 0.08), [44, -17])])} className="iso-screen-line" />
        ))}
      </g>
    )
  }

  const foot = 1.24
  return (
    <g>
      {active && (
        <polygon points={pts([[x, y - (d / 2) * foot], [x + (w / 2) * foot, y], [x, y + (d / 2) * foot], [x - (w / 2) * foot, y]])} className="iso-foot" />
      )}
      <ellipse cx={x} cy={y + d * 0.12} rx={w * 0.52} ry={d * 0.3} className="iso-shadow" />
      <polygon points={pts([L, B, add(B, down), add(L, down)])} className="iso-face" fill={`url(#g-l-${tone})`} />
      <polygon points={pts([B, R, add(R, down), add(B, down)])} className="iso-face" fill={`url(#g-r-${tone})`} />
      <polygon points={pts([T, R, B, L])} className="iso-face" fill={`url(#g-t-${tone})`} />
      {details}
      {screen}
      <g className="iso-icon" transform={`translate(${x - 14} ${y - h - (tall ? d / 4 + 12 : 14)})`}>
        <ActorIcon kind={a.kind} x={0} y={0} />
      </g>
      {tall && (
        <text x={x} y={y - h + NAME_BASE} textAnchor="middle" className="iso-node-name" style={{ fontSize: nameSize(a.label, w, d) }}>
          {a.label}
        </text>
      )}
    </g>
  )
}

function Pill({ x, y, text, sub, strong, small }: { x: number; y: number; text: string; sub?: string; strong?: boolean; small?: boolean }) {
  const w = Math.max(text.length * (small ? 7.6 : 9.4), (sub ?? '').length * 7.4) + (small ? 22 : 30)
  const h = sub ? 44 : small ? 24 : 30
  return (
    <g>
      <rect x={x - w / 2 + 3} y={y - h / 2 + 3} width={w} height={h} rx={h / 2} className="iso-pill-shadow" />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} className={`iso-pill${strong ? ' is-strong' : ''}`} />
      <text x={x} y={sub ? y - 3 : y + (small ? 4 : 5)} textAnchor="middle" className={small ? 'iso-pill-small' : 'iso-pill-label'}>
        {text}
      </text>
      {sub && (
        <text x={x} y={y + 13} textAnchor="middle" className="iso-pill-sub">
          {sub}
        </text>
      )}
    </g>
  )
}

/** Route between two devices along the isometric axes, with a rounded corner. */
function route(A: Actor, B: Actor) {
  const a: Pt = [A.x, A.y]
  const b: Pt = [B.x, B.y]
  const dv = sub(b, a)
  const u1: Pt = [0.866, 0.5]
  const u2: Pt = [0.866, -0.5]
  const k1 = (dv[0] / 0.866 + dv[1] / 0.5) / 2
  const k2 = (dv[0] / 0.866 - dv[1] / 0.5) / 2
  const c1 = add(a, u1, k1)
  const c2 = add(a, u2, k2)
  const c = c1[1] >= c2[1] ? c1 : c2 // route below the devices
  const ra = KIND[A.kind].w * 0.62
  const rb = KIND[B.kind].w * 0.66
  const legA = len(sub(c, a))
  const legB = len(sub(b, c))
  if (legA < ra + 20 || legB < rb + 20) {
    const u = unit(dv)
    const s = add(a, u, ra)
    const e = add(b, u, -rb)
    return { d: `M${s[0].toFixed(1)} ${s[1].toFixed(1)} L${e[0].toFixed(1)} ${e[1].toFixed(1)}`, mid: [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2] as Pt }
  }
  const ua = unit(sub(c, a))
  const ub = unit(sub(b, c))
  const s = add(a, ua, ra)
  const e = add(b, ub, -rb)
  const r = 22
  const p1 = add(c, ua, -r)
  const p2 = add(c, ub, r)
  return {
    d: `M${s[0].toFixed(1)} ${s[1].toFixed(1)} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} L${e[0].toFixed(1)} ${e[1].toFixed(1)}`,
    mid: c,
  }
}

function fit(actors: Actor[]) {
  const x0 = Math.min(...actors.map((a) => a.x - KIND[a.kind].w * 0.62)) - 30
  const x1 = Math.max(...actors.map((a) => a.x + KIND[a.kind].w * 0.62)) + 30
  const y0 = Math.min(...actors.map((a) => a.y - KIND[a.kind].h - (KIND[a.kind].w * DEPTH) / 2 - (a.kind === 'laptop' ? 90 : 0))) - 40
  const y1 = Math.max(...actors.map((a) => a.y + KIND[a.kind].w * DEPTH * 0.62)) + 74
  const w = Math.max(620, x1 - x0)
  const cx = (x0 + x1) / 2
  return { x: cx - w / 2, y: y0, w, h: y1 - y0 }
}

export function IsoStage({ flow: base, cur, paused, replayKey }: { flow: Flow; cur: number; paused: boolean; replayKey: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const motionRef = useRef<SVGAnimateMotionElement>(null)
  const cxm = base.actors.reduce((sum, a) => sum + a.x, 0) / base.actors.length
  const span = Math.max(...base.actors.map((a) => a.x)) - Math.min(...base.actors.map((a) => a.x)) || 1
  const spread = Math.min(0.9, Math.max(0.58, 720 / span)) // wide lessons are drawn closer together
  const flow = { ...base, actors: base.actors.map((a) => ({ ...a, x: cxm + (a.x - cxm) * spread })) }
  const byId = Object.fromEntries(flow.actors.map((a) => [a.id, a])) as Record<string, Actor>
  const shown = flow.actors.filter((a) => (flow.appear?.[a.id] ?? 1) <= Math.max(1, cur + 1))
  const visible = new Set(shown.map((a) => a.id))
  const step = cur >= 0 ? flow.steps[cur] : null
  const badges = stateUpTo(flow, cur)
  const box = fit(flow.actors)
  const protos = [...new Set(flow.steps.map((s) => s.proto))] as Proto[]

  // start the packet loop once the route has drawn itself; restart on replay or a new step
  useEffect(() => {
    const m = motionRef.current
    if (!m) return
    try {
      m.beginElementAt(0.75)
    } catch {
      /* SMIL not available */
    }
  }, [cur, replayKey])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (paused) svg.pauseAnimations()
    else svg.unpauseAnimations()
  }, [paused, cur, replayKey])

  let message = null
  if (step && step.from !== step.to && byId[step.from] && byId[step.to]) {
    const rt = route(byId[step.from], byId[step.to])
    const color = protoColor(step.proto)
    message = (
      <g key={`m${cur}-${replayKey}`}>
        <path id="iso-route" d={rt.d} pathLength={1} className="iso-route" markerEnd="url(#iso-head)" />
        <circle r="8" cx="0" cy="0" fill={color} className="iso-packet">
          <animateMotion ref={motionRef} dur="1.9s" begin="indefinite" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.25 1">
            <mpath href="#iso-route" />
          </animateMotion>
        </circle>
        <g className="iso-pop">
          <Pill x={rt.mid[0]} y={rt.mid[1] + 30} text={step.short ?? step.summary} strong />
        </g>
      </g>
    )
  } else if (step && byId[step.from]) {
    const a = byId[step.from]
    const { w, h } = KIND[a.kind]
    const d = w * DEPTH
    message = (
      <g key={`m${cur}-${replayKey}`}>
        <polygon points={pts([[a.x, a.y - d * 0.65], [a.x + w * 0.65, a.y], [a.x, a.y + d * 0.65], [a.x - w * 0.65, a.y]])} className="iso-ring" style={{ stroke: protoColor(step.proto) }} />
        <g className="iso-pop">
          <Pill x={a.x} y={a.y - h - d / 2 - (a.kind === 'laptop' ? 110 : 30)} text={step.short ?? ''} strong />
        </g>
      </g>
    )
  }

  return (
    <div className={`iso-wrap${paused ? ' is-paused' : ''}`}>
      <svg ref={svgRef} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} className="iso" role="img" aria-label="Diagram of the devices in this lesson">
        <defs>
          <pattern id="iso-grid" width="64" height="37" patternUnits="userSpaceOnUse">
            <path d="M0 0 L64 37 M64 0 L0 37" className="iso-grid-line" />
          </pattern>
          <marker id="iso-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="iso-head" />
          </marker>
          {TONES.map((t) => (
            <g key={t}>
              <linearGradient id={`g-t-${t}`} x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0" style={{ stopColor: `var(--iso-${t}-hi)` }} />
                <stop offset="1" style={{ stopColor: `var(--iso-${t}-t)` }} />
              </linearGradient>
              <linearGradient id={`g-l-${t}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" style={{ stopColor: `var(--iso-${t}-l)` }} />
                <stop offset="1" style={{ stopColor: `var(--iso-${t}-r)` }} />
              </linearGradient>
              <linearGradient id={`g-r-${t}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" style={{ stopColor: `var(--iso-${t}-r)` }} />
                <stop offset="1" style={{ stopColor: `var(--iso-${t}-lo)` }} />
              </linearGradient>
            </g>
          ))}
        </defs>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="url(#iso-grid)" />
        {flow.links
          .filter(([a, b]) => visible.has(a) && visible.has(b))
          .map(([a, b]) => {
            const A = byId[a]
            const B = byId[b]
            return <line key={`${a}-${b}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="iso-link" />
          })}
        {shown.map((a) => {
          const { w, h } = KIND[a.kind]
          const d = w * DEPTH
          const badge = badges[a.id]
          const tall = h >= TALL
          const bw = badge ? badge.text.length * 7.6 + 22 : 0
          return (
            <g key={a.id} className="iso-actor">
              <Block a={a} active={!!step && (step.from === a.id || step.to === a.id)} />
              {!tall && <Pill x={a.x} y={a.y + d * 0.62 + 18} text={a.label} sub={a.sub && a.sub.length <= 26 ? a.sub : undefined} />}
              {tall && a.sub && <Pill x={a.x} y={a.y + d * 0.62 + 10} text={a.sub} small />}
              {badge && (
                <g transform={`translate(${a.x + w * 0.4} ${a.y - h - d / 2 + 2})`}>
                  <g className="iso-pop">
                    <rect x="2" y="-11" width={bw} height="26" rx="13" className="iso-pill-shadow" />
                    <rect x="0" y="-13" width={bw} height="26" rx="13" className={`iso-badge tone-${badge.tone ?? 'info'}`} />
                    <text x={bw / 2} y="4.5" textAnchor="middle" className="iso-badge-text">
                      {badge.text}
                    </text>
                  </g>
                </g>
              )}
            </g>
          )
        })}
        {message}
      </svg>
      <div className="iso-legend">
        {protos.map((p) => (
          <span key={p}>
            <i style={{ background: protoColor(p) }} />
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { CHAPTERS, LESSONS } from '../lessons/index'
import { LEVELS, PART_SPOT, ROWS, SPOTS, rackIds, rackParts, rackType, rowTypes, type Level, type Part, type PartKind, type RackType } from './data'

// The data center explorer: zoom from the data hall into a row, a rack and one server.
// The hall and the row are drawn in isometric view, the rack from the front and the server from the top.

type Pt = [number, number]
type Target = { row?: string; rack?: string; node?: string }
interface Handlers {
  zoom: (t: Target, e: MouseEvent) => void
  pick: (spot: string) => void
  hover: (text: string | null) => void
}

const iso = (s: number) => (x: number, y: number, z = 0): Pt => [(x - y) * 0.866 * s, (x + y) * 0.5 * s - z * s]
const pts = (a: Pt[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
const TONE: Record<RackType, string> = { compute: 'slate', gpu: 'violet', network: 'teal' }
const TYPE_NAME: Record<RackType, string> = { compute: 'compute rack', gpu: 'GPU rack', network: 'network rack' }

function viewBox(P: (x: number, y: number, z?: number) => Pt, x0: number, x1: number, y0: number, y1: number, z1: number, pad = 24) {
  const c = [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1), P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]
  const xs = c.map((p) => p[0])
  const ys = c.map((p) => p[1])
  const minX = Math.min(...xs) - pad
  const minY = Math.min(...ys) - pad
  return `${minX.toFixed(0)} ${minY.toFixed(0)} ${(Math.max(...xs) - minX + pad).toFixed(0)} ${(Math.max(...ys) - minY + pad).toFixed(0)}`
}

function IsoBox({ P, x, y, z = 0, w, d, h, tone }: { P: ReturnType<typeof iso>; x: number; y: number; z?: number; w: number; d: number; h: number; tone: string }) {
  return (
    <g className="dcx-box">
      <polygon points={pts([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)])} style={{ fill: `var(--iso-${tone}-l)` }} />
      <polygon points={pts([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)])} style={{ fill: `var(--iso-${tone}-r)` }} />
      <polygon points={pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)])} style={{ fill: `var(--iso-${tone}-t)` }} />
    </g>
  )
}

function Tag({ at, text, kind = 'plain' }: { at: Pt; text: string; kind?: 'plain' | 'cold' | 'hot' | 'a' | 'b' }) {
  const w = text.length * 6.4 + 16
  return (
    <g className={`dcx-tag is-${kind}`} transform={`translate(${at[0].toFixed(1)} ${at[1].toFixed(1)})`}>
      <rect x={-w / 2} y={-10} width={w} height={20} rx={10} />
      <text y={4} textAnchor="middle">
        {text}
      </text>
    </g>
  )
}

function Flow({ from, to, kind }: { from: Pt; to: Pt; kind: 'cold' | 'hot' }) {
  return <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className={`dcx-flow is-${kind}`} markerEnd={`url(#dcx-head-${kind})`} />
}

function Defs() {
  return (
    <defs>
      {(['cold', 'hot'] as const).map((k) => (
        <marker key={k} id={`dcx-head-${k}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className={`dcx-arrowhead is-${k}`} />
        </marker>
      ))}
    </defs>
  )
}

function Hit({ id, label, active, onClick, on, children }: { id: string; label: string; active: string | null; onClick: (e: MouseEvent) => void; on: Handlers; children: ReactNode }) {
  return (
    <g className={`dcx-hit${active === id ? ' is-on' : ''}`} onClick={onClick} onMouseEnter={() => on.hover(label)} onMouseLeave={() => on.hover(null)} role="button" aria-label={label}>
      {children}
    </g>
  )
}

/* ---------- level 1: the data hall ---------- */

const ROW_Y: Record<string, number> = { A: 2.6, B: 5.4, C: 8.3, D: 11.1 }
const RW = 0.75
const RD = 1.1
const RH = 2
const X0 = 3

export function HallScene({ on, active }: { on: Handlers; active: string | null }) {
  const P = iso(24)
  const floor = (x0: number, y0: number, x1: number, y1: number) => pts([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)])
  const xEnd = X0 + RW * 8
  const coldAisles = [
    { y0: ROW_Y.A + RD, y1: ROW_Y.B },
    { y0: ROW_Y.C + RD, y1: ROW_Y.D },
  ]
  const hotAisles = [
    { y0: 1.4, y1: ROW_Y.A },
    { y0: ROW_Y.B + RD, y1: ROW_Y.C },
    { y0: ROW_Y.D + RD, y1: ROW_Y.D + RD + 1.2 },
  ]
  const row = (r: string) => (
    <g key={r}>
      <Hit id={`row-${r}`} label={`Row ${r}: click to walk in`} active={active} on={on} onClick={(e) => on.zoom({ row: r }, e)}>
        {rowTypes(r).map((t, i) => (
          <IsoBox key={i} P={P} x={X0 + i * RW} y={ROW_Y[r]} w={RW - 0.03} d={RD} h={RH} tone={TONE[t]} />
        ))}
      </Hit>
      <Hit id="busway" label="Overhead busway" active={active} on={on} onClick={() => on.pick('busway')}>
        <line className="dcx-bus is-a" x1={P(X0 - 0.3, ROW_Y[r] + 0.3, 2.45)[0]} y1={P(X0 - 0.3, ROW_Y[r] + 0.3, 2.45)[1]} x2={P(xEnd + 0.3, ROW_Y[r] + 0.3, 2.45)[0]} y2={P(xEnd + 0.3, ROW_Y[r] + 0.3, 2.45)[1]} />
        <line className="dcx-bus is-b" x1={P(X0 - 0.3, ROW_Y[r] + 0.8, 2.45)[0]} y1={P(X0 - 0.3, ROW_Y[r] + 0.8, 2.45)[1]} x2={P(xEnd + 0.3, ROW_Y[r] + 0.8, 2.45)[0]} y2={P(xEnd + 0.3, ROW_Y[r] + 0.8, 2.45)[1]} />
      </Hit>
    </g>
  )
  const containment = (a: { y0: number; y1: number }, k: number) => (
    <Hit key={k} id="cold" label="Cold aisle with containment" active={active} on={on} onClick={() => on.pick('cold')}>
      <polygon className="dcx-glass" points={pts([P(X0, a.y0, RH), P(xEnd, a.y0, RH), P(xEnd, a.y1, RH), P(X0, a.y1, RH)])} />
      <polygon className="dcx-glass" points={pts([P(xEnd, a.y0, 0), P(xEnd, a.y1, 0), P(xEnd, a.y1, RH), P(xEnd, a.y0, RH)])} />
      {[1, 3, 5].map((x) => (
        <Flow key={x} kind="cold" from={P(X0 + x, (a.y0 + a.y1) / 2, 0.15)} to={P(X0 + x, (a.y0 + a.y1) / 2, 1.2)} />
      ))}
    </Hit>
  )
  return (
    <svg viewBox={viewBox(P, 0, 18.5, 0, 14, 2.6)} className="dcx-svg" role="img" aria-label="Isometric view of a data hall with four rows of racks">
      <Defs />
      <polygon points={floor(0, 0, 18.5, 14)} className="dcx-floor" />
      {Array.from({ length: 18 }, (_, i) => (
        <line key={`gx${i}`} className="dcx-grid" x1={P(i + 1, 0)[0]} y1={P(i + 1, 0)[1]} x2={P(i + 1, 14)[0]} y2={P(i + 1, 14)[1]} />
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`gy${i}`} className="dcx-grid" x1={P(0, i + 1)[0]} y1={P(0, i + 1)[1]} x2={P(18.5, i + 1)[0]} y2={P(18.5, i + 1)[1]} />
      ))}
      {hotAisles.map((a, k) => (
        <Hit key={`h${k}`} id="hot" label="Hot aisle" active={active} on={on} onClick={() => on.pick('hot')}>
          <polygon className="dcx-tint is-hot" points={floor(X0 - 0.2, a.y0, xEnd + 0.2, a.y1)} />
        </Hit>
      ))}
      {coldAisles.map((a, k) => (
        <polygon key={`c${k}`} className="dcx-tint is-cold" points={floor(X0, a.y0, xEnd, a.y1)} />
      ))}
      <Hit id="crah" label="CRAH units" active={active} on={on} onClick={() => on.pick('crah')}>
        {[2, 5, 8.2, 11].map((y) => (
          <IsoBox key={y} P={P} x={0.3} y={y} w={1.1} d={2} h={2.2} tone="slate" />
        ))}
      </Hit>
      {row('A')}
      {row('B')}
      {containment(coldAisles[0], 0)}
      {hotAisles.map((a, k) =>
        [1.5, 4.5].map((x) => <Flow key={`hf${k}${x}`} kind="hot" from={P(X0 + x, (a.y0 + a.y1) / 2, 1.1)} to={P(X0 + x, (a.y0 + a.y1) / 2, 2.3)} />),
      )}
      {row('C')}
      {row('D')}
      {containment(coldAisles[1], 1)}
      <Hit id="network" label="Network racks" active={active} on={on} onClick={() => on.pick('network')}>
        <polygon className="dcx-outline" points={pts([P(X0, ROW_Y.A, RH + 0.02), P(X0 + 2 * RW, ROW_Y.A, RH + 0.02), P(X0 + 2 * RW, ROW_Y.A + RD, RH + 0.02), P(X0, ROW_Y.A + RD, RH + 0.02)])} />
      </Hit>
      <Hit id="ups" label="UPS and batteries" active={active} on={on} onClick={() => on.pick('ups')}>
        <IsoBox P={P} x={12.2} y={0.8} w={5.2} d={4} h={2.2} tone="amber" />
      </Hit>
      <Hit id="staging" label="Staging area" active={active} on={on} onClick={() => on.pick('staging')}>
        <polygon className="dcx-staging" points={floor(12.2, 8.2, 17.4, 13)} />
        <IsoBox P={P} x={14.3} y={10} w={1.4} d={1.7} h={0.15} tone="neutral" />
        <IsoBox P={P} x={14.6} y={10.3} w={RW} d={RD} h={RH} tone="slate" />
      </Hit>
      {ROWS.map((r) => (
        <Tag key={r} at={P(xEnd + 0.75, ROW_Y[r] + RD / 2, 0)} text={`Row ${r}`} />
      ))}
      <Tag at={P(X0 + 3, (coldAisles[0].y0 + coldAisles[0].y1) / 2, RH + 0.15)} text="Cold aisle" kind="cold" />
      <Tag at={P(X0 + 3, (hotAisles[1].y0 + hotAisles[1].y1) / 2, 2.55)} text="Hot aisle" kind="hot" />
      <Tag at={P(0.85, 6.5, 2.75)} text="CRAH units" />
      <Tag at={P(14.8, 2.8, 2.6)} text="UPS + batteries" />
      <Tag at={P(14.8, 13.4, 0)} text="Staging · R-1042" />
      <Tag at={P(X0 + 0.75, ROW_Y.A - 0.4, RH + 0.5)} text="Network" />
    </svg>
  )
}

/* ---------- level 2: one row ---------- */

const PART_FILL: Record<PartKind, string> = {
  patch: 'var(--iso-neutral-r)',
  mgmt: 'var(--iso-teal-t)',
  tor: 'var(--iso-teal-l)',
  fabric: 'var(--iso-violet-l)',
  spine: 'var(--iso-teal-l)',
  blank: 'var(--dcx-blank)',
  node: 'var(--iso-slate-t)',
  storage: 'var(--iso-blue-t)',
  gpu: 'var(--iso-violet-t)',
}

function RowScene({ row, on, active }: { row: string; on: Handlers; active: string | null }) {
  const P = iso(40)
  const H = 3.4
  const W = 0.96
  const Y = 2
  const D = 1.8
  const racks = rackIds(row)
  const line = (a: Pt, b: Pt, cls: string, key?: string | number) => <line key={key} className={cls} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
  return (
    <svg viewBox={viewBox(P, -1, 9.2, -0.8, 6.8, 4.6)} className="dcx-svg" role="img" aria-label={`Isometric view of row ${row}`}>
      <Defs />
      <polygon className="dcx-floor" points={pts([P(-1, -0.8), P(9.2, -0.8), P(9.2, 6.8), P(-1, 6.8)])} />
      <Hit id="hot" label="Hot aisle" active={active} on={on} onClick={() => on.pick('hot')}>
        <polygon className="dcx-tint is-hot" points={pts([P(-0.6, -0.6), P(8.6, -0.6), P(8.6, Y), P(-0.6, Y)])} />
      </Hit>
      <Hit id="cold" label="Cold aisle" active={active} on={on} onClick={() => on.pick('cold')}>
        <polygon className="dcx-tint is-cold" points={pts([P(-0.6, Y + D), P(8.6, Y + D), P(8.6, 6.6), P(-0.6, 6.6)])} />
        {Array.from({ length: 9 }, (_, i) => (
          <polygon key={i} className="dcx-perf" points={pts([P(i - 0.3, 4.6), P(i + 0.3, 4.6), P(i + 0.3, 5.6), P(i - 0.3, 5.6)])} />
        ))}
      </Hit>
      {racks.map((_, i) => (
        <Flow key={`h${i}`} kind="hot" from={P(i + 0.48, Y - 0.1, 1.7)} to={P(i + 0.48, 0.4, 2.5)} />
      ))}
      <Hit id="busA" label="Busway A" active={active} on={on} onClick={() => on.pick('busA')}>
        {line(P(-0.8, 2.1, 4.35), P(8.8, 2.1, 4.35), 'dcx-bus is-a is-thick')}
        {racks.map((_, i) => line(P(i + 0.25, 2.1, 4.35), P(i + 0.25, 2.1, H), 'dcx-drop is-a', i))}
      </Hit>
      <Hit id="busB" label="Busway B" active={active} on={on} onClick={() => on.pick('busB')}>
        {line(P(-0.8, 2.45, 4.55), P(8.8, 2.45, 4.55), 'dcx-bus is-b is-thick')}
        {racks.map((_, i) => line(P(i + 0.7, 2.45, 4.55), P(i + 0.7, 2.45, H), 'dcx-drop is-b', i))}
      </Hit>
      {racks.map((id, i) => {
        const type = rackType(id)
        const parts = rackParts(type)
        const x = i
        const yF = Y + D
        return (
          <Hit key={id} id={`rack-${id}`} label={`Rack ${id} · ${TYPE_NAME[type]}: click to open`} active={active} on={on} onClick={(e) => on.zoom({ row, rack: id }, e)}>
            <IsoBox P={P} x={x} y={Y} w={W} d={D} h={H} tone={TONE[type]} />
            {parts
              .filter((p) => p.kind !== 'blank')
              .map((p, k) => {
                const z0 = ((p.u - 1) / 42) * H + 0.01
                const z1 = ((p.u - 1 + p.size) / 42) * H - 0.01
                return <polygon key={k} className="dcx-unit" style={{ fill: PART_FILL[p.kind] }} points={pts([P(x + 0.08, yF, z0), P(x + W - 0.08, yF, z0), P(x + W - 0.08, yF, z1), P(x + 0.08, yF, z1)])} />
              })}
          </Hit>
        )
      })}
      <Hit id="tray" label="Cable tray" active={active} on={on} onClick={() => on.pick('tray')}>
        <IsoBox P={P} x={-0.6} y={2.75} z={3.95} w={9.2} d={0.5} h={0.1} tone="amber" />
        {racks.map((_, i) => line(P(i + 0.5, 3.0, 3.95), P(i + 0.5, 3.0, H), 'dcx-fiber', i))}
      </Hit>
      {racks.map((_, i) => (
        <Flow key={`c${i}`} kind="cold" from={P(i + 0.48, 6.0, 1.3)} to={P(i + 0.48, Y + D + 0.15, 1.3)} />
      ))}
      {racks.map((id, i) => (
        <Tag key={id} at={P(i + 0.5, Y + D + 0.55, 0)} text={id} />
      ))}
      <Tag at={P(4, 6.3, 0)} text="Cold aisle · 18-27 °C" kind="cold" />
      <Tag at={P(4, -0.4, 2.7)} text="Hot aisle · 35-45 °C" kind="hot" />
      <Tag at={P(-1.2, 2.1, 4.35)} text="Busway A" kind="a" />
      <Tag at={P(9.3, 2.45, 4.55)} text="Busway B" kind="b" />
      <Tag at={P(9.2, 3.0, 4.05)} text="Fiber tray" />
    </svg>
  )
}

/* ---------- level 3: one rack, front view ---------- */

const PART_LABEL: Record<PartKind, (n: number) => string> = {
  patch: (n) => (n > 1 ? `Fiber patch panels (${n})` : 'Fiber patch panel'),
  mgmt: () => 'Management switch · 1G',
  tor: () => 'Top-of-rack switch · 25G/100G',
  fabric: () => 'Fabric switch · 400G',
  spine: (n) => `Spine switches (${n})`,
  blank: (n) => `Blanking panels (${n})`,
  node: (n) => `${n} compute servers · 1U`,
  storage: (n) => `${n} storage servers · 2U`,
  gpu: (n) => `${n} GPU servers · 8 GPUs each`,
}

function RackScene({ rack, on, active }: { rack: string; on: Handlers; active: string | null }) {
  const type = rackType(rack)
  const parts = rackParts(type)
  const top = 36
  const bottom = 604
  const uH = (bottom - top) / 42
  const yOf = (p: Part) => bottom - (p.u - 1 + p.size) * uH
  const left = 340
  const right = 560
  // group consecutive parts of the same kind for the callouts
  const sorted = [...parts].sort((a, b) => b.u - a.u)
  const groups: { kind: PartKind; parts: Part[] }[] = []
  for (const p of sorted) {
    const g = groups[groups.length - 1]
    if (g && g.kind === p.kind) g.parts.push(p)
    else groups.push({ kind: p.kind, parts: [p] })
  }
  const rightSide = (k: PartKind) => k === 'node' || k === 'storage' || k === 'gpu' || k === 'spine'
  return (
    <svg viewBox="0 0 900 640" className="dcx-svg" role="img" aria-label={`Front view of rack ${rack}`}>
      <Defs />
      <rect x={left - 22} y={top - 14} width={right - left + 44} height={bottom - top + 28} rx={6} className="dcx-frame" />
      {Array.from({ length: 42 }, (_, i) => (i + 1) % 5 === 0 || i === 0 ? (
        <text key={i} x={left - 14} y={bottom - i * uH - uH / 2 + 3} className="dcx-u" textAnchor="middle">
          {i + 1}
        </text>
      ) : null)}
      {(['pduA', 'pduB'] as const).map((id, k) => {
        const x = k === 0 ? left - 52 : right + 34
        return (
          <Hit key={id} id={id} label={k === 0 ? 'PDU A, at the back' : 'PDU B, at the back'} active={active} on={on} onClick={() => on.pick(id)}>
            <rect x={x} y={top + 20} width={18} height={bottom - top - 40} rx={4} className={`dcx-pdu is-${k === 0 ? 'a' : 'b'}`} />
            {Array.from({ length: 14 }, (_, i) => (
              <circle key={i} cx={x + 9} cy={top + 40 + i * 38} r={3} className="dcx-outlet" />
            ))}
            <text x={x + 9} y={bottom + 24} textAnchor="middle" className="dcx-small">
              {k === 0 ? 'PDU A (back)' : 'PDU B (back)'}
            </text>
          </Hit>
        )
      })}
      {parts.map((p, k) => {
        const y = yOf(p) + 0.8
        const h = p.size * uH - 1.6
        const spot = PART_SPOT[p.kind]
        const isNode = p.kind === 'node'
        const label = isNode ? `${p.id}: click to open` : `${SPOTS[spot]?.title ?? p.kind}${p.id ? ` · ${p.id}` : ''}`
        return (
          <Hit key={k} id={isNode ? p.id! : spot} label={label} active={active} on={on} onClick={(e) => (isNode ? on.zoom({ rack, node: p.id }, e) : on.pick(spot))}>
            <rect x={left} y={y} width={right - left} height={h} rx={2} className={`dcx-part is-${p.kind}`} style={{ fill: PART_FILL[p.kind] }} />
            {(p.kind === 'mgmt' || p.kind === 'tor' || p.kind === 'spine' || p.kind === 'fabric' || p.kind === 'patch') &&
              Array.from({ length: 16 }, (_, i) => <rect key={i} x={left + 52 + i * 9.5} y={y + 3} width={6} height={h - 6} rx={1} className="dcx-port" />)}
            {isNode && (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <rect key={i} x={left + 8 + i * 22} y={y + 2.5} width={18} height={h - 5} rx={1} className="dcx-bay" />
                ))}
                <circle cx={right - 12} cy={y + h / 2} r={2.6} className="dcx-led" />
                <text x={right - 22} y={y + h / 2 + 3.2} textAnchor="end" className="dcx-tiny">
                  {p.id}
                </text>
              </>
            )}
            {p.kind === 'storage' &&
              Array.from({ length: 12 }, (_, i) => <rect key={i} x={left + 8 + (i % 6) * 34} y={y + 3 + Math.floor(i / 6) * (h / 2)} width={30} height={h / 2 - 5} rx={1} className="dcx-bay" />)}
            {p.kind === 'gpu' && (
              <>
                {Array.from({ length: 9 }, (_, i) => (
                  <line key={i} x1={left + 10} x2={right - 60} y1={y + 6 + i * ((h - 12) / 8)} y2={y + 6 + i * ((h - 12) / 8)} className="dcx-grille" />
                ))}
                <text x={right - 10} y={y + h / 2 + 3} textAnchor="end" className="dcx-tiny">
                  {p.id}
                </text>
              </>
            )}
          </Hit>
        )
      })}
      {groups.map((g, k) => {
        const yTop = yOf(g.parts[0])
        const yBot = yOf(g.parts[g.parts.length - 1]) + g.parts[g.parts.length - 1].size * uH
        const cy = (yTop + yBot) / 2
        const r = rightSide(g.kind)
        if (g.kind === 'blank' && g.parts.length < 3) return null
        const x1 = r ? right + 62 : left - 62
        const x2 = r ? right + 92 : left - 92
        return (
          <g key={k} className="dcx-callout">
            <line x1={r ? right + 4 : left - 4} y1={cy} x2={x1} y2={cy} />
            <line x1={x1} y1={cy} x2={x2} y2={cy} />
            <text x={r ? x2 + 6 : x2 - 6} y={cy + 4} textAnchor={r ? 'start' : 'end'}>
              {PART_LABEL[g.kind](g.parts.length)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ---------- level 4: one server, top view ---------- */

function ServerScene({ on, active }: { on: Handlers; active: string | null }) {
  const bankY = [70, 196, 262, 388]
  const hit = (id: string, children: ReactNode) => (
    <Hit id={id} label={SPOTS[id].title} active={active} on={on} onClick={() => on.pick(id)}>
      {children}
    </Hit>
  )
  return (
    <svg viewBox="0 0 900 500" className="dcx-svg" role="img" aria-label="Top view of a 1U two-socket server with the lid off">
      <Defs />
      {hit('chassis', <rect x={70} y={50} width={760} height={400} rx={8} className="dcx-chassis" />)}
      {hit('board', <polygon points="240,56 826,56 826,320 672,320 672,444 240,444" className="dcx-board" />)}
      <text x={110} y={38} textAnchor="middle" className="dcx-small">
        front · cold aisle
      </text>
      <text x={790} y={38} textAnchor="middle" className="dcx-small">
        back · hot aisle
      </text>
      {[200, 300, 400].map((y) => (
        <Flow key={y} kind="cold" from={[18, y]} to={[64, y]} />
      ))}
      {[180, 300].map((y) => (
        <Flow key={y} kind="hot" from={[840, y]} to={[886, y]} />
      ))}
      {hit(
        'front',
        <>
          <rect x={50} y={58} width={20} height={96} rx={3} className="dcx-ear" />
          <circle cx={60} cy={74} r={5} className="dcx-pwr" />
          <circle cx={60} cy={92} r={4} className="dcx-uid" />
          <circle cx={60} cy={106} r={2.5} className="dcx-led" />
          <rect x={30} y={124} width={30} height={22} rx={2} className="dcx-pulltag" />
          <text x={45} y={138} textAnchor="middle" className="dcx-tiny">
            S/N
          </text>
        </>,
      )}
      {hit(
        'drives',
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <rect x={80} y={60 + i * 48} width={70} height={42} rx={3} className="dcx-drive" />
              <line x1={88} x2={142} y1={60 + i * 48 + 33} y2={60 + i * 48 + 33} className="dcx-handle" />
            </g>
          ))}
          <text x={115} y={470} textAnchor="middle" className="dcx-small">
            NVMe U.2 × 8
          </text>
        </>,
      )}
      {hit(
        'backplane',
        <>
          <rect x={155} y={56} width={14} height={388} className="dcx-pad" />
          <line x1={162} x2={162} y1={58} y2={442} className="dcx-backplane" />
        </>,
      )}
      {hit(
        'fans',
        <>
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i} transform={`translate(210 ${82 + i * 56})`}>
              <circle r={22} className="dcx-fan" />
              <path d="M0 -18 Q8 -6 0 0 Q-8 6 0 18 M-18 0 Q-6 -8 0 0 Q6 8 18 0" className="dcx-blade" />
            </g>
          ))}
          <text x={210} y={470} textAnchor="middle" className="dcx-small">
            fans
          </text>
        </>,
      )}
      {hit(
        'dimms',
        <>
          {bankY.map((y0) =>
            [0, 1, 2, 3].map((i) => <rect key={`${y0}-${i}`} x={286} y={y0 + i * 10} width={186} height={6.5} rx={1.5} className="dcx-dimm" />),
          )}
          <text x={379} y={470} textAnchor="middle" className="dcx-small">
            DIMMs × 16
          </text>
        </>,
      )}
      {hit(
        'upi',
        <>
          <polyline points="426,146 490,146 490,352 426,352" className="dcx-pad-line" />
          <polyline points="426,146 490,146 490,352 426,352" className="dcx-upi" />
          <text x={503} y={250} textAnchor="middle" className="dcx-tiny" transform="rotate(90 503 250)">
            UPI
          </text>
        </>,
      )}
      {hit(
        'cpus',
        <>
          {[118, 310].map((y, k) => (
            <g key={y}>
              <rect x={334} y={y} width={92} height={70} rx={4} className="dcx-cpu" />
              {Array.from({ length: 6 }, (_, i) => (
                <line key={i} x1={340} x2={420} y1={y + 10 + i * 10} y2={y + 10 + i * 10} className="dcx-fin" />
              ))}
              <text x={380} y={y + 40} textAnchor="middle" className="dcx-label-in">
                CPU {k}
              </text>
            </g>
          ))}
        </>,
      )}
      {hit(
        'sensors',
        <>
          {[
            [178, 64],
            [316, 153],
            [316, 345],
            [664, 354],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r={7} className="dcx-sensor" />
              <text x={x} y={y + 3} textAnchor="middle" className="dcx-tiny is-fixed">
                T
              </text>
            </g>
          ))}
        </>,
      )}
      {hit(
        'riser',
        <>
          <rect x={546} y={60} width={12} height={112} rx={2} className="dcx-riser" />
          <text x={790} y={91} textAnchor="middle" className="dcx-tiny">
            x16
          </text>
          <text x={790} y={148} textAnchor="middle" className="dcx-tiny">
            x8
          </text>
        </>,
      )}
      {hit(
        'nic',
        <>
          <rect x={560} y={64} width={210} height={46} rx={3} className="dcx-card" />
          <text x={665} y={92} textAnchor="middle" className="dcx-label-in">
            NIC 2 × 25G
          </text>
          <rect x={824} y={70} width={12} height={14} className="dcx-port-rear" />
          <rect x={824} y={90} width={12} height={14} className="dcx-port-rear" />
        </>,
      )}
      {hit(
        'hba',
        <>
          <rect x={560} y={122} width={210} height={46} rx={3} className="dcx-card is-hba" />
          <text x={665} y={150} textAnchor="middle" className="dcx-label-in">
            RAID / HBA
          </text>
          <rect x={824} y={138} width={12} height={14} className="dcx-port-rear is-hba" />
        </>,
      )}
      {hit(
        'bios',
        <>
          <rect x={515} y={236} width={40} height={26} rx={2} className="dcx-chip" />
          <text x={535} y={276} textAnchor="middle" className="dcx-tiny">
            BIOS
          </text>
        </>,
      )}
      {hit(
        'bmc',
        <>
          <rect x={600} y={240} width={46} height={36} rx={2} className="dcx-chip is-bmc" />
          <text x={623} y={262} textAnchor="middle" className="dcx-label-in">
            BMC
          </text>
          <path d="M646 258 H826" className="dcx-trace" />
          <rect x={824} y={251} width={12} height={14} className="dcx-port-rear is-bmc" />
        </>,
      )}
      {hit(
        'm2',
        <>
          <rect x={520} y={304} width={80} height={22} rx={2} className="dcx-m2" />
          <text x={560} y={319} textAnchor="middle" className="dcx-label-in">
            M.2
          </text>
          <text x={560} y={342} textAnchor="middle" className="dcx-tiny">
            boot
          </text>
        </>,
      )}
      <text x={560} y={430} textAnchor="middle" className="dcx-silk">
        motherboard X13
      </text>
      {hit(
        'psus',
        <>
          {[
            { y: 328, t: 'PSU 1 · feed A', c: 'a' },
            { y: 388, t: 'PSU 2 · feed B', c: 'b' },
          ].map((p) => (
            <g key={p.y}>
              <rect x={680} y={p.y} width={146} height={52} rx={3} className={`dcx-psu is-${p.c}`} />
              <text x={753} y={p.y + 30} textAnchor="middle" className="dcx-label-in is-fixed">
                {p.t}
              </text>
            </g>
          ))}
        </>,
      )}
    </svg>
  )
}

/* ---------- the page ---------- */

const LEVEL_NAMES: Record<Level, string> = { hall: 'Data hall', row: 'Row', rack: 'Rack', server: 'Server' }
const ORDER: Level[] = ['hall', 'row', 'rack', 'server']

function LessonChips({ ids, go }: { ids: string[]; go: (h: string) => void }) {
  return (
    <div className="dcx-lessons">
      {ids.map((id) => {
        const l = LESSONS.find((x) => x.id === id)
        if (!l) return null
        const ch = CHAPTERS.find((c) => c.id === l.chapter)
        return (
          <button key={id} onClick={() => go(`#/lesson/${id}`)} style={{ borderLeftColor: ch?.color }}>
            {l.title}
          </button>
        )
      })}
    </div>
  )
}

export function DataCenter({ go, path }: { go: (h: string) => void; path: string[] }) {
  const [row, setRow] = useState<string | null>(path[0] ?? null)
  const [rack, setRack] = useState<string | null>(path[1] ?? null)
  const [node, setNode] = useState<string | null>(path[2] ?? null)
  const [spot, setSpot] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [anim, setAnim] = useState({ dir: 'in', ox: 50, oy: 50, key: 0 })
  const canvas = useRef<HTMLDivElement>(null)
  const level: Level = node ? 'server' : rack ? 'rack' : row ? 'row' : 'hall'

  // a typed link, the course link or back/forward: follow the new hash
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash
      if (!h.startsWith('#/explore')) return
      const parts = h.replace(/^#\/explore\/?/, '').split('/').filter(Boolean)
      setRow(parts[0] ?? null)
      setRack(parts[1] ?? null)
      setNode(parts[2] ?? null)
      setSpot(null)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const h = `#/explore${row ? `/${row}` : ''}${rack ? `/${rack}` : ''}${node ? `/${node}` : ''}`
    if (window.location.hash !== h) window.history.replaceState(null, '', h)
  }, [row, rack, node])

  const origin = (e?: MouseEvent) => {
    const r = canvas.current?.getBoundingClientRect()
    if (!e || !r) return { ox: 50, oy: 50 }
    return { ox: ((e.clientX - r.left) / r.width) * 100, oy: ((e.clientY - r.top) / r.height) * 100 }
  }
  const to = (t: { row: string | null; rack: string | null; node: string | null }, dir: 'in' | 'out', e?: MouseEvent) => {
    setRow(t.row)
    setRack(t.rack)
    setNode(t.node)
    setSpot(null)
    setHover(null)
    setAnim((a) => ({ dir, ...origin(e), key: a.key + 1 }))
  }
  const up = () => {
    if (node) to({ row, rack, node: null }, 'out')
    else if (rack) to({ row, rack: null, node: null }, 'out')
    else if (row) to({ row: null, rack: null, node: null }, 'out')
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (spot) setSpot(null)
        else up()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const on: Handlers = {
    zoom: (t, e) => to({ row: t.row ?? row ?? (t.rack ? t.rack[0] : null), rack: t.rack ?? rack, node: t.node ?? null }, 'in', e),
    pick: (s) => setSpot(s),
    hover: setHover,
  }
  const active = spot
  const scene =
    level === 'hall' ? <HallScene on={on} active={active} /> : level === 'row' ? <RowScene row={row!} on={on} active={active} /> : level === 'rack' ? <RackScene rack={rack!} on={on} active={active} /> : <ServerScene on={on} active={active} />

  const info = LEVELS[level]
  const type = rack ? rackType(rack) : null
  const title = level === 'hall' ? 'The data hall' : level === 'row' ? `Row ${row}` : level === 'rack' ? `Rack ${rack}` : `${node} in rack ${rack}`
  const sub = level === 'rack' && type ? SPOTS[`rack-${type}`]?.text : null
  const s = spot ? SPOTS[spot] : null
  const next = spot && info.parts ? info.parts[info.parts.indexOf(spot) + 1] ?? null : null

  return (
    <div className="dcx page-fit">
      <section className="panel dcx-stage">
        <header className="dcx-head">
          <nav className="dcx-crumbs" aria-label="Where you are">
            <button onClick={() => level !== 'hall' && to({ row: null, rack: null, node: null }, 'out')} className={level === 'hall' ? 'on' : ''}>
              Data hall
            </button>
            {row && (
              <>
                <span>›</span>
                <button onClick={() => (rack ? to({ row, rack: null, node: null }, 'out') : null)} className={level === 'row' ? 'on' : ''}>
                  Row {row}
                </button>
              </>
            )}
            {rack && (
              <>
                <span>›</span>
                <button onClick={() => (node ? to({ row, rack, node: null }, 'out') : null)} className={level === 'rack' ? 'on' : ''}>
                  Rack {rack}
                </button>
              </>
            )}
            {node && (
              <>
                <span>›</span>
                <button className="on">{node}</button>
              </>
            )}
          </nav>
          <ol className="dcx-levels" aria-label="Zoom level">
            {ORDER.map((l, i) => (
              <li key={l} className={ORDER.indexOf(level) >= i ? 'is-on' : ''}>
                {LEVEL_NAMES[l]}
              </li>
            ))}
          </ol>
          <button className="btn btn-sm" onClick={up} disabled={level === 'hall'}>
            ↑ Zoom out
          </button>
        </header>
        <div className="dcx-canvas" ref={canvas}>
          <div key={anim.key} className={`dcx-scene is-${anim.dir}`} style={{ transformOrigin: `${anim.ox}% ${anim.oy}%` }}>
            {scene}
          </div>
        </div>
        <footer className="dcx-foot">
          <span className="dcx-key is-cold">cold air</span>
          <span className="dcx-key is-hot">hot air</span>
          <span className="dcx-key is-a">feed A</span>
          <span className="dcx-key is-b">feed B</span>
          <span className="dcx-key is-fiber">fiber</span>
          <span className="dcx-status">{hover ?? info.hint}</span>
        </footer>
      </section>

      <aside className="panel dcx-info">
        <p className="eyebrow">
          Level {ORDER.indexOf(level) + 1} of 4 · {LEVEL_NAMES[level]}
        </p>
        <h1>{title}</h1>
        {s ? (
          <div className="dcx-spot">
            <h2>{s.title}</h2>
            <p>{s.text}</p>
            {s.check && (
              <p className="dcx-check">
                <b>How it is checked.</b> {s.check}
              </p>
            )}
            {s.terms && (
              <div className="dcx-terms" aria-label="Terms">
                {s.terms.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            )}
            {s.lessons && (
              <>
                <h3 className="panel-sub">In the lessons</h3>
                <LessonChips ids={s.lessons} go={go} />
              </>
            )}
            {s.actions && (
              <div className="toolbar">
                {s.actions.map((a) => (
                  <button key={a.hash} className="btn btn-sm" onClick={() => go(a.hash)}>
                    {a.label} →
                  </button>
                ))}
              </div>
            )}
            <div className="dcx-spotnav">
              <button className="dcx-back" onClick={() => setSpot(null)}>
                ← back to {title}
              </button>
              {next && (
                <button className="btn btn-sm" onClick={() => setSpot(next)}>
                  Next: {SPOTS[next].title} →
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {sub && <p className="dcx-sub">{sub}</p>}
            <p>{info.text}</p>
            <h3 className="panel-sub">Good to know</h3>
            <ul className="dcx-facts">
              {info.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <h3 className="panel-sub">In the lessons</h3>
            <LessonChips ids={info.lessons} go={go} />
            {info.actions && (
              <div className="toolbar">
                {info.actions.map((a) => (
                  <button key={a.hash} className="btn btn-sm" onClick={() => go(a.hash)}>
                    {a.label} →
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {info.parts && (
          <>
            <h3 className="panel-sub">
              Every part ({info.parts.length})
            </h3>
            <div className="dcx-partlist">
              {info.parts.map((id) => (
                <button key={id} className={spot === id ? 'on' : ''} onClick={() => setSpot(id)} onMouseEnter={() => setHover(SPOTS[id].title)} onMouseLeave={() => setHover(null)}>
                  {SPOTS[id].title}
                </button>
              ))}
            </div>
          </>
        )}
        <p className="dcx-hint">{info.hint} Esc zooms out.</p>
      </aside>
    </div>
  )
}

/** The data hall for the Overview: a click walks into the explorer. */
export function DataCenterMini({ go }: { go: (h: string) => void }) {
  const [hover, setHover] = useState<string | null>(null)
  const on: Handlers = {
    zoom: (t) => go(`#/explore${t.row ? `/${t.row}` : ''}`),
    pick: () => go('#/explore'),
    hover: setHover,
  }
  return (
    <div className="dcx-mini">
      <HallScene on={on} active={null} />
      <span className="dcx-status">{hover ?? 'Click a row to walk in'}</span>
    </div>
  )
}

import { useMemo, type CSSProperties } from 'react'
import type { StageProps, StageStep } from '../engine/StageLesson'
import { bits, grid, health, rowCount, type Level, type Slot } from './model'

// The RAID lessons' stage: the incoming file as lettered blocks, the controller, and the disks.
// Blocks fly from the file into their slots as a step writes them; parity comes from the controller.

export interface RaidState {
  level: Level
  disks: number
  /** Data blocks in the file. */
  blocks: number
  /** Stripes (rows) written so far; all when left out. */
  rows?: number
  failed?: number[]
  /** A disk replaced by a new one that is being rebuilt. */
  spare?: number
  /** Rows rebuilt on the new disk. */
  rebuilt?: number
  /** Highlighted stripe. */
  hot?: number
  /** A block computed on the fly for a read, while its disk is gone. */
  read?: string
  /** Bit-level parity panel. */
  xor?: 'parity' | 'recover' | 'pq'
  ctrl?: string
  note?: string
}

export interface RaidStep extends StageStep {
  s: RaidState
}

const CTRL: Record<Level, string> = {
  single: 'Disk controller',
  jbod: 'HBA · no RAID',
  raid0: 'RAID 0 controller',
  raid1: 'RAID 1 controller',
  raid5: 'RAID 5 controller',
  raid6: 'RAID 6 controller',
  raid10: 'RAID 10 controller',
}

const TILE = 38
const TPITCH = 44
const TILE_Y = 30
const CTRL_Y = 100
const SLOT_H = 30
const SLOT_STEP = 36
const HEAD = 36

function geometry(level: Level, disks: number) {
  const pitch = disks <= 1 ? 0 : disks === 2 ? 240 : disks === 3 ? 200 : disks === 4 ? 175 : 152
  const dw = disks >= 5 ? 126 : 140
  const xs = Array.from({ length: disks }, (_, d) => 500 + (d - (disks - 1) / 2) * pitch)
  const sub = level === 'raid10'
  return { xs, dw, top: sub ? 252 : 222, sub }
}

const slotClass = (s: Slot) => `rs-slot is-${s.kind}`

/** The part of the drawing a lesson uses, over all its steps, so the stage can zoom to it. */
function extents(steps: RaidStep[]) {
  let l = 1000
  let r = 0
  let b = 0
  for (const { s } of steps) {
    const { xs, dw, top } = geometry(s.level, s.disks)
    const x0 = 500 - (s.blocks * TPITCH - (TPITCH - TILE)) / 2
    l = Math.min(l, x0 - 48, xs[0] - dw / 2 - (s.hot !== undefined ? 78 : 12), 372, s.read ? 200 : 1000)
    r = Math.max(r, x0 + s.blocks * TPITCH + 4, xs[xs.length - 1] + dw / 2 + 12, 830, s.xor ? 994 : 0)
    b = Math.max(b, top + HEAD + rowCount(s.level, s.disks, s.blocks) * SLOT_STEP + 18)
  }
  return { l, r, b }
}

function XorPanel({ mode }: { mode: 'parity' | 'recover' | 'pq' }) {
  const A = 0b1011
  const B = 0b0110
  const C = 0b1100
  const P = A ^ B ^ C
  const rows: [string, string][] =
    mode === 'parity'
      ? [
          ['A', bits(A)],
          ['B', bits(B)],
          ['C', bits(C)],
          ['P1', bits(P)],
        ]
      : mode === 'recover'
        ? [
            ['A', bits(A)],
            ['C', bits(C)],
            ['P1', bits(P)],
            ['B', bits(A ^ C ^ P)],
          ]
        : []
  return (
    <g className="rs-xor" transform="translate(800 84)">
      <rect width="186" height="132" rx="10" className="rs-xor-box" />
      <text x="12" y="20" className="rs-xor-title">
        {mode === 'pq' ? 'Two parities' : mode === 'parity' ? 'XOR, bit by bit' : 'Rebuild B with XOR'}
      </text>
      {mode === 'pq' ? (
        <>
          {['P1 = A ⊕ B ⊕ C', 'Q1 = Reed-Solomon', '    (Galois field)', '2 equations, so', 'any 2 blocks back'].map((t, i) => (
            <text key={t} x="12" y={44 + i * 19} className="rs-xor-row" style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
              {t}
            </text>
          ))}
        </>
      ) : (
        rows.map(([k, v], i) => (
          <g key={k} className="rs-xor-line" style={{ animationDelay: `${0.25 + i * 0.35}s` }}>
            {i === 3 && <line x1="10" x2="176" y1={36 + i * 22 - 6} y2={36 + i * 22 - 6} className="rs-xor-rule" />}
            <text x="14" y={44 + i * 22} className={`rs-xor-row${i === 3 ? ' is-result' : ''}`}>
              {k.padEnd(3, ' ')}
            </text>
            <text x="64" y={44 + i * 22} className={`rs-xor-row${i === 3 ? ' is-result' : ''}`}>
              {v.split('').join(' ')}
            </text>
          </g>
        ))
      )}
      {mode !== 'pq' && (
        <text x="12" y="124" className="rs-xor-foot">
          odd number of 1s → 1
        </text>
      )}
    </g>
  )
}

export function RaidStage({ steps, cur, replayKey }: StageProps<RaidStep>) {
  const i = Math.max(0, cur)
  const st = steps[i].s
  const prev = cur > 0 ? steps[cur - 1].s : null
  const same = !!prev && prev.level === st.level && prev.disks === st.disks && prev.blocks === st.blocks
  const g = grid(st.level, st.disks, st.blocks)
  const rowsAll = rowCount(st.level, st.disks, st.blocks)
  const rows = cur < 0 ? 0 : Math.min(rowsAll, st.rows ?? rowsAll)
  const prevRows = cur <= 0 || !same ? 0 : Math.min(rowsAll, prev!.rows ?? rowsAll)
  const rebuilt = st.spare === undefined ? 0 : Math.min(rows, st.rebuilt ?? 0)
  const prevRebuilt = same && prev!.spare === st.spare ? Math.min(rows, prev!.rebuilt ?? 0) : 0
  const failed = cur < 0 ? [] : (st.failed ?? [])
  const missing = [...failed, ...(st.spare !== undefined && rebuilt < rows ? [st.spare] : [])]
  const h = health(st.level, st.disks, missing)
  const busy = rows > prevRows || rebuilt > prevRebuilt
  const { xs, dw, top, sub } = geometry(st.level, st.disks)
  const box = useMemo(() => extents(steps), [steps])

  // the file strip
  const x0 = 500 - (st.blocks * TPITCH - (TPITCH - TILE)) / 2
  const tileX = (k: number) => x0 + k * TPITCH
  const sent = new Set<number>()
  g.forEach((col) =>
    col.forEach((s, r) => {
      if (s?.src !== undefined && r < rows) sent.add(s.src)
    }),
  )
  // blocks that cannot be read any more
  const lostTile = (k: number) => {
    if (h === 'failed') return rows > 0
    if (h !== 'partial') return false
    return g.some((col, d) => missing.includes(d) && col.some((s, r) => r < rows && s?.src === k))
  }

  const slotY = (r: number) => top + HEAD + r * SLOT_STEP
  const bodyH = HEAD + rowsAll * SLOT_STEP + 6
  const sw = dw - 20
  const hot = st.hot
  const readSrcs = st.read !== undefined && hot !== undefined ? g.map((col, d) => (missing.includes(d) ? null : col[hot])).filter(Boolean) : []

  const status =
    st.spare !== undefined && rebuilt < rows
      ? { cls: 'info', text: `Rebuilding ${rebuilt}/${rows}` }
      : h === 'optimal'
        ? { cls: 'ok', text: rows === 0 ? 'Waiting for data' : 'Optimal' }
        : h === 'degraded'
          ? { cls: 'warn', text: missing.length > 1 ? `Degraded: ${missing.length} disks out` : 'Degraded' }
          : h === 'partial'
            ? { cls: 'bad', text: 'Part of the data lost' }
            : { cls: 'bad', text: 'Failed: data lost' }

  const caption =
    st.note ??
    (cur < 0
      ? 'Press Play or Start to write the file to the array.'
      : st.spare !== undefined && rebuilt < rows
        ? 'Rebuilding: the new disk is filled from the other disks.'
        : h === 'failed'
          ? 'The array is lost: the file cannot be read, and only a backup brings it back.'
          : h === 'partial'
            ? 'The blocks on the failed disk are gone; the other disks still read fine.'
            : h === 'degraded'
              ? st.level === 'raid6' && missing.length === 1
                ? 'Degraded, and still protected against one more failure.'
                : 'Degraded: every block can still be read, with no protection left.'
              : '')

  return (
    <div className="rs">
      <svg key={`${cur}:${replayKey}`} viewBox={`${box.l} 8 ${box.r - box.l} ${box.b - 8}`} className="rs-svg" role="img" aria-label={`${st.level} array with ${st.disks} disks: ${status.text}`}>
        {/* file */}
        <text x={x0 - 14} y={TILE_Y + 24} textAnchor="end" className="rs-label">
          file
        </text>
        <line x1={tileX(0) + TILE / 2} x2={tileX(st.blocks - 1) + TILE / 2} y1={TILE_Y + TILE + 10} y2={TILE_Y + TILE + 10} className="rs-bus" />
        <line x1={500} x2={500} y1={TILE_Y + TILE + 10} y2={CTRL_Y} className={`rs-bus${busy ? ' is-busy' : ''}`} />
        {Array.from({ length: st.blocks }, (_, k) => (
          <g key={k} className={`rs-tile${sent.has(k) ? ' is-sent' : ''}${lostTile(k) ? ' is-lost' : ''}${st.read === String.fromCharCode(65 + k) ? ' is-read' : ''}`}>
            <line x1={tileX(k) + TILE / 2} x2={tileX(k) + TILE / 2} y1={TILE_Y + TILE} y2={TILE_Y + TILE + 10} className="rs-bus" />
            <rect x={tileX(k)} y={TILE_Y} width={TILE} height={TILE} rx="6" />
            <text x={tileX(k) + TILE / 2} y={TILE_Y + 25} textAnchor="middle">
              {String.fromCharCode(65 + k)}
            </text>
          </g>
        ))}

        {/* controller and status */}
        <rect x={385 + 4} y={CTRL_Y + 4} width={230} height={44} rx="10" className="rs-shadow" />
        <rect x={385} y={CTRL_Y} width={230} height={44} rx="10" className="rs-ctrl" />
        <text x={500} y={CTRL_Y + 27} textAnchor="middle" className="rs-ctrl-text">
          {st.ctrl ?? CTRL[st.level]}
        </text>
        <g className={`rs-status is-${status.cls}`}>
          <rect x={627} y={CTRL_Y + 7} width={Math.max(96, status.text.length * 8.2 + 22)} height={30} rx="15" />
          <text x={641} y={CTRL_Y + 27}>
            {status.text}
          </text>
        </g>
        {st.read && (
          <g className="rs-readtag">
            <rect x={210} y={CTRL_Y + 7} width={162} height={30} rx="8" />
            <text x={291} y={CTRL_Y + 27} textAnchor="middle">
              {st.read} = {readSrcs.map((s) => s!.label).join(' ⊕ ')}
            </text>
          </g>
        )}

        {/* links */}
        {sub
          ? Array.from({ length: st.disks / 2 }, (_, p) => {
              const cx = (xs[2 * p] + xs[2 * p + 1]) / 2
              return (
                <g key={p}>
                  <path d={`M500 ${CTRL_Y + 44} V${CTRL_Y + 64} H${cx} V184`} className={`rs-link${busy ? ' is-busy' : ''}`} />
                  <rect x={cx - 84 + 3} y={187} width={168} height={32} rx="8" className="rs-shadow" />
                  <rect x={cx - 84} y={184} width={168} height={32} rx="8" className="rs-sub" />
                  <text x={cx} y={205} textAnchor="middle" className="rs-sub-text">
                    Mirror pair {p + 1} (RAID 1)
                  </text>
                  {[2 * p, 2 * p + 1].map((d) => (
                    <path key={d} d={`M${cx} 216 V${top - 14} H${xs[d]} V${top}`} className={`rs-link${busy ? ' is-busy' : ''}${missing.includes(d) ? ' is-down' : ''}`} />
                  ))}
                </g>
              )
            })
          : xs.map((x, d) => <path key={d} d={`M500 ${CTRL_Y + 44} V${CTRL_Y + 76} H${x} V${top}`} className={`rs-link${busy ? ' is-busy' : ''}${missing.includes(d) ? ' is-down' : ''}`} />)}

        {/* disks */}
        {xs.map((x, d) => {
          const isFailed = failed.includes(d)
          const isSpare = st.spare === d
          const left = x - dw / 2
          return (
            <g key={d} className={`rs-disk${isFailed ? ' is-failed' : ''}${isSpare ? ' is-spare' : ''}`}>
              <rect x={left + 4} y={top + 4} width={dw} height={bodyH} rx="10" className="rs-shadow" />
              <rect x={left} y={top} width={dw} height={bodyH} rx="10" className="rs-body" />
              <rect x={left} y={top} width={dw} height={28} rx="10" className="rs-head" />
              {!isFailed && <circle cx={left + dw - 14} cy={top + 14} r="5" className={`rs-led${isSpare && rebuilt < rows ? ' is-busy' : ''}`} />}
              <text x={left + 12} y={top + 19} className="rs-disk-name">
                Disk {d + 1}
                {isFailed ? ' · failed' : isSpare ? ' · new' : ''}
              </text>
              {g[d].map((s, r) => {
                const y = slotY(r)
                const sx = x - sw / 2
                if (!s) return <rect key={r} x={sx} y={y} width={sw} height={SLOT_H} rx="5" className="rs-slot is-none" />
                const written = isSpare ? r < rebuilt : r < rows
                if (!written)
                  return (
                    <rect key={r} x={sx} y={y} width={sw} height={SLOT_H} rx="5" className={`rs-slot is-empty${hot === r ? ' is-hot' : ''}`} />
                  )
                const fresh = !isSpare && r >= prevRows && r < rows
                const freshRebuild = isSpare && r >= prevRebuilt && r < rebuilt
                let style: CSSProperties | undefined
                let cls = ''
                if (fresh) {
                  const from =
                    s.src !== undefined ? { x: tileX(s.src) + TILE / 2, y: TILE_Y + TILE / 2 } : { x: 500, y: CTRL_Y + 22 }
                  const base = (r - prevRows) * 0.8
                  const delay = s.kind === 'p' ? base + 0.45 : s.kind === 'q' ? base + 0.6 : base + d * 0.06
                  style = { '--dx': `${from.x - x}px`, '--dy': `${from.y - (y + SLOT_H / 2)}px`, animationDelay: `${delay}s` } as CSSProperties
                  cls = s.kind === 'p' || s.kind === 'q' ? ' rs-fly is-calc' : ' rs-fly'
                } else if (freshRebuild) {
                  style = { animationDelay: `${(r - prevRebuilt) * 0.55}s` }
                  cls = ' rs-pop'
                }
                const orphan = h === 'failed' && !isFailed
                const inRead = st.read !== undefined && hot === r && !missing.includes(d)
                return (
                  <g key={r} className={`${slotClass(s)}${cls}${isSpare ? ' is-rebuilt' : ''}${orphan ? ' is-orphan' : ''}${hot === r ? ' is-hot' : ''}${inRead ? ' is-read' : ''}`} style={style}>
                    <rect x={sx} y={y} width={sw} height={SLOT_H} rx="5" />
                    <text x={x} y={y + 20} textAnchor="middle">
                      {s.label}
                    </text>
                  </g>
                )
              })}
              {isFailed && (
                <g className="rs-x">
                  <line x1={left + 14} y1={top + 40} x2={left + dw - 14} y2={top + bodyH - 12} />
                  <line x1={left + dw - 14} y1={top + 40} x2={left + 14} y2={top + bodyH - 12} />
                </g>
              )}
              {inReadLines(st, hot, d, missing, x, slotY)}
            </g>
          )
        })}

        {/* stripe label */}
        {hot !== undefined && rows > 0 && (
          <text x={xs[0] - dw / 2 - 12} y={slotY(hot) + 20} textAnchor="end" className="rs-label is-hot">
            stripe {hot + 1}
          </text>
        )}
        {st.xor && <XorPanel mode={st.xor} />}
      </svg>
      {caption && <p className={`rs-caption is-${status.cls}`}>{caption}</p>}
    </div>
  )
}

/** Dashed lines from the blocks read for a degraded read up to the controller. */
function inReadLines(st: RaidState, hot: number | undefined, d: number, missing: number[], x: number, slotY: (r: number) => number) {
  if (st.read === undefined || hot === undefined || missing.includes(d)) return null
  return <path d={`M${x} ${slotY(hot)} L500 ${CTRL_Y + 44}`} className="rs-readline" />
}

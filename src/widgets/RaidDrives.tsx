import { useEffect, useState } from 'react'
import type { LessonMeta } from '../engine/types'
import { Card, KeyPoints } from '../engine/ui'
import { markDone } from '../progress'

// RAID by hand (fail disks, see capacity, parity and the write penalty), SATA versus SAS
// connectors, and drive form factors drawn to scale. Flat diagrams, no pictures.

type Level = 'JBOD' | 'RAID 0' | 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10'

const LEVELS: Record<Level, { min: number; even?: boolean; name: string; idea: string; penalty: number; penaltyWhy: string }> = {
  JBOD: { min: 1, name: 'just a bunch of disks', idea: 'Every disk on its own (or joined end to end). No protection: a dead disk loses its own data. ZFS or Ceph often add the redundancy in software.', penalty: 1, penaltyWhy: 'one write per write' },
  'RAID 0': { min: 2, name: 'striping', idea: 'Data is split across all disks. The fastest, full capacity, and no protection: one dead disk loses everything.', penalty: 1, penaltyWhy: 'one write per write, spread over all disks' },
  'RAID 1': { min: 2, name: 'mirroring', idea: 'Every disk holds the same data. Survives all but one disk failing, fast reads, half the capacity with two disks.', penalty: 2, penaltyWhy: 'every write goes to both copies' },
  'RAID 5': { min: 3, name: 'striping with one parity', idea: 'One parity block per stripe, rotating over the disks. Survives one failure, capacity of N - 1 disks. A rebuild reads every other disk, long and risky on big disks.', penalty: 4, penaltyWhy: 'read old data, read old parity, write new data, write new parity' },
  'RAID 6': { min: 4, name: 'striping with two parities', idea: 'Two parity blocks (P and Q) per stripe. Survives two failures, capacity of N - 2 disks. The usual choice for big disks.', penalty: 6, penaltyWhy: 'read data, P and Q, write data, P and Q' },
  'RAID 10': { min: 4, even: true, name: 'mirrors, then striped', idea: 'Disks in mirror pairs, data striped across the pairs. Survives one failure per pair, half the capacity, fast reads and writes. Common for databases.', penalty: 2, penaltyWhy: 'every write goes to both disks of a pair' },
}
const ORDER = Object.keys(LEVELS) as Level[]
const SIZE_TB = 4
const ROWS = 4
const DISK = 'ABCDEFGH'

/** The block label on disk d in stripe r. */
function block(level: Level, n: number, r: number, d: number): { t: string; kind: 'data' | 'p' | 'q' | 'copy' } {
  if (level === 'JBOD') return { t: `${DISK[d]}${r + 1}`, kind: 'data' }
  if (level === 'RAID 0') return { t: `D${r * n + d + 1}`, kind: 'data' }
  if (level === 'RAID 1') return { t: `D${r + 1}`, kind: d === 0 ? 'data' : 'copy' }
  if (level === 'RAID 10') {
    const pairs = n / 2
    return { t: `D${r * pairs + Math.floor(d / 2) + 1}`, kind: d % 2 === 0 ? 'data' : 'copy' }
  }
  const parities = level === 'RAID 6' ? 2 : 1
  const p = (n - 1 - (r % n) + n) % n
  const q = (p + 1) % n
  if (d === p) return { t: `P${r + 1}`, kind: 'p' }
  if (parities === 2 && d === q) return { t: `Q${r + 1}`, kind: 'q' }
  // data disks in order, skipping the parity disks
  const dataDisks = Array.from({ length: n }, (_, i) => i).filter((i) => i !== p && (parities === 1 || i !== q))
  const k = n - parities
  return { t: `D${r * k + dataDisks.indexOf(d) + 1}`, kind: 'data' }
}

function state(level: Level, n: number, failed: Set<number>): { lost: boolean; lostDisks?: number[] } {
  const f = failed.size
  if (f === 0) return { lost: false }
  if (level === 'JBOD') return { lost: false, lostDisks: [...failed] }
  if (level === 'RAID 0') return { lost: true }
  if (level === 'RAID 1') return { lost: f >= n }
  if (level === 'RAID 5') return { lost: f >= 2 }
  if (level === 'RAID 6') return { lost: f >= 3 }
  for (let pair = 0; pair < n / 2; pair++) if (failed.has(pair * 2) && failed.has(pair * 2 + 1)) return { lost: true }
  return { lost: false }
}

function usable(level: Level, n: number) {
  return { JBOD: n, 'RAID 0': n, 'RAID 1': 1, 'RAID 5': n - 1, 'RAID 6': n - 2, 'RAID 10': n / 2 }[level] * SIZE_TB
}
function survives(level: Level, n: number) {
  return { JBOD: 'none (each disk on its own)', 'RAID 0': 'none', 'RAID 1': `${n - 1} of ${n}`, 'RAID 5': 'any 1', 'RAID 6': 'any 2', 'RAID 10': `any 1; up to ${n / 2} if each is in a different pair` }[level]
}

function RaidSim({ onUse }: { onUse: () => void }) {
  const [level, setLevel] = useState<Level>('RAID 5')
  const [n, setN] = useState(4)
  const [failed, setFailed] = useState<Set<number>>(new Set())
  const L = LEVELS[level]
  const pick = (l: Level) => {
    setLevel(l)
    let m = Math.max(n, LEVELS[l].min)
    if (LEVELS[l].even && m % 2) m += 1
    setN(m)
    setFailed(new Set())
  }
  const setCount = (m: number) => {
    if (m < L.min || m > 8 || (L.even && m % 2)) return
    setN(m)
    setFailed(new Set())
  }
  const toggle = (d: number) => {
    const f = new Set(failed)
    if (f.has(d)) f.delete(d)
    else f.add(d)
    setFailed(f)
    onUse()
  }
  const st = state(level, n, failed)
  const w = 62
  const gap = 12
  const x0 = (d: number) => 10 + d * (w + gap) + (level === 'RAID 10' ? Math.floor(d / 2) * 10 : 0)
  const width = x0(n - 1) + w + 10
  const status = failed.size === 0 ? 'Optimal' : st.lost ? 'Failed: data lost' : level === 'JBOD' ? `Disk ${[...failed].map((d) => DISK[d]).join(', ')} lost, the others fine` : 'Degraded: still serving data'

  return (
    <Card title="RAID by hand: click a disk to fail it">
      <div className="toolbar rd-tools">
        <div className="seg">
          {ORDER.map((l) => (
            <button key={l} className={level === l ? 'on' : ''} onClick={() => pick(l)}>
              {l}
            </button>
          ))}
        </div>
        <div className="seg">
          <button onClick={() => setCount(n - (L.even ? 2 : 1))} aria-label="Fewer disks">
            −
          </button>
          <button className="on" disabled>
            {n} disks × {SIZE_TB} TB
          </button>
          <button onClick={() => setCount(n + (L.even ? 2 : 1))} aria-label="More disks">
            +
          </button>
        </div>
        <button className="btn btn-sm" onClick={() => setFailed(new Set())} disabled={failed.size === 0}>
          Replace and rebuild
        </button>
      </div>
      <p className="rd-idea">
        <b>
          {level}, {L.name}.
        </b>{' '}
        {L.idea}
      </p>
      <div className="rd-wrap">
        <svg viewBox={`0 0 ${width} ${50 + ROWS * 34 + 26}`} className="rd-svg is-raid" role="img" aria-label={`${level} with ${n} disks`}>
          {level === 'RAID 10' &&
            Array.from({ length: n / 2 }, (_, p) => (
              <g key={p}>
                <rect x={x0(p * 2) - 4} y={4} width={2 * w + gap + 8} height={50 + ROWS * 34 - 2} rx={8} className="rd-pair" />
                <text x={x0(p * 2) + w + gap / 2} y={50 + ROWS * 34 + 18} textAnchor="middle" className="rd-cap">
                  mirror pair {p + 1}
                </text>
              </g>
            ))}
          {Array.from({ length: n }, (_, d) => {
            const dead = failed.has(d)
            const gone = dead && (st.lost || level === 'JBOD')
            return (
              <g key={d} className={`rd-disk${dead ? ' is-dead' : ''}`} onClick={() => toggle(d)} role="button" aria-label={`Disk ${DISK[d]}${dead ? ', failed' : ''}`}>
                <rect x={x0(d)} y={10} width={w} height={36 + ROWS * 34} rx={6} className="rd-body" />
                <text x={x0(d) + w / 2} y={30} textAnchor="middle" className="rd-name">
                  {DISK[d]}
                </text>
                {Array.from({ length: ROWS }, (_, r) => {
                  const b = block(level, n, r, d)
                  const lostBlock = st.lost
                  return (
                    <g key={r}>
                      <rect x={x0(d) + 6} y={40 + r * 34} width={w - 12} height={26} rx={4} className={`rd-block is-${b.kind}${dead ? ' is-off' : ''}${lostBlock || gone ? ' is-lost' : ''}`} />
                      <text x={x0(d) + w / 2} y={57 + r * 34} textAnchor="middle" className="rd-blabel">
                        {b.t}
                      </text>
                    </g>
                  )
                })}
                {dead && <path d={`M${x0(d) + 8} 16 L${x0(d) + w - 8} ${40 + ROWS * 34} M${x0(d) + w - 8} 16 L${x0(d) + 8} ${40 + ROWS * 34}`} className="rd-x" />}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="rd-legend">
        <span className="is-data">data</span>
        {(level === 'RAID 1' || level === 'RAID 10') && <span className="is-copy">mirror copy</span>}
        {(level === 'RAID 5' || level === 'RAID 6') && <span className="is-p">parity P</span>}
        {level === 'RAID 6' && <span className="is-q">parity Q</span>}
      </div>
      <p className={`rd-status is-${failed.size === 0 ? 'ok' : st.lost ? 'bad' : 'warn'}`}>
        <b>{status}.</b>{' '}
        {failed.size === 0
          ? 'Every disk healthy. Click a disk to fail it.'
          : st.lost
            ? level === 'RAID 0'
              ? 'One disk gone and every stripe has a hole: RAID 0 has nothing to rebuild from.'
              : 'More disks failed than this level can survive. The data has to come from a backup.'
            : level === 'JBOD'
              ? 'Only the data on the failed disk is gone; the other disks never depended on it.'
              : `The blocks on ${[...failed].map((d) => DISK[d]).join(' and ')} are rebuilt on the fly from ${level === 'RAID 1' || level === 'RAID 10' ? 'the mirror copy' : 'the other disks and the parity'}: reads are slower, and a new disk has to be rebuilt before the next failure.`}
      </p>
      <div className="rd-metrics">
        <div>
          <span>Usable</span>
          <b>
            {usable(level, n)} TB of {n * SIZE_TB}
          </b>
          <i>{Math.round((usable(level, n) / (n * SIZE_TB)) * 100)}%</i>
        </div>
        <div>
          <span>Survives</span>
          <b>{survives(level, n)}</b>
        </div>
        <div>
          <span>Write penalty</span>
          <b>{L.penalty} disk I/O per write</b>
          <i>{L.penaltyWhy}</i>
        </div>
        <div>
          <span>Minimum</span>
          <b>
            {L.min} disk{L.min > 1 ? 's' : ''}
            {L.even ? ', even' : ''}
          </b>
        </div>
      </div>
    </Card>
  )
}

/* ---------- SATA versus SAS: the drive plugs ---------- */

function Plug({ x, sas, label }: { x: number; sas: boolean; label: string }) {
  const y = 30
  return (
    <g transform={`translate(${x} 0)`}>
      <text x={150} y={16} textAnchor="middle" className="rd-head">
        {label}
      </text>
      {/* the drive's edge */}
      <rect x={0} y={y} width={300} height={70} rx={4} className="rd-drive" />
      {/* data segment, 7 pins */}
      <rect x={24} y={y + 34} width={74} height={20} rx={2} className="rd-seg" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={30 + i * 9.5} y={y + 38} width={5} height={12} className="rd-pin" />
      ))}
      {/* the gap or the bridge */}
      {sas ? <rect x={98} y={y + 34} width={26} height={20} className="rd-bridge" /> : <rect x={98} y={y + 34} width={26} height={20} className="rd-gap" />}
      {/* power segment, 15 pins */}
      <rect x={124} y={y + 34} width={150} height={20} rx={2} className="rd-seg" />
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={i} x={130 + i * 9.4} y={y + 38} width={5} height={12} className="rd-pin" />
      ))}
      <text x={61} y={y + 86} textAnchor="middle" className="rd-cap">
        data · 7 pins
      </text>
      <text x={111} y={y + 28} textAnchor="middle" className={sas ? 'rd-note' : 'rd-cap'}>
        {sas ? 'bridge' : 'gap'}
      </text>
      <text x={199} y={y + 86} textAnchor="middle" className="rd-cap">
        power · 15 pins
      </text>
      {sas && (
        <text x={150} y={y + 104} textAnchor="middle" className="rd-note">
          + 7 pins for port 2 on the back
        </text>
      )}
    </g>
  )
}

const IFACES = [
  ['', 'SATA', 'SAS', 'NVMe'],
  ['Speed', '6 Gb/s', '12 Gb/s (24 newest)', 'PCIe x4: about 8 GB/s on Gen4'],
  ['Ports', 'one', 'two (dual port)', 'one, some drives two'],
  ['Duplex', 'half', 'full', 'full'],
  ['Command queue', '32 (NCQ)', 'hundreds', 'up to 64K queues'],
  ['Spinning drives', '5,400 and 7,200 rpm', '7,200, 10k and 15k rpm', 'SSD only'],
  ['Connects to', 'SATA port, SAS HBA', 'SAS HBA or RAID controller', 'PCIe, straight to the CPU'],
]

function Connectors() {
  return (
    <Card title="SATA versus SAS: the plug on the drive">
      <div className="rd-wrap">
        <svg viewBox="0 0 660 150" className="rd-svg" role="img" aria-label="SATA and SAS drive plugs side by side">
          <Plug x={10} sas={false} label="SATA drive" />
          <Plug x={350} sas label="SAS drive" />
        </svg>
      </div>
      <p>
        From the outside they look alike. A SATA plug has a gap between the data and the power contacts; a SAS plug fills that gap with a bridge. The backplane socket follows from that: a{' '}
        <b>SAS backplane or controller takes SATA drives</b>, but a <b>SAS drive does not fit a SATA socket</b>, because the bridge hits the key that sits in the gap.
      </p>
      <div className="rd-table" role="table">
        {IFACES.map((row, i) => (
          <div key={i} role="row" className={i === 0 ? 'is-head' : ''}>
            {row.map((c, j) => (
              <span key={j} role={i === 0 ? 'columnheader' : 'cell'}>
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ---------- form factors, to scale ---------- */

const SHAPES = [
  { id: '35', name: '3.5-inch', w: 101.6, h: 147, tone: 'slate', iface: 'SATA or SAS spinning disks', where: 'storage servers and disk shelves (JBODs): the most terabytes per bay', hot: true },
  { id: 'u2', name: '2.5-inch / U.2', w: 69.85, h: 100.45, tone: 'blue', iface: 'U.2 is NVMe; the same shape exists as SATA and SAS drives, 7 or 15 mm thick', where: 'the front bays of most compute servers', hot: true },
  { id: 'e1s', name: 'E1.S', w: 31.5, h: 111.49, tone: 'teal', iface: 'NVMe in the EDSFF ruler shape, built for flash and airflow', where: 'dense front bays of newer servers', hot: true },
  { id: 'm2', name: 'M.2 2280', w: 22, h: 80, tone: 'amber', iface: 'NVMe (or SATA) card that lies on the board; 2280 means 22 by 80 mm', where: 'the boot drive inside the server', hot: false },
] as const

function FormFactors() {
  const [sel, setSel] = useState<string>('u2')
  const k = 1.45 // px per mm
  let x = 14
  const placed = SHAPES.map((s) => {
    const p = { ...s, x: x + Math.max(0, (92 - s.w * k) / 2), y: 22 + (147 - s.h) * k }
    x += Math.max(s.w * k, 92) + 30
    return p
  })
  const s = SHAPES.find((f) => f.id === sel)!
  return (
    <Card title="Drive shapes, drawn to scale">
      <div className="rd-ff">
        <svg viewBox={`0 0 ${x} ${22 + 147 * k + 40}`} className="rd-svg" role="img" aria-label="Drive form factors to scale">
          {placed.map((p) => (
            <g key={p.id} className={`rd-shape${sel === p.id ? ' is-on' : ''}`} onClick={() => setSel(p.id)} role="button" aria-label={p.name}>
              <rect x={p.x} y={p.y} width={p.w * k} height={p.h * k} rx={4} style={{ fill: `var(--iso-${p.tone}-t)`, stroke: 'var(--iso-edge)' }} />
              {p.id === 'm2' && <rect x={p.x + 3} y={p.y + p.h * k - 12} width={p.w * k - 6} height={8} className="rd-pin" />}
              <text x={p.x + (p.w * k) / 2} y={22 + 147 * k + 16} textAnchor="middle" className="rd-cap">
                {p.name}
              </text>
              <text x={p.x + (p.w * k) / 2} y={22 + 147 * k + 31} textAnchor="middle" className="rd-mm">
                {p.w} × {p.h} mm
              </text>
            </g>
          ))}
        </svg>
        <div className="rd-ffinfo">
          <h3>{s.name}</h3>
          <p>{s.iface}.</p>
          <p>
            <b>Where:</b> {s.where}.
          </p>
          <p>
            <b>Hot-swap:</b> {s.hot ? 'yes, from the front, server running' : 'no, the server has to be opened'}.
          </p>
        </div>
      </div>
    </Card>
  )
}

export function RaidDrives({ meta }: { meta: LessonMeta }) {
  const [used, setUsed] = useState(0)
  useEffect(() => {
    if (used >= 3) markDone(meta.id)
  }, [used, meta.id])
  return (
    <div className="lesson">
      <RaidSim onUse={() => setUsed((u) => u + 1)} />
      <Connectors />
      <FormFactors />
      <KeyPoints
        points={[
          'RAID 0 is speed only, RAID 1 and 10 are copies, RAID 5 and 6 are parity: 1 and 2 disks of protection.',
          'Parity costs writes: a small write is 4 disk I/Os on RAID 5 and 6 on RAID 6, against 2 on a mirror.',
          'Degraded still works but is slower and one failure closer to loss: replace and rebuild before anything else.',
          'A SAS backplane takes SATA drives, not the other way round; NVMe skips the controller and goes to the CPU over PCIe.',
        ]}
      />
    </div>
  )
}

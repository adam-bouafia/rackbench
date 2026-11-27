import { useEffect, useMemo, useState } from 'react'
import { Verdict } from '../engine/ui'
import { markDone } from '../progress'
import { bits, dataPerRow, grid, health, LEVEL_NAME, parityDisk, usableDisks, WRITE_PENALTY, type Level } from '../raid/model'

// RAID Rescue: ten rounds of the RAID questions a rack engineer meets, with a fresh array every time.

type Kind = 'survive' | 'capacity' | 'recover' | 'pick' | 'place' | 'read'

interface Diagram {
  level: Level
  disks: number
  blocks: number
  failed?: number[]
  rows?: number
  /** Row drawn empty with a question mark. */
  ask?: number
}

interface Round {
  kind: Kind
  prompt: string
  diagram?: Diagram
  options?: string[]
  answer?: number
  /** recover rounds */
  given?: [string, number][]
  target?: [string, number]
  why: string
}

const KIND_NAME: Record<Kind, string> = {
  survive: 'Survive or lose',
  capacity: 'Usable capacity',
  recover: 'Rebuild a block',
  pick: 'Pick the level',
  place: 'Where does it go?',
  read: 'Degraded read',
}

const ORDER: Kind[] = ['survive', 'capacity', 'place', 'recover', 'pick', 'survive', 'read', 'capacity', 'pick', 'recover']

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const pickOne = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
const shuffle = <T,>(a: T[]) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
const distinct = (n: number, max: number) => shuffle(Array.from({ length: max }, (_, i) => i)).slice(0, n).sort((a, b) => a - b)
const diskList = (ds: number[]) => ds.map((d) => `disk ${d + 1}`).join(' and ')

/** Shuffle options and return the new index of the right one. */
function withAnswer(options: string[], right: string) {
  const o = shuffle(options)
  return { options: o, answer: o.indexOf(right) }
}

function survive(): Round {
  const conf = pickOne<[Level, number]>([
    ['raid0', rnd(2, 4)],
    ['raid1', rnd(2, 3)],
    ['raid5', rnd(3, 5)],
    ['raid6', rnd(4, 6)],
    ['raid10', pickOne([4, 6])],
  ])
  const [level, disks] = conf
  const n = level === 'raid0' ? 1 : Math.min(level === 'raid6' ? 3 : 2, disks - 1)
  const failed = distinct(rnd(1, n), disks)
  const h = health(level, disks, failed)
  const lost = h === 'failed'
  let why = ''
  if (level === 'raid0') why = 'RAID 0 has no redundancy: any failed disk loses the whole array.'
  else if (level === 'raid1') why = `RAID 1 keeps a full copy on every disk, so it survives until the last disk fails (${disks - 1} of ${disks}).`
  else if (level === 'raid5') why = 'RAID 5 has one parity block per stripe: it survives exactly one failed disk.'
  else if (level === 'raid6') why = 'RAID 6 has two parity blocks per stripe: it survives any two failed disks, not three.'
  else {
    const pair = failed.find((d) => d % 2 === 0 && failed.includes(d + 1))
    why =
      pair !== undefined
        ? `Disks ${pair + 1} and ${pair + 2} are one mirror pair; with both gone, their blocks exist nowhere.`
        : 'Every mirror pair still has at least one disk, so every block still exists somewhere.'
  }
  return {
    kind: 'survive',
    prompt: `${LEVEL_NAME[level]} with ${disks} disks: ${diskList(failed)} ${failed.length > 1 ? 'have' : 'has'} failed. Is the data still there?`,
    diagram: { level, disks, blocks: dataPerRow(level, disks) * 3, failed },
    options: ['Still serving data', 'Data lost'],
    answer: lost ? 1 : 0,
    why,
  }
}

function capacity(): Round {
  const conf = pickOne<[Level, number]>([
    ['raid0', rnd(2, 6)],
    ['raid1', 2],
    ['raid5', rnd(3, 8)],
    ['raid6', rnd(4, 8)],
    ['raid10', pickOne([4, 6, 8])],
  ])
  const [level, disks] = conf
  const size = pickOne([2, 4, 8, 12, 16])
  const right = usableDisks(level, disks) * size
  const near = [disks * size, (disks - 1) * size, (disks - 2) * size, (disks * size) / 2, size].filter((v) => v > 0 && v !== right)
  const far = [right * 2, right + 2 * size, right * 3, right + size].filter((v) => v > 0 && v !== right)
  const pool = [...new Set([...shuffle([...new Set(near)]), ...far])].slice(0, 3)
  const opts = [right, ...pool].map((v) => `${v} TB`)
  const rule: Record<Level, string> = {
    raid0: 'RAID 0 uses every disk: N × size.',
    raid1: 'RAID 1 keeps one disk of data, whatever the number of copies.',
    raid5: 'RAID 5 gives N − 1 disks: one disk worth of parity.',
    raid6: 'RAID 6 gives N − 2 disks: two disks worth of parity.',
    raid10: 'RAID 10 mirrors everything: half of the raw capacity.',
    single: '',
    jbod: '',
  }
  return {
    kind: 'capacity',
    prompt: `${disks} × ${size} TB disks in ${LEVEL_NAME[level]}. How much is usable?`,
    ...withAnswer(opts, `${right} TB`),
    why: `${rule[level]} Here: ${right} TB of ${disks * size} TB raw.`,
  }
}

function recover(): Round {
  const v = [rnd(1, 15), rnd(1, 15), rnd(1, 15)]
  const all: [string, number][] = [
    ['A', v[0]],
    ['B', v[1]],
    ['C', v[2]],
    ['P1', v[0] ^ v[1] ^ v[2]],
  ]
  const lostIdx = rnd(0, 3)
  const target = all[lostIdx]
  const given = all.filter((_, i) => i !== lostIdx)
  return {
    kind: 'recover',
    prompt: `RAID 5, stripe 1. The disk holding ${target[0]} died. Set the bits of ${target[0]} from the other three blocks.`,
    diagram: { level: 'raid5', disks: 4, blocks: 3, failed: [all.findIndex((x) => x[0] === target[0])] },
    given,
    target,
    why: `${target[0]} = ${given.map((g) => g[0]).join(' ⊕ ')} = ${bits(target[1])}. XOR column by column: an odd number of 1s gives 1.`,
  }
}

const SCENARIOS: [string, Level | 'jbod', string][] = [
  ['Boot drives for the operating system: two M.2 SSDs, and the server must keep running if one dies.', 'raid1', 'RAID 1 mirrors the two drives; most servers boot this way.'],
  ['Scratch space for render jobs on four NVMe drives. The data is recreated every run; the customer wants maximum speed.', 'raid0', 'RAID 0 gives the full speed and capacity; losing the data costs nothing here.'],
  ['An archive of twelve 18 TB HDDs: as much capacity as possible, and it must survive two failed disks.', 'raid6', 'RAID 6 survives any two disks with only two disks of parity; rebuilds of 18 TB disks are long.'],
  ['A database on eight SSDs with heavy random writes. Rebuilds must be quick; capacity matters less.', 'raid10', 'RAID 10: fast writes without parity, and a rebuild is a copy from the partner disk.'],
  ['A small file server with four 4 TB disks: good capacity, survive one failed disk, tight budget.', 'raid5', 'RAID 5 keeps 75% of four disks and survives one; fine for small disks and light writes.'],
  ['Ceph storage nodes: the software keeps three copies across servers, so the HBA should pass every disk through as it is.', 'jbod', 'JBOD (pass-through): the redundancy is done by the software across servers.'],
  ['A video recorder with eight large HDDs, mostly sequential writes, that must survive a failure during a long rebuild.', 'raid6', 'RAID 6 still has one parity left during a rebuild; RAID 5 would have none.'],
  ['Virtual machines on six SSDs: steady random writes, and a dead disk must not slow the cluster for long.', 'raid10', 'RAID 10 rebuilds by copying one disk, with no parity work on the others.'],
]
const LEVEL_OPTS = ['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10', 'JBOD']

function pick(used: Set<number>): Round {
  const free = SCENARIOS.map((_, i) => i).filter((i) => !used.has(i))
  const idx = pickOne(free.length ? free : SCENARIOS.map((_, i) => i))
  used.add(idx)
  const [text, level, why] = SCENARIOS[idx]
  const right = level === 'jbod' ? 'JBOD' : LEVEL_NAME[level]
  return { kind: 'pick', prompt: text, options: LEVEL_OPTS, answer: LEVEL_OPTS.indexOf(right), why }
}

function place(): Round {
  const which = rnd(0, 2)
  if (which === 0) {
    const disks = rnd(4, 5)
    const row = rnd(2, 3)
    const p = parityDisk(disks, row)
    return {
      kind: 'place',
      prompt: `RAID 5 on ${disks} disks, parity moving one disk to the left per stripe. Which disk gets P${row + 1}?`,
      diagram: { level: 'raid5', disks, blocks: (disks - 1) * (row + 1), rows: row, ask: row },
      options: Array.from({ length: disks }, (_, d) => `Disk ${d + 1}`),
      answer: p,
      why: `Parity starts on the last disk and moves one disk left per stripe: stripe ${row + 1} puts it on disk ${p + 1}.`,
    }
  }
  if (which === 1) {
    const disks = 3
    const k = rnd(6, 8)
    const L = String.fromCharCode(65 + k)
    return {
      kind: 'place',
      prompt: `RAID 0 on 3 disks. Which disk gets block ${L}?`,
      diagram: { level: 'raid0', disks, blocks: 9, rows: 2, ask: 2 },
      options: ['Disk 1', 'Disk 2', 'Disk 3'],
      answer: k % 3,
      why: `Blocks go round the disks in turn: ${L} is block ${k + 1}, so it lands on disk ${(k % 3) + 1}.`,
    }
  }
  const k = rnd(4, 7)
  const L = String.fromCharCode(65 + k)
  const pair = k % 2
  const right = pair === 0 ? 'Disks 1 and 2' : 'Disks 3 and 4'
  return {
    kind: 'place',
    prompt: `RAID 10 on 4 disks (pairs 1+2 and 3+4). Where is block ${L} stored?`,
    diagram: { level: 'raid10', disks: 4, blocks: 8, rows: Math.floor(k / 2), ask: Math.floor(k / 2) },
    ...withAnswer(['Disks 1 and 2', 'Disks 3 and 4', 'Disk 1 only', 'All four disks'], right),
    why: `Blocks alternate between the mirror pairs, and land on both disks of their pair: ${L} goes to ${right.toLowerCase()}.`,
  }
}

function read(): Round {
  const disks = 4
  const row = rnd(0, 3)
  const failed = rnd(0, 3)
  const g = grid('raid5', disks, 12)
  const lost = g[failed][row]!.label
  const others = g.filter((_, d) => d !== failed).map((col) => col[row]!.label)
  const right = others.join(' ⊕ ')
  const otherRow = (row + 1) % 4
  const wrong1 = g.filter((_, d) => d !== failed).map((col, j) => (j === 0 ? col[otherRow]!.label : col[row]!.label)).join(' ⊕ ')
  return {
    kind: 'read',
    prompt: `RAID 5, 4 disks: disk ${failed + 1} has failed. A program reads ${lost}. What does the controller read to return it?`,
    diagram: { level: 'raid5', disks, blocks: 12, failed: [failed] },
    ...withAnswer([right, wrong1, `${lost} from its mirror copy`, 'Every block on every disk'], right),
    why: `${lost} = ${right}: the other blocks of the same stripe, XORed together. RAID 5 has no mirror copy.`,
  }
}

function makeShift(): Round[] {
  const used = new Set<number>()
  return ORDER.map((k) => (k === 'survive' ? survive() : k === 'capacity' ? capacity() : k === 'recover' ? recover() : k === 'pick' ? pick(used) : k === 'place' ? place() : read()))
}

function MiniArray({ d }: { d: Diagram }) {
  const g = grid(d.level, d.disks, d.blocks)
  const rows = g[0].length
  const cw = 86
  const gap = 14
  const w = d.disks * cw + (d.disks - 1) * gap
  const h = 26 + rows * 28 + 8
  return (
    <svg viewBox={`-4 -4 ${w + 8} ${h + 8}`} className="rr-array" role="img" aria-label={`${LEVEL_NAME[d.level]} array`}>
      {g.map((col, di) => {
        const x = di * (cw + gap)
        const failed = d.failed?.includes(di)
        return (
          <g key={di} className={`rr-disk${failed ? ' is-failed' : ''}`}>
            <rect x={x} y={0} width={cw} height={h} rx="8" className="rr-body" />
            <text x={x + cw / 2} y={17} textAnchor="middle" className="rr-name">
              Disk {di + 1}
            </text>
            {col.map((s, r) => {
              const shown = d.rows === undefined || r < d.rows
              const ask = d.ask === r
              if (!s) return null
              return (
                <g key={r} className={`rr-slot is-${shown ? s.kind : ask ? 'ask' : 'empty'}`}>
                  <rect x={x + 8} y={26 + r * 28} width={cw - 16} height={22} rx="4" />
                  <text x={x + cw / 2} y={26 + r * 28 + 16} textAnchor="middle">
                    {shown ? s.label : ask ? '?' : ''}
                  </text>
                </g>
              )
            })}
            {failed && (
              <g className="rr-x">
                <line x1={x + 10} y1={26} x2={x + cw - 10} y2={h - 8} />
                <line x1={x + cw - 10} y1={26} x2={x + 10} y2={h - 8} />
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function BitRow({ label, value, editable, onToggle }: { label: string; value: number; editable?: boolean; onToggle?: (bit: number) => void }) {
  return (
    <div className={`rr-bits${editable ? ' is-edit' : ''}`}>
      <span className="rr-bits-label">{label}</span>
      {[3, 2, 1, 0].map((b) => {
        const on = (value >> b) & 1
        return editable ? (
          <button key={b} className={`rr-bit${on ? ' is-on' : ''}`} onClick={() => onToggle?.(b)} aria-label={`bit ${3 - b + 1}: ${on}`}>
            {on}
          </button>
        ) : (
          <span key={b} className={`rr-bit${on ? ' is-on' : ''}`}>
            {on}
          </span>
        )
      })}
    </div>
  )
}

const BEST = 'rackbench:raid-best'
const readBest = () => {
  try {
    return Number(localStorage.getItem(BEST) ?? 0) || 0
  } catch {
    return 0
  }
}

export function RaidRescue() {
  const [shiftKey, setShiftKey] = useState(0)
  const rounds = useMemo(() => makeShift(), [shiftKey])
  const [i, setI] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [bitsVal, setBitsVal] = useState(0)
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(readBest)
  const [sheet, setSheet] = useState(false)
  const done = results.length === rounds.length
  const r = rounds[Math.min(i, rounds.length - 1)]
  const answered = r.kind === 'recover' ? checked : choice !== null
  const right = r.kind === 'recover' ? bitsVal === r.target![1] : choice === r.answer

  useEffect(() => {
    if (!done) return
    markDone('raid-rescue')
    if (score > best) {
      setBest(score)
      try {
        localStorage.setItem(BEST, String(score))
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const settle = (ok: boolean) => {
    const s = ok ? streak + 1 : 0
    setStreak(s)
    setScore((v) => v + (ok ? 100 + Math.max(0, s - 1) * 25 : 0))
    setResults((x) => [...x, ok])
  }
  const choose = (k: number) => {
    if (answered) return
    setChoice(k)
    settle(k === r.answer)
  }
  const check = () => {
    if (checked) return
    setChecked(true)
    settle(bitsVal === r.target![1])
  }
  const next = () => {
    setI((v) => v + 1)
    setChoice(null)
    setBitsVal(0)
    setChecked(false)
  }
  const again = () => {
    setShiftKey((k) => k + 1)
    setI(0)
    setChoice(null)
    setBitsVal(0)
    setChecked(false)
    setResults([])
    setScore(0)
    setStreak(0)
  }

  const byKind = (Object.keys(KIND_NAME) as Kind[]).map((k) => {
    const idx = rounds.map((x, j) => (x.kind === k ? j : -1)).filter((j) => j >= 0 && j < results.length)
    return { k, n: idx.length, ok: idx.filter((j) => results[j]).length }
  })

  return (
    <div className="rr page-fit">
      <section className="panel rr-main">
        {done ? (
          <div className="rr-end">
            <p className="eyebrow">Shift complete</p>
            <h1>
              {results.filter(Boolean).length} of {rounds.length} arrays rescued
            </h1>
            <p className="rr-score-big">{score} points</p>
            <table className="data rr-table">
              <tbody>
                {byKind
                  .filter((x) => x.n > 0)
                  .map((x) => (
                    <tr key={x.k}>
                      <th>{KIND_NAME[x.k]}</th>
                      <td>
                        {x.ok}/{x.n}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="muted">
              Best: {Math.max(best, score)} points. Missed some? The RAID lessons show every rule, one level at a time.
            </p>
            <div className="toolbar">
              <button className="btn btn-primary" onClick={again}>
                New shift →
              </button>
              <a className="btn" href="#/lesson/raid-why">
                RAID lessons
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="rr-head">
              <span className="chip">{KIND_NAME[r.kind]}</span>
              <span className="muted">
                Round {i + 1} of {rounds.length}
              </span>
            </div>
            <h2 className="rr-prompt">{r.prompt}</h2>
            {r.diagram && (
              <div className="rr-diagram">
                <MiniArray d={r.diagram} />
              </div>
            )}
            {r.kind === 'recover' ? (
              <div className="rr-xor">
                {r.given!.map(([l, v]) => (
                  <BitRow key={l} label={l} value={v} />
                ))}
                <div className="rr-rule" />
                <BitRow label={r.target![0]} value={bitsVal} editable={!checked} onToggle={(b) => setBitsVal((v) => v ^ (1 << b))} />
                {!checked && (
                  <button className="btn btn-primary" onClick={check}>
                    Check
                  </button>
                )}
              </div>
            ) : (
              <div className={`rr-options${r.options!.length > 4 ? ' is-grid' : ''}`}>
                {r.options!.map((o, k) => (
                  <button key={o} className={`quiz-opt${choice === null ? '' : k === r.answer ? ' is-right' : k === choice ? ' is-wrong' : ' is-dim'}`} onClick={() => choose(k)}>
                    <span className="quiz-letter">{'ABCDEF'[k]}</span>
                    {o}
                  </button>
                ))}
              </div>
            )}
            {answered && (
              <div className="quiz-why rr-why">
                <Verdict ok={right}>{right ? 'Rescued' : 'Not this time'}</Verdict> {r.why}
                <div>
                  <button className="btn btn-primary" onClick={next}>
                    {i + 1 >= rounds.length ? 'End of shift' : 'Next array'} →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
      <aside className="panel rr-side">
        <h3 className="panel-title">RAID Rescue</h3>
        <p className="muted small">Ten arrays per shift, a new set every time. 100 points per rescue, more for a streak.</p>
        <div className="rr-stats">
          <div>
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div>
            <span>Streak</span>
            <strong>{streak}</strong>
          </div>
          <div>
            <span>Best</span>
            <strong>{Math.max(best, done ? score : 0)}</strong>
          </div>
        </div>
        <ol className="rr-dots" aria-label="Rounds">
          {rounds.map((x, j) => (
            <li key={j} className={j < results.length ? (results[j] ? 'is-ok' : 'is-bad') : j === i ? 'is-now' : ''} title={KIND_NAME[x.kind]} />
          ))}
        </ol>
        <button className="btn btn-sm" onClick={() => setSheet(!sheet)}>
          {sheet ? 'Hide' : 'Show'} the cheat sheet
        </button>
        {sheet && (
          <table className="data rr-sheet">
            <thead>
              <tr>
                <th>Level</th>
                <th>Min</th>
                <th>Usable</th>
                <th>Survives</th>
                <th>Write</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['raid0', 2, 'N'],
                  ['raid1', 2, '1 disk'],
                  ['raid5', 3, 'N − 1'],
                  ['raid6', 4, 'N − 2'],
                  ['raid10', 4, 'N / 2'],
                ] as [Level, number, string][]
              ).map(([l, m, u]) => (
                <tr key={l}>
                  <th>{LEVEL_NAME[l]}</th>
                  <td>{m}</td>
                  <td>{u}</td>
                  <td>{l === 'raid0' ? 'none' : l === 'raid1' ? 'all but 1' : l === 'raid5' ? '1' : l === 'raid6' ? '2' : '1 per pair'}</td>
                  <td>{WRITE_PENALTY[l]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </aside>
    </div>
  )
}

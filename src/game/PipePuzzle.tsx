import { useEffect, useMemo, useState } from 'react'
import { markDone } from '../progress'
import { RESULTS } from '../stages/PipeStage'

// Pipe puzzle: build the Linux pipeline that answers the question. Each tile is a real command,
// run here on the sample file, so any pipeline that gives the right output counts.

type Fn = (lines: string[]) => string[]
interface Tile {
  label: string
  fn: Fn
}

const has = (p: string) => (l: string) => l.includes(p)
const field = (l: string, n: number) => l.trim().split(/\s+/)[n - 1] ?? ''
const num = (l: string) => parseFloat(l.trim()) || 0
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const T: Record<string, Tile> = {}
const tile = (label: string, fn: Fn) => (T[label] = { label, fn })
tile('grep FAIL', (ls) => ls.filter(has('FAIL')))
tile('grep PASS', (ls) => ls.filter(has('PASS')))
tile('grep -c FAIL', (ls) => [String(ls.filter(has('FAIL')).length)])
tile('grep -v PASS', (ls) => ls.filter((l) => !l.includes('PASS')))
tile('grep memory', (ls) => ls.filter(has('memory')))
tile('grep be0', (ls) => ls.filter(has('be0')))
tile("grep 'Link is Down'", (ls) => ls.filter(has('Link is Down')))
tile("grep -c 'Link is Down'", (ls) => [String(ls.filter(has('Link is Down')).length)])
tile('grep EDAC', (ls) => ls.filter(has('EDAC')))
tile('grep -v EDAC', (ls) => ls.filter((l) => !l.includes('EDAC')))
tile('grep -i error', (ls) => ls.filter((l) => l.toLowerCase().includes('error')))
tile('grep degrees', (ls) => ls.filter(has('degrees')))
tile('grep RPM', (ls) => ls.filter(has('RPM')))
tile('grep -v ok', (ls) => ls.filter((l) => !l.includes('ok')))
tile('grep -v 1.4', (ls) => ls.filter((l) => !l.includes('1.4')))
tile('grep 1.4', (ls) => ls.filter(has('1.4')))
tile("awk '{print $1}'", (ls) => ls.map((l) => field(l, 1)))
tile("awk '{print $2}'", (ls) => ls.map((l) => field(l, 2)))
tile("awk '{print $3}'", (ls) => ls.map((l) => field(l, 3)))
tile('sort', (ls) => [...ls].sort(cmp))
tile('sort -r', (ls) => [...ls].sort((a, b) => cmp(b, a)))
tile('sort -u', (ls) => [...new Set(ls)].sort(cmp))
tile('sort -n', (ls) => [...ls].sort((a, b) => num(a) - num(b) || cmp(a, b)))
tile('sort -rn', (ls) => [...ls].sort((a, b) => num(b) - num(a) || cmp(b, a)))
tile('sort -k2 -n', (ls) => [...ls].sort((a, b) => (parseFloat(field(a, 2)) || 0) - (parseFloat(field(b, 2)) || 0) || cmp(a, b)))
tile('sort -k2 -rn', (ls) => [...ls].sort((a, b) => (parseFloat(field(b, 2)) || 0) - (parseFloat(field(a, 2)) || 0) || cmp(b, a)))
tile('uniq', (ls) => ls.filter((l, i) => i === 0 || l !== ls[i - 1]))
tile('uniq -c', (ls) => {
  const out: string[] = []
  let n = 0
  ls.forEach((l, i) => {
    n++
    if (i === ls.length - 1 || ls[i + 1] !== l) {
      out.push(`${String(n).padStart(7)} ${l}`)
      n = 0
    }
  })
  return out
})
tile('head -1', (ls) => ls.slice(0, 1))
tile('head -3', (ls) => ls.slice(0, 3))
tile('tail -1', (ls) => ls.slice(-1))
tile('tail -3', (ls) => ls.slice(-3))
tile('wc -l', (ls) => [String(ls.length)])

const pad = (cols: string[], w: number[]) => cols.map((c, i) => (i < cols.length - 1 ? c.padEnd(w[i]) : c)).join(' ')
const FILES: Record<string, string[]> = {
  'results.txt': RESULTS.map((r) => pad(r, [6, 6, 4])),
  'dmesg.log': [
    '[   12.402] ice 0000:3b:00.0 be0: NIC Link is up 25 Gbps Full Duplex',
    '[   12.611] ice 0000:3b:00.1 be1: NIC Link is up 25 Gbps Full Duplex',
    '[  851.117] ice 0000:3b:00.0 be0: NIC Link is Down',
    '[  853.904] ice 0000:3b:00.0 be0: NIC Link is up 25 Gbps Full Duplex',
    '[  977.210] EDAC MC0: 1 CE memory read error on DIMM_B1',
    '[ 2210.004] ice 0000:3b:00.0 be0: NIC Link is Down',
    '[ 2212.771] ice 0000:3b:00.0 be0: NIC Link is up 25 Gbps Full Duplex',
    '[ 3305.448] EDAC MC0: 1 CE memory read error on DIMM_B1',
  ],
  'sensors.txt': [
    'CPU0_Temp      71    degrees  ok',
    'CPU1_Temp      78    degrees  ok',
    'DIMM_A1_Temp   49    degrees  ok',
    'DIMM_B1_Temp   52    degrees  ok',
    'Inlet_Temp     24    degrees  ok',
    'FAN1           8400  RPM      ok',
    'FAN2           0     RPM      cr',
    'PSU1_Temp      41    degrees  ok',
  ],
  'bios.txt': ['rk-n1 bios 1.4', 'rk-n2 bios 1.4', 'rk-n3 bios 1.3', 'rk-n4 bios 1.4', 'rk-n5 bios 1.2', 'rk-n6 bios 1.4'],
  'drives.txt': ['nvme0n1  PM9A3     3.84T', 'nvme1n1  PM9A3     3.84T', 'nvme2n1  PM9A3     3.84T', 'nvme3n1  PM9A3     3.84T', 'sda      MZ7L3     1.92T', 'sdb      MZ7L3     1.92T', 'sdc      ST8000NM  8T'],
}

interface Puzzle {
  file: string
  goal: string
  answer: string[]
  tiles: string[]
  hint: string
}

const PUZZLES: Puzzle[] = [
  { file: 'results.txt', goal: 'Show only the tests that failed.', answer: ['grep FAIL'], tiles: ['grep FAIL', 'grep PASS', 'sort', 'head -3', 'wc -l'], hint: 'grep keeps the lines that contain a word.' },
  { file: 'results.txt', goal: 'How many tests failed? One number.', answer: ['grep FAIL', 'wc -l'], tiles: ['grep FAIL', 'wc -l', 'grep -c FAIL', 'uniq -c', 'sort'], hint: 'Count lines with wc -l, or let grep count with -c.' },
  { file: 'results.txt', goal: 'List every node that failed a test, each once, in order.', answer: ['grep FAIL', "awk '{print $1}'", 'sort', 'uniq'], tiles: ['grep FAIL', "awk '{print $1}'", "awk '{print $2}'", 'sort', 'uniq', 'uniq -c', 'sort -u'], hint: 'Filter, keep the first column, then sort and drop the repeats.' },
  { file: 'results.txt', goal: 'Which node failed most often? One line: the count and the node.', answer: ['grep FAIL', "awk '{print $1}'", 'sort', 'uniq -c', 'sort -rn', 'head -1'], tiles: ['grep FAIL', "awk '{print $1}'", 'sort', 'uniq -c', 'sort -rn', 'sort -n', 'head -1', 'tail -3'], hint: 'Count with sort | uniq -c, then sort the counts as numbers, highest first.' },
  { file: 'dmesg.log', goal: 'How many times did be0 go down?', answer: ['grep be0', "grep -c 'Link is Down'"], tiles: ['grep be0', "grep -c 'Link is Down'", "grep 'Link is Down'", 'grep -i error', 'wc -l', 'sort'], hint: 'Keep the be0 lines, then count the ones that say Link is Down.' },
  { file: 'dmesg.log', goal: 'Show only the memory error lines.', answer: ['grep EDAC'], tiles: ['grep EDAC', 'grep -v EDAC', 'grep be0', 'head -1', 'wc -l'], hint: 'Memory errors are reported by EDAC.' },
  { file: 'sensors.txt', goal: 'The three hottest temperature sensors, hottest first.', answer: ['grep degrees', 'sort -k2 -rn', 'head -3'], tiles: ['grep degrees', 'grep RPM', 'sort -k2 -rn', 'sort -k2 -n', 'head -3', 'tail -3'], hint: 'Keep the temperatures, sort column 2 as numbers from high to low, keep three.' },
  { file: 'sensors.txt', goal: 'Which fan has stopped? Its line only.', answer: ['grep RPM', 'grep -v ok'], tiles: ['grep RPM', 'grep -v ok', 'grep degrees', 'sort -k2 -rn', 'head -1', 'tail -1'], hint: 'Keep the fans, then the line whose status is not ok (or the slowest fan).' },
  { file: 'bios.txt', goal: 'Which nodes are not on BIOS 1.4? Node names only.', answer: ['grep -v 1.4', "awk '{print $1}'"], tiles: ['grep -v 1.4', 'grep 1.4', "awk '{print $1}'", "awk '{print $3}'", 'sort -r', 'wc -l'], hint: 'grep -v keeps the lines that do not match.' },
  { file: 'drives.txt', goal: 'Count the drives of each model, models in alphabetical order.', answer: ["awk '{print $2}'", 'sort', 'uniq -c'], tiles: ["awk '{print $2}'", "awk '{print $3}'", 'sort', 'uniq -c', 'sort -rn', 'wc -l'], hint: 'The model is column 2; sort it so uniq -c can count.' },
]

const run = (file: string, pipe: string[]) => pipe.reduce((ls, t) => T[t].fn(ls), FILES[file])
const norm = (ls: string[]) => ls.map((l) => l.trim().replace(/\s+/g, ' ')).join('\n')

const KEY = 'rackbench:pipes-solved'
const readSolved = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as number[]
  } catch {
    return []
  }
}

export function PipePuzzle() {
  const [n, setN] = useState(() => {
    const s = readSolved()
    const first = PUZZLES.findIndex((_, i) => !s.includes(i))
    return first < 0 ? 0 : first
  })
  const [pipe, setPipe] = useState<string[]>([])
  const [solved, setSolved] = useState<number[]>(readSolved)
  const [hint, setHint] = useState(false)
  const pz = PUZZLES[n]
  const order = useMemo(() => {
    const t = [...pz.tiles]
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[t[i], t[j]] = [t[j], t[i]]
    }
    return t
  }, [pz])
  const out = run(pz.file, pipe)
  const expected = run(pz.file, pz.answer)
  const ok = pipe.length > 0 && norm(out) === norm(expected)
  const isSolved = solved.includes(n) || ok

  const save = (s: number[]) => {
    setSolved(s)
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch {
      /* ignore */
    }
    if (s.length >= PUZZLES.length) markDone('pipe-puzzle')
  }
  useEffect(() => {
    if (ok && !solved.includes(n)) save([...solved, n])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, n])

  const goTo = (k: number) => {
    setN(k)
    setPipe([])
    setHint(false)
  }

  return (
    <div className="pz page-fit">
      <section className="panel pz-main">
        <div className="pz-head">
          <div>
            <p className="eyebrow">
              Puzzle {n + 1} of {PUZZLES.length} · {pz.file}
            </p>
            <h2 className="pz-goal">{pz.goal}</h2>
          </div>
          <ol className="pz-dots" aria-label="Puzzles">
            {PUZZLES.map((_, k) => (
              <li key={k}>
                <button className={`${k === n ? 'is-now' : ''}${solved.includes(k) ? ' is-ok' : ''}`} onClick={() => goTo(k)} aria-label={`Puzzle ${k + 1}`}>
                  {k + 1}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="pz-cmd" aria-label="Your pipeline">
          <span className="pp-prompt">$</span>
          <span className="pz-fixed">cat {pz.file}</span>
          {pipe.map((t, k) => (
            <button key={k} className="pz-piece" onClick={() => setPipe(pipe.filter((_, j) => j !== k))} title="Remove">
              <span className="pp-pipe">|</span> {t} <span className="pz-x">×</span>
            </button>
          ))}
          {pipe.length === 0 && <span className="pz-empty">add commands from below</span>}
        </div>
        <div className="pz-tiles">
          {order.map((t) => (
            <button key={t} className="pz-tile" onClick={() => setPipe([...pipe, t])} disabled={pipe.length >= 7}>
              {t}
            </button>
          ))}
          <button className="btn btn-sm" onClick={() => setPipe([])} disabled={!pipe.length}>
            Clear
          </button>
          <button className="btn btn-sm" onClick={() => setHint(true)}>
            Hint
          </button>
        </div>
        {hint && <p className="pz-hint">{pz.hint}</p>}
        <div className="pz-io">
          <div className="pz-pane">
            <h4>{pipe.length ? 'Output' : pz.file}</h4>
            <pre className={ok ? 'is-ok' : ''}>{out.length ? out.join('\n') : '(no output)'}</pre>
          </div>
          <div className="pz-pane">
            <h4>Expected</h4>
            <pre>{expected.join('\n')}</pre>
          </div>
        </div>
        {isSolved && ok && (
          <div className="pz-win">
            <strong>Solved.</strong> <code>cat {pz.file} | {pipe.join(' | ')}</code>
            {n + 1 < PUZZLES.length ? (
              <button className="btn btn-primary" onClick={() => goTo(n + 1)}>
                Next puzzle →
              </button>
            ) : (
              <span className="muted">That was the last one: {solved.length} of {PUZZLES.length} solved.</span>
            )}
          </div>
        )}
      </section>
      <aside className="panel pz-side">
        <h3 className="panel-title">Pipe puzzle</h3>
        <p className="muted small">Click commands to add them to the pipeline; click a piece in the pipeline to remove it. The output updates as you build. Any pipeline that gives the expected output counts.</p>
        <h4 className="panel-sub">The file</h4>
        <pre className="pz-file">{FILES[pz.file].join('\n')}</pre>
        <p className="small">
          Solved {solved.length} of {PUZZLES.length}. Learn the commands in <a href="#/lesson/linux-pipes">Linux commands: pipes, exit codes, loops</a>.
        </p>
      </aside>
    </div>
  )
}

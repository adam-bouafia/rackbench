import { useEffect, useState, type CSSProperties } from 'react'
import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'

// Linux pipes, one command at a time: the lines of a burn-in result file are filtered, cut, sorted
// and counted as each stage joins the pipeline. Rows move to their new places between steps.

type Scene = 'pipe' | 'save' | 'exit' | 'loop' | 'tools'
export interface PipeStep extends StageStep {
  scene: Scene
  /** Pipeline stage shown: 0 cat, 1 grep, 2 awk, 3 sort, 4 uniq -c, 5 sort -rn. */
  stage?: number
  cmd?: string[]
}

export const RESULTS: string[][] = [
  ['rk-n03', 'cpu', 'PASS', 'stress-ng 2h'],
  ['rk-n07', 'memory', 'FAIL', 'ecc=3 DIMM B1'],
  ['rk-n03', 'disk', 'PASS', 'fio 3.1 GB/s'],
  ['rk-n12', 'net', 'FAIL', 'link drops=2 be0'],
  ['rk-n07', 'disk', 'PASS', 'fio 3.0 GB/s'],
  ['rk-n09', 'cpu', 'PASS', 'stress-ng 2h'],
  ['rk-n12', 'memory', 'FAIL', 'ecc=1 DIMM A1'],
  ['rk-n07', 'net', 'FAIL', 'mtu 1500 on be1'],
  ['rk-n05', 'disk', 'FAIL', 'fio 1.9 GB/s'],
  ['rk-n09', 'net', 'PASS', 'iperf3 23.4 Gb/s'],
  ['rk-n07', 'cpu', 'FAIL', 'throttled 2.1 GHz'],
]

interface RowView {
  show: boolean
  pos: number
  count?: number
}

/** Where every input row sits after pipeline stage `s`. */
function layout(s: number): RowView[] {
  const ids = RESULTS.map((_, i) => i)
  if (s <= 0) return ids.map((i) => ({ show: true, pos: i }))
  const fail = ids.filter((i) => RESULTS[i][2] === 'FAIL')
  if (s <= 2) return ids.map((i) => (fail.includes(i) ? { show: true, pos: fail.indexOf(i) } : { show: false, pos: i }))
  const sorted = [...fail].sort((a, b) => (RESULTS[a][0] < RESULTS[b][0] ? -1 : RESULTS[a][0] > RESULTS[b][0] ? 1 : a - b))
  if (s === 3) return ids.map((i) => (sorted.includes(i) ? { show: true, pos: sorted.indexOf(i) } : { show: false, pos: i }))
  const groups: number[][] = []
  for (const i of sorted) {
    const last = groups[groups.length - 1]
    if (last && RESULTS[last[0]][0] === RESULTS[i][0]) last.push(i)
    else groups.push([i])
  }
  const order = s >= 5 ? [...groups].sort((a, b) => b.length - a.length) : groups
  return ids.map((i) => {
    const gi = order.findIndex((g) => g.includes(i))
    if (gi < 0) return { show: false, pos: i }
    const g = order[gi]
    return g[0] === i ? { show: true, pos: gi, count: g.length } : { show: false, pos: gi }
  })
}

const ROW = 27

function Terminal({ cmd }: { cmd: string[] }) {
  return (
    <div className="pp-term">
      <span className="pp-prompt">$</span>
      {cmd.map((c, i) => (
        <span key={i} className={i === cmd.length - 1 ? 'pp-new' : ''}>
          {i > 0 && <span className="pp-pipe"> | </span>}
          {c}
        </span>
      ))}
    </div>
  )
}

function PipeTable({ stage, from }: { stage: number; from: number }) {
  const [phase, setPhase] = useState<'from' | 'to'>('from')
  useEffect(() => {
    setPhase('from')
    let b = 0
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setPhase('to'))
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [stage, from])
  const s = phase === 'from' ? from : stage
  const view = layout(s)
  const cut = s >= 2
  return (
    <div className="pp-out" style={{ height: RESULTS.length * ROW + 12 }}>
      {RESULTS.map((r, i) => {
        const v = view[i]
        return (
          <div key={i} className={`pp-row${v.show ? '' : ' is-out'}${r[2] === 'FAIL' ? ' is-fail' : ''}`} style={{ top: 6 + v.pos * ROW } as CSSProperties}>
            <span className={`pp-count${v.count ? ' is-on' : ''}`}>{v.count ?? ''}</span>
            <span className="pp-c0">{r[0]}</span>
            <span className={`pp-c${cut ? ' is-cut' : ''}`}>{r[1]}</span>
            <span className={`pp-c pp-verdict${cut ? ' is-cut' : ''}`}>{r[2]}</span>
            <span className={`pp-c${cut ? ' is-cut' : ''}`}>{r[3]}</span>
          </div>
        )
      })}
    </div>
  )
}

const EXIT_LINES: [string, string][] = [
  ['$ grep -q FAIL results.txt; echo $?', '0'],
  ['$ grep -q LOST results.txt; echo $?', '1'],
  ['$ false | true; echo $?', '0'],
  ['$ set -o pipefail; false | true; echo $?', '1'],
]

const TOOLS: [string, string][] = [
  ['grep -i / -v / -c', 'match, invert, count lines'],
  ["awk '{print $2}'", 'pick columns'],
  ['cut -d, -f1', 'cut fields from CSV'],
  ['sort -n / -rn / -k2', 'sort as numbers, by a column'],
  ['uniq -c', 'count repeated neighbours'],
  ['wc -l', 'count lines'],
  ['head / tail -f', 'first lines, follow a log'],
  ["sed 's/a/b/'", 'replace text'],
  ['xargs -P 8', 'run in parallel from a list'],
  ['tee file', 'show and save at once'],
  ['journalctl -k / dmesg', 'kernel messages'],
  ['ssh node cmd', 'run on another machine'],
]

export function PipeStage({ steps, cur, replayKey }: StageProps<PipeStep>) {
  const st = steps[Math.max(0, cur)]
  const scene = cur < 0 ? 'pipe' : st.scene
  if (scene === 'pipe') {
    const stage = cur < 0 ? 0 : (st.stage ?? 0)
    const prev = cur > 0 && steps[cur - 1].scene === 'pipe' ? (steps[cur - 1].stage ?? 0) : stage
    return (
      <div className="pp" key={replayKey}>
        <Terminal cmd={cur < 0 ? ['cat results.txt'] : (st.cmd ?? [])} />
        <PipeTable stage={stage} from={Math.min(prev, stage)} />
      </div>
    )
  }
  return (
    <div className="pp" key={`${cur}:${replayKey}`}>
      {scene === 'save' && (
        <>
          <Terminal cmd={["grep FAIL results.txt", "awk '{print $1}'", 'sort', 'uniq -c', 'sort -rn > worst-nodes.txt']} />
          <div className="pp-files">
            <div className="pp-file pp-in">
              <strong>worst-nodes.txt</strong>
              <pre>{'      3 rk-n07\n      2 rk-n12\n      1 rk-n05'}</pre>
            </div>
            <div className="pp-file pp-in" style={{ animationDelay: '0.5s' }}>
              <strong>Redirections</strong>
              <pre>{'cmd > file      write, replace\ncmd >> file     append\ncmd 2> err.log  errors only\ncmd > all 2>&1  output and errors\ncmd | tee file  show and save'}</pre>
            </div>
          </div>
        </>
      )}
      {scene === 'exit' && (
        <div className="pp-shell">
          {EXIT_LINES.map(([c, o], i) => (
            <div key={c} className="pp-in" style={{ animationDelay: `${i * 0.6}s` }}>
              <div className="pp-cmdline">{c}</div>
              <div className={`pp-code ${o === '0' ? 'is-ok' : 'is-bad'}`}>{o}</div>
            </div>
          ))}
        </div>
      )}
      {scene === 'loop' && (
        <div className="pp-loop">
          <pre className="pp-script">{`for n in rk-n1 rk-n2 rk-n3; do
  ssh "$n" 'sudo dmidecode -s bios-version' > "bios-$n.txt" &
done
wait
grep -H . bios-*.txt`}</pre>
          <div className="pp-fan">
            <div className="pp-node is-host">test host</div>
            <div className="pp-wires">
              {[0, 1, 2].map((k) => (
                <span key={k} className="pp-wire" style={{ animationDelay: `${0.2 + k * 0.05}s` }} />
              ))}
            </div>
            <div className="pp-nodes">
              {[
                ['rk-n1', '1.4'],
                ['rk-n2', '1.4'],
                ['rk-n3', '1.3'],
              ].map(([n, v], k) => (
                <div key={n} className="pp-node-row">
                  <div className="pp-node">{n}</div>
                  <div className={`pp-file-chip pp-in${v !== '1.4' ? ' is-bad' : ''}`} style={{ animationDelay: `${1.1 + k * 0.15}s` }}>
                    bios-{n}.txt: {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {scene === 'tools' && (
        <div className="pp-tools">
          {TOOLS.map(([c, w], i) => (
            <div key={c} className="pp-tool pp-in" style={{ animationDelay: `${i * 0.06}s` }}>
              <code>{c}</code>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const G = 'grep FAIL results.txt'
const A = "awk '{print $1}'"

export const LINUX_PIPES: StageLesson<PipeStep> = {
  Stage: PipeStage,
  metrics: [
    { id: 'lines', label: 'Lines out', start: '11' },
    { id: 'question', label: 'Question', start: 'which node fails most?' },
  ],
  intro: [
    'Interviewers ask whether you can run Linux scripts and work with Linux commands. The honest proof is a one-liner you can build and explain.',
    'Every node of a rack wrote its burn-in results into results.txt. The question: which nodes failed, and which one failed most?',
  ],
  legend: [
    ['|', 'Pipe: the output of one command becomes the input of the next'],
    ['stdout', 'What a command prints; what the pipe carries'],
    ['Exit code', '0 for success, anything else for failure'],
  ],
  steps: [
    {
      scene: 'pipe',
      stage: 0,
      cmd: ['cat results.txt'],
      short: 'The file',
      title: 'One line per test: node, test, verdict, detail',
      explain: ['cat prints the file: 11 lines here, thousands on a real rack. Reading it by eye does not scale; the next commands answer the question for you.'],
      key: 'Text in, text out: that is what makes Linux commands composable.',
    },
    {
      scene: 'pipe',
      stage: 1,
      cmd: [G],
      short: 'grep',
      title: 'grep keeps the lines that match',
      tag: 'action',
      explain: ['grep FAIL keeps the 6 lines that contain FAIL and drops the rest. Add -i to ignore case, -v to keep the lines that do not match, -c to count them.'],
      key: 'grep filters rows.',
      m: { lines: '6' },
    },
    {
      scene: 'pipe',
      stage: 2,
      cmd: [G, A],
      short: 'awk',
      title: 'awk keeps the first column',
      tag: 'action',
      explain: [
        'The pipe | sends the output of grep into awk. awk splits every line on spaces into fields $1, $2, $3; {print $1} prints only the node name.',
        "For CSV files, cut -d, -f1 does the same, and awk -F, '{print $1}' too.",
      ],
      key: 'awk picks columns; the pipe joins small tools into one.',
    },
    {
      scene: 'pipe',
      stage: 3,
      cmd: [G, A, 'sort'],
      short: 'sort',
      title: 'sort puts equal lines together',
      tag: 'action',
      explain: ['sort orders the lines, so the three rk-n07 lines end up next to each other. The next command needs exactly that.'],
    },
    {
      scene: 'pipe',
      stage: 4,
      cmd: [G, A, 'sort', 'uniq -c'],
      short: 'uniq -c',
      title: 'uniq -c merges and counts neighbours',
      tag: 'action',
      explain: ['uniq merges repeated lines that are next to each other, and -c puts the count in front: rk-n05 once, rk-n07 three times, rk-n12 twice.', 'Without the sort before it, uniq would miss repeats that are not neighbours.'],
      key: 'sort | uniq -c: count how often each value appears.',
      m: { lines: '3' },
    },
    {
      scene: 'pipe',
      stage: 5,
      cmd: [G, A, 'sort', 'uniq -c', 'sort -rn'],
      short: 'sort -rn',
      title: 'Worst first',
      tag: 'result',
      explain: ['sort -n sorts by number, -r reverses: the node with the most failures is on top. Add | head -1 to keep only that line.', 'rk-n07 failed memory, network and CPU tests: the first node to open.'],
      key: 'Filter, cut, sort, count: half the one-liners you will ever write.',
      m: { question: 'rk-n07, 3 failures' },
    },
    {
      scene: 'save',
      short: 'Save it',
      title: 'Send the answer to a file',
      explain: ['> writes the output into a file and replaces it; >> appends. 2> catches the error messages, 2>&1 joins them with the output, and | tee shows and saves at the same time.'],
      key: 'Results you do not save are results you do not have.',
    },
    {
      scene: 'exit',
      short: 'Exit codes',
      title: 'The exit code is the verdict',
      tag: 'technique',
      explain: [
        'Every command returns an exit code: 0 means success, anything else a failure; $? holds the last one. grep returns 0 when it found a match and 1 when it did not.',
        'A pipeline returns the code of its last command, so a failure early in it is hidden. set -o pipefail makes the pipeline fail if any command in it fails: put it at the top of every test script.',
      ],
      key: 'Read the exit code; never guess from the text.',
    },
    {
      scene: 'loop',
      short: 'Loop',
      title: 'The same command on every node',
      tag: 'action',
      explain: [
        'The loop starts one ssh per node; & sends each into the background, so the three nodes answer at the same time, and wait holds the script until all are done.',
        'Each answer goes into its own file. grep -H . prints every file with its name: rk-n3 still runs BIOS 1.3, and the others 1.4.',
      ],
      key: 'Loop, run in parallel, save per node, compare: the bones of every rack test script.',
    },
    {
      scene: 'tools',
      short: 'Toolbox',
      title: 'The commands worth knowing by heart',
      tag: 'result',
      explain: ['These cover most rack work: find lines, cut columns, count, sort, follow logs, run on many nodes. In an interview, write one pipeline on paper and explain each stage, as in this lesson.'],
    },
  ],
}

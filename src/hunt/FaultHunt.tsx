import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { FAULTS, HELP, newGame, run, type FaultId, type Game } from './sim'
import { Verdict } from '../engine/ui'
import { markDone } from '../progress'

interface Line {
  kind: 'in' | 'out' | 'sys'
  text: string
}

const PROMPT = 'you@host:~/rackbench$'
const BEST_KEY = 'rackbench:hunt-best'

function readBest(): number | null {
  try {
    const v = localStorage.getItem(BEST_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

const mmss = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function FaultHunt() {
  const [game, setGame] = useState<Game>(newGame)
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [hpos, setHpos] = useState(-1)
  const [now, setNow] = useState(Date.now())
  const [guess, setGuess] = useState<{ node: number; fault: FaultId | '' }>({ node: 0, fault: '' })
  const [result, setResult] = useState<null | { node: boolean; fault: boolean; ms: number; cmds: number }>(null)
  const [best, setBest] = useState<number | null>(readBest)
  const termRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (result) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [result])

  useEffect(() => {
    const el = termRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const start = () => {
    setGame(newGame())
    setLines([{ kind: 'sys', text: 'One fault is hidden somewhere in rack rk-01 (three nodes, bond0 configured). Find it with the tools below, then name the node and the fault. Type "help" for the commands.' }])
    setResult(null)
    setGuess({ node: 0, fault: '' })
    setHistory([])
    setNow(Date.now())
    inputRef.current?.focus()
  }

  useEffect(() => {
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (line: string) => {
    const cmd = line.trim()
    if (!cmd) return
    if (cmd === 'clear') {
      setLines([])
    } else {
      setLines((ls) => [...ls, { kind: 'in', text: cmd }, { kind: 'out', text: run(game, cmd) }])
    }
    setHistory((h) => [...h, cmd])
    setHpos(-1)
    setInput('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit(input)
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const p = hpos < 0 ? history.length - 1 : Math.max(0, hpos - 1)
      setHpos(p)
      setInput(history[p])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (hpos < 0) return
      const p = hpos + 1
      if (p >= history.length) {
        setHpos(-1)
        setInput('')
      } else {
        setHpos(p)
        setInput(history[p])
      }
    }
  }

  const answer = () => {
    if (!guess.node || !guess.fault) return
    const ms = Date.now() - game.started
    const r = { node: guess.node === game.node, fault: guess.fault === game.fault, ms, cmds: history.length }
    setResult(r)
    if (r.node && r.fault) {
      markDone('fault-hunt')
      if (best === null || ms < best) {
        setBest(ms)
        try {
          localStorage.setItem(BEST_KEY, String(ms))
        } catch {
          /* ignore */
        }
      }
    }
  }

  const info = FAULTS.find((f) => f.id === game.fault)!
  const elapsed = (result ? result.ms : now - game.started) || 0

  return (
    <div className="hunt page-fit">
      <section className="hunt-main">
        <header className="hunt-head">
          <div>
            <h1>Fault hunt</h1>
            <p className="muted small">One hidden fault in rack rk-01. Triage: reachable? matches the BOM? links, MTU, bond, counters? slower than the others? BMCs?</p>
          </div>
          <div className="hunt-stats">
            <span className="stepcount">⏱ {mmss(elapsed)}</span>
            <span className="stepcount">{history.length} cmds</span>
            {best !== null && <span className="stepcount">best {mmss(best)}</span>}
            <button className="btn btn-primary" onClick={start}>
              New round
            </button>
          </div>
        </header>
        <div className="term" onClick={() => inputRef.current?.focus()}>
          <div className="term-out" ref={termRef}>
            {lines.map((l, i) => (
              <div key={i} className={`term-${l.kind}`}>
                {l.kind === 'in' ? (
                  <>
                    <span className="term-prompt">{PROMPT}</span> {l.text}
                  </>
                ) : (
                  l.text
                )}
              </div>
            ))}
          </div>
          <div className="term-line">
            <span className="term-prompt">{PROMPT}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Command"
              disabled={!!result}
            />
          </div>
        </div>
      </section>

      <aside className="hunt-side">
        <section className="panel hunt-help">
          <h2 className="panel-title">Commands</h2>
          <ul className="help-list">
            {HELP.map((h) => (
              <li key={h.cmd}>
                <button
                  onClick={() => {
                    setInput(h.cmd)
                    inputRef.current?.focus()
                  }}
                >
                  <code>{h.cmd}</code>
                  <span>{h.what}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel hunt-answer">
          <h2 className="panel-title">Your finding</h2>
          {!result ? (
            <div className="answer">
              <label>
                Node
                <select value={guess.node} onChange={(e) => setGuess({ ...guess, node: Number(e.target.value) })}>
                  <option value={0}>choose</option>
                  <option value={1}>rk-n1</option>
                  <option value={2}>rk-n2</option>
                  <option value={3}>rk-n3</option>
                </select>
              </label>
              <label>
                Fault
                <select value={guess.fault} onChange={(e) => setGuess({ ...guess, fault: e.target.value as FaultId })}>
                  <option value="">choose</option>
                  {FAULTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary" onClick={answer} disabled={!guess.node || !guess.fault}>
                Submit
              </button>
            </div>
          ) : (
            <div className="result">
              <p>
                <Verdict ok={result.node && result.fault}>{result.node && result.fault ? 'Correct' : 'Not quite'}</Verdict> {mmss(result.ms)}, {result.cmds} commands. It was <strong>{info.label}</strong> on <strong>rk-n{game.node}</strong>.
              </p>
              <dl className="kv">
                <dt>Test case</dt>
                <dd>{info.testCase}</dd>
                <dt>Evidence</dt>
                <dd>{info.evidence}</dd>
                <dt>Real rack</dt>
                <dd>{info.cause}</dd>
                <dt>Action</dt>
                <dd>{info.action}</dd>
              </dl>
              <p className="muted small">
                On the lab: <code>./lab/faults.sh inject {game.fault} rk-n{game.node}</code>
              </p>
              <button className="btn btn-primary" onClick={start}>
                Next round
              </button>
            </div>
          )}
        </section>
      </aside>
    </div>
  )
}

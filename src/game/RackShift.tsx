import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { markDone, useStored } from '../progress'
import {
  BASELINE,
  BCOLS,
  CAUSES,
  DEFECTS,
  FEED_LIMIT,
  KINDS,
  ORDERS,
  PCOLS,
  PORTS,
  POINTS,
  RACK_U,
  SPEC,
  STAGES,
  bcolsOf,
  buildRules,
  burnCell,
  cableDefect,
  expectedCell,
  fits,
  lldp,
  makeOrder,
  maxPoints,
  medianFio,
  occupied,
  pcolOf,
  planned,
  powerCell,
  rackLoad,
  type BCol,
  type Cause,
  type Defect,
  type Order,
  type PCol,
  type Placed,
  type Port,
  type ServerKind,
  type Stage,
} from './shift'

type Phase = 'intro' | 'play' | 'shipped' | 'done'
type Sel =
  | { stage: 'cable'; server: string; port: Port }
  | { stage: 'power'; server: string; col: PCol }
  | { stage: 'burnin'; server: string; col: BCol }
  | null
type Note = { tone: 'ok' | 'bad' | 'info'; text: string; explain?: string } | null
type Tab = 'order' | 'plan' | 'tests'

const ZERO: Record<Stage, number> = { build: 0, cable: 0, power: 0, burnin: 0, report: 0 }
const STAGE_TAB: Record<Stage, Tab> = { build: 'order', cable: 'plan', power: 'order', burnin: 'tests', report: 'order' }
const KIND_NAME: Record<ServerKind, string> = { node: 'compute', stor: 'storage', gpu: 'GPU' }

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
const sum = (r: Record<Stage, number>) => Object.values(r).reduce((a, b) => a + b, 0)
const symptom = (o: Order, d: Defect) => DEFECTS[d.kind].symptom(d, o)
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

export function RackShift() {
  const [best, setBest] = useStored<string>('rackbench:shift-best', '0')
  const [phase, setPhase] = useState<Phase>('intro')
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [ix, setIx] = useState(0)
  const order = useMemo(() => makeOrder(ix, seed), [ix, seed])
  const [stage, setStage] = useState<Stage>('build')
  const [rack, setRack] = useState<Placed[]>([])
  const [pick, setPick] = useState<string | null>(null)
  const [defects, setDefects] = useState<Defect[]>(order.defects)
  const [pts, setPts] = useState<Record<Stage, number>>(ZERO)
  const [totals, setTotals] = useState<{ ref: string; title: string; score: number; max: number; you: number; qa: number }[]>([])
  const [log, setLog] = useState<{ t: string; text: string; d?: number }[]>([])
  const [fails, setFails] = useState(0)
  const [rules, setRules] = useState<ReturnType<typeof buildRules> | null>(null)
  const [sel, setSel] = useState<Sel>(null)
  const [suspect, setSuspect] = useState(false)
  const [tried, setTried] = useState<string[]>([])
  const [note, setNote] = useState<Note>(null)
  const [qa, setQa] = useState<Defect[] | null>(null)
  const [powered, setPowered] = useState(0)
  const [burn, setBurn] = useState(-1)
  const [retest, setRetest] = useState(-1)
  const [answers, setAnswers] = useState<Record<string, { ev: string; cause: Cause | '' }>>({})
  const [reported, setReported] = useState(false)
  const [tab, setTab] = useState<Tab>('order')
  const t0 = useRef(0)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (phase !== 'play') return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [phase])

  const addLog = (text: string, d?: number) => setLog((l) => [{ t: clock(Date.now() - t0.current), text, d }, ...l].slice(0, 80))
  const score = (st: Stage, d: number, text: string) => {
    setPts((p) => ({ ...p, [st]: p[st] + d }))
    addLog(text, d)
  }

  const begin = (i: number, s: number) => {
    if (i === 0) {
      t0.current = Date.now()
      setTotals([])
      setLog([])
    }
    setIx(i)
    setSeed(s)
    setDefects(makeOrder(i, s).defects)
    setStage('build')
    setRack([])
    setPick(null)
    setPts(ZERO)
    setFails(0)
    setRules(null)
    setSel(null)
    setNote(null)
    setQa(null)
    setPowered(0)
    setBurn(-1)
    setRetest(-1)
    setAnswers({})
    setReported(false)
    setTab('order')
    setPhase('play')
    const o = ORDERS[i]
    window.setTimeout(() => addLog(`Order ${o.ref}: ${o.title} for ${o.customer}`), 0)
  }

  const choose = (s: Sel) => {
    setSel(s)
    setSuspect(false)
    setTried([])
    setNote(null)
  }

  // ---------- build ----------
  const cart = order.list.filter((i) => !rack.some((p) => p.id === i.id))
  const picked = cart.find((i) => i.id === pick) ?? cart[0]
  const placeAt = (u: number) => {
    if (!picked) return
    const size = KINDS[picked.kind].size
    const bottom = fits(rack, picked.kind, u) ? u : size > 1 && fits(rack, picked.kind, u - size + 1) ? u - size + 1 : null
    if (bottom === null) {
      setNote({ tone: 'bad', text: `${picked.id} needs ${size} free units in a row here.` })
      return
    }
    setRack([...rack, { ...picked, u: bottom }])
    setPick(null)
    setRules(null)
    setNote(null)
  }
  const unplace = (p: Placed) => {
    setRack(rack.filter((x) => x !== p))
    if (p.kind !== 'blank') setPick(p.id)
    setRules(null)
  }
  const fillBlanks = () => {
    const occ = occupied(rack)
    const add: Placed[] = []
    for (let u = 1; u <= RACK_U; u++) if (!occ.has(u)) add.push({ id: `blank-${u}`, kind: 'blank', u })
    setRack([...rack, ...add])
    setRules(null)
  }
  const checkBuild = () => {
    const r = buildRules(order, rack)
    setRules(r)
    if (r.every((x) => x.ok)) {
      score('build', Math.max(POINTS.buildFail, POINTS.build - POINTS.buildFail * fails), `Build passed${fails ? ` after ${fails} failed check${fails > 1 ? 's' : ''}` : ' on the first check'}`)
      advance()
    } else {
      setFails(fails + 1)
      addLog(`Build check: ${r.filter((x) => !x.ok).length} rule(s) not met`)
    }
  }

  // ---------- shared fault handling ----------
  const servers = order.servers
  const fix = (d: Defect, st: 'cable' | 'power' | 'burnin') => {
    setDefects((ds) => ds.map((x) => (x.id === d.id ? { ...x, found: 'you', fixed: true, retested: st !== 'burnin' } : x)))
    score(st, POINTS.find, `${symptom(order, d)}: fixed`)
    setNote({ tone: 'ok', text: st === 'burnin' ? `Fixed. Now retest ${d.server}: a fix counts once the test passes again.` : `Found and fixed: ${symptom(order, d)}.`, explain: DEFECTS[d.kind].explain })
    setSuspect(false)
  }
  const wrongCall = (st: Stage, text: string, entry: string) => {
    score(st, -POINTS.wrong, entry)
    setNote({ tone: 'bad', text })
  }

  // cabling
  const recable = (server: string, port: Port) => {
    const d = cableDefect(defects, server, port)
    if (d) fix(d, 'cable')
    else wrongCall('cable', `${server} ${port} already matches the plan: ${planned(order.n[server], port)}.`, `${server} ${port} re-cabled for nothing`)
  }

  // power on
  const powerOn = () => {
    setPowered(0)
    addLog('ipmitool chassis power on, every server')
    let k = 0
    const id = window.setInterval(() => {
      k += 1
      setPowered(k)
      if (k >= servers.length) window.clearInterval(id)
    }, 260)
  }
  const allOn = powered >= servers.length

  // burn-in
  const runBurn = () => {
    addLog('Burn-in started: stress-ng, fio, iperf3, 8 hours')
    let p = 0
    setBurn(0)
    const id = window.setInterval(() => {
      p = Math.min(100, p + 2.5)
      setBurn(p)
      if (p >= 100) {
        window.clearInterval(id)
        addLog('Burn-in finished: results in')
      }
    }, 80)
  }
  const pending = defects.filter((d) => d.stage === 'burnin' && d.fixed && !d.retested)
  const runRetest = () => {
    const ids = pending.map((d) => d.id)
    let p = 0
    setRetest(0)
    const id = window.setInterval(() => {
      p = Math.min(100, p + 5)
      setRetest(p)
      if (p >= 100) {
        window.clearInterval(id)
        setRetest(-1)
        setDefects((ds) => ds.map((x) => (ids.includes(x.id) ? { ...x, retested: true } : x)))
        addLog(`Retest passed: ${pending.map((d) => d.server).join(', ')}`)
        setNote({ tone: 'ok', text: 'Retest passed. The results now show the fixed servers.' })
      }
    }, 80)
  }

  // ---------- stage flow ----------
  const advance = () => {
    const i = STAGES.findIndex((s) => s.id === stage)
    const next = STAGES[i + 1]?.id
    if (!next) return
    setStage(next)
    setSel(null)
    setNote(null)
    setQa(null)
    setTab(STAGE_TAB[next])
  }
  const finish = () => {
    if (stage === 'power' && !allOn) return setNote({ tone: 'info', text: 'Power the servers on first.' })
    if (stage === 'burnin' && burn < 100) return setNote({ tone: 'info', text: 'Run the burn-in first.' })
    if (stage === 'burnin' && pending.length) return setNote({ tone: 'info', text: `Retest ${pending.map((d) => d.server).join(', ')} first: a fix counts once the test passes again.` })
    const missed = defects.filter((d) => d.stage === stage && !d.fixed)
    if (missed.length) {
      setDefects((ds) => ds.map((d) => (missed.some((m) => m.id === d.id) ? { ...d, found: 'qa', fixed: true, retested: true } : d)))
      setPts((p) => ({ ...p, [stage]: p[stage] - POINTS.qa * missed.length }))
      missed.forEach((m) => addLog(`QA found: ${symptom(order, m)}`, -POINTS.qa))
      setQa(missed)
      setSel(null)
      setNote(null)
    } else {
      addLog(`${STAGES.find((s) => s.id === stage)!.title}: no open issues`)
      advance()
    }
  }

  // report
  const submitReport = () => {
    let gained = 0
    for (const d of defects) {
      const a = answers[d.id]
      const right = DEFECTS[d.kind].evidence(d, order)
      if (a?.ev === right) gained += POINTS.evidence
      if (a?.cause === DEFECTS[d.kind].cause) gained += POINTS.cause
    }
    score('report', gained, `Report written: ${gained} of ${defects.length * (POINTS.evidence + POINTS.cause)} points`)
    setReported(true)
  }
  const total = sum(pts)
  const ship = () => {
    const row = { ref: order.ref, title: order.title, score: total, max: maxPoints(order), you: defects.filter((d) => d.found === 'you').length, qa: defects.filter((d) => d.found === 'qa').length }
    setTotals([...totals, row])
    addLog(`${order.ref} shipped`)
    setPhase('shipped')
  }
  const endShift = () => {
    const shiftScore = totals.reduce((a, r) => a + r.score, 0)
    if (shiftScore > Number(best)) setBest(String(shiftScore))
    markDone('rack-shift')
    setPhase('done')
  }

  // ---------- views ----------
  if (phase === 'intro') return <Intro best={Number(best)} onStart={() => begin(0, seed)} />
  if (phase === 'done') {
    const shiftScore = totals.reduce((a, r) => a + r.score, 0)
    return <ShiftDone rows={totals} score={shiftScore} best={Number(best)} onAgain={() => begin(0, Math.floor(Math.random() * 1e9))} />
  }

  const stIx = STAGES.findIndex((s) => s.id === stage)
  const shiftSoFar = totals.reduce((a, r) => a + r.score, 0) + (phase === 'play' ? total : 0)
  const busy = (burn >= 0 && burn < 100) || retest >= 0

  return (
    <div className="rs page-fit">
      <header className="rs-head">
        <div className="rs-name">
          <strong>Rack Shift</strong>
          <span>
            Order {ix + 1} of {ORDERS.length} · {order.ref} {order.title}
          </span>
        </div>
        <ol className="rs-steps">
          {STAGES.map((s, i) => (
            <li key={s.id} className={phase === 'shipped' || i < stIx ? 'is-done' : i === stIx ? 'is-on' : ''}>
              <i>{phase === 'shipped' || i < stIx ? '✓' : i + 1}</i>
              {s.title}
            </li>
          ))}
        </ol>
        <div className="rs-meta">
          <span className="rs-score">
            {shiftSoFar} <small>pts</small>
          </span>
          <span className="rs-time">{clock(now - t0.current)}</span>
          <button className="btn btn-sm" onClick={() => begin(0, Math.floor(Math.random() * 1e9))}>
            New shift
          </button>
        </div>
      </header>

      <div className="rs-body">
        <RackView order={order} rack={rack} stage={stage} picked={picked?.id} powered={phase === 'shipped' || stIx > 2 ? servers.length : stage === 'power' ? powered : 0} busy={busy} focus={sel?.server} onEmpty={placeAt} onDev={unplace} />

        <section className="panel rs-main">
          {phase === 'shipped' ? (
            <Shipped order={order} pts={pts} defects={defects} last={ix === ORDERS.length - 1} onNext={() => (ix === ORDERS.length - 1 ? endShift() : begin(ix + 1, seed))} />
          ) : qa ? (
            <div className="rs-scroll">
              <h2 className="rs-h">QA check: {qa.length === 1 ? 'one problem' : `${qa.length} problems`} got past this stage</h2>
              <p className="muted small">QA fixed {qa.length === 1 ? 'it' : 'them'} ({signed(-POINTS.qa * qa.length)} points). This is what to look for next time.</p>
              {qa.map((d) => (
                <div key={d.id} className="rs-qa">
                  <strong>{symptom(order, d)}</strong>
                  <code>{DEFECTS[d.kind].evidence(d, order)}</code>
                  <p>{DEFECTS[d.kind].explain}</p>
                </div>
              ))}
              <button className="btn btn-primary" onClick={advance}>
                Continue to {STAGES[stIx + 1]?.title} →
              </button>
            </div>
          ) : (
            <>
              <p className="rs-why">
                <b>{STAGES[stIx].title}.</b> {STAGES[stIx].why}
              </p>
              <div className="rs-scroll">
                {stage === 'build' && (
                  <BuildStage order={order} rack={rack} cart={cart} picked={picked?.id} setPick={setPick} rules={rules} fillBlanks={fillBlanks} clear={() => { setRack([]); setRules(null) }} />
                )}
                {stage === 'cable' && (
                  <table className="data rs-table">
                    <thead>
                      <tr>
                        <th>Server</th>
                        <th>Port</th>
                        <th>LLDP neighbour</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servers.flatMap((s) =>
                        PORTS.map((port) => {
                          const on = sel?.stage === 'cable' && sel.server === s.id && sel.port === port
                          const done = defects.find((d) => d.stage === 'cable' && d.fixed && d.found === 'you' && (d.server === s.id || d.other === s.id) && (d.kind === 'swap' ? port === 'P1' : d.kind === 'bmc-port' ? port === 'BMC' : d.kind === 'unplugged' ? port === 'P2' : port !== 'BMC'))
                          return (
                            <tr key={s.id + port} className={`is-click${on ? ' is-sel' : ''}${done ? ' is-fixed' : ''}`} onClick={() => choose({ stage: 'cable', server: s.id, port })}>
                              <td>{port === 'BMC' ? s.id : ''}</td>
                              <td>{port}</td>
                              <td className="mono">{lldp(order, defects, s.id, port)}</td>
                            </tr>
                          )
                        }),
                      )}
                    </tbody>
                  </table>
                )}
                {stage === 'power' &&
                  (powered === 0 ? (
                    <div className="rs-start">
                      <p>Every server is cabled and dark. Power them on through their BMCs, then check each one against the order.</p>
                      <code>for n in {servers.map((s) => s.id).join(' ')}; do ipmitool -H $n-bmc chassis power on; done</code>
                      <button className="btn btn-primary" onClick={powerOn}>
                        Power on every server
                      </button>
                    </div>
                  ) : (
                    <table className="data rs-table rs-grid">
                      <thead>
                        <tr>
                          <th>Server</th>
                          {PCOLS.map((c) => (
                            <th key={c.id}>{c.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {servers.map((s, i) => (
                          <tr key={s.id}>
                            <th>{s.id}</th>
                            {PCOLS.map((c) => {
                              if (i >= powered) return <td key={c.id} className="muted">POST…</td>
                              const cell = powerCell(order, defects, s.id, c.id)
                              const on = sel?.stage === 'power' && sel.server === s.id && sel.col === c.id
                              const done = defects.some((d) => d.stage === 'power' && d.server === s.id && d.found === 'you' && d.fixed && pcolOf(d.kind) === c.id)
                              return (
                                <td key={c.id} className={`is-click${on ? ' is-sel' : ''}${done ? ' is-fixed' : ''}`} onClick={() => choose({ stage: 'power', server: s.id, col: c.id })}>
                                  {cell.value}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ))}
                {stage === 'burnin' &&
                  (burn < 100 ? (
                    <div className="rs-start">
                      <p>Full load on every server at once: CPU and memory with verification, every drive, every network port. Then read the results against the test plan.</p>
                      <code>stress-ng --cpu 0 --vm 4 --vm-bytes 90% --verify -t 8h &amp; fio --rw=randread … &amp; iperf3 -c tor01 …</code>
                      {burn < 0 ? (
                        <button className="btn btn-primary" onClick={runBurn}>
                          Start the burn-in
                        </button>
                      ) : (
                        <div className="rs-progress">
                          <div style={{ width: `${burn}%` }} />
                          <span>hour {Math.min(8, Math.floor(burn / 12.5) + 1)} of 8</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <table className="data rs-table rs-grid">
                        <thead>
                          <tr>
                            <th>Server</th>
                            {BCOLS.map((c) => (
                              <th key={c.id}>{c.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {servers.map((s) => (
                            <tr key={s.id}>
                              <th>
                                {s.id}
                                {pending.some((d) => d.server === s.id) && <em className="rs-tag">retest</em>}
                              </th>
                              {BCOLS.map((c) => {
                                const cell = burnCell(order, defects, s.id, c.id)
                                const on = sel?.stage === 'burnin' && sel.server === s.id && sel.col === c.id
                                const done = defects.some((d) => d.stage === 'burnin' && d.server === s.id && d.found === 'you' && d.retested && bcolsOf(d.kind).includes(c.id))
                                return (
                                  <td key={c.id} className={`is-click${on ? ' is-sel' : ''}${done ? ' is-fixed' : ''}`} onClick={() => choose({ stage: 'burnin', server: s.id, col: c.id })}>
                                    {cell.value}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {pending.length > 0 && (
                        <div className="rs-retest">
                          {retest >= 0 ? (
                            <div className="rs-progress">
                              <div style={{ width: `${retest}%` }} />
                              <span>retesting {pending.map((d) => d.server).join(', ')}</span>
                            </div>
                          ) : (
                            <button className="btn btn-primary" onClick={runRetest}>
                              Retest {pending.map((d) => d.server).join(', ')}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ))}
                {stage === 'report' && <ReportStage order={order} defects={defects} answers={answers} setAnswers={setAnswers} reported={reported} />}
              </div>

              <Detail
                order={order}
                defects={defects}
                sel={sel}
                suspect={suspect}
                tried={tried}
                note={note}
                onOk={() => {
                  setSel(null)
                  setNote(null)
                }}
                onSuspect={() => {
                  if (!sel) return
                  if (sel.stage === 'cable') return recable(sel.server, sel.port)
                  if (sel.stage === 'power') {
                    const cell = powerCell(order, defects, sel.server, sel.col)
                    if (!cell.defect) return wrongCall('power', `It matches the order: ${expectedCell(order.kindOf[sel.server] as ServerKind, sel.col)}.`, `${sel.server} ${sel.col}: false alarm`)
                  } else {
                    const cell = burnCell(order, defects, sel.server, sel.col)
                    if (!cell.defect) return wrongCall('burnin', 'This value is within the test plan.', `${sel.server} ${sel.col}: false alarm`)
                    if (cell.defect.fixed) return setNote({ tone: 'info', text: `Already fixed. Retest ${sel.server} to see new results.` })
                  }
                  setSuspect(true)
                  setNote(null)
                }}
                onFix={(f) => {
                  if (!sel || sel.stage === 'cable') return
                  const d = sel.stage === 'power' ? powerCell(order, defects, sel.server, sel.col).defect : burnCell(order, defects, sel.server, sel.col).defect
                  if (!d) return
                  if (f === DEFECTS[d.kind].fixes[0]) fix(d, sel.stage)
                  else {
                    setTried([...tried, f])
                    wrongCall(sel.stage, 'That did not change the result. Read the value again: which part or setting does it point to?', `${d.server}: "${f}" did not help`)
                  }
                }}
              />

              <footer className="rs-foot">
                <span className="muted small">
                  This order: {signed(total)} pts · {defects.filter((d) => d.fixed).length} issue{defects.filter((d) => d.fixed).length === 1 ? '' : 's'} closed
                </span>
                {stage === 'build' ? (
                  <button className="btn btn-primary" onClick={checkBuild} disabled={cart.length > 0}>
                    {cart.length ? `${cart.length} on the cart` : 'Check the build →'}
                  </button>
                ) : stage === 'report' ? (
                  reported ? (
                    <button className="btn btn-primary" onClick={ship}>
                      Ship the rack →
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={submitReport} disabled={defects.some((d) => !answers[d.id]?.ev || !answers[d.id]?.cause)}>
                      Submit the report
                    </button>
                  )
                ) : (
                  <button className="btn btn-primary" onClick={finish} disabled={busy}>
                    Done with {STAGES[stIx].title.toLowerCase()} →
                  </button>
                )}
              </footer>
            </>
          )}
        </section>

        <aside className="rs-side">
          <section className="panel rs-trav">
            <div className="seg rs-tabs">
              <button className={tab === 'order' ? 'on' : ''} onClick={() => setTab('order')}>
                Order
              </button>
              <button className={tab === 'plan' ? 'on' : ''} onClick={() => setTab('plan')}>
                Cabling
              </button>
              <button className={tab === 'tests' ? 'on' : ''} onClick={() => setTab('tests')}>
                Tests
              </button>
            </div>
            <Traveler order={order} rack={rack} tab={tab} />
          </section>
          <section className="panel rs-log">
            <h3 className="panel-title">Log</h3>
            <ol>
              {log.map((l, i) => (
                <li key={i}>
                  <span className="mono muted">{l.t}</span>
                  <span>{l.text}</span>
                  {l.d ? <b className={l.d > 0 ? 'up' : 'down'}>{signed(l.d)}</b> : <b />}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  )
}

/* ---------- pieces ---------- */

function RackView({ order, rack, stage, picked, powered, busy, focus, onEmpty, onDev }: { order: Order; rack: Placed[]; stage: Stage; picked?: string; powered: number; busy: boolean; focus?: string; onEmpty: (u: number) => void; onDev: (p: Placed) => void }) {
  const occ = occupied(rack)
  const building = stage === 'build'
  const load = rackLoad(rack)
  return (
    <section className="panel rs-rackcol">
      <div className="rl-rack rs-rack" role="list" aria-label="Rack units, top to bottom">
        {Array.from({ length: RACK_U }, (_, i) => RACK_U - i).map((u) => {
          const p = occ.get(u)
          if (p && p.u + KINDS[p.kind].size - 1 !== u) return null
          const size = p ? KINDS[p.kind].size : 1
          const idx = p ? order.servers.findIndex((s) => s.id === p.id) : -1
          const led = idx < 0 ? '' : idx < powered ? (busy ? 'busy' : 'on') : 'off'
          return (
            <div key={u} role="listitem" className="rl-row" style={{ flex: `${size} 1 0` }}>
              <span className="rl-u">{u}</span>
              {p ? (
                <button className={`rl-dev kind-${KINDS[p.kind].cls}${focus === p.id ? ' is-sel' : ''}`} onClick={() => building && onDev(p)} disabled={!building} title={building ? 'Take it out' : KINDS[p.kind].label}>
                  <span>{p.kind === 'blank' ? 'blank' : p.id}</span>
                  {led && <i className={`rs-led is-${led}`} />}
                </button>
              ) : (
                <button className={`rl-empty${building && picked ? ' is-target' : ''}`} onClick={() => building && onEmpty(u)} disabled={!building}>
                  {building && picked ? `put ${picked} here` : ''}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div className="rs-power">
        <span>
          Load {load} W of {FEED_LIMIT} W per feed
        </span>
        <div className="rs-meter">
          <div style={{ width: `${Math.min(100, (load / FEED_LIMIT) * 100)}%` }} />
        </div>
      </div>
    </section>
  )
}

function BuildStage({ order, rack, cart, picked, setPick, rules, fillBlanks, clear }: { order: Order; rack: Placed[]; cart: Order['list']; picked?: string; setPick: (id: string) => void; rules: ReturnType<typeof buildRules> | null; fillBlanks: () => void; clear: () => void }) {
  const open = RACK_U - [...occupied(rack).keys()].length
  return (
    <div className="rs-build">
      <h3 className="panel-title">Cart · {cart.length ? `${cart.length} left` : 'empty'}</h3>
      {cart.length ? (
        <>
          <div className="rs-cart">
            {cart.map((i) => (
              <button key={i.id} className={`rs-chip kind-${KINDS[i.kind].cls}${picked === i.id ? ' is-on' : ''}`} onClick={() => setPick(i.id)}>
                <strong>{i.id}</strong>
                <span>
                  {KINDS[i.kind].label} · {KINDS[i.kind].watts} W
                </span>
              </button>
            ))}
          </div>
          <p className="muted small">Pick a device, then click a unit in the rack. Click a device in the rack to take it out again.</p>
        </>
      ) : (
        <p className="muted small">Everything from the order is in the rack.</p>
      )}
      <div className="toolbar">
        <button className="btn btn-sm" onClick={fillBlanks} disabled={open === 0}>
          Blanking panels in {open} open unit{open === 1 ? '' : 's'}
        </button>
        <button className="btn btn-sm" onClick={clear} disabled={!rack.length}>
          Empty the rack
        </button>
      </div>
      {rules && (
        <ul className="rs-rules">
          {rules.map((r) => (
            <li key={r.title} className={r.ok ? 'ok' : 'bad'}>
              <b>{r.ok ? 'OK' : 'Fix'}</b>
              <span>
                <strong>{r.title}.</strong> {r.ok ? '' : r.fail}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">The order: {order.list.length} devices. Rules are checked when everything is in.</p>
    </div>
  )
}

function Detail({ order, defects, sel, suspect, tried, note, onOk, onSuspect, onFix }: { order: Order; defects: Defect[]; sel: Sel; suspect: boolean; tried: string[]; note: Note; onOk: () => void; onSuspect: () => void; onFix: (f: string) => void }) {
  if (!sel && !note) return null
  let head = ''
  let body: ReactNode = null
  let ok = ''
  let bad = ''
  let fixes: string[] = []
  if (sel?.stage === 'cable') {
    head = `${sel.server} · ${sel.port}`
    body = (
      <>
        LLDP neighbour <code>{lldp(order, defects, sel.server, sel.port)}</code> <span className="muted">(lldpctl)</span>. Compare it with the cabling plan.
      </>
    )
    ok = 'Matches the plan'
    bad = 'Re-cable to the plan'
  } else if (sel?.stage === 'power') {
    const kind = order.kindOf[sel.server] as ServerKind
    const col = PCOLS.find((c) => c.id === sel.col)!
    const cell = powerCell(order, defects, sel.server, sel.col)
    head = `${sel.server} · ${col.label}`
    body = (
      <>
        Reports <code>{cell.value}</code> <span className="muted">({col.cmd})</span>. The order says <code>{expectedCell(kind, sel.col)}</code>.
      </>
    )
    ok = 'Matches the order'
    bad = 'Does not match'
    if (cell.defect) fixes = order.fixes[cell.defect.id]
  } else if (sel?.stage === 'burnin') {
    const kind = order.kindOf[sel.server] as ServerKind
    const col = BCOLS.find((c) => c.id === sel.col)!
    const cell = burnCell(order, defects, sel.server, sel.col)
    head = `${sel.server} · ${col.label}`
    const extra =
      sel.col === 'fio'
        ? ` Median of the ${KIND_NAME[kind]} servers: ${medianFio(order, defects, kind).toFixed(1)}k, so this is ${Math.round((Number(cell.value) / medianFio(order, defects, kind)) * 100)}%.`
        : sel.col === 'net'
          ? ` This is a ${SPEC[kind].port} port.`
          : ''
    body = (
      <>
        Result <code>{cell.value}</code>. Test plan: {col.rule}.{extra}
      </>
    )
    ok = 'Within the plan'
    bad = 'Fails the plan'
    if (cell.defect && !cell.defect.fixed) fixes = order.fixes[cell.defect.id]
  }
  return (
    <div className="rs-detail">
      {sel && (
        <>
          <div className="rs-detail-row">
            <strong>{head}</strong>
            <span className="rs-detail-body">{body}</span>
          </div>
          {!suspect ? (
            <div className="toolbar">
              <button className="btn btn-sm" onClick={onOk}>
                {ok}
              </button>
              <button className="btn btn-sm btn-bad" onClick={onSuspect}>
                {bad}
              </button>
            </div>
          ) : (
            <div className="rs-fixes">
              <span className="muted small">What do you do?</span>
              {fixes.map((f) => (
                <button key={f} className="btn btn-sm" disabled={tried.includes(f)} onClick={() => onFix(f)}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {note && (
        <div className={`rs-note is-${note.tone}`}>
          <p>{note.text}</p>
          {note.explain && <p className="small">{note.explain}</p>}
        </div>
      )}
    </div>
  )
}

function ReportStage({ order, defects, answers, setAnswers, reported }: { order: Order; defects: Defect[]; answers: Record<string, { ev: string; cause: Cause | '' }>; setAnswers: (a: Record<string, { ev: string; cause: Cause | '' }>) => void; reported: boolean }) {
  const set = (id: string, k: 'ev' | 'cause', v: string) => setAnswers({ ...answers, [id]: { ev: answers[id]?.ev ?? '', cause: answers[id]?.cause ?? '', [k]: v } })
  return (
    <div className="rs-report">
      <p className="small">
        Rack {order.ref}, {order.title.toLowerCase()} for {order.customer}. {order.servers.length} servers on BIOS {BASELINE.bios} and BMC {BASELINE.bmc}; cabling checked with LLDP; 8-hour burn-in. {defects.length} issues, all fixed and retested. For each, pick the evidence and the root cause.
      </p>
      <ol>
        {defects.map((d) => {
          const a = answers[d.id] ?? { ev: '', cause: '' }
          const rightEv = DEFECTS[d.kind].evidence(d, order)
          const rightCause = DEFECTS[d.kind].cause
          return (
            <li key={d.id} className="rs-issue">
              <div className="rs-issue-head">
                <strong>{symptom(order, d)}</strong>
                <em className={`rs-tag${d.found === 'qa' ? ' is-qa' : ''}`}>{d.found === 'qa' ? 'found by QA' : 'found by you'}</em>
              </div>
              <span className="muted small">Fix: {DEFECTS[d.kind].fixes[0]}{d.stage === 'burnin' ? '; retest passed' : ''}.</span>
              <label>
                <span>Evidence</span>
                <select value={a.ev} onChange={(e) => set(d.id, 'ev', e.target.value)} disabled={reported} className={reported ? (a.ev === rightEv ? 'is-right' : 'is-wrong') : ''}>
                  <option value="">choose the output that shows it</option>
                  {order.evidence[d.id].map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Root cause</span>
                <select value={a.cause} onChange={(e) => set(d.id, 'cause', e.target.value)} disabled={reported} className={reported ? (a.cause === rightCause ? 'is-right' : 'is-wrong') : ''}>
                  <option value="">choose</option>
                  {CAUSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              {reported && (a.ev !== rightEv || a.cause !== rightCause) && (
                <p className="small rs-answer">
                  {a.ev !== rightEv && (
                    <>
                      Evidence: <code>{rightEv}</code>.{' '}
                    </>
                  )}
                  {a.cause !== rightCause && <>Root cause: {CAUSES.find((c) => c.id === rightCause)!.label}.</>}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Traveler({ order, rack, tab }: { order: Order; rack: Placed[]; tab: Tab }) {
  const kinds = [...new Set(order.servers.map((s) => s.kind))] as ServerKind[]
  if (tab === 'plan')
    return (
      <div className="rs-trav-body">
        <p className="small muted">Each server has a number n. BMC goes to the management switch port n, P1 to data switch port n, P2 to data switch port n + 24.</p>
        <table className="data rs-plan">
          <thead>
            <tr>
              <th>Server</th>
              <th>n</th>
              <th>BMC</th>
              <th>P1</th>
              <th>P2</th>
            </tr>
          </thead>
          <tbody>
            {order.servers.map((s) => (
              <tr key={s.id}>
                <th>{s.id}</th>
                <td>{order.n[s.id]}</td>
                <td className="mono">Gi1/0/{order.n[s.id]}</td>
                <td className="mono">Eth1/{order.n[s.id]}</td>
                <td className="mono">Eth1/{order.n[s.id] + 24}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted">BMC ports are on mgmt01, P1 and P2 on tor01.</p>
      </div>
    )
  if (tab === 'tests')
    return (
      <div className="rs-trav-body">
        <p className="small muted">8-hour burn-in on every server, then these pass criteria:</p>
        <ul className="rs-crit">
          {BCOLS.map((c) => (
            <li key={c.id}>
              <strong>{c.label}</strong> {c.rule}
            </li>
          ))}
          <li>
            <strong>After a fix</strong> retest the server; it passes only on the new result.
          </li>
        </ul>
      </div>
    )
  return (
    <div className="rs-trav-body">
      <p className="small">
        <strong>
          {order.ref} · {order.title}
        </strong>{' '}
        for {order.customer}.
      </p>
      <ul className="rs-items">
        {Object.entries(order.items).map(([k, n]) => (
          <li key={k}>
            {n} × {KINDS[k as keyof typeof KINDS].label} <span className="muted">({KINDS[k as keyof typeof KINDS].watts} W)</span>
          </li>
        ))}
      </ul>
      <p className="small">
        Firmware baseline: <strong>BIOS {BASELINE.bios}</strong>, <strong>BMC {BASELINE.bmc}</strong>
      </p>
      <table className="data rs-bom">
        <thead>
          <tr>
            <th />
            {kinds.map((k) => (
              <th key={k}>{KIND_NAME[k]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(['cpus', 'mem', 'drives', 'extra'] as PCol[]).map((c) => (
            <tr key={c}>
              <th>{PCOLS.find((x) => x.id === c)!.label}</th>
              {kinds.map((k) => (
                <td key={k}>{expectedCell(k, c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small muted">
        Power: feeds A and B, 230 V × 32 A each. Every server has two PSUs, one per feed. Rack load now {rackLoad(rack)} W.
      </p>
    </div>
  )
}

function Shipped({ order, pts, defects, last, onNext }: { order: Order; pts: Record<Stage, number>; defects: Defect[]; last: boolean; onNext: () => void }) {
  const total = sum(pts)
  const max = maxPoints(order)
  const stars = total >= max * 0.9 ? 3 : total >= max * 0.7 ? 2 : 1
  return (
    <div className="rs-scroll rs-shipped">
      <p className="eyebrow">{order.ref} shipped</p>
      <h2 className="rs-h">
        {order.title}: {total} of {max} points
      </h2>
      <p className="rs-stars" aria-label={`${stars} of 3`}>
        {'★'.repeat(stars)}
        <span>{'★'.repeat(3 - stars)}</span>
      </p>
      <table className="data">
        <tbody>
          {STAGES.map((s) => (
            <tr key={s.id}>
              <th>{s.title}</th>
              <td className="num">{signed(pts[s.id])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small">
        You found {defects.filter((d) => d.found === 'you').length} of {defects.length} issues; QA caught {defects.filter((d) => d.found === 'qa').length}.
      </p>
      <button className="btn btn-primary" onClick={onNext}>
        {last ? 'End the shift →' : 'Next order →'}
      </button>
    </div>
  )
}

function Intro({ best, onStart }: { best: number; onStart: () => void }) {
  return (
    <div className="rs-intro page-fit">
      <section className="panel rs-intro-card">
        <p className="eyebrow">Practice · game</p>
        <h1>Rack Shift</h1>
        <p className="lead">
          One shift on a rack integration floor. Three orders come in: an edge rack, a storage rack and a GPU rack. For each one you build the rack, check every cable, power it on and check it against the order, burn it in, write the report and ship it. Faults are hidden along the way, as on a real floor.
        </p>
        <ol className="rs-intro-steps">
          <li>
            <b>Build</b> place every device by the rules a rack must pass
          </li>
          <li>
            <b>Cabling</b> compare LLDP neighbours with the cabling plan
          </li>
          <li>
            <b>Power on</b> check what every server reports against the order
          </li>
          <li>
            <b>Burn-in</b> read the results against the test plan, fix, retest
          </li>
          <li>
            <b>Report</b> evidence and root cause for every issue, then ship
          </li>
        </ol>
        <p className="small muted">
          +{POINTS.find} for each fault you find and fix, −{POINTS.wrong} for a wrong call, −{POINTS.qa} when QA finds one you missed, +{POINTS.evidence} each for the right evidence and root cause. Every shift hides different faults.
        </p>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={onStart}>
            Start the shift →
          </button>
          {best > 0 && <span className="muted small">Your best shift: {best} points</span>}
        </div>
      </section>
    </div>
  )
}

function ShiftDone({ rows, score, best, onAgain }: { rows: { ref: string; title: string; score: number; max: number; you: number; qa: number }[]; score: number; best: number; onAgain: () => void }) {
  const max = rows.reduce((a, r) => a + r.max, 0)
  return (
    <div className="rs-intro page-fit">
      <section className="panel rs-intro-card">
        <p className="eyebrow">Shift over</p>
        <h1>
          {score} of {max} points
        </h1>
        <p className="lead">{score >= best ? 'Your best shift so far.' : `Your best shift: ${best} points.`} Three racks built, tested and shipped.</p>
        <table className="data">
          <thead>
            <tr>
              <th>Order</th>
              <th>Points</th>
              <th>Found by you</th>
              <th>Found by QA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ref}>
                <th>
                  {r.ref} {r.title}
                </th>
                <td className="num">
                  {r.score} / {r.max}
                </td>
                <td className="num">{r.you}</td>
                <td className="num">{r.qa}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={onAgain}>
            Play a new shift →
          </button>
          <span className="muted small">New shift, new faults.</span>
        </div>
      </section>
    </div>
  )
}

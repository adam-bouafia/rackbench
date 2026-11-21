import { useEffect, useMemo, useState } from 'react'
import { Verdict } from '../engine/ui'
import { markDone } from '../progress'

// Rack Lab: build a 24U rack and check it against the rules a rack integration team works by.

type Kind = 'srv1' | 'stor2' | 'gpu2' | 'sw' | 'blank'
type Feed = 'A' | 'B'
interface Dev {
  id: number
  kind: Kind
  u: number // bottom unit
  psu: [Feed, Feed]
}

const KINDS: Record<Kind, { label: string; size: number; watts: number; heavy: boolean; psus: boolean }> = {
  srv1: { label: '1U server', size: 1, watts: 450, heavy: false, psus: true },
  stor2: { label: '2U storage server', size: 2, watts: 700, heavy: true, psus: true },
  gpu2: { label: '2U GPU server', size: 2, watts: 1800, heavy: true, psus: true },
  sw: { label: '1U switch', size: 1, watts: 150, heavy: false, psus: true },
  blank: { label: 'Blanking panel', size: 1, watts: 0, heavy: false, psus: false },
}
const RACK_U = 24
const PDU_W = 230 * 32 // one feed: 230 V, 32 A
const LIMIT = PDU_W * 0.8

let nextId = 1
const dev = (kind: Kind, u: number, psu: [Feed, Feed] = ['A', 'B']): Dev => ({ id: nextId++, kind, u, psu })

const PRESETS: Record<string, () => Dev[]> = {
  'Messy rack': () => [dev('gpu2', 20), dev('srv1', 12, ['A', 'A']), dev('srv1', 11), dev('sw', 2), dev('gpu2', 5), dev('stor2', 8), dev('srv1', 13)],
  'Good rack': () => [
    dev('sw', 24),
    dev('sw', 23),
    ...Array.from({ length: 10 }, (_, i) => dev('blank', 13 + i)),
    dev('srv1', 12),
    dev('srv1', 11),
    dev('srv1', 10),
    dev('srv1', 9),
    dev('stor2', 7),
    dev('stor2', 5),
    dev('gpu2', 3),
    dev('blank', 2),
    dev('blank', 1),
  ],
  Empty: () => [],
}

function occupied(devs: Dev[]) {
  const map = new Map<number, Dev>()
  for (const d of devs) for (let k = 0; k < KINDS[d.kind].size; k++) map.set(d.u + k, d)
  return map
}

export function RackLab() {
  const [devs, setDevs] = useState<Dev[]>(PRESETS['Messy rack'])
  const [selU, setSelU] = useState<number | null>(null)
  const [selDev, setSelDev] = useState<number | null>(null)
  const occ = useMemo(() => occupied(devs), [devs])

  const fits = (kind: Kind, u: number, ignore?: number) => {
    const size = KINDS[kind].size
    if (u < 1 || u + size - 1 > RACK_U) return false
    for (let k = 0; k < size; k++) {
      const o = occ.get(u + k)
      if (o && o.id !== ignore) return false
    }
    return true
  }

  const place = (kind: Kind) => {
    if (selU === null || !fits(kind, selU)) return
    setDevs([...devs, dev(kind, selU)])
    setSelU(null)
  }
  const update = (id: number, f: (d: Dev) => Dev) => setDevs(devs.map((d) => (d.id === id ? f(d) : d)))
  const remove = (id: number) => {
    setDevs(devs.filter((d) => d.id !== id))
    setSelDev(null)
  }
  const move = (id: number, delta: number) => {
    const d = devs.find((x) => x.id === id)
    if (d && fits(d.kind, d.u + delta, id)) update(id, (x) => ({ ...x, u: x.u + delta }))
  }
  const fillBlanks = () => {
    const add: Dev[] = []
    for (let u = 1; u <= RACK_U; u++) if (!occ.has(u)) add.push(dev('blank', u))
    setDevs([...devs, ...add])
  }

  // checks
  const powered = devs.filter((d) => KINDS[d.kind].psus)
  const loadA = powered.reduce((s, d) => s + KINDS[d.kind].watts * (d.psu.filter((p) => p === 'A').length / 2), 0)
  const loadB = powered.reduce((s, d) => s + KINDS[d.kind].watts * (d.psu.filter((p) => p === 'B').length / 2), 0)
  const total = loadA + loadB
  const singleFeed = powered.filter((d) => d.psu[0] === d.psu[1])
  const lowSwitch = devs.filter((d) => d.kind === 'sw' && d.u < RACK_U - 3)
  const highHeavy = devs.filter((d) => KINDS[d.kind].heavy && d.u > RACK_U / 2)
  const gaps = Array.from({ length: RACK_U }, (_, i) => i + 1).filter((u) => !occ.has(u))
  const name = (d: Dev) => `${KINDS[d.kind].label} in U${d.u}`

  const checks: { ok: boolean; title: string; detail: string }[] = [
    { ok: devs.some((d) => d.kind === 'sw'), title: 'The rack has a switch', detail: 'Servers need a top-of-rack switch for their network ports.' },
    { ok: singleFeed.length === 0, title: 'Every device has its two PSUs on different feeds', detail: singleFeed.length ? `On one feed only: ${singleFeed.map(name).join(', ')}.` : 'A feed or PDU can fail without stopping anything.' },
    { ok: total <= LIMIT, title: 'One feed alone carries the whole rack (80% rule)', detail: `If a feed fails, the other carries ${Math.round(total)} W of its ${Math.round(LIMIT)} W design limit (80% of 230 V × 32 A).` },
    { ok: lowSwitch.length === 0, title: 'Switches sit at the top of the rack', detail: lowSwitch.length ? `Move up: ${lowSwitch.map(name).join(', ')}. Short cables run down from the top.` : 'Top of rack, short cable runs.' },
    { ok: highHeavy.length === 0, title: 'Heavy servers sit in the lower half', detail: highHeavy.length ? `Move down: ${highHeavy.map(name).join(', ')}. A top-heavy rack can tip when a server slides out.` : 'Low centre of gravity.' },
    { ok: gaps.length === 0, title: 'No open units: blanking panels everywhere else', detail: gaps.length ? `${gaps.length} open unit${gaps.length > 1 ? 's' : ''} (${gaps.slice(0, 6).map((u) => 'U' + u).join(', ')}${gaps.length > 6 ? '…' : ''}). Hot air would flow back to the front.` : 'Air only flows through the servers, front to back.' },
  ]
  const passed = checks.filter((c) => c.ok).length
  const allOk = passed === checks.length && devs.filter((d) => d.kind !== 'blank').length >= 4
  useEffect(() => {
    if (allOk) markDone('rack-lab')
  }, [allOk])

  const sd = devs.find((d) => d.id === selDev)
  const meter = (w: number) => Math.min(100, (w / PDU_W) * 100)

  return (
    <div className="racklab page-fit">
      <header className="rl-head">
        <div>
          <p className="eyebrow">Rack Lab</p>
          <h1>Build a rack that would pass integration</h1>
          <p className="muted small">Click an open unit, then a device. Click a device to move it, remove it or change its power feeds.</p>
        </div>
        <div className="rl-presets">
          {Object.keys(PRESETS).map((p) => (
            <button key={p} className="btn" onClick={() => { setDevs(PRESETS[p]()); setSelDev(null); setSelU(null) }}>
              {p}
            </button>
          ))}
          <button className="btn" onClick={fillBlanks}>
            Fill with blanking panels
          </button>
        </div>
      </header>

      <div className="racklab-grid">
        <div className="rl-rack" role="list" aria-label="Rack units, top to bottom">
          {Array.from({ length: RACK_U }, (_, i) => RACK_U - i).map((u) => {
            const d = occ.get(u)
            if (d && d.u + KINDS[d.kind].size - 1 !== u) return null
            const size = d ? KINDS[d.kind].size : 1
            const bad = d && (singleFeed.includes(d) || lowSwitch.includes(d) || highHeavy.includes(d))
            return (
              <div key={u} role="listitem" className="rl-row" style={{ flex: `${size} 1 0` }}>
                <span className="rl-u">{d ? `${d.u}${size > 1 ? `-${d.u + size - 1}` : ''}` : u}</span>
                {d ? (
                  <button className={`rl-dev kind-${d.kind}${selDev === d.id ? ' is-sel' : ''}${bad ? ' is-bad' : ''}`} onClick={() => { setSelDev(d.id); setSelU(null) }}>
                    {KINDS[d.kind].label}
                    {KINDS[d.kind].psus && (
                      <span className="rl-psu">
                        {d.psu[0]}
                        {d.psu[1]}
                      </span>
                    )}
                  </button>
                ) : (
                  <button className={`rl-empty${selU === u ? ' is-sel' : ''}`} onClick={() => { setSelU(u); setSelDev(null) }}>
                    {selU === u ? 'choose a device →' : 'open'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="stack">
          <section className="card">
            <h2 className="card-title">{selU !== null ? `Add to U${selU}` : sd ? name(sd) : 'Devices'}</h2>
            {sd ? (
              <div className="rl-edit">
                <div className="seg">
                  <button onClick={() => move(sd.id, 1)}>Up</button>
                  <button onClick={() => move(sd.id, -1)}>Down</button>
                  <button onClick={() => remove(sd.id)}>Remove</button>
                </div>
                {KINDS[sd.kind].psus && (
                  <div className="rl-feeds">
                    {[0, 1].map((k) => (
                      <label key={k}>
                        PSU {k + 1} on feed
                        <select value={sd.psu[k]} onChange={(e) => update(sd.id, (x) => ({ ...x, psu: (k === 0 ? [e.target.value, x.psu[1]] : [x.psu[0], e.target.value]) as [Feed, Feed] }))}>
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </select>
                      </label>
                    ))}
                    <span className="muted">{KINDS[sd.kind].watts} W</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rl-palette">
                {(Object.keys(KINDS) as Kind[]).map((k) => (
                  <button key={k} className={`btn rl-pal kind-${k}`} disabled={selU === null || !fits(k, selU)} onClick={() => place(k)}>
                    {KINDS[k].label}
                    <span className="muted">{KINDS[k].watts ? `${KINDS[k].watts} W` : 'airflow'}</span>
                  </button>
                ))}
                {selU === null && <p className="muted">Click an open unit in the rack first.</p>}
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">Power</h2>
            {(['A', 'B'] as Feed[]).map((f) => {
              const w = f === 'A' ? loadA : loadB
              return (
                <div key={f} className="pdu-row">
                  <span>PDU {f}</span>
                  <div className="pdu-meter">
                    <div style={{ width: `${meter(w)}%` }} />
                    <i style={{ left: '80%' }} />
                  </div>
                  <span className="num">{Math.round(w)} W</span>
                </div>
              )
            })}
            <div className="pdu-row">
              <span>One feed fails</span>
              <div className={`pdu-meter${total > LIMIT ? ' is-over' : ''}`}>
                <div style={{ width: `${meter(total)}%` }} />
                <i style={{ left: '80%' }} />
              </div>
              <span className="num">{Math.round(total)} W</span>
            </div>
            <p className="muted small">Each feed: 230 V × 32 A = {PDU_W} W; design limit 80%. Redundant PSUs share the load, so normally each feed carries about half.</p>
          </section>

        </div>
        <div className="rl-checks">
          <section className="card rl-checks-card">
            <h2 className="card-title">
              Checks: {passed} of {checks.length} {allOk && <Verdict ok>Rack passes</Verdict>}
            </h2>
            <ul className="checks">
              {checks.map((c) => (
                <li key={c.title}>
                  <Verdict ok={c.ok}>{c.ok ? 'OK' : 'Fix'}</Verdict>
                  <span>
                    <strong>{c.title}.</strong> {c.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

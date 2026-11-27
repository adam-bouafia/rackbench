import { useEffect, useMemo, useState } from 'react'
import { Verdict } from '../engine/ui'
import { markDone } from '../progress'

// Patch it: work orders from the data center floor. Pick the module and cable, check the polarity,
// read the light levels and decide whether the link passes or what to fix.

type Fault = 'none' | 'polarity' | 'dirty'
interface Option {
  label: string
  ok: boolean
  why: string
}
interface Order {
  title: string
  route: string
  need: string
  options: Option[]
  /** Duplex LC fibre: the polarity step applies. */
  duplex: boolean
  /** Copper (DAC, Cat6A): no light readings. */
  copper: boolean
  fault: Fault
}

const ORDERS: Order[] = [
  {
    title: 'New server, top-of-rack link',
    route: 'C04-U30 rk-n12 be0 (SFP28) → C04-U42 tor1 eth1/9 (SFP28), same rack, 2 m',
    need: '25G',
    options: [
      { label: 'SFP28 25G passive DAC, 2 m', ok: true, why: 'Inside the rack a DAC is the cheapest, lowest-power 25G link, with nothing to clean.' },
      { label: '2 × SFP28 LR + OS2 LC duplex, 2 m', ok: false, why: 'It would work, but two 10 km optics for 2 m cost far more and use more power. In-rack 25G is a DAC.' },
      { label: 'QSFP28 100G DAC, 2 m', ok: false, why: 'Wrong form factor: a QSFP28 plug does not fit the SFP28 port on the server.' },
      { label: 'Cat6A patch cord, 2 m', ok: false, why: 'The ports are SFP28 cages, not RJ45: copper twisted pair does not plug in.' },
    ],
    duplex: false,
    copper: true,
    fault: 'none',
  },
  {
    title: 'Uplink to the spine',
    route: 'C04 tor1 eth1/49 (QSFP28) → B01 spine1 eth3/12, across the hall, 70 m through MPO trunks',
    need: '100G',
    options: [
      { label: '2 × QSFP28 SR4 + MPO-12 OM4 trunk and cords', ok: true, why: 'SR4 runs 4 × 25G lanes over 8 fibres of an MPO-12, and OM4 carries it 100 m: 70 m fits.' },
      { label: '2 × QSFP28 LR4 + OM4 LC duplex', ok: false, why: 'LR4 is a single-mode optic (1310 nm). On multimode OM4 it will not work reliably.' },
      { label: 'QSFP28 100G DAC, 70 m', ok: false, why: 'Passive DAC reaches only a few metres.' },
      { label: '2 × SFP28 SR + OM4 LC duplex', ok: false, why: 'SFP28 is 25G; the order asks for 100G on QSFP28 ports.' },
    ],
    duplex: false,
    copper: false,
    fault: 'dirty',
  },
  {
    title: 'Rack to rack in the same row',
    route: 'C06 storage1 p1 (SFP28) → C04 tor1 eth1/30 (SFP28), 25 m through patch panels',
    need: '25G',
    options: [
      { label: '2 × SFP28 SR + OM4 LC duplex', ok: true, why: 'Short-reach 850 nm optics on OM4: 25G up to about 100 m, through the row\'s panels.' },
      { label: 'SFP28 passive DAC, 25 m', ok: false, why: 'DAC does not exist at that length; passive twinax stops at a few metres.' },
      { label: '2 × SFP28 LR + OM4 LC duplex', ok: false, why: 'LR is single-mode. Mixing it with multimode fibre gives an unreliable link at best.' },
      { label: 'Cat6A, 25 m', ok: false, why: 'SFP28 cages, not RJ45 ports.' },
    ],
    duplex: true,
    copper: false,
    fault: 'polarity',
  },
  {
    title: 'Carrier hand-off to another building',
    route: 'Meet-me room panel MMR-2 port 14 → C02 edge1 eth1/1 (SFP+), carrier fibre 8 km to the other site',
    need: '10G',
    options: [
      { label: '2 × SFP+ 10G LR + OS2 LC duplex', ok: true, why: '10GBASE-LR runs 1310 nm on single-mode to 10 km: 8 km fits.' },
      { label: '2 × SFP+ 10G SR + OM4 LC duplex', ok: false, why: 'Multimode SR reaches a few hundred metres, not kilometres, and the carrier hands off single-mode.' },
      { label: '2 × SFP+ 10G ER (40 km) + OS2', ok: false, why: 'A 40 km optic on 8 km can overload the receiver without an attenuator; LR is the right reach.' },
      { label: 'SFP+ DAC, 8 km', ok: false, why: 'Copper twinax reaches a few metres.' },
    ],
    duplex: true,
    copper: false,
    fault: 'dirty',
  },
  {
    title: 'BMC port to the management switch',
    route: 'C04-U30 rk-n12 BMC (RJ45 1G) → C04-U41 mgmt ge1/22 (RJ45), same rack',
    need: '1G',
    options: [
      { label: 'Cat6A patch cord, 1 m', ok: true, why: 'BMC ports are RJ45 at 1G: a short Cat6 or Cat6A cord.' },
      { label: 'SFP28 DAC, 1 m', ok: false, why: 'The BMC port is RJ45, not an SFP cage.' },
      { label: '2 × SFP+ SR + OM4 LC', ok: false, why: 'Neither end takes an optic.' },
      { label: 'OM4 LC duplex cord', ok: false, why: 'Fibre needs optics at both ends; these are copper ports.' },
    ],
    duplex: false,
    copper: true,
    fault: 'none',
  },
  {
    title: 'GPU server, 100G to the leaf switch',
    route: 'D02-U10 gpu03 port 1 (QSFP28) → D02-U42 leaf2 eth1/5 (QSFP28), same rack, 2.5 m',
    need: '100G',
    options: [
      { label: 'QSFP28 100G passive DAC, 3 m', ok: true, why: '100G in the rack: a QSFP28 DAC, no optics to clean or fail.' },
      { label: '2 × QSFP28 SR4 + MPO-12 OM4, 3 m', ok: false, why: 'It works, but optics and MPO cost more and use more power where a DAC fits.' },
      { label: 'QSFP28 to 4 × SFP28 breakout DAC', ok: false, why: 'A breakout makes four 25G links; the GPU port needs one 100G link.' },
      { label: 'SFP28 DAC, 3 m', ok: false, why: '25G and the wrong form factor for QSFP28 ports.' },
    ],
    duplex: false,
    copper: true,
    fault: 'none',
  },
  {
    title: 'Storage server in the next rack',
    route: 'C05-U12 nas2 p1 (SFP28) → C04 tor1 eth1/31 (SFP28), 6 m over the cable tray',
    need: '25G',
    options: [
      { label: 'SFP28 25G AOC, 7 m', ok: true, why: 'An active optical cable: optics built in, fixed length, fine for a few racks along the tray.' },
      { label: 'SFP28 passive DAC, 6 m', ok: false, why: '25G over passive twinax is reliable only to about 3 to 5 m.' },
      { label: '2 × SFP28 LR + OS2 LC duplex', ok: false, why: 'It would work, but 10 km optics for 6 m are needlessly expensive.' },
      { label: 'Cat6A, 6 m', ok: false, why: 'SFP28 ports do not take RJ45.' },
    ],
    duplex: false,
    copper: false,
    fault: 'none',
  },
  {
    title: 'Long run across the hall',
    route: 'A08 tor3 eth1/48 (SFP28) → F01 core1 eth2/7 (SFP28), 90 m through two patch panels',
    need: '25G',
    options: [
      { label: '2 × SFP28 SR + OM4 LC duplex', ok: true, why: 'OM4 carries 25G short-reach to about 100 m: 90 m fits, if the connectors are clean.' },
      { label: '2 × SFP28 SR + OM3 LC duplex', ok: false, why: 'OM3 carries 25G only to about 70 m.' },
      { label: 'SFP28 AOC, 90 m, laid through the panels', ok: false, why: 'An AOC has fixed ends: it cannot be patched through panels.' },
      { label: 'SFP28 passive DAC, 90 m', ok: false, why: 'Passive copper reaches a few metres.' },
    ],
    duplex: true,
    copper: false,
    fault: 'polarity',
  },
]

const ACTIONS = ['Pass: close the ticket with the readings', 'Clean both ends, inspect, retest', 'Flip the polarity at one end', 'Replace the optic']

type Phase = 'media' | 'polarity' | 'test' | 'fixed'

const pickShift = () => {
  const ids = ORDERS.map((_, i) => i)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return ids.slice(0, 6)
}

export function PatchIt() {
  const [shift, setShift] = useState(0)
  const ids = useMemo(() => pickShift(), [shift])
  const [n, setN] = useState(0)
  const [phase, setPhase] = useState<Phase>('media')
  const [pick, setPick] = useState<number | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [action, setAction] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [log, setLog] = useState<boolean[]>([])
  const done = n >= ids.length
  const o = ORDERS[ids[Math.min(n, ids.length - 1)]]
  const order = useMemo(() => [...o.options.keys()].sort(() => Math.random() - 0.5), [o])
  const rx = useMemo(() => (-1.6 - Math.random() * 1.8).toFixed(2), [o])

  useEffect(() => {
    if (done) markDone('patch-it')
  }, [done])

  const polarityWrong = o.duplex && (o.fault === 'polarity') !== flipped
  const right = polarityWrong ? 2 : o.fault === 'dirty' ? 1 : 0

  const chooseMedia = (k: number) => {
    if (pick !== null) return
    setPick(k)
    const ok = o.options[k].ok
    if (ok) setScore((s) => s + 100)
    setLog((l) => [...l, ok])
  }
  const toTest = () => {
    if (o.duplex && (o.fault === 'polarity') !== flipped) {
      /* left wrong: the test shows it */
    } else if (o.duplex) setScore((s) => s + 50)
    setPhase('test')
  }
  const chooseAction = (k: number) => {
    if (action !== null) return
    setAction(k)
    const ok = k === right
    if (ok) setScore((s) => s + 100)
    setLog((l) => [...l, ok])
  }
  const next = () => {
    setN((v) => v + 1)
    setPhase('media')
    setPick(null)
    setFlipped(false)
    setAction(null)
  }

  const reading = (state: 'now' | 'after') => {
    const bad = state === 'now' && (polarityWrong ? 'dark' : o.fault === 'dirty' ? 'weak' : null)
    if (o.copper)
      return ['$ ethtool be0 | grep -E "Speed|Link"', '+	Speed: ' + (o.need === '100G' ? '100000' : o.need === '1G' ? '1000' : '25000') + 'Mb/s', '+	Link detected: yes', '$ ip -s link show be0   # after 10 min of traffic', '+	RX errors: 0   TX errors: 0']
    if (bad === 'dark') return ['$ ethtool be0 | grep Link', '!	Link detected: no', '$ ethtool -m be0 | grep -i "receiver signal"', '!	Receiver signal average optical power : 0.0000 mW / -inf dBm', '	Laser output power                    : 0.7943 mW / -1.00 dBm']
    if (bad === 'weak') return ['$ ethtool -m be0 | grep -iE "receiver signal|rx power low warning"', '!	Receiver signal average optical power : 0.0692 mW / -11.60 dBm', '	Laser rx power low warning threshold  : 0.0912 mW / -10.40 dBm', '$ ip -s link show be0', '!	RX errors: 2213 (CRC), and rising']
    return ['$ ethtool -m be0 | grep -i "receiver signal"', `+	Receiver signal average optical power : ${(10 ** (Number(rx) / 10)).toFixed(4)} mW / ${rx} dBm`, '$ ip -s link show be0   # after 10 min of traffic', '+	RX errors: 0   (no new errors)']
  }

  if (done)
    return (
      <div className="pi page-fit">
        <section className="panel pi-main">
          <p className="eyebrow">Shift complete</p>
          <h1 className="pi-h">
            {log.filter(Boolean).length} of {log.length} calls right · {score} points
          </h1>
          <p className="muted">Media choice, polarity and the light reading: the three things that decide whether a new link works the first time.</p>
          <div className="toolbar">
            <button
              className="btn btn-primary"
              onClick={() => {
                setShift((s) => s + 1)
                setN(0)
                setScore(0)
                setLog([])
                setPhase('media')
                setPick(null)
                setFlipped(false)
                setAction(null)
              }}
            >
              New shift →
            </button>
            <a className="btn" href="#/lesson/fiber-basics">
              Fibre lessons
            </a>
          </div>
        </section>
      </div>
    )

  return (
    <div className="pi page-fit">
      <section className="panel pi-main">
        <div className="pi-head">
          <span className="chip">Work order {n + 1} of {ids.length}</span>
          <span className="muted">
            {phase === 'media' ? '1. Pick the cable' : phase === 'polarity' ? '2. Plug in: check the polarity' : '3. Test the link'}
          </span>
        </div>
        <h2 className="pi-title">
          {o.title} <span className="pi-need">{o.need}</span>
        </h2>
        <p className="pi-route">{o.route}</p>

        {phase === 'media' && (
          <>
            <div className="pi-options">
              {order.map((k) => {
                const op = o.options[k]
                const state = pick === null ? '' : op.ok ? ' is-right' : k === pick ? ' is-wrong' : ' is-dim'
                return (
                  <button key={k} className={`quiz-opt${state}`} onClick={() => chooseMedia(k)}>
                    {op.label}
                  </button>
                )
              })}
            </div>
            {pick !== null && (
              <div className="quiz-why">
                <Verdict ok={o.options[pick].ok}>{o.options[pick].ok ? 'Right' : 'Not this one'}</Verdict> {o.options[pick].why}
                {!o.options[pick].ok && <> The right pick: {o.options.find((x) => x.ok)!.label}.</>}
                <div>
                  <button className="btn btn-primary" onClick={() => setPhase(o.duplex ? 'polarity' : 'test')}>
                    {o.duplex ? 'Plug it in' : 'Test the link'} →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {phase === 'polarity' && (
          <div className="pi-pol">
            <svg viewBox="0 0 760 210" className="pi-svg" role="img" aria-label="Duplex fibre polarity">
              <rect x={20} y={40} width={150} height={120} rx="10" className="fb-optic" />
              <text x={95} y={30} textAnchor="middle" className="fb-label">
                server end
              </text>
              <text x={150} y={78} textAnchor="end" className="fb-strong">
                TX
              </text>
              <text x={150} y={138} textAnchor="end" className="fb-strong">
                RX
              </text>
              <rect x={590} y={40} width={150} height={120} rx="10" className="fb-optic" />
              <text x={665} y={30} textAnchor="middle" className="fb-label">
                switch end
              </text>
              {(() => {
                const top = (o.fault === 'polarity') !== flipped ? 'TX' : 'RX'
                const bottom = top === 'TX' ? 'RX' : 'TX'
                const ok = top === 'RX'
                return (
                  <>
                    <text x={610} y={78} className={ok ? 'fb-ok' : 'fb-bad'}>
                      {top}
                    </text>
                    <text x={610} y={138} className={ok ? 'fb-ok' : 'fb-bad'}>
                      {bottom}
                    </text>
                    <path d="M170 72 H590" className="fb-strand" />
                    <path d="M170 132 H590" className="fb-strand" />
                    <path d="M170 72 H590" className={ok ? 'fb-light' : 'fb-light is-bad'} />
                    <text x={380} y={190} textAnchor="middle" className={ok ? 'fb-ok' : 'fb-bad'}>
                      {ok ? 'TX lands on RX at both ends' : 'TX lands on TX: no light will reach a receiver'}
                    </text>
                  </>
                )
              })()}
            </svg>
            <div className="toolbar">
              <button className="btn" onClick={() => setFlipped(!flipped)}>
                Flip the LC pair at the switch end
              </button>
              <button className="btn btn-primary" onClick={toTest}>
                Done: test the link →
              </button>
            </div>
          </div>
        )}

        {(phase === 'test' || phase === 'fixed') && (
          <>
            <pre className="pi-term">
              {reading(phase === 'fixed' ? 'after' : 'now').map((l, i) => (
                <span key={i} className={l.startsWith('!') ? 'is-bad' : l.startsWith('+') ? 'is-ok' : ''}>
                  {l.replace(/^[!+]/, '')}
                  {'\n'}
                </span>
              ))}
            </pre>
            {phase === 'test' && (
              <div className="pi-options is-grid">
                {ACTIONS.map((a, k) => (
                  <button key={a} className={`quiz-opt${action === null ? '' : k === right ? ' is-right' : k === action ? ' is-wrong' : ' is-dim'}`} onClick={() => chooseAction(k)}>
                    {a}
                  </button>
                ))}
              </div>
            )}
            {action !== null && phase === 'test' && (
              <div className="quiz-why">
                <Verdict ok={action === right}>{action === right ? 'Right call' : 'Not this time'}</Verdict>{' '}
                {right === 2
                  ? 'No light at all on a fresh duplex link: TX meets TX. Swap the pair at one end, then test again.'
                  : right === 1
                    ? 'Light arrives but too weak (under the warning threshold) and CRC errors climb: inspect and clean both ends of every connection on the path, then retest.'
                    : o.copper
                      ? 'Link at full speed and no errors after traffic: record it and close.'
                      : 'Receive power well inside the range and no new errors: record the reading in the ticket and close.'}
                <div>
                  <button className="btn btn-primary" onClick={() => (right === 0 ? next() : setPhase('fixed'))}>
                    {right === 0 ? 'Next work order' : 'Do the fix and retest'} →
                  </button>
                </div>
              </div>
            )}
            {phase === 'fixed' && (
              <div className="quiz-why">
                <Verdict ok>Fixed</Verdict> The link is clean now. Before and after readings go into the ticket.
                <div>
                  <button className="btn btn-primary" onClick={next}>
                    Next work order →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
      <aside className="panel pi-side">
        <h3 className="panel-title">Patch it</h3>
        <p className="muted small">Six work orders per shift. 100 points for the right cable, 50 for getting the polarity right before the test, 100 for the right call on the reading.</p>
        <div className="rr-stats">
          <div>
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div>
            <span>Right</span>
            <strong>
              {log.filter(Boolean).length}/{log.length}
            </strong>
          </div>
        </div>
        <h4 className="panel-sub">Rules of thumb</h4>
        <ul className="pi-rules">
          <li>In the rack: DAC. A few racks: AOC or SR + OM4. Across the hall: SR + OM4, up to ~100 m at 25G. Kilometres: LR + single-mode.</li>
          <li>SR = multimode, LR = single-mode. Both ends must match.</li>
          <li>No light at all on a new duplex link: polarity. Weak light and CRC errors: dirt.</li>
          <li>Readings before and after go into the ticket.</li>
        </ul>
      </aside>
    </div>
  )
}

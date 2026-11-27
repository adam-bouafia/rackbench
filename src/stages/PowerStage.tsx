import type { CSSProperties } from 'react'
import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'

// How much power a server and a rack need, worked out step by step, with the rack power chart.

type Scene = 'parts' | 'wall' | 'measure' | 'psu' | 'rack' | 'limits' | 'feed' | 'phases' | 'heat'
export interface PowerStep extends StageStep {
  scene: Scene
  upto?: number
}

const PARTS: { name: string; detail: string; w: number; tone: string }[] = [
  { name: 'CPUs', detail: '2 × 150 W TDP', w: 300, tone: 'amber' },
  { name: 'Memory', detail: '8 RDIMMs × 5 W', w: 40, tone: 'green' },
  { name: 'NVMe drives', detail: '2 × 10 W', w: 20, tone: 'blue' },
  { name: 'Network card', detail: '2 × 25G ports', w: 15, tone: 'teal' },
  { name: 'Fans', detail: '5 × 6 W at load', w: 30, tone: 'slate' },
  { name: 'Board, BMC, chipset', detail: 'the rest', w: 20, tone: 'violet' },
]
const DC = PARTS.reduce((a, p) => a + p.w, 0) // 425
const EFF = 0.94
const WALL = Math.round(DC / EFF) // 452
const RACK: [string, number, number][] = [
  ['1U compute servers', 24, 450],
  ['Top-of-rack switches', 2, 150],
]
const RACK_W = RACK.reduce((a, [, n, w]) => a + n * w, 0) // 11100
const kW = (w: number) => `${(w / 1000).toFixed(1)} kW`
const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` })

function Bar({ label, value, max, limit, tone, note, delay = 0 }: { label: string; value: number; max: number; limit?: number; tone: string; note?: string; delay?: number }) {
  const over = limit !== undefined && value > limit
  return (
    <div className="pw-bar">
      <div className="pw-bar-head">
        <span>{label}</span>
        <strong className={over ? 'is-bad' : ''}>{note ?? kW(value)}</strong>
      </div>
      <div className="pw-track">
        <div className={`pw-fill pw-grow is-${over ? 'bad' : tone}`} style={{ width: `${Math.min(100, (value / max) * 100)}%`, ...d(delay) }} />
        {limit !== undefined && <div className="pw-limit" style={{ left: `${(limit / max) * 100}%` }} title="80% limit" />}
      </div>
    </div>
  )
}

export function PowerStage({ steps, cur, replayKey }: StageProps<PowerStep>) {
  const st = steps[Math.max(0, cur)]
  const scene = cur < 0 ? 'parts' : st.scene
  const upto = cur < 0 ? 0 : (st.upto ?? PARTS.length)
  const shown = PARTS.slice(0, upto)
  const sum = shown.reduce((a, p) => a + p.w, 0)

  return (
    <div className="pw" key={`${cur}:${replayKey}`}>
      {scene === 'parts' && (
        <div className="pw-parts">
          <table className="pw-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Count × typical</th>
                <th>Watts</th>
              </tr>
            </thead>
            <tbody>
              {PARTS.map((p, i) => (
                <tr key={p.name} className={i < upto ? 'pw-in' : 'is-ghost'} style={d(i * 0.25)}>
                  <td>
                    <span className={`pw-swatch is-${p.tone}`} />
                    {p.name}
                  </td>
                  <td>{p.detail}</td>
                  <td>{p.w} W</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Sum of the parts (DC side)</td>
                <td>{sum} W</td>
              </tr>
            </tfoot>
          </table>
          <div className="pw-stack" aria-label={`Stacked bar, ${sum} W`}>
            <div className="pw-stack-col">
              {shown.map((p, i) => (
                <div key={p.name} className={`pw-seg pw-rise is-${p.tone}`} style={{ height: `${(p.w / 500) * 100}%`, ...d(i * 0.25) }} title={`${p.name} ${p.w} W`}>
                  {p.w >= 30 ? <span>{p.w}</span> : null}
                </div>
              ))}
            </div>
            <div className="pw-stack-scale">
              {[500, 400, 300, 200, 100, 0].map((v) => (
                <span key={v}>{v} W</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {scene === 'wall' && (
        <div className="pw-col">
          <h3 className="pw-h">From the parts to the wall socket</h3>
          <Bar label="DC load: what the parts use" value={DC} max={520} tone="amber" note={`${DC} W`} />
          <Bar label="Lost as heat in the PSU (94% efficient)" value={WALL - DC} max={520} tone="slate" note={`${WALL - DC} W`} delay={0.5} />
          <Bar label="AC from the wall" value={WALL} max={520} tone="blue" note={`${WALL} W`} delay={1} />
          <p className="pw-formula pw-in" style={d(1.4)}>
            {DC} W ÷ {EFF} = <strong>{WALL} W</strong> at the wall
          </p>
        </div>
      )}

      {scene === 'measure' && (
        <div className="pw-col">
          <h3 className="pw-h">Measure it: the BMC reads the power supplies</h3>
          <pre className="pw-term pw-in">{`$ ipmitool -I lanplus -H 10.70.0.12 -U admin -P **** dcmi power reading
    Instantaneous power reading:                   438 Watts
    Minimum during sampling period:                142 Watts
    Maximum during sampling period:                461 Watts
    Average power reading over sample period:      447 Watts
    Power reading state is:                   activated

$ curl -sk -u admin:**** https://10.70.0.12/redfish/v1/Chassis/1/Power | jq '.PowerControl[0].PowerConsumedWatts'
438`}</pre>
          <p className="pw-formula pw-in" style={d(0.6)}>
            Estimate {WALL} W, measured peak 461 W under burn-in: budget <strong>450-470 W</strong> per server.
          </p>
        </div>
      )}

      {scene === 'psu' && (
        <div className="pw-col">
          <h3 className="pw-h">Two power supplies, 1+1: either one carries the server alone</h3>
          <div className="pw-psus">
            {[
              ['Normal: both share', WALL / 2, WALL / 2],
              ['PSU 1 fails: PSU 2 alone', 0, WALL],
            ].map(([t, a, b], i) => (
              <div key={t as string} className="pw-psu-case pw-in" style={d(i * 0.8)}>
                <strong>{t as string}</strong>
                <Bar label="PSU 1 · 800 W" value={a as number} max={800} tone={(a as number) === 0 ? 'off' : 'blue'} note={(a as number) === 0 ? 'failed' : `${Math.round(a as number)} W`} delay={i * 0.8} />
                <Bar label="PSU 2 · 800 W" value={b as number} max={800} tone="blue" note={`${Math.round(b as number)} W`} delay={i * 0.8 + 0.2} />
              </div>
            ))}
          </div>
          <p className="pw-formula">Each PSU must be rated above the whole server: {WALL} W on one 800 W PSU is 57%.</p>
        </div>
      )}

      {scene === 'rack' && (
        <div className="pw-col">
          <h3 className="pw-h">The rack power chart</h3>
          <table className="pw-table is-rack">
            <thead>
              <tr>
                <th>Device</th>
                <th>Qty</th>
                <th>Each</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {RACK.map(([n, q, w], i) => (
                <tr key={n} className="pw-in" style={d(i * 0.3)}>
                  <td>{n}</td>
                  <td>{q}</td>
                  <td>{w} W</td>
                  <td>{(q * w).toLocaleString('en-US')} W</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Rack total</td>
                <td>{RACK_W.toLocaleString('en-US')} W = {kW(RACK_W)}</td>
              </tr>
            </tfoot>
          </table>
          <Bar label="Servers" value={24 * 450} max={14000} tone="amber" delay={0.6} />
          <Bar label="Switches" value={300} max={14000} tone="teal" delay={0.8} />
          <Bar label="Rack total" value={RACK_W} max={14000} tone="blue" delay={1} />
        </div>
      )}

      {scene === 'limits' && (
        <div className="pw-col">
          <h3 className="pw-h">Does {kW(RACK_W)} fit on one feed? (line = 80% limit)</h3>
          <Bar label="Single-phase 230 V × 32 A = 7.4 kW, 80% = 5.9 kW" value={RACK_W} max={22200} limit={5888} tone="blue" note={`${kW(RACK_W)}: too much`} />
          <Bar label="Three-phase 400 V × 32 A × 1.73 = 22.2 kW, 80% = 17.7 kW" value={RACK_W} max={22200} limit={17736} tone="ok" note={`${kW(RACK_W)}: 63% of the budget`} delay={0.6} />
          <p className="pw-formula">Single-phase: P = V × A. Three-phase: P = 400 V × A × √3. Continuous load: at most 80% of the circuit.</p>
        </div>
      )}

      {scene === 'feed' && (
        <div className="pw-col">
          <h3 className="pw-h">Feeds A and B: one must carry the whole rack</h3>
          <div className="pw-psus">
            {[
              ['Normal: PSU 1 on A, PSU 2 on B', RACK_W / 2, RACK_W / 2],
              ['Feed A trips: feed B carries everything', 0, RACK_W],
            ].map(([t, a, b], i) => (
              <div key={t as string} className="pw-psu-case pw-in" style={d(i * 0.8)}>
                <strong>{t as string}</strong>
                <Bar label="Feed A · 3-phase 32 A" value={a as number} max={22200} limit={17736} tone={(a as number) === 0 ? 'off' : 'ok'} note={(a as number) === 0 ? 'off' : kW(a as number)} delay={i * 0.8} />
                <Bar label="Feed B · 3-phase 32 A" value={b as number} max={22200} limit={17736} tone="ok" note={kW(b as number)} delay={i * 0.8 + 0.2} />
              </div>
            ))}
          </div>
          <p className="pw-formula">Size each feed for the full {kW(RACK_W)}, not for half of it.</p>
        </div>
      )}

      {scene === 'phases' && (
        <div className="pw-col">
          <h3 className="pw-h">Three phases, each 230 V × 32 A = 7.4 kW (80%: 5.9 kW)</h3>
          <div className="pw-psus">
            {[
              ['Balanced: 8 servers per phase', [3700, 3700, 3700]],
              ['Unbalanced: everything on L1 first', [6600, 3000, 1500]],
            ].map(([t, v], i) => (
              <div key={t as string} className="pw-psu-case pw-in" style={d(i * 0.8)}>
                <strong>{t as string}</strong>
                {(v as number[]).map((w, k) => (
                  <Bar key={k} label={`L${k + 1}`} value={w} max={7360} limit={5888} tone="ok" note={kW(w)} delay={i * 0.8 + k * 0.15} />
                ))}
              </div>
            ))}
          </div>
          <p className="pw-formula">An overloaded phase trips its breaker while the other two still have room.</p>
        </div>
      )}

      {scene === 'heat' && (
        <div className="pw-col">
          <h3 className="pw-h">Every watt in becomes heat to remove</h3>
          <div className="pw-heat">
            {[
              ['This rack', RACK_W, 'air cooling, contained cold aisle'],
              ['An 8-GPU rack', 40000, 'rear-door heat exchanger or liquid cooling'],
            ].map(([t, w, c], i) => (
              <div key={t as string} className="pw-heat-card pw-in" style={d(i * 0.6)}>
                <strong>{t as string}</strong>
                <span className="pw-big">{kW(w as number)}</span>
                <span>× 3,412 = {Math.round((w as number) * 3.412).toLocaleString('en-US')} BTU/h</span>
                <span>≈ {((w as number) * 3.412 / 12000).toFixed(1)} tons of cooling</span>
                <em>{c as string}</em>
              </div>
            ))}
          </div>
          <p className="pw-formula">1 kW = 3,412 BTU/h. One ton of cooling = 12,000 BTU/h.</p>
        </div>
      )}
    </div>
  )
}

export const POWER_BUDGET: StageLesson<PowerStep> = {
  Stage: PowerStage,
  metrics: [
    { id: 'server', label: 'Server', start: '-' },
    { id: 'rack', label: 'Rack', start: '-' },
    { id: 'budget', label: 'Feed budget', start: '-' },
    { id: 'headroom', label: 'Headroom', start: '-' },
  ],
  intro: [
    'Two interview questions in one lesson: how do you calculate the power each component needs, and how do you make a rack power chart?',
    'The numbers are typical values for a 1U two-socket server. Real projects use the vendor power calculator and the BMC readings.',
  ],
  legend: [
    ['TDP', 'Thermal design power: the heat a CPU is designed to give off under sustained load'],
    ['PSU efficiency', 'The share of wall power that reaches the parts'],
    ['80% rule', 'Load a circuit to at most 80% of its rating'],
  ],
  steps: [
    {
      scene: 'parts',
      upto: 3,
      short: 'The parts',
      title: 'Start from the parts list',
      tag: 'action',
      explain: ['Take the BOM and give every part its power: count × watts each. The CPUs come first, they are the biggest consumers; then memory and drives.'],
      key: 'Server power = the sum of its parts.',
      m: { server: '360 W so far' },
    },
    {
      scene: 'parts',
      short: 'All parts',
      title: 'Add the rest: network, fans, board',
      explain: [
        `The network card, the fans at load, and the board with its BMC and chipset. Sum: ${DC} W on the DC side of the power supplies.`,
        'Use the worst case, not the average: CPU TDP, fans at full load, every drive active.',
      ],
      m: { server: `${DC} W (DC)` },
    },
    {
      scene: 'parts',
      short: 'TDP',
      title: 'What TDP means',
      tag: 'technique',
      explain: [
        'TDP is the heat the CPU gives off at sustained full load, and so what the cooling must remove. Turbo can draw more for short bursts, so leave a margin.',
        'A GPU is listed the same way: an 8-GPU server with 700 W GPUs draws 5.6 kW for the GPUs alone.',
      ],
      key: 'Size for the worst case: TDP, fans at full speed, every drive busy.',
    },
    {
      scene: 'wall',
      short: 'Wall power',
      title: 'Divide by the PSU efficiency',
      tag: 'action',
      explain: [
        `Power supplies lose some energy as heat. With a 94% efficient PSU (80 PLUS Platinum class around half load): ${DC} W ÷ 0.94 = ${WALL} W from the wall.`,
        'The wall figure is what the PDU, the feed and the cooling see.',
      ],
      key: 'Wall power = DC load ÷ efficiency.',
      m: { server: `${WALL} W (wall)` },
    },
    {
      scene: 'measure',
      short: 'Measure',
      title: 'Check the estimate with the BMC',
      tag: 'result',
      explain: [
        'During burn-in, read the real draw from the BMC: ipmitool dcmi power reading, or Redfish (PowerConsumedWatts). The PDU per-outlet meter gives a second opinion.',
        'Budget on the measured peak plus a margin: here about 450 W per server.',
      ],
      m: { server: '~450 W measured' },
    },
    {
      scene: 'psu',
      short: 'PSU 1+1',
      title: 'Each PSU must carry the server alone',
      explain: ['With redundant PSUs (1+1), both share the load normally. When one fails, the other carries all of it, so each PSU is rated above the full server: 800 W here.'],
      key: '1+1: either PSU alone runs the server.',
    },
    {
      scene: 'rack',
      short: 'Rack chart',
      title: 'The rack power chart',
      tag: 'action',
      explain: [
        'List every device in the rack with its quantity and its watts, multiply, and add up: 24 servers × 450 W + 2 switches × 150 W = 11,100 W.',
        'That table is the rack power chart. It goes with the rack elevation and the cabling table.',
      ],
      key: 'Rack power = Σ (quantity × watts per device).',
      m: { rack: kW(RACK_W) },
    },
    {
      scene: 'limits',
      short: 'Feed limit',
      title: 'Does it fit on one feed?',
      explain: [
        'Single-phase 230 V × 32 A = 7.36 kW, and at 80% continuous load 5.9 kW: 11.1 kW does not fit.',
        'Three-phase 400 V × 32 A × √3 = 22.2 kW, at 80% 17.7 kW: it fits, with room left.',
      ],
      key: 'Single-phase 32 A ≈ 7.4 kW; three-phase 32 A ≈ 22 kW. Plan at 80%.',
      m: { budget: '17.7 kW (3-phase, 80%)', headroom: '6.6 kW' },
    },
    {
      scene: 'feed',
      short: 'A and B',
      title: 'One feed must carry everything',
      tag: 'event',
      explain: [
        'Every server has one PSU on feed A and one on feed B, so normally each feed carries about half: 5.6 kW.',
        'When feed A trips, feed B carries all 11.1 kW. So each feed is sized for the whole rack, and a rack test switches one feed off on purpose.',
      ],
      key: 'Redundant feeds: size each one for the full rack.',
    },
    {
      scene: 'phases',
      short: 'Phases',
      title: 'Balance the three phases',
      explain: [
        'A three-phase PDU has three circuits, L1, L2 and L3, each 230 V × 32 A. Spread the servers evenly: 8 per phase gives 3.7 kW each.',
        'Plug everything into L1 first and that phase trips while the others have room left.',
      ],
      key: 'Balance the load over L1, L2 and L3.',
    },
    {
      scene: 'heat',
      short: 'Heat',
      title: 'Power in = heat out',
      tag: 'result',
      explain: [
        'Almost every watt a rack draws becomes heat in the room: 11.1 kW is about 37,900 BTU/h, or 3.2 tons of cooling.',
        'High-density GPU racks of 40 kW and more go beyond comfortable air cooling: rear-door heat exchangers or direct liquid cooling.',
      ],
      key: '1 kW of IT load = 3,412 BTU/h of heat to remove.',
    },
  ],
}

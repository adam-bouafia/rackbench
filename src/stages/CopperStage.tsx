import type { CSSProperties } from 'react'
import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'

// Copper cabling and cable management: RJ45 and categories, testing, DAC, labels and tidy racks.

type Scene = 'rj45' | 'cats' | 'channel' | 'test' | 'dac' | 'manage' | 'label'
export interface CopperStep extends StageStep {
  scene: Scene
}

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` })

// T568B, pins 1 to 8
const PINS: [string, string, string][] = [
  ['1', 'white-orange', 'is-wo'],
  ['2', 'orange', 'is-o'],
  ['3', 'white-green', 'is-wg'],
  ['4', 'blue', 'is-b'],
  ['5', 'white-blue', 'is-wb'],
  ['6', 'green', 'is-g'],
  ['7', 'white-brown', 'is-wbr'],
  ['8', 'brown', 'is-br'],
]

const FAULTS: { name: string; map: (number | null)[]; note: string }[] = [
  { name: 'Pass', map: [1, 2, 3, 4, 5, 6, 7, 8], note: 'every pin lands on the same pin' },
  { name: 'Open', map: [1, 2, 3, null, 5, 6, 7, 8], note: 'pin 4 reaches nothing: a broken or unseated wire' },
  { name: 'Reversed pair', map: [2, 1, 3, 4, 5, 6, 7, 8], note: 'the two wires of a pair are swapped' },
  { name: 'Crossed pairs', map: [3, 6, 1, 4, 5, 2, 7, 8], note: 'orange and green pairs swapped between the ends' },
  { name: 'Split pair', map: [1, 2, 3, 4, 5, 6, 7, 8], note: 'pins match, but 3 and 6 are not twisted together: noise, errors at speed' },
]

export function CopperStage({ steps, cur, replayKey }: StageProps<CopperStep>) {
  const st = steps[Math.max(0, cur)]
  const scene = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {scene === 'rj45' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              RJ45, wired to T568B
            </text>
            <rect x={330} y={70} width={340} height={210} rx="16" className="cu-plug" />
            <rect x={460} y={50} width={80} height={26} rx="4" className="cu-latch" />
            {PINS.map(([n, name, cls], i) => (
              <g key={n} className="fb-in" style={d(i * 0.12)}>
                <rect x={350 + i * 39} y={90} width={26} height={60} rx="3" className="cu-gold" />
                <rect x={354 + i * 39} y={150} width={18} height={250} className={`cu-wire ${cls}`} />
                <text x={363 + i * 39} y={84} textAnchor="middle" className="fb-tiny">
                  {n}
                </text>
                <text x={363 + i * 39} y={420} textAnchor="end" className="fb-tiny" transform={`rotate(-50 ${363 + i * 39} 420)`}>
                  {name}
                </text>
              </g>
            ))}
            <text x={140} y={150} className="fb-label">
              pairs: 1-2 orange
            </text>
            <text x={140} y={172} className="fb-label">
              3-6 green
            </text>
            <text x={140} y={194} className="fb-label">
              4-5 blue
            </text>
            <text x={140} y={216} className="fb-label">
              7-8 brown
            </text>
            <text x={700} y={150} className="fb-label">
              1G and 10G use all
            </text>
            <text x={700} y={172} className="fb-label">
              four pairs, both ways
            </text>
            <text x={700} y={194} className="fb-label">
              at once
            </text>
          </>
        )}
        {scene === 'cats' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              Categories: speed and length
            </text>
            {[
              ['Cat5e', '1 Gb/s', '100 m', 'BMC and management ports'],
              ['Cat6', '1 Gb/s · 10 Gb/s', '100 m · 55 m', 'office, older racks'],
              ['Cat6A', '10 Gb/s', '100 m', 'today\'s default for 10GBASE-T'],
              ['Cat8', '25 / 40 Gb/s', '30 m', 'short in-row links, rare'],
            ].map(([c, s, l, u], i) => (
              <g key={c} className="fb-in" style={d(i * 0.2)}>
                <rect x={80} y={80 + i * 80} width={840} height={60} rx="10" className="fb-card" />
                <text x={110} y={117 + i * 80} className="fb-strong">
                  {c}
                </text>
                <text x={260} y={117 + i * 80} className="fb-label">
                  {s}
                </text>
                <text x={480} y={117 + i * 80} className="fb-label">
                  {l}
                </text>
                <text x={640} y={117 + i * 80} className="fb-small">
                  {u}
                </text>
              </g>
            ))}
            <text x={500} y={430} textAnchor="middle" className="fb-label">
              U/UTP is unshielded; S/FTP has a foil per pair and a braid. Shielded cable needs grounded panels.
            </text>
          </>
        )}
        {scene === 'channel' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              The 100 m channel: permanent link plus cords
            </text>
            <rect x={60} y={150} width={120} height={70} rx="8" className="fb-optic" />
            <text x={120} y={190} textAnchor="middle" className="fb-small">
              server port
            </text>
            <path d="M180 185 H280" className="cu-cord" />
            <rect x={280} y={140} width={60} height={90} rx="6" className="fb-panel" />
            <text x={310} y={260} textAnchor="middle" className="fb-small">
              patch panel
            </text>
            <path d="M340 185 C 450 120, 560 250, 660 185" className="cu-run" />
            <rect x={660} y={140} width={60} height={90} rx="6" className="fb-panel" />
            <text x={690} y={260} textAnchor="middle" className="fb-small">
              patch panel
            </text>
            <path d="M720 185 H820" className="cu-cord" />
            <rect x={820} y={150} width={120} height={70} rx="8" className="fb-optic" />
            <text x={880} y={190} textAnchor="middle" className="fb-small">
              switch port
            </text>
            <text x={230} y={130} textAnchor="middle" className="fb-label">
              cord
            </text>
            <text x={500} y={110} textAnchor="middle" className="fb-strong">
              permanent link: up to 90 m, punched down at both panels
            </text>
            <text x={770} y={130} textAnchor="middle" className="fb-label">
              cord
            </text>
            <text x={500} y={320} textAnchor="middle" className="fb-label">
              Cords add up to 10 m in total. Solid-core cable for the fixed run, stranded for cords.
            </text>
            <text x={500} y={350} textAnchor="middle" className="fb-label">
              The permanent link is certified once; every cord you add is part of the channel.
            </text>
          </>
        )}
        {scene === 'test' && (
          <>
            <text x={500} y={36} textAnchor="middle" className="fb-title">
              A cable tester's wiremap
            </text>
            {FAULTS.map((f, r) => {
              const y = 70 + r * 80
              return (
                <g key={f.name} className="fb-in" style={d(r * 0.35)}>
                  <text x={40} y={y + 30} className={r === 0 ? 'fb-ok' : 'fb-bad'}>
                    {f.name}
                  </text>
                  {PINS.map(([n, , cls], i) => {
                    const to = f.map[i]
                    const x1 = 230 + i * 26
                    return (
                      <g key={n}>
                        <circle cx={x1} cy={y + 10} r="7" className={`cu-pin ${cls}`} />
                        {to !== null ? (
                          <line x1={x1} y1={y + 18} x2={230 + (to - 1) * 26} y2={y + 46} className={`cu-map ${cls}${r === 4 && (i === 2 || i === 5) ? ' is-split' : ''}`} />
                        ) : (
                          <line x1={x1} y1={y + 18} x2={x1} y2={y + 28} className="cu-map is-open" />
                        )}
                        <circle cx={230 + i * 26} cy={y + 54} r="7" className={`cu-pin ${cls}`} />
                      </g>
                    )
                  })}
                  <text x={470} y={y + 36} className="fb-small">
                    {f.note}
                  </text>
                </g>
              )
            })}
          </>
        )}
        {scene === 'dac' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              DAC and breakout cables inside the rack
            </text>
            <rect x={120} y={80} width={760} height={50} rx="6" className="fb-panel" />
            <text x={500} y={110} textAnchor="middle" className="fb-small">
              top-of-rack switch: QSFP28 100G ports
            </text>
            {[0, 1, 2, 3].map((k) => (
              <g key={k} className="fb-in" style={d(k * 0.2)}>
                <rect x={160} y={200 + k * 56} width={300} height={40} rx="6" className="fb-optic" />
                <text x={310} y={225 + k * 56} textAnchor="middle" className="fb-small">
                  server {k + 1} · SFP28 25G
                </text>
                <path d={`M460 ${220 + k * 56} C 560 ${220 + k * 56}, 560 160, 640 130`} className="cu-twinax" />
              </g>
            ))}
            <text x={720} y={240} className="fb-strong">
              1 × QSFP28 → 4 × SFP28
            </text>
            <text x={720} y={264} className="fb-small">
              a breakout DAC: one 100G port
            </text>
            <text x={720} y={284} className="fb-small">
              becomes four 25G links
            </text>
            <text x={500} y={450} textAnchor="middle" className="fb-label">
              Passive DAC: no optics, almost no power, ~1-3 m. The switch port must be set to breakout mode.
            </text>
          </>
        )}
        {scene === 'manage' && (
          <>
            {[
              { x: 80, tidy: false, title: 'Before' },
              { x: 540, tidy: true, title: 'After' },
            ].map((r) => (
              <g key={r.x} className="fb-in" style={d(r.tidy ? 0.6 : 0)}>
                <text x={r.x + 190} y={40} textAnchor="middle" className="fb-title">
                  {r.title}
                </text>
                <rect x={r.x} y={60} width={380} height={340} rx="10" className="fb-panel" />
                {Array.from({ length: 8 }, (_, i) => (
                  <rect key={i} x={r.x + 30} y={78 + i * 38} width={320} height={28} rx="4" className="fb-optic" />
                ))}
                {r.tidy ? (
                  <>
                    <rect x={r.x + 352} y={70} width={18} height={320} rx="4" className="cu-manager" />
                    {Array.from({ length: 8 }, (_, i) => (
                      <path key={i} d={`M${r.x + 300} ${92 + i * 38} H${r.x + 352}`} className="cu-cord is-blue" />
                    ))}
                    <rect x={r.x + 8} y={70} width={18} height={320} rx="4" className="cu-manager" />
                    {Array.from({ length: 8 }, (_, i) => (
                      <path key={i} d={`M${r.x + 60} ${92 + i * 38} H${r.x + 26}`} className="cu-cord is-red" />
                    ))}
                  </>
                ) : (
                  Array.from({ length: 8 }, (_, i) => (
                    <path key={i} d={`M${r.x + 300} ${92 + i * 38} C ${r.x + 120} ${300 - i * 20}, ${r.x + 340} ${120 + i * 25}, ${r.x + 60 + i * 30} ${92 + ((i * 3) % 8) * 38}`} className={`cu-cord ${i % 2 ? 'is-red' : 'is-blue'}`} />
                  ))
                )}
              </g>
            ))}
            <text x={500} y={440} textAnchor="middle" className="fb-label">
              Data to one side, power to the other, through cable managers, with hook-and-loop straps, not zip ties.
            </text>
            <text x={500} y={464} textAnchor="middle" className="fb-label">
              Nothing in front of fans or PSU handles: any part must be swappable without unplugging the neighbours.
            </text>
          </>
        )}
        {scene === 'label' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              One label at each end, the same text
            </text>
            <path d="M120 200 H880" className="cu-cord is-blue" />
            {[150, 850].map((x, i) => (
              <g key={x} className="fb-in" style={d(i * 0.4)}>
                <rect x={x - 70} y={150} width={140} height={44} rx="6" className="cu-tag" />
                <text x={x} y={170} textAnchor="middle" className="fb-tiny">
                  C04-U22 be0
                </text>
                <text x={x} y={186} textAnchor="middle" className="fb-tiny">
                  ⇄ C04-U42 eth1/9
                </text>
              </g>
            ))}
            <Rows />
          </>
        )}
      </svg>
    </div>
  )
}

function Rows() {
  return (
    <g className="fb-in" style={d(0.8)}>
      <rect x={120} y={260} width={760} height={150} rx="10" className="fb-card" />
      {[
        ['From', 'Port', 'To', 'Port', 'Cable'],
        ['C04-U22 rk-n12', 'be0', 'C04-U42 tor1', 'eth1/9', 'DAC 25G 2 m'],
        ['C04-U22 rk-n12', 'mgmt0', 'C04-U41 mgmt', 'ge1/22', 'Cat6A 1 m'],
      ].map((r, i) => (
        <g key={i}>
          {r.map((c, j) => (
            <text key={j} x={140 + j * 150} y={292 + i * 34} className={i === 0 ? 'fb-strong' : 'fb-small'}>
              {c}
            </text>
          ))}
        </g>
      ))}
      <text x={500} y={436} textAnchor="middle" className="fb-label">
        The cabling table is the plan; the labels and LLDP prove the rack matches it.
      </text>
    </g>
  )
}

export const COPPER: StageLesson<CopperStep> = {
  Stage: CopperStage,
  intro: ['Copper still runs every management network, many 10G links and every in-rack DAC. This lesson covers the RJ45 plug, the categories, what a cable tester tells you, and the cable management a technician is judged on.'],
  legend: [
    ['RJ45', 'The 8-pin plug of Ethernet copper cable'],
    ['Patch panel', 'Where fixed cable runs end, so cords can be moved without touching the runs'],
    ['Wiremap', 'A tester\'s check that every pin reaches the right pin'],
  ],
  steps: [
    { scene: 'rj45', short: 'RJ45', title: 'Eight wires, four twisted pairs', explain: ['An RJ45 plug has 8 pins and the cable 4 twisted pairs. T568B puts orange on 1-2, green on 3-6, blue on 4-5, brown on 7-8 (T568A swaps orange and green). Both ends must use the same standard.', 'The twist cancels noise, so a pair must stay twisted right up to the plug.'], key: 'Same standard on both ends; pairs stay twisted.' },
    { scene: 'cats', short: 'Categories', title: 'Cat5e, Cat6, Cat6A, Cat8', explain: ['Cat5e carries 1G for 100 m and is fine for BMC ports. Cat6 does 10G only to about 55 m; Cat6A does 10G for the full 100 m and is today\'s default.', 'Shielded cable (S/FTP) resists noise in dense bundles but must be grounded through the panels.'], key: '10GBASE-T over 100 m needs Cat6A.' },
    { scene: 'channel', short: '100 m', title: 'Permanent link and channel', explain: ['Structured cabling runs solid cable from panel to panel (up to 90 m, the permanent link) and uses short stranded cords at each end. Cords may add up to 10 m: 100 m channel.', 'The fixed runs are certified once at installation; you move cords, never the runs.'], key: 'Move cords, not the permanent link.' },
    { scene: 'test', short: 'Testing', title: 'What the tester sees', tag: 'technique', explain: ['A simple tester checks the wiremap: every pin to the same pin. It finds opens, shorts, reversed and crossed pairs. A split pair passes the wiremap but fails at speed, so a certifier also measures crosstalk, return loss and length.', 'A link that negotiates 1G instead of 10G, or counts errors, is a classic sign of a bad termination.'], key: 'Wiremap catches wrong pins; only certification catches split pairs.' },
    { scene: 'dac', short: 'DAC', title: 'Twinax inside the rack', explain: ['A DAC is copper twinax with SFP or QSFP ends fixed on. Cheap, almost no power, about 1 to 3 m: server to top-of-rack switch.', 'A breakout DAC splits one 100G QSFP28 port into four 25G SFP28 links; the switch port must be configured for breakout.'], key: 'DAC for short in-rack links; breakout needs the port set to match.' },
    { scene: 'manage', short: 'Tidy', title: 'Cable management', tag: 'action', explain: ['Route data and power on opposite sides through the managers, strap with hook-and-loop, leave a small service loop, respect the bend radius (about 4 times the diameter for copper, about 10 times for fibre cords).', 'Keep cables away from fan exhausts and PSU handles: every part must be swappable without unplugging the neighbours, and airflow must not be blocked.'], key: 'Any part swappable without touching its neighbours.' },
    { scene: 'label', short: 'Labels', title: 'Label both ends, match the table', tag: 'result', explain: ['Every cable gets a label at both ends with the same text: where it comes from and where it goes. The format follows the site standard (often rack, unit and port).', 'Update the cabling table and the asset records when you change a link, and check it with LLDP: the label, the table and the switch must agree.'], key: 'Label, table and LLDP must agree.' },
  ],
}

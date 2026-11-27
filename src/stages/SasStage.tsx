import type { CSSProperties } from 'react'
import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'

// SATA versus SAS (and NVMe), one difference per step, drawn in the site's paper style.

type Scene = 'drives' | 'plugs' | 'fit' | 'speed' | 'duplex' | 'ports' | 'queue' | 'nvme' | 'summary'
export interface SasStep extends StageStep {
  scene: Scene
}

function Plug({ x, y, w, sas, labels }: { x: number; y: number; w: number; sas: boolean; labels?: boolean }) {
  const k = w / 300
  const h = 26 * k
  const seg = (sx: number, sw: number, pins: number) => (
    <g>
      <rect x={x + sx * k} y={y} width={sw * k} height={h} rx={3 * k} className="sas-seg" />
      {Array.from({ length: pins }, (_, i) => (
        <rect key={i} x={x + (sx + 6 + (i * (sw - 12)) / pins) * k} y={y + 6 * k} width={((sw - 12) / pins) * 0.55 * k} height={h - 12 * k} className="sas-pin" />
      ))}
    </g>
  )
  return (
    <g>
      <rect x={x - 10 * k} y={y - 14 * k} width={w + 20 * k} height={h + 28 * k} rx={6 * k} className="sas-edge" />
      {seg(0, 80, 7)}
      <rect x={x + 80 * k} y={y} width={26 * k} height={h} className={sas ? 'sas-bridge' : 'sas-gap'} />
      {seg(106, 194, 15)}
      {labels && (
        <>
          <text x={x + 40 * k} y={y + h + 34 * k} textAnchor="middle" className="sas-label">
            data · 7 pins
          </text>
          <text x={x + 93 * k} y={y - 22 * k} textAnchor="middle" className={`sas-label ${sas ? 'is-sas' : 'is-sata'}`}>
            {sas ? 'bridge' : 'gap'}
          </text>
          <text x={x + 203 * k} y={y + h + 34 * k} textAnchor="middle" className="sas-label">
            power · 15 pins
          </text>
        </>
      )}
    </g>
  )
}

/** Packets moving along a horizontal line. */
function Lane({ x1, x2, y, n, dur, reverse, cls = '', delay = 0 }: { x1: number; x2: number; y: number; n: number; dur: number; reverse?: boolean; cls?: string; delay?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <circle
          key={i}
          cx={reverse ? x2 : x1}
          cy={y}
          r="7"
          className={`sas-dot ${cls}`}
          style={{ '--run': `${(x2 - x1) * (reverse ? -1 : 1)}px`, animationDuration: `${dur}s`, animationDelay: `${delay + (i * dur) / n}s` } as CSSProperties}
        />
      ))}
    </g>
  )
}

function Box({ x, y, w, h, label, sub, cls = '' }: { x: number; y: number; w: number; h: number; label: string; sub?: string; cls?: string }) {
  return (
    <g className={`sas-box ${cls}`}>
      <rect x={x + 4} y={y + 4} width={w} height={h} rx="10" className="sas-shadow" />
      <rect x={x} y={y} width={w} height={h} rx="10" />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 5)} textAnchor="middle" className="sas-box-label">
        {label}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 16} textAnchor="middle" className="sas-box-sub">
          {sub}
        </text>
      )}
    </g>
  )
}

function Drive({ x, y, sas }: { x: number; y: number; sas: boolean }) {
  return (
    <g>
      <rect x={x + 5} y={y + 5} width={230} height={290} rx="12" className="sas-shadow" />
      <rect x={x} y={y} width={230} height={290} rx="12" className="sas-drive" />
      <rect x={x + 30} y={y + 40} width={170} height={120} rx="8" className="sas-plate" />
      <text x={x + 115} y={y + 86} textAnchor="middle" className="sas-plate-title">
        {sas ? 'SAS SSD' : 'SATA SSD'}
      </text>
      <text x={x + 115} y={y + 112} textAnchor="middle" className="sas-plate-sub">
        2.5-inch · {sas ? '12 Gb/s' : '6 Gb/s'}
      </text>
      <text x={x + 115} y={y + 136} textAnchor="middle" className="sas-plate-sub">
        {sas ? 'dual port' : 'single port'}
      </text>
      <Plug x={x + 40} y={y + 250} w={150} sas={sas} />
    </g>
  )
}

const SUMMARY: [string, string, string, string][] = [
  ['Link speed', '6 Gb/s', '12 Gb/s, 24G newest', 'PCIe x4: ~8 GB/s on Gen4'],
  ['Ports', 'one', 'two (dual port)', 'one, some two'],
  ['Duplex', 'half', 'full', 'full'],
  ['Command queue', '32 (NCQ)', 'hundreds', 'up to 64K queues'],
  ['Connector', 'gap between data and power', 'bridge, port 2 on the back', 'U.2, E1.S, M.2'],
  ['Fits a SAS slot', 'yes', 'yes', 'no (own bays)'],
  ['Typical use', 'boot SSDs, cheap capacity', 'enterprise HDDs, dual-path storage', 'performance'],
]

export function SasStage({ steps, cur, replayKey }: StageProps<SasStep>) {
  const st = steps[Math.max(0, cur)]
  const scene = cur < 0 ? 'drives' : st.scene
  if (scene === 'summary')
    return (
      <div className="sas-wrap" key={`${cur}:${replayKey}`}>
        <table className="sas-table">
          <thead>
            <tr>
              <th />
              <th>SATA</th>
              <th>SAS</th>
              <th>NVMe</th>
            </tr>
          </thead>
          <tbody>
            {SUMMARY.map((r, i) => (
              <tr key={r[0]} style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
                {r.map((c, j) => (j === 0 ? <th key={j}>{c}</th> : <td key={j}>{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  return (
    <div className="sas-wrap">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="sas-svg" role="img" aria-label={`SATA versus SAS: ${st.title}`}>
        {scene === 'drives' && (
          <>
            <Drive x={150} y={70} sas={false} />
            <Drive x={620} y={70} sas />
            <text x={500} y={230} textAnchor="middle" className="sas-vs">
              vs
            </text>
            <text x={500} y={420} textAnchor="middle" className="sas-label">
              Same size, same bays. The label and the connector tell them apart.
            </text>
          </>
        )}
        {scene === 'plugs' && (
          <>
            <text x={130} y={120} className="sas-title">
              SATA
            </text>
            <g className="sas-pulse-gap">
              <Plug x={230} y={92} w={620} sas={false} labels />
            </g>
            <text x={130} y={318} className="sas-title">
              SAS
            </text>
            <g className="sas-pulse-bridge">
              <Plug x={230} y={290} w={620} sas labels />
            </g>
            <text x={540} y={446} textAnchor="middle" className="sas-note">
              + 7 more pins for the second port, on the back of the plug
            </text>
          </>
        )}
        {scene === 'fit' && (
          <>
            <text x={250} y={40} textAnchor="middle" className="sas-title">
              SATA drive → SAS slot
            </text>
            <text x={750} y={40} textAnchor="middle" className="sas-title">
              SAS drive → SATA slot
            </text>
            <g className="sas-slide is-fits">
              <rect x={170} y={70} width={160} height={150} rx="10" className="sas-drive" />
              <text x={250} y={140} textAnchor="middle" className="sas-plate-title">
                SATA
              </text>
              <Plug x={190} y={196} w={120} sas={false} />
            </g>
            <rect x={150} y={390} width={200} height={50} rx="8" className="sas-socket" />
            <text x={250} y={470} textAnchor="middle" className="sas-label">
              SAS backplane: no key, takes both
            </text>
            <g className="sas-slide is-blocked">
              <rect x={670} y={70} width={160} height={150} rx="10" className="sas-drive" />
              <text x={750} y={140} textAnchor="middle" className="sas-plate-title">
                SAS
              </text>
              <Plug x={690} y={196} w={120} sas />
            </g>
            <rect x={650} y={390} width={200} height={50} rx="8" className="sas-socket" />
            <rect x={736} y={372} width={14} height={26} className="sas-key" />
            <text x={750} y={470} textAnchor="middle" className="sas-label">
              SATA backplane: a key sits in the gap
            </text>
            <g className="sas-verdict is-ok" style={{ animationDelay: '1.6s' }}>
              <circle cx={400} cy={300} r="26" />
              <text x={400} y={309} textAnchor="middle">
                ✓
              </text>
            </g>
            <g className="sas-verdict is-bad" style={{ animationDelay: '1.6s' }}>
              <circle cx={900} cy={300} r="26" />
              <text x={900} y={309} textAnchor="middle">
                ✕
              </text>
            </g>
          </>
        )}
        {scene === 'speed' && (
          <>
            <Box x={60} y={110} w={150} h={70} label="HBA" />
            <Box x={790} y={110} w={150} h={70} label="SATA drive" />
            <line x1={210} x2={790} y1={145} y2={145} className="sas-wire" />
            <Lane x1={220} x2={780} y={145} n={4} dur={2.4} />
            <text x={500} y={210} textAnchor="middle" className="sas-label">
              SATA III: 6 Gb/s, about 600 MB/s
            </text>
            <Box x={60} y={290} w={150} h={70} label="HBA" />
            <Box x={790} y={290} w={150} h={70} label="SAS drive" cls="is-sas" />
            <line x1={210} x2={790} y1={325} y2={325} className="sas-wire" />
            <Lane x1={220} x2={780} y={325} n={8} dur={1.2} cls="is-sas" />
            <text x={500} y={390} textAnchor="middle" className="sas-label">
              SAS-3: 12 Gb/s · SAS-4 (24G): twice that again
            </text>
          </>
        )}
        {scene === 'duplex' && (
          <>
            <text x={500} y={70} textAnchor="middle" className="sas-title">
              SATA: one direction at a time
            </text>
            <Box x={60} y={100} w={150} h={70} label="HBA" />
            <Box x={790} y={100} w={150} h={70} label="SATA drive" />
            <line x1={210} x2={790} y1={135} y2={135} className="sas-wire" />
            <g className="sas-half is-a">
              <Lane x1={220} x2={780} y={135} n={3} dur={1.5} />
            </g>
            <g className="sas-half is-b">
              <Lane x1={220} x2={780} y={135} n={3} dur={1.5} reverse cls="is-back" />
            </g>
            <text x={500} y={270} textAnchor="middle" className="sas-title">
              SAS: both directions at once
            </text>
            <Box x={60} y={300} w={150} h={70} label="HBA" />
            <Box x={790} y={300} w={150} h={70} label="SAS drive" cls="is-sas" />
            <line x1={210} x2={790} y1={322} y2={322} className="sas-wire" />
            <line x1={210} x2={790} y1={350} y2={350} className="sas-wire" />
            <Lane x1={220} x2={780} y={322} n={3} dur={1.5} cls="is-sas" />
            <Lane x1={220} x2={780} y={350} n={3} dur={1.5} reverse cls="is-back" />
          </>
        )}
        {scene === 'ports' && (
          <>
            <text x={60} y={50} className="sas-title">
              SAS: two ports, two paths
            </text>
            <Box x={60} y={70} w={170} h={56} label="Controller A" />
            <Box x={60} y={160} w={170} h={56} label="Controller B" />
            <Box x={760} y={110} w={180} h={66} label="SAS drive" sub="port 1 · port 2" cls="is-sas" />
            <path d="M230 98 H500 V130 H760" className="sas-wire" />
            <path d="M230 188 H500 V156 H760" className="sas-wire" />
            <g className="sas-cut" style={{ animationDelay: '1s' }}>
              <line x1={350} y1={84} x2={378} y2={112} />
              <line x1={378} y1={84} x2={350} y2={112} />
            </g>
            <g className="sas-dies">
              <Lane x1={240} x2={480} y={98} n={2} dur={1.2} />
            </g>
            <Lane x1={240} x2={480} y={188} n={3} dur={1.2} cls="is-sas" />
            <text x={850} y={210} textAnchor="middle" className="sas-label is-ok">
              still reachable
            </text>
            <text x={60} y={300} className="sas-title">
              SATA: one port, one path
            </text>
            <Box x={60} y={330} w={170} h={56} label="Controller" />
            <Box x={760} y={325} w={180} h={66} label="SATA drive" cls="sas-gone" />
            <path d="M230 358 H760" className="sas-wire" />
            <g className="sas-cut" style={{ animationDelay: '1s' }}>
              <line x1={480} y1={344} x2={508} y2={372} />
              <line x1={508} y1={344} x2={480} y2={372} />
            </g>
            <g className="sas-dies">
              <Lane x1={240} x2={470} y={358} n={2} dur={1.2} />
            </g>
            <text x={850} y={420} textAnchor="middle" className="sas-label is-bad">
              unreachable
            </text>
          </>
        )}
        {scene === 'queue' && (
          <>
            <text x={80} y={70} className="sas-title">
              SATA NCQ: 32 commands
            </text>
            {Array.from({ length: 32 }, (_, i) => (
              <rect key={i} x={80 + i * 26} y={90} width={20} height={20} rx="4" className="sas-q" style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
            <text x={80} y={190} className="sas-title">
              SAS: hundreds of commands (typically 254 or more)
            </text>
            {Array.from({ length: 256 }, (_, i) => (
              <rect key={i} x={80 + (i % 32) * 26} y={210 + Math.floor(i / 32) * 26} width={20} height={20} rx="4" className="sas-q is-sas" style={{ animationDelay: `${(i % 32) * 0.05 + Math.floor(i / 32) * 0.12}s` }} />
            ))}
          </>
        )}
        {scene === 'nvme' && (
          <>
            <Box x={400} y={40} w={200} h={70} label="CPU" sub="PCIe lanes" />
            <text x={200} y={160} textAnchor="middle" className="sas-title">
              NVMe: straight to the CPU
            </text>
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <path d={`M${440 + k * 20} 110 V200 H${110 + k * 100} V300`} className="sas-wire is-pcie" />
                <Box x={70 + k * 100} y={300} w={80} h={90} label="NVMe" sub="x4" cls="is-nvme" />
              </g>
            ))}
            <text x={780} y={160} textAnchor="middle" className="sas-title">
              SAS and SATA: through an HBA
            </text>
            <path d="M560 110 V200 H780 V230" className="sas-wire is-pcie" />
            <Box x={700} y={230} w={160} h={56} label="HBA or RAID" />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <path d={`M780 286 V320 H${690 + k * 90} V340`} className="sas-wire" />
                <Box x={655 + k * 90} y={340} w={70} h={56} label={k === 2 ? 'SATA' : 'SAS'} cls={k === 2 ? '' : 'is-sas'} />
              </g>
            ))}
            <text x={500} y={450} textAnchor="middle" className="sas-label">
              NVMe: up to 64K queues of 64K commands, no controller in the path
            </text>
          </>
        )}
      </svg>
    </div>
  )
}

export const SATA_SAS: StageLesson<SasStep> = {
  Stage: SasStage,
  metrics: [
    { id: 'topic', label: 'Comparing', start: '-' },
    { id: 'sata', label: 'SATA', start: '-' },
    { id: 'sas', label: 'SAS', start: '-' },
  ],
  intro: [
    'A favourite interview question: what is the difference between SATA and SAS, in performance and in how they look? This lesson answers it one difference at a time, and ends with NVMe for comparison.',
  ],
  legend: [
    ['SATA', 'Serial ATA: the desktop-born drive interface'],
    ['SAS', 'Serial Attached SCSI: the server drive interface'],
    ['HBA', 'Host bus adapter: the card the drives connect to'],
  ],
  steps: [
    {
      scene: 'drives',
      short: 'Look alike',
      title: 'Two drives that fit the same bay',
      explain: ['A SATA SSD and a SAS SSD in the 2.5-inch size slide into the same hot-swap bays of a server. From the front of the rack you cannot tell them apart.', 'The label says which one it is, and so does the connector.'],
      m: { topic: 'Size', sata: '2.5" or 3.5"', sas: '2.5" or 3.5"' },
    },
    {
      scene: 'plugs',
      short: 'The plug',
      title: 'A gap or a bridge',
      tag: 'technique',
      explain: [
        'SATA: a 7-pin data segment, a gap, a 15-pin power segment.',
        'SAS: the gap is closed by a plastic bridge, and the second port has 7 more pins on the back side of the plug.',
      ],
      key: 'Gap between data and power = SATA. Bridge = SAS.',
      m: { topic: 'Connector', sata: 'gap', sas: 'bridge' },
    },
    {
      scene: 'fit',
      short: 'Backplane fit',
      title: 'SAS slots take SATA drives, not the reverse',
      tag: 'result',
      explain: [
        'A SAS backplane has no key in that spot, and a SAS controller speaks SATA too, so a SATA drive fits and works.',
        'A SATA backplane has a key in the gap. The SAS bridge hits it: the drive does not go in, and a SATA controller could not talk to it anyway.',
      ],
      key: 'SATA drive in a SAS slot: fine. SAS drive in a SATA slot: no.',
      m: { topic: 'Compatibility', sata: 'fits SAS slots', sas: 'SAS slots only' },
    },
    {
      scene: 'speed',
      short: 'Speed',
      title: '6 Gb/s against 12 or 24 Gb/s',
      explain: [
        'SATA III runs at 6 Gb/s per link, about 600 MB/s after encoding. SAS-3 runs at 12 Gb/s and SAS-4 (24G) about twice that.',
        'For spinning disks the link rarely matters, the platters are slower than either. For SSDs it does.',
      ],
      m: { topic: 'Link speed', sata: '6 Gb/s', sas: '12 / 24 Gb/s' },
    },
    {
      scene: 'duplex',
      short: 'Duplex',
      title: 'Half duplex against full duplex',
      explain: ['SATA sends data one direction at a time. SAS reads and writes at the same moment, in both directions.'],
      key: 'SAS is full duplex; SATA is half duplex.',
      m: { topic: 'Duplex', sata: 'half', sas: 'full' },
    },
    {
      scene: 'ports',
      short: 'Two ports',
      title: 'Dual port: two paths to one drive',
      tag: 'event',
      explain: [
        'A SAS drive has two ports, so two controllers or two expanders can reach it. When path A breaks, path B carries on: storage servers use this to avoid a single point of failure.',
        'A SATA drive has one port. Break its path and the drive is gone.',
      ],
      key: 'Dual port: one drive, two independent paths.',
      m: { topic: 'Ports', sata: '1', sas: '2' },
    },
    {
      scene: 'queue',
      short: 'Queue',
      title: 'How many commands can wait',
      explain: [
        'With many requests at once, a drive queues them and reorders them to work efficiently. SATA NCQ queues up to 32 commands; SAS queues are much deeper, typically 254 or more per device.',
        'Deeper queues help busy servers with many users or virtual machines.',
      ],
      m: { topic: 'Command queue', sata: '32', sas: '254+' },
    },
    {
      scene: 'nvme',
      short: 'And NVMe',
      title: 'NVMe skips the controller',
      tag: 'technique',
      explain: [
        'NVMe drives connect to the CPU over PCIe, usually four lanes each, with no HBA in between. Up to 64K queues of 64K commands, and latency in microseconds.',
        'In a server today: SATA for boot SSDs and cheap capacity, SAS for enterprise HDDs and dual-path storage, NVMe for performance.',
      ],
      key: 'NVMe: PCIe straight to the CPU.',
      m: { topic: 'Path', sata: 'via HBA', sas: 'via HBA' },
    },
    {
      scene: 'summary',
      short: 'Side by side',
      title: 'The answer, side by side',
      tag: 'result',
      explain: ['In an interview, cover four things: the connector (gap or bridge), compatibility (SAS slots take SATA), performance (speed, full duplex, queue) and reliability (dual port, enterprise drives).'],
      key: 'Connector, compatibility, performance, dual port.',
      m: { topic: 'Summary', sata: 'cheaper, simpler', sas: 'faster, dual path' },
    },
  ],
}

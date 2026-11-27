import type { CSSProperties } from 'react'
import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'

// Fibre on the data center floor: what is inside the cable, polarity, light levels and cleaning.

type Scene = 'cross' | 'colors' | 'connectors' | 'optics' | 'reach' | 'txrx' | 'wrong' | 'flip' | 'panels' | 'vfl' | 'mpo' | 'dom' | 'budget' | 'scope' | 'clean' | 'retest'
export interface FiberStep extends StageStep {
  scene: Scene
}

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` })

function Optic({ x, y, label, flip, tx = 'TX', rx = 'RX' }: { x: number; y: number; label: string; flip?: boolean; tx?: string; rx?: string }) {
  return (
    <g>
      <rect x={x + 4} y={y + 4} width={120} height={70} rx="8" className="fb-shadow" />
      <rect x={x} y={y} width={120} height={70} rx="8" className="fb-optic" />
      <text x={x + 60} y={y - 10} textAnchor="middle" className="fb-label">
        {label}
      </text>
      <rect x={flip ? x - 10 : x + 106} y={y + 10} width={24} height={20} rx="4" className="fb-port is-tx" />
      <rect x={flip ? x - 10 : x + 106} y={y + 40} width={24} height={20} rx="4" className="fb-port is-rx" />
      <text x={flip ? x + 24 : x + 96} y={y + 25} textAnchor={flip ? 'start' : 'end'} className="fb-small">
        {tx}
      </text>
      <text x={flip ? x + 24 : x + 96} y={y + 55} textAnchor={flip ? 'start' : 'end'} className="fb-small">
        {rx}
      </text>
    </g>
  )
}

/** A strand of fibre with light travelling along it. */
function Strand({ d: path, lit = true, dark, slow }: { d: string; lit?: boolean; dark?: boolean; slow?: boolean }) {
  return (
    <g>
      <path d={path} className={`fb-strand${dark ? ' is-dark' : ''}`} />
      {lit && !dark && <path d={path} className={`fb-light${slow ? ' is-slow' : ''}`} />}
    </g>
  )
}

function Term({ x, y, w, lines }: { x: number; y: number; w: number; lines: string[] }) {
  return (
    <g className="fb-in">
      <rect x={x} y={y} width={w} height={22 + lines.length * 19} rx="10" className="fb-term" />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 26 + i * 19} className={`fb-term-text${l.startsWith('!') ? ' is-bad' : l.startsWith('+') ? ' is-ok' : ''}`}>
          {l.replace(/^[!+]/, '')}
        </text>
      ))}
    </g>
  )
}

function Bar({ x, y, w, parts, max, limit }: { x: number; y: number; w: number; parts: [string, number, string][]; max: number; limit: number }) {
  let acc = 0
  return (
    <g>
      <rect x={x} y={y} width={w} height={38} rx="6" className="fb-track" />
      {parts.map(([name, v, tone], i) => {
        const px = x + (acc / max) * w
        acc += v
        return (
          <g key={i} className="fb-grow" style={d(i * 0.3)}>
            <rect x={px} y={y} width={(v / max) * w} height={38} className={`fb-seg is-${tone}`} />
            {v / max > 0.06 && (
              <text x={px + ((v / max) * w) / 2} y={y + 24} textAnchor="middle" className="fb-small">
                {name}
              </text>
            )}
          </g>
        )
      })}
      <line x1={x + (limit / max) * w} x2={x + (limit / max) * w} y1={y - 12} y2={y + 50} className="fb-limit" />
    </g>
  )
}

export function FiberStage({ steps, cur, replayKey }: StageProps<FiberStep>) {
  const st = steps[Math.max(0, cur)]
  const scene = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {scene === 'cross' && (
          <>
            {[
              { x: 270, title: 'Multimode (OM4)', core: 50, jacket: 'is-aqua', note: 'core 50 µm · 850 nm · up to ~100-400 m' },
              { x: 730, title: 'Single-mode (OS2)', core: 9, jacket: 'is-yellow', note: 'core 9 µm · 1310 / 1550 nm · km' },
            ].map((f) => (
              <g key={f.x}>
                <text x={f.x} y={40} textAnchor="middle" className="fb-title">
                  {f.title}
                </text>
                <circle cx={f.x} cy={150} r={92} className={`fb-jacket ${f.jacket}`} />
                <circle cx={f.x} cy={150} r={62} className="fb-clad" />
                <circle cx={f.x} cy={150} r={(f.core / 125) * 62} className="fb-core fb-pulse" />
                <text x={f.x} y={262} textAnchor="middle" className="fb-label">
                  {f.note}
                </text>
                <text x={f.x + 100} y={84} className="fb-small">
                  cladding 125 µm
                </text>
              </g>
            ))}
            <rect x={60} y={300} width={420} height={120} rx="12" className="fb-pipe" />
            <rect x={60} y={340} width={420} height={40} className="fb-pipe-core" />
            {[0, 1, 2].map((k) => (
              <path key={k} d="M60 360 L130 342 L200 378 L270 342 L340 378 L410 342 L480 360" className="fb-light is-mode" style={d(k * 0.45)} />
            ))}
            <text x={270} y={448} textAnchor="middle" className="fb-label">
              many paths (modes) bounce through the wide core
            </text>
            <rect x={520} y={300} width={420} height={120} rx="12" className="fb-pipe" />
            <rect x={520} y={354} width={420} height={12} className="fb-pipe-core" />
            <path d="M520 360 H940" className="fb-light" />
            <text x={730} y={448} textAnchor="middle" className="fb-label">
              one path through a thin core: it goes far
            </text>
          </>
        )}
        {scene === 'colors' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              The jacket colour tells you the fibre
            </text>
            {[
              ['OS2', 'single-mode', 'is-yellow', '1310 / 1550 nm', '10 km and more'],
              ['OM3', 'multimode 50 µm', 'is-aqua', '850 nm', '25G: 70 m · 10G: 300 m'],
              ['OM4', 'multimode 50 µm', 'is-violet', '850 nm', '25G: 100 m · 10G: 400 m'],
              ['OM5', 'multimode, wideband', 'is-lime', '850-950 nm', 'like OM4, plus SWDM'],
              ['OM1 / OM2', 'legacy multimode', 'is-orange', '850 nm', 'old, do not mix'],
            ].map(([n, kind, tone, wl, reach], i) => (
              <g key={n} className="fb-in" style={d(i * 0.2)}>
                <rect x={80} y={72 + i * 76} width={300} height={22} rx="11" className={`fb-cable ${tone}`} />
                <text x={400} y={89 + i * 76} className="fb-strong">
                  {n}
                </text>
                <text x={510} y={89 + i * 76} className="fb-label">
                  {kind}
                </text>
                <text x={700} y={80 + i * 76} className="fb-small">
                  {wl}
                </text>
                <text x={700} y={100 + i * 76} className="fb-small">
                  {reach}
                </text>
              </g>
            ))}
            <text x={500} y={466} textAnchor="middle" className="fb-label">
              OM4 is aqua in many places and violet (erika) in Europe. Read the print on the jacket to be sure.
            </text>
          </>
        )}
        {scene === 'connectors' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              Connectors: LC, SC, MPO; blue UPC, green APC
            </text>
            {/* LC duplex */}
            <g className="fb-in">
              <rect x={110} y={120} width={36} height={90} rx="5" className="fb-boot is-upc" />
              <rect x={156} y={120} width={36} height={90} rx="5" className="fb-boot is-upc" />
              <rect x={104} y={110} width={94} height={18} rx="4" className="fb-clip" />
              <rect x={122} y={210} width={12} height={30} className="fb-ferrule" />
              <rect x={168} y={210} width={12} height={30} className="fb-ferrule" />
              <text x={151} y={280} textAnchor="middle" className="fb-strong">
                LC duplex
              </text>
              <text x={151} y={302} textAnchor="middle" className="fb-small">
                1.25 mm ferrule
              </text>
              <text x={151} y={320} textAnchor="middle" className="fb-small">
                SFP / QSFP LR, SR
              </text>
            </g>
            {/* SC */}
            <g className="fb-in" style={d(0.3)}>
              <rect x={340} y={110} width={64} height={100} rx="6" className="fb-boot is-upc" />
              <rect x={364} y={210} width={16} height={30} className="fb-ferrule" />
              <text x={372} y={280} textAnchor="middle" className="fb-strong">
                SC
              </text>
              <text x={372} y={302} textAnchor="middle" className="fb-small">
                2.5 mm ferrule, push-pull
              </text>
              <text x={372} y={320} textAnchor="middle" className="fb-small">
                older panels, carriers
              </text>
            </g>
            {/* MPO */}
            <g className="fb-in" style={d(0.6)}>
              <rect x={540} y={110} width={150} height={100} rx="8" className="fb-boot is-mpo" />
              <rect x={555} y={210} width={120} height={22} rx="3" className="fb-ferrule" />
              {Array.from({ length: 12 }, (_, i) => (
                <circle key={i} cx={562 + i * 9.6} cy={221} r="3" className={`fb-fibre${i < 4 ? ' is-tx' : i >= 8 ? ' is-rx' : ''}`} />
              ))}
              <rect x={605} y={98} width={20} height={12} className="fb-key" />
              <text x={615} y={280} textAnchor="middle" className="fb-strong">
                MPO-12
              </text>
              <text x={615} y={302} textAnchor="middle" className="fb-small">
                12 fibres in one ferrule, a key on top
              </text>
              <text x={615} y={320} textAnchor="middle" className="fb-small">
                100G-SR4, trunks between rows
              </text>
            </g>
            {/* UPC vs APC */}
            <g className="fb-in" style={d(0.9)}>
              <rect x={790} y={120} width={40} height={90} rx="5" className="fb-boot is-upc" />
              <rect x={850} y={120} width={40} height={90} rx="5" className="fb-boot is-apc" />
              <path d="M803 210 h14 v30 h-14z" className="fb-ferrule" />
              <path d="M863 210 h14 v26 l-14 6z" className="fb-ferrule" />
              <text x={840} y={280} textAnchor="middle" className="fb-strong">
                UPC · APC
              </text>
              <text x={840} y={302} textAnchor="middle" className="fb-small">
                APC end face is cut at 8°
              </text>
              <text x={840} y={320} textAnchor="middle" className="fb-bad">
                never mate APC with UPC
              </text>
            </g>
            <text x={500} y={420} textAnchor="middle" className="fb-label">
              Boot colour: blue = UPC single-mode, beige or aqua = multimode, green = APC.
            </text>
          </>
        )}
        {scene === 'optics' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              The module in the port decides the cable
            </text>
            {[
              ['SFP28 SR', '25G · 850 nm · MM', 'LC duplex, OM3/OM4', 'is-aqua'],
              ['SFP28 LR', '25G · 1310 nm · SM', 'LC duplex, OS2, 10 km', 'is-yellow'],
              ['QSFP28 SR4', '100G · 4 × 25G · MM', 'MPO-12 (8 fibres), OM4 100 m', 'is-aqua'],
              ['QSFP28 LR4', '100G · 4 colours · SM', 'LC duplex, OS2, 10 km', 'is-yellow'],
              ['DAC', 'copper twinax, passive', 'fixed ends, ~1-3 m, in the rack', 'is-copper'],
              ['AOC', 'optics built into the cable', 'fixed ends, up to ~30-100 m', 'is-aqua'],
            ].map(([n, a, b, tone], i) => {
              const x = 90 + (i % 3) * 290
              const y = 80 + Math.floor(i / 3) * 190
              return (
                <g key={n} className="fb-in" style={d(i * 0.15)}>
                  <rect x={x + 4} y={y + 4} width={240} height={150} rx="12" className="fb-shadow" />
                  <rect x={x} y={y} width={240} height={150} rx="12" className="fb-card" />
                  <rect x={x + 20} y={y + 24} width={90} height={34} rx="5" className="fb-optic" />
                  <rect x={x + 110} y={y + 33} width={110} height={16} rx="8" className={`fb-cable ${tone}`} />
                  <text x={x + 20} y={y + 88} className="fb-strong">
                    {n}
                  </text>
                  <text x={x + 20} y={y + 110} className="fb-small">
                    {a}
                  </text>
                  <text x={x + 20} y={y + 130} className="fb-small">
                    {b}
                  </text>
                </g>
              )
            })}
          </>
        )}
        {scene === 'reach' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              Which link where?
            </text>
            {[
              ['In the rack, server to top-of-rack switch', '≤ 3 m', 'DAC (or AOC)', 90],
              ['Rack to rack, same row', '5-30 m', 'AOC, or SR + OM4', 170],
              ['Across the hall, row to spine', '≤ 100 m', 'SR + OM4, MPO trunks', 250],
              ['Another building, carrier hand-off', 'km', 'LR + OS2 single-mode', 330],
            ].map(([w, dist, pick, y], i) => (
              <g key={w as string} className="fb-in" style={d(i * 0.3)}>
                <rect x={60} y={(y as number) - 30} width={880} height={56} rx="10" className="fb-card" />
                <text x={80} y={(y as number) + 4} className="fb-label">
                  {w}
                </text>
                <rect x={470} y={(y as number) - 8} width={(i + 1) * 45} height={14} rx="7" className={`fb-cable ${i === 0 ? 'is-copper' : i === 3 ? 'is-yellow' : 'is-aqua'}`} />
                <text x={700} y={(y as number) - 4} className="fb-strong">
                  {pick}
                </text>
                <text x={700} y={(y as number) + 16} className="fb-small">
                  {dist}
                </text>
              </g>
            ))}
            <text x={500} y={420} textAnchor="middle" className="fb-label">
              Both ends must match: same speed, same wavelength, same fibre type.
            </text>
          </>
        )}
        {(scene === 'txrx' || scene === 'wrong' || scene === 'flip') && (
          <>
            <Optic x={120} y={150} label="server be0 · SFP28 SR" />
            <Optic x={760} y={150} label="switch eth1/9 · SFP28 SR" flip />
            <Strand d="M250 170 C 450 170, 550 210, 750 210" dark={scene === 'wrong'} />
            <Strand d="M250 200 C 450 200, 550 160, 750 160" dark={scene === 'wrong'} />
            {scene === 'wrong' ? (
              <>
                <path d="M250 170 H750" className="fb-strand is-bad" />
                <path d="M250 200 H750" className="fb-strand is-bad" />
                <text x={500} y={140} textAnchor="middle" className="fb-bad">
                  straight cord: TX meets TX, RX meets RX
                </text>
              </>
            ) : (
              <text x={500} y={140} textAnchor="middle" className="fb-ok">
                TX on one end lands on RX on the other
              </text>
            )}
            <Term
              x={120}
              y={300}
              w={760}
              lines={
                scene === 'wrong'
                  ? ['$ ethtool be0 | grep Link', '!	Link detected: no', '$ ethtool -m be0 | grep -i "receiver signal"', '!	Receiver signal average optical power : 0.0000 mW / -inf dBm']
                  : ['$ ethtool be0 | grep Link', '+	Link detected: yes', '$ ethtool -m be0 | grep -i "receiver signal"', '+	Receiver signal average optical power : 0.6310 mW / -2.00 dBm']
              }
            />
          </>
        )}
        {scene === 'panels' && (
          <>
            <text x={500} y={36} textAnchor="middle" className="fb-title">
              End to end, the path must cross an odd number of times
            </text>
            {[
              { y: 90, flips: [true, false, false], ok: true, label: '1 flip' },
              { y: 230, flips: [true, true, false], ok: false, label: '2 flips' },
              { y: 370, flips: [true, true, true], ok: true, label: '3 flips' },
            ].map((row, i) => (
              <g key={i} className="fb-in" style={d(i * 0.3)}>
                <rect x={40} y={row.y} width={90} height={60} rx="8" className="fb-optic" />
                <text x={85} y={row.y + 36} textAnchor="middle" className="fb-small">
                  server
                </text>
                {['patch cord', 'trunk', 'patch cord'].map((n, k) => {
                  const x0 = 160 + k * 230
                  const flip = row.flips[k]
                  return (
                    <g key={k}>
                      <path d={flip ? `M${x0} ${row.y + 18} L${x0 + 170} ${row.y + 42}` : `M${x0} ${row.y + 18} L${x0 + 170} ${row.y + 18}`} className="fb-strand" />
                      <path d={flip ? `M${x0} ${row.y + 42} L${x0 + 170} ${row.y + 18}` : `M${x0} ${row.y + 42} L${x0 + 170} ${row.y + 42}`} className="fb-strand" />
                      <text x={x0 + 85} y={row.y + 72} textAnchor="middle" className="fb-small">
                        {n} {flip ? '(A-B)' : '(A-A)'}
                      </text>
                      {k < 2 && <rect x={x0 + 178} y={row.y - 4} width={44} height={68} rx="4" className="fb-panel" />}
                    </g>
                  )
                })}
                <rect x={860} y={row.y} width={90} height={60} rx="8" className="fb-optic" />
                <text x={905} y={row.y + 36} textAnchor="middle" className="fb-small">
                  switch
                </text>
                <text x={500} y={row.y - 10} textAnchor="middle" className={row.ok ? 'fb-ok' : 'fb-bad'}>
                  {row.label}: {row.ok ? 'TX meets RX, link up' : 'TX meets TX, dark'}
                </text>
              </g>
            ))}
          </>
        )}
        {scene === 'vfl' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              A visual fault locator shows which strand is which
            </text>
            <rect x={80} y={150} width={140} height={60} rx="10" className="fb-optic" />
            <text x={150} y={186} textAnchor="middle" className="fb-small">
              red laser 650 nm
            </text>
            <path d="M220 180 C 400 120, 600 260, 780 170" className="fb-strand" />
            <path d="M220 180 C 400 120, 600 260, 780 170" className="fb-red" />
            <path d="M220 200 C 400 260, 600 120, 780 230" className="fb-strand" />
            <rect x={780} y={150} width={120} height={100} rx="10" className="fb-panel" />
            <circle cx={820} cy={172} r="9" className="fb-glow" />
            <circle cx={820} cy={230} r="9" className="fb-dot-off" />
            <text x={840} y={300} textAnchor="middle" className="fb-label">
              the lit strand glows at the far end
            </text>
            <text x={500} y={380} textAnchor="middle" className="fb-label">
              Also finds breaks and tight bends: red light leaks out where the fibre is damaged.
            </text>
            <text x={500} y={410} textAnchor="middle" className="fb-bad">
              Never look into a fibre or a port: 850 and 1310 nm laser light is invisible.
            </text>
          </>
        )}
        {scene === 'mpo' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-title">
              100G-SR4 over MPO: 4 fibres send, 4 receive
            </text>
            {[0, 1].map((side) => (
              <g key={side}>
                <rect x={side ? 700 : 120} y={110} width={180} height={50} rx="6" className="fb-ferrule" />
                {Array.from({ length: 12 }, (_, i) => (
                  <g key={i}>
                    <circle cx={(side ? 708 : 128) + i * 14.5} cy={135} r="5" className={`fb-fibre${(side ? i >= 8 : i < 4) ? ' is-tx' : (side ? i < 4 : i >= 8) ? ' is-rx' : ''}`} />
                    <text x={(side ? 708 : 128) + i * 14.5} y={180} textAnchor="middle" className="fb-tiny">
                      {i + 1}
                    </text>
                  </g>
                ))}
                <text x={side ? 790 : 210} y={96} textAnchor="middle" className="fb-label">
                  {side ? 'far end (seen from the front)' : 'transceiver: TX 1-4, RX 9-12'}
                </text>
              </g>
            ))}
            {[0, 1, 2, 3].map((k) => (
              <path key={k} d={`M${128 + k * 14.5} 160 C 300 ${260 + k * 10}, 600 ${260 + k * 10}, ${708 + (11 - k) * 14.5} 160`} className="fb-light" style={d(k * 0.15)} />
            ))}
            <text x={500} y={340} textAnchor="middle" className="fb-label">
              A type-B trunk flips the order: fibre 1 lands on 12, 4 on 9, so every TX meets an RX.
            </text>
            <text x={500} y={366} textAnchor="middle" className="fb-label">
              Fibres 5 to 8 are dark. Keys up or down and the trunk type must match the design.
            </text>
          </>
        )}
        {scene === 'dom' && (
          <>
            <Term
              x={60}
              y={50}
              w={880}
              lines={[
                '$ ethtool -m be0',
                '	Identifier                    : 0x03 (SFP)',
                '	Transceiver type              : Ethernet: 25GBASE-SR',
                '	Laser wavelength              : 850nm',
                '	Laser output power            : 0.7943 mW / -1.00 dBm',
                '!	Receiver signal average optical power : 0.0661 mW / -11.80 dBm',
                '	Laser rx power low warning threshold  : 0.0912 mW / -10.40 dBm',
                '$ ip -s link show be0 | grep -A1 RX',
                '!	RX: bytes  packets  errors  dropped ...       errors: 1834 (CRC)',
              ]}
            />
            <text x={500} y={300} textAnchor="middle" className="fb-label">
              Every SFP and QSFP reports its own light levels (DOM / DDM): the switch shows the same.
            </text>
            <text x={500} y={330} textAnchor="middle" className="fb-bad">
              Rx -11.8 dBm is under the warning threshold, and CRC errors climb: too little light arrives.
            </text>
          </>
        )}
        {scene === 'budget' && (
          <>
            <text x={500} y={46} textAnchor="middle" className="fb-title">
              Loss budget: 25GBASE-SR on OM4 allows about 1.9 dB
            </text>
            <text x={60} y={120} className="fb-label">
              Clean link: 60 m of OM4 + 2 connector pairs
            </text>
            <Bar x={60} y={140} w={880} max={3} limit={1.9} parts={[['fibre 0.2', 0.2, 'aqua'], ['pair 0.35', 0.35, 'slate'], ['pair 0.35', 0.35, 'slate']]} />
            <text x={60} y={250} className="fb-label">
              Same link, one dirty connector
            </text>
            <Bar x={60} y={270} w={880} max={3} limit={1.9} parts={[['fibre 0.2', 0.2, 'aqua'], ['pair 0.35', 0.35, 'slate'], ['dirty pair 1.8 dB', 1.8, 'bad']]} />
            <text x={60 + (1.9 / 3) * 880} y={360} textAnchor="middle" className="fb-bad">
              budget
            </text>
            <text x={500} y={420} textAnchor="middle" className="fb-label">
              Fibre itself loses ~3 dB per km at 850 nm. Connectors and dirt are what break short links.
            </text>
          </>
        )}
        {(scene === 'scope' || scene === 'clean') && (
          <>
            {[
              { x: 280, dirty: true, label: scene === 'scope' ? 'Before: dust and an oil smear' : 'Before cleaning' },
              { x: 720, dirty: false, label: 'After: clean core and cladding' },
            ].map((s, i) => (
              <g key={s.x} className="fb-in" style={d(i * (scene === 'clean' ? 1.2 : 0.3))}>
                <circle cx={s.x} cy={200} r={140} className="fb-scope" />
                <circle cx={s.x} cy={200} r={110} className="fb-zone" />
                <circle cx={s.x} cy={200} r={62} className="fb-clad-face" />
                <circle cx={s.x} cy={200} r={14} className="fb-core-face" />
                {s.dirty && (
                  <g className="fb-dirt">
                    <circle cx={s.x - 30} cy={180} r="9" />
                    <circle cx={s.x + 8} cy={196} r="5" />
                    <circle cx={s.x + 40} cy={228} r="12" />
                    <ellipse cx={s.x - 10} cy={240} rx="34" ry="10" className="fb-smear" />
                  </g>
                )}
                <text x={s.x} y={380} textAnchor="middle" className={s.dirty ? 'fb-bad' : 'fb-ok'}>
                  {s.label}
                </text>
              </g>
            ))}
            {scene === 'clean' && <path d="M380 200 C 450 120, 550 120, 620 200" className="fb-arrow" markerEnd="url(#fb-head)" />}
            {scene === 'clean' && (
              <text x={500} y={36} textAnchor="middle" className="fb-strong">
                one-click cleaner: push, click, inspect again
              </text>
            )}
            <defs>
              <marker id="fb-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 L10 5 L0 10z" className="fb-head" />
              </marker>
            </defs>
            <text x={500} y={440} textAnchor="middle" className="fb-label">
              {scene === 'scope' ? 'An inspection scope shows the end face. Zones: core, cladding, contact.' : 'Clean both sides: the cord end and the port or bulkhead it goes into.'}
            </text>
          </>
        )}
        {scene === 'retest' && (
          <Term
            x={60}
            y={70}
            w={880}
            lines={[
              '$ ethtool -m be0 | grep -i "receiver signal"',
              '+	Receiver signal average optical power : 0.5495 mW / -2.60 dBm',
              '$ ip -s link show be0 | grep -A1 RX     # read now, again after the test',
              '+	RX errors before: 1834   after 10 minutes of iperf3: 1834   (no new errors)',
              '$ ethtool be0 | grep -E "Speed|Link"',
              '+	Speed: 25000Mb/s',
              '+	Link detected: yes',
            ]}
          />
        )}
      </svg>
    </div>
  )
}

const M = [
  { id: 'link', label: 'Link', start: '-' },
  { id: 'rx', label: 'Rx power', start: '-' },
]

export const FIBER_BASICS: StageLesson<FiberStep> = {
  Stage: FiberStage,
  intro: [
    'Most of a data center technician\'s day is cables: patching new servers, moving links, fixing the ones that stay dark. This lesson is what is inside a fibre, how to read it from the outside, and which module and cable belong together.',
  ],
  legend: [
    ['Fibre', 'Glass that carries light: a core inside a cladding, in a coloured jacket'],
    ['Optic', 'The transceiver module in the port that turns signals into light and back'],
    ['DAC', 'Direct-attach copper cable with the modules built on'],
  ],
  steps: [
    { scene: 'cross', short: 'Inside', title: 'Multimode and single-mode', explain: ['Both have the same 125 µm cladding. Multimode has a wide 50 µm core: light takes many paths (modes) and spreads, so it reaches about 100 to 400 m, with cheaper 850 nm optics.', 'Single-mode has a 9 µm core: one path, little spreading, kilometres of reach with 1310 or 1550 nm lasers.'], key: 'Multimode for short links inside a hall; single-mode for long ones.' },
    { scene: 'colors', short: 'Colours', title: 'Read the jacket', tag: 'technique', explain: ['The colour is the first clue: yellow single-mode, aqua or violet OM3/OM4, lime OM5, orange for old OM1/OM2. The text printed on the jacket is the proof: type, core size, sometimes the length.', 'Reach depends on speed: OM4 carries 10G about 400 m, but 25G only about 100 m.'], key: 'Yellow = single-mode. Aqua / violet = multimode.' },
    { scene: 'connectors', short: 'Connectors', title: 'LC, SC, MPO, and the end face', explain: ['LC duplex is the everyday connector on SFP and QSFP optics. SC is the older, bigger one, often on carrier panels. MPO carries 12 (or 16) fibres in one ferrule for parallel optics and trunks.', 'The end face is polished flat (UPC) or at 8° (APC, green). Mating APC with UPC leaves an air gap and damages both.'], key: 'Never mate a green APC connector with a UPC one.' },
    { scene: 'optics', short: 'Optics', title: 'The module decides the cable', tag: 'technique', explain: ['SR modules are short reach: 850 nm on multimode. LR modules are long reach: 1310 nm on single-mode. SR4 runs 4 lanes over MPO; LR4 sends 4 colours over one LC pair.', 'DAC and AOC cables have the modules fixed on the ends: nothing to clean, one part to swap.'], key: 'SR → multimode, LR → single-mode. The label on the module says which.' },
    { scene: 'reach', short: 'Which where', title: 'Picking the link for the distance', tag: 'result', explain: ['Inside the rack: DAC, cheap and power-efficient. Between racks: AOC or SR optics on OM4. Across the hall: SR optics on OM4, often through MPO trunks and patch panels. To another building or a carrier: LR on single-mode.', 'Both ends must match in speed, wavelength and fibre type, and the switch must support the module.'], key: 'Distance picks the medium; both ends must match.' },
  ],
}

export const FIBER_POLARITY: StageLesson<FiberStep> = {
  Stage: FiberStage,
  metrics: M,
  intro: ['The most common reason a new fibre link stays dark is not a broken part: it is polarity, the transmit fibre landing on a transmit port. This lesson shows why, how to see it, and how it works through patch panels and MPO trunks.'],
  legend: [
    ['TX / RX', 'Transmit and receive: every duplex optic has one of each'],
    ['A-B cord', 'A duplex patch cord that crosses: A on one end, B on the other'],
  ],
  steps: [
    { scene: 'txrx', short: 'TX to RX', title: 'Light must cross over', explain: ['Each optic sends on TX and listens on RX. One fibre carries the server\'s TX to the switch\'s RX, the other the switch\'s TX to the server\'s RX.', 'A standard duplex patch cord (A-B) crosses by design, so a direct link works when plugged in.'], key: 'Every working link: TX meets RX at the other end.', m: { link: 'up', rx: '-2.0 dBm' } },
    { scene: 'wrong', short: 'Dark link', title: 'Straight through: no light arrives', tag: 'event', explain: ['With a straight path (A-A), both TX fibres arrive at the other TX: nothing reaches either receiver. Link down, and the optic reports no received light at all: -inf or about -40 dBm.', 'A dead optic shows the same symptom, so check the light first: no light at all points to polarity or the wrong strand; weak light points to dirt or damage.'], key: 'No receive light at all, on a new link: suspect polarity first.', m: { link: 'down', rx: '-inf dBm' } },
    { scene: 'flip', short: 'Flip it', title: 'Swap the pair in the clip', tag: 'action', explain: ['Most LC duplex clips open so the two connectors can swap places. Swap them at one end only, plug back in, and the link comes up.', 'Write down what you changed: if one end of a structured link needed a flip, the documentation or a cord type is wrong somewhere.'], m: { link: 'up', rx: '-2.0 dBm' } },
    { scene: 'panels', short: 'Through panels', title: 'Polarity through patch panels and a trunk', explain: ['In a data hall a link rarely is one cord: patch cord, panel, trunk, panel, patch cord. Each piece either crosses or not. End to end, the total must cross an odd number of times.', 'That is why sites standardise one polarity method and one cord type, and why "just add a cord" can break a link that worked.'], key: 'Count the crossings: odd works, even is dark.' },
    { scene: 'vfl', short: 'Locator', title: 'Find the strand with red light', tag: 'technique', explain: ['A visual fault locator shines visible red light into one fibre. At the far panel the lit strand glows, which tells you which port is which, and red leaking out of a cord shows a break or a bend that is too tight.', 'For the real light level, use the optic\'s own readings or an optical power meter.'], key: 'Red light to trace, power readings to judge.' },
    { scene: 'mpo', short: 'MPO lanes', title: '100G-SR4: eight fibres in a twelve-fibre plug', explain: ['An SR4 optic sends on fibres 1 to 4 and receives on 9 to 12; 5 to 8 stay dark. A type-B trunk reverses the order so fibre 1 arrives at position 12, and every lane meets a receiver.', 'Mix trunk types or key orientation and some or all lanes stay dark. The site\'s design document says which.'], key: 'MPO polarity is the same rule: every TX lane must land on an RX lane.' },
  ],
}

export const FIBER_CLEAN: StageLesson<FiberStep> = {
  Stage: FiberStage,
  metrics: M,
  intro: ['Weak light is the other classic: the link is up but errors climb, or it flaps. Most of the time the cause is a dirty connector. This lesson reads the light level, explains the loss budget, then inspects, cleans and proves the fix.'],
  legend: [
    ['dBm', 'Optical power on a log scale: 0 dBm = 1 mW, -10 dBm = 0.1 mW'],
    ['dB', 'A loss: every 3 dB halves the light'],
    ['DOM', 'Digital optical monitoring: the optic reports its temperature, voltage and light levels'],
  ],
  steps: [
    { scene: 'dom', short: 'Read the light', title: 'The optic tells you how much light arrives', tag: 'action', explain: ['ethtool -m on the server (or show interface transceiver on the switch) reads the module: transmitted power, received power, and the alarm and warning thresholds.', 'Here the receiver gets -11.8 dBm, under its -10.4 dBm warning, and CRC errors climb. The link is up but sick.'], key: 'Errors on an up link: read the receive power before anything else.', m: { link: 'up, CRC errors', rx: '-11.8 dBm' } },
    { scene: 'budget', short: 'Budget', title: 'Where the light goes', explain: ['Every optic pair has a power budget: how much loss the channel may have. Short-reach 25G on OM4 allows about 1.9 dB in total.', 'Fibre itself costs little over 60 m. A clean connector pair costs a few tenths of a dB; one dirty pair can eat the whole budget by itself.'], key: 'On short links, connectors and dirt use up the budget, not the fibre.' },
    { scene: 'scope', short: 'Inspect', title: 'Look at the end face with a scope', tag: 'technique', explain: ['An inspection scope (handheld or on a probe) magnifies the end face. Dust, oil from a finger or a scratch near the core blocks light and can damage the opposite end face when mated.', 'Inspect before you connect, every time, including new cords: dust caps are not a guarantee.'], key: 'Inspect before you connect.' },
    { scene: 'clean', short: 'Clean', title: 'Clean, then inspect again', tag: 'action', explain: ['Dry clean first with a one-click cleaner (for ports and bulkheads) or a cleaning cassette (for cord ends). Inspect again; only if it is still dirty, a wet-dry clean.', 'Clean both sides of the connection: a clean cord in a dirty port is dirty again. Never blow into a connector, and never touch the end face.'], key: 'Both ends, dry first, inspect again.' },
    { scene: 'retest', short: 'Prove it', title: 'Retest and read the counters', tag: 'result', explain: ['After cleaning, the receive power is back to -2.6 dBm. Read the error counters, run traffic for a while, read them again: no new errors.', 'Write the before and after values into the ticket: that is the evidence the fault is fixed, and the history if it comes back.'], key: 'Before and after values in the ticket: the proof of the fix.', m: { link: 'up, clean', rx: '-2.6 dBm' } },
  ],
}

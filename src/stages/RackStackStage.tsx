import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'
import { Arrow, Box, Caption, Mark, Person, Term, d } from './kit'

// Rack and stack: install one 2U server from the work order to the record in the DCIM.

type Scene = 'plan' | 'units' | 'cagenut' | 'rails' | 'lift' | 'power' | 'airflow' | 'cables' | 'record'
export interface RackStep extends StageStep {
  scene: Scene
}

const UPX = 105 // one U at the post scale: 1.75 in at 60 px per inch
const HOLES = [0.25, 0.875, 1.5] // hole centres inside a U, in inches from its bottom edge

function Post({ x, y, us, from }: { x: number; y: number; us: number; from: number }) {
  // A front post seen face on, `us` units tall, bottom unit number `from`.
  return (
    <g>
      <rect x={x} y={y} width={44} height={us * UPX} rx="3" className="rk-post" />
      {Array.from({ length: us }, (_, k) => {
        const bottom = y + (us - k) * UPX
        return (
          <g key={k}>
            {HOLES.map((h) => (
              <rect key={h} x={x + 15} y={bottom - h * 60 - 7} width={14} height={14} className="rk-hole" />
            ))}
            <line x1={x - 14} x2={x + 58} y1={bottom} y2={bottom} className="rk-ubound" />
            <text x={x - 20} y={bottom - UPX / 2 + 4} textAnchor="end" className="fb-small">
              U{from + k}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function RackStackStage({ steps, cur, replayKey }: StageProps<RackStep>) {
  const st = steps[Math.max(0, cur)]
  const s = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {s === 'plan' && (
          <>
            <rect x={70} y={30} width={230} height={420} rx="8" className="fb-panel" />
            {Array.from({ length: 21 }, (_, i) => {
              const u = 42 - i * 2
              const target = u === 22
              return (
                <g key={i}>
                  <rect x={110} y={40 + i * 19.5} width={170} height={17} rx="2" className={target ? 'rk-slot is-target' : u > 38 ? 'rk-slot is-net' : u < 22 && u > 8 ? 'rk-slot is-used' : 'rk-slot'} />
                  <text x={104} y={53 + i * 19.5} textAnchor="end" className="fb-tiny">
                    {u}
                  </text>
                </g>
              )
            })}
            <text x={195} y={471} textAnchor="middle" className="fb-tiny">
              rack C04, front elevation
            </text>
            <Box
              x={360}
              y={40}
              w={580}
              h={300}
              title="Work order W-3307: install one server"
              lines={['Model      RL-2S-2U, 28 kg: two people', 'Position   C04, U21-U22, front facing the cold aisle', 'Rails      sliding rail kit, in the box', 'Power      PSU1 -> PDU A outlet 21, PSU2 -> PDU B outlet 21', 'Network    p1 -> tor1 eth1/21, BMC -> mgmt1 port 21', 'Asset tag  AT-0047731, serial RL2611-021', '', 'Check the slot is free and the PDUs have room first.']}
              delay={0.3}
            />
            <text x={650} y={385} textAnchor="middle" className="fb-label fb-in" style={d(0.9)}>
              The elevation and the work order are the contract:
            </text>
            <text x={650} y={407} textAnchor="middle" className="fb-label fb-in" style={d(0.9)}>
              position, power ports and network ports are already decided.
            </text>
          </>
        )}

        {s === 'units' && (
          <>
            <Post x={200} y={60} us={3} from={20} />
            <g className="fb-in" style={d(0.6)}>
              <rect x={290} y={60} width={200} height={2 * UPX} rx="6" className="rk-server-face" />
              <text x={390} y={60 + UPX + 5} textAnchor="middle" className="fb-strong">
                2U server
              </text>
              <text x={390} y={60 + UPX + 25} textAnchor="middle" className="fb-tiny">
                U21 + U22
              </text>
            </g>
            <g className="fb-in" style={d(1.2)}>
              <path d={`M560 ${60 + 2 * UPX} v${UPX}`} className="rk-dim" />
              <text x={575} y={60 + 2.5 * UPX + 4} className="fb-small">
                1U = 44.45 mm (1.75 in)
              </text>
              <text x={575} y={60 + 2.5 * UPX + 24} className="fb-small">
                three holes per U
              </text>
              <text x={560} y={60 + 0.4 * UPX} className="fb-small">
                holes 5/8 in apart inside a U,
              </text>
              <text x={560} y={60 + 0.4 * UPX + 20} className="fb-small">
                1/2 in across the border to the next U
              </text>
            </g>
            <Caption y={440}>Count from the bottom, use the numbers printed on the post, and mark the same U on the front and the back posts.</Caption>
          </>
        )}

        {s === 'cagenut' && (
          <>
            <rect x={140} y={70} width={120} height={320} rx="4" className="rk-post" />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={180} y={110 + k * 100} width={40} height={40} className="rk-hole" />
            ))}
            <g className="rk-nut-in">
              <rect x={184} y={214} width={32} height={32} rx="3" className="rk-nut" />
              <circle cx={200} cy={230} r="9" className="rk-nut-thread" />
              <path d="M184 214 l-10 -6 M184 246 l-10 6 M216 214 l10 -6 M216 246 l10 6" className="rk-wing" />
            </g>
            <text x={200} y={420} textAnchor="middle" className="fb-small">
              M6 cage nut, square hole
            </text>
            <Box x={340} y={60} w={600} h={150} title="Cage nuts: for fixed gear" lines={['switches, patch panels, shelves, blanking panels with screws.', 'Hook one wing inside the hole, then lever the other in with', 'the cage nut tool. A screwdriver slips, into your fingers.']} tone="amber" delay={0.8} />
            <Box x={340} y={240} w={600} h={130} title="Tool-less rails: for most servers" lines={['their square pegs drop straight into the holes and latch:', 'no cage nuts. Read the rail kit\'s card; kits differ per vendor.']} tone="teal" delay={1.4} />
          </>
        )}

        {s === 'rails' && (
          <>
            <rect x={150} y={60} width={34} height={330} rx="3" className="rk-post" />
            <rect x={760} y={60} width={34} height={330} rx="3" className="rk-post" />
            <text x={167} y={50} textAnchor="middle" className="fb-tiny">
              front post
            </text>
            <text x={777} y={50} textAnchor="middle" className="fb-tiny">
              back post
            </text>
            <line x1={120} x2={830} y1={220} y2={220} className="rk-ubound" />
            <text x={112} y={224} textAnchor="end" className="fb-tiny">
              U21
            </text>
            <rect x={184} y={206} width={576} height={22} rx="4" className="rk-rail rk-stretch" />
            <rect x={184} y={210} width={300} height={14} rx="3" className="rk-rail-inner" />
            <g className="fb-in" style={d(1.6)}>
              <Mark x={167} y={190} ok />
              <Mark x={777} y={190} ok />
              <text x={470} y={262} textAnchor="middle" className="fb-small">
                outer rail: same U front and back,
              </text>
              <text x={470} y={282} textAnchor="middle" className="fb-small">
                depth set to the rack, both latches clicked
              </text>
            </g>
            <g className="fb-in" style={d(2.2)}>
              <rect x={260} y={320} width={420} height={60} rx="6" className="sw-chassis" />
              <rect x={270} y={312} width={400} height={10} rx="3" className="rk-rail-inner" />
              <text x={470} y={356} textAnchor="middle" className="fb-small">
                inner rail on each side of the server, pins in the keyholes
              </text>
            </g>
            <Caption y={440}>A rail one hole lower at the back looks fine until the server jams halfway in.</Caption>
          </>
        )}

        {s === 'lift' && (
          <>
            <rect x={420} y={80} width={34} height={300} rx="3" className="rk-post" />
            <rect x={880} y={80} width={34} height={300} rx="3" className="rk-post" />
            <rect x={454} y={206} width={426} height={22} rx="4" className="rk-rail" />
            <g className="rk-slide">
              <rect x={60} y={180} width={420} height={70} rx="6" className="sw-chassis" />
              <rect x={70} y={210} width={400} height={12} rx="3" className="rk-rail-inner" />
              <text x={270} y={206} textAnchor="middle" className="fb-small">
                2U server
              </text>
            </g>
            <g className="rk-lifters">
              <Person x={90} y={340} tone="blue" />
              <Person x={150} y={340} tone="amber" />
            </g>
            <Box x={40} y={390} w={920} h={70} lines={['line the inner rails up with the outer rails, slide in until the safety latch clicks,', 'press the release tabs, push home, tighten the front thumbscrews']} delay={2.4} />
          </>
        )}

        {s === 'power' && (
          <>
            <rect x={110} y={40} width={50} height={400} rx="6" className="sf-pdu" />
            <rect x={840} y={40} width={50} height={400} rx="6" className="sf-pdu" />
            <text x={135} y={32} textAnchor="middle" className="fb-strong">
              PDU A
            </text>
            <text x={865} y={32} textAnchor="middle" className="fb-strong">
              PDU B
            </text>
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i}>
                <rect x={121} y={70 + i * 30} width={28} height={16} rx="3" className={`sf-outlet${i === 6 ? ' is-used' : ''}`} />
                <rect x={851} y={70 + i * 30} width={28} height={16} rx="3" className={`sf-outlet${i === 6 ? ' is-used' : ''}`} />
              </g>
            ))}
            <rect x={260} y={190} width={480} height={110} rx="8" className="sw-chassis" />
            <text x={500} y={182} textAnchor="middle" className="fb-label">
              back of the server
            </text>
            <rect x={280} y={210} width={130} height={70} rx="5" className="sw-psu" />
            <rect x={590} y={210} width={130} height={70} rx="5" className="sw-psu" />
            <text x={345} y={250} textAnchor="middle" className="fb-small">
              PSU1
            </text>
            <text x={655} y={250} textAnchor="middle" className="fb-small">
              PSU2
            </text>
            <path d="M290 245 C 220 245 200 258 149 258" className="rk-cord is-a" />
            <path d="M710 245 C 780 245 800 258 851 258" className="rk-cord is-b" />
            <circle cx={395} cy={222} r="5" className="sw-led-ok fb-in" style={d(1.2)} />
            <circle cx={705} cy={222} r="5" className="sw-led-ok fb-in" style={d(1.4)} />
            <Box x={260} y={320} w={480} h={110} title="Plugs" lines={['C14 inlet on the PSU, C13 on the cord (10 A)', 'GPU servers: C20 inlet, C19 cord (16 A)', 'retention clips on, cords clear of the PSU latch']} tone="plain" delay={0.8} />
            <Caption y={472} tone="bad" delay={1.8}>
              Never both cords into one PDU: when that feed goes down, the server goes with it.
            </Caption>
          </>
        )}

        {s === 'airflow' && (
          <>
            <rect x={40} y={50} width={250} height={340} rx="8" className="sf-cold" />
            <rect x={710} y={50} width={250} height={340} rx="8" className="sf-hot" />
            <text x={165} y={80} textAnchor="middle" className="fb-strong">
              cold aisle
            </text>
            <text x={835} y={80} textAnchor="middle" className="fb-strong">
              hot aisle
            </text>
            <rect x={330} y={60} width={340} height={320} rx="6" className="sf-rack" />
            {[0, 1, 2, 4, 5].map((i) => (
              <rect key={i} x={340} y={74 + i * 52} width={320} height={42} rx="4" className="sw-chassis" />
            ))}
            {[0, 1, 2, 4, 5].map((i) => (
              <path key={i} d={`M220 ${95 + i * 52} H800`} className="rk-air is-cold" />
            ))}
            <rect x={340} y={230} width={320} height={42} rx="4" className="rk-blank fb-in" style={d(2.6)} />
            <path d="M790 262 C 740 262 720 251 660 251 L 340 251 C 300 251 290 272 250 272" className="rk-air is-hot rk-recirc" />
            <text x={500} y={420} textAnchor="middle" className="fb-small">
              an empty U lets hot exhaust leak back to the front: the servers above and below breathe it
            </text>
            <Caption y={446} tone="ok" delay={2.8}>
              Blanking panel in: the loop is gone. Switches: pick port-side intake or exhaust fans to match how they face.
            </Caption>
          </>
        )}

        {s === 'cables' && (
          <>
            <text x={250} y={40} textAnchor="middle" className="fb-bad">
              spaghetti
            </text>
            <rect x={90} y={60} width={320} height={300} rx="6" className="sf-rack" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={100} y={80 + i * 66} width={300} height={44} rx="4" className="sw-chassis" />
            ))}
            {[0, 1, 2, 3, 4].map((k) => (
              <path key={k} d={`M${130 + k * 50} ${100 + k * 30} C ${300 - k * 30} ${200 + k * 20} ${110 + k * 40} ${250 - k * 10} ${380 - k * 20} ${330 - k * 40}`} className={`rk-mess is-${k % 3}`} />
            ))}
            <g className="fb-in" style={d(0.8)}>
              <text x={750} y={40} textAnchor="middle" className="fb-ok">
                dressed
              </text>
              <rect x={590} y={60} width={320} height={300} rx="6" className="sf-rack" />
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <rect x={600} y={80 + i * 66} width={300} height={44} rx="4" className="sw-chassis" />
                  <path d={`M640 ${102 + i * 66} H700 q12 0 12 12 v${10} q0 10 10 10 H870`} className="rk-neat is-1" />
                  <path d={`M780 ${96 + i * 66} H870`} className="rk-neat is-0" />
                </g>
              ))}
              <rect x={872} y={70} width={20} height={280} rx="4" className="cu-manager" />
              {[0, 1, 2, 3, 4].map((k) => (
                <rect key={k} x={868} y={90 + k * 56} width={28} height={8} rx="2" className="rk-velcro" />
              ))}
            </g>
            <Caption y={400}>To the side, velcro not tight zip ties, PSUs and fans clear, a service loop so the server can slide out.</Caption>
            <Caption y={426} delay={1.4}>
              Label both ends: C04-U21 p1 → C04-U42 tor1 eth1/21.
            </Caption>
          </>
        )}

        {s === 'record' && (
          <>
            <Box
              x={60}
              y={40}
              w={430}
              h={260}
              title="DCIM: asset AT-0047731"
              lines={['serial     RL2611-021', 'position   C04 U21-U22, front', 'power      A-21, B-21', 'network    tor1 eth1/21, mgmt1 21', 'photos     front, back', 'ticket     W-3307 done 14:52']}
              delay={0.2}
            />
            <Term
              x={530}
              y={40}
              w={420}
              delay={0.9}
              lines={['$ ipmitool -H 10.70.1.21 ... power on', '+Chassis Power Control: Up/On', '$ lldpctl p1 | grep -E "SysName|PortID"', '+  SysName: tor1', '+  PortID:  ifname eth1/21', '# matches the work order']}
            />
            <Mark x={560} y={230} ok delay={1.8} />
            <text x={580} y={235} className="fb-small fb-in" style={d(1.8)}>
              power, link and neighbour match the plan
            </text>
            <Arrow x1={545} y1={280} x2={575} y2={280} delay={2.2} />
            <text x={585} y={285} className="fb-small fb-in" style={d(2.2)}>
              then the BOM check and burn-in
            </text>
            <Caption y={420}>If the DCIM does not know the server is there, nobody else will find it again.</Caption>
          </>
        )}
      </svg>
    </div>
  )
}

export const RACK_STACK: StageLesson<RackStep> = {
  Stage: RackStackStage,
  metrics: [
    { id: 'pos', label: 'Position', start: 'C04 U21-U22' },
    { id: 'state', label: 'State', start: 'in the box' },
  ],
  intro: [
    '"Rack and stack" is the core install job: put a server in the right place in the rack, power it from two feeds, cable it, and record it. Step through one 2U server from the work order to the DCIM record.',
  ],
  legend: [
    ['U', 'Rack unit: 44.45 mm (1.75 in) of height'],
    ['Elevation', 'The drawing of what sits in which U of a rack'],
    ['C13 / C14', 'The common server power plug and inlet (C19 / C20 for 16 A)'],
    ['DCIM', 'Data center infrastructure management: the database of every rack, device, port and cable'],
  ],
  steps: [
    { scene: 'plan', short: 'Plan', title: 'Read the work order and the elevation', tag: 'action', explain: ['The work order and the rack elevation say exactly where the server goes, which PDU outlets it uses and which switch ports it connects to. Check before you start: the slot is free, the PDUs have room on their circuits, the parts and the rail kit are on site.', 'A 28 kg server is above most one-person limits: book a second person or the lift.'], key: 'The position, power ports and network ports are decided before you lift anything.', m: { state: 'planned' } },
    { scene: 'units', short: 'Units', title: 'Counting rack units', explain: ['A rack unit (U) is 44.45 mm high and holds three holes on each post. Inside a U the holes sit 5/8, 5/8 and then 1/2 inch apart, so the uneven spacing shows where one U ends and the next begins.', 'Count from the bottom, read the numbers printed on the post, and mark the same U on the front and the back posts.'], key: 'Same U on all four posts, counted from the bottom.', m: { state: 'U marked' } },
    { scene: 'cagenut', short: 'Cage nuts', title: 'Cage nuts or tool-less rails', explain: ['Square-hole posts take cage nuts: a nut in a spring cage that clips into the hole, for anything screwed in, like switches, patch panels and shelves. Use the cage nut tool, not a screwdriver.', 'Most server rail kits are tool-less: their pegs drop into the square holes and latch, no cage nuts needed.'], key: 'Cage nuts for fixed gear, tool-less rails for most servers.', m: { state: 'holes ready' } },
    { scene: 'rails', short: 'Rails', title: 'Fit the rails', tag: 'action', explain: ['The outer rails go on the rack posts at the same U at the front and the back, with the depth set to the rack. Both ends latch with a click. The inner rails go on the sides of the server.', 'A rail one hole off at the back looks fine until the server jams halfway in, or sits crooked and blocks its neighbour.'], key: 'Level rails, same U, both latches clicked.', m: { state: 'rails fitted' } },
    { scene: 'lift', short: 'Slide in', title: 'Lift and slide in', tag: 'action', explain: ['Two people (or the lift) line the inner rails up with the outer rails and slide the server in until the safety latch clicks. Press the release tabs, push it home and tighten the front thumbscrews, so it cannot slide out during transport or work in the next U.'], key: 'Two people, latch clicks, thumbscrews tight.', m: { state: 'in the rack' } },
    { scene: 'power', short: 'Power', title: 'Two PSUs, two feeds', tag: 'technique', explain: ['PSU1 goes to PDU A and PSU2 to PDU B: two separate feeds, so the server survives losing one. Servers use C14 inlets and C13 cords; big GPU servers use C20 inlets and C19 cords for 16 A.', 'Fit the retention clips, keep cords clear of the PSU latches, and check both PSU lights go green.'], key: 'One PSU per feed, never both on the same PDU.', m: { state: 'powered, A + B' } },
    { scene: 'airflow', short: 'Airflow', title: 'Front to back, and no gaps', tag: 'technique', explain: ['Servers take cold air in at the front and blow it out at the back, so the front faces the cold aisle. An empty U lets hot exhaust leak back to the front, and the servers next to it breathe their own heat.', 'Fill every empty U with a blanking panel. Switches often sit backwards in the rack, so they come with port-side intake or port-side exhaust fans: the right one depends on how the switch faces.'], key: 'Front in the cold aisle, blanking panels in every gap.', m: { state: 'airflow checked' } },
    { scene: 'cables', short: 'Cables', title: 'Cable and label', explain: ['Cables go to the side into the cable manager, held with velcro rather than tight zip ties, with the PSUs and the fan exhaust left clear. Leave a service loop so the server can slide out on its rails without unplugging.', 'Label both ends with where the cable comes from and where it goes, as the cabling plan says.'], key: 'Tidy, clear of PSUs, a service loop, labelled at both ends.', m: { state: 'cabled' } },
    { scene: 'record', short: 'Record', title: 'Record it and prove it', tag: 'result', explain: ['Update the DCIM: asset tag, serial, position, power and network ports, photos of the front and back. Then power on through the BMC and check the link and the LLDP neighbour against the work order.', 'Only then does the server go on to the BOM check and burn-in.'], key: 'The job ends in the DCIM, with proof that power and network match the plan.', m: { state: 'recorded' } },
  ],
}

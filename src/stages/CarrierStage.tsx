import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'
import { Arrow, Box, Caption, Mark, Term, d } from './kit'

// Carriers and cross-connects: one circuit from the LOA to the hand-over, then a loopback test.

type Scene = 'what' | 'order' | 'path' | 'run' | 'test' | 'demarc' | 'handover' | 'loop'
export interface XcStep extends StageStep {
  scene: Scene
}

/** The whole path, left to right: client router, cage panel, tray, MMR, carrier. */
function Path({ light, loop, cut }: { light?: 'ok' | 'carrier' | 'none'; loop?: boolean; cut?: boolean }) {
  return (
    <g>
      <rect x={30} y={120} width={250} height={200} rx="10" className="xc-cage" />
      <text x={155} y={110} textAnchor="middle" className="fb-label">
        client cage C12
      </text>
      <rect x={50} y={190} width={110} height={60} rx="6" className="xc-router" />
      <text x={105} y={225} textAnchor="middle" className="fb-tiny">
        client router
      </text>
      <rect x={200} y={170} width={50} height={100} rx="4" className="xc-panel" />
      <text x={225} y={290} textAnchor="middle" className="fb-tiny">
        CP-1
      </text>
      <rect x={560} y={100} width={220} height={240} rx="10" className="xc-mmr" />
      <text x={670} y={90} textAnchor="middle" className="fb-label">
        meet-me room MMR-1
      </text>
      <rect x={585} y={170} width={50} height={100} rx="4" className="xc-panel" />
      <text x={610} y={290} textAnchor="middle" className="fb-tiny">
        MP-3
      </text>
      <rect x={705} y={170} width={50} height={100} rx="4" className="xc-panel is-carrier" />
      <text x={730} y={290} textAnchor="middle" className="fb-tiny">
        PP-14
      </text>
      <rect x={820} y={120} width={150} height={200} rx="10" className="xc-carrier" />
      <text x={895} y={110} textAnchor="middle" className="fb-label">
        carrier
      </text>
      <rect x={840} y={190} width={110} height={60} rx="6" className="xc-router is-carrier" />
      <text x={895} y={225} textAnchor="middle" className="fb-tiny">
        carrier router
      </text>
      <path d="M160 220 H200" className="fb-strand" />
      <path d="M250 220 H300 V60 H520 V220 H585" className="fb-strand" />
      <path d="M635 220 H705" className="fb-strand" />
      <path d="M755 220 H840" className="fb-strand" />
      <text x={410} y={52} textAnchor="middle" className="fb-tiny">
        overhead tray, zone trunk Z3
      </text>
      {cut && <path d="M640 205 l60 30 M640 235 l60 -30" className="xc-cut" />}
      {light === 'ok' && <path d="M160 220 H200 M250 220 H300 V60 H520 V220 H585 M635 220 H705 M755 220 H840" className="fb-light" />}
      {light === 'carrier' && <path d="M840 224 H755" className="fb-light" />}
      {loop && (
        <g className="fb-in" style={d(0.8)}>
          <path d="M760 212 h22 a10 10 0 0 1 0 20 h-22" className="xc-loop" />
          <path d="M840 212 H760 M760 232 H840" className="fb-light" />
        </g>
      )}
    </g>
  )
}

export function CarrierStage({ steps, cur, replayKey }: StageProps<XcStep>) {
  const st = steps[Math.max(0, cur)]
  const s = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {s === 'what' && (
          <>
            <Path light="ok" />
            <Caption y={380}>A cross-connect: a cable inside the building between two parties, here a client and a carrier.</Caption>
            <Caption y={406} delay={1.2}>
              The same job connects two clients, or a client and a cloud on-ramp.
            </Caption>
          </>
        )}

        {s === 'order' && (
          <>
            <Box
              x={50}
              y={40}
              w={500}
              h={230}
              title="LOA / CFA from the carrier"
              lines={['Carrier       NordNet Fibre', 'Authorises    Acme B.V.', 'to connect to MMR-1, panel PP-14', 'Ports         7 and 8 (one pair)', 'Connector     LC/UPC duplex', 'Fibre         single-mode OS2', 'Valid until   31 Dec 2026', 'Signed        NordNet provisioning']}
              tone="plain"
              delay={0.2}
            />
            {[
              'client name matches the order',
              'still valid',
              'PP-14 ports 7-8 exist and are free',
              'connector and fibre type match the panel',
            ].map((t, i) => (
              <g key={t} className="fb-in" style={d(0.8 + i * 0.4)}>
                <Mark x={600} y={90 + i * 60} ok />
                <text x={622} y={95 + i * 60} className="fb-small">
                  {t}
                </text>
              </g>
            ))}
            <Caption y={420}>Any mismatch: stop, and the client asks the carrier for a corrected LOA.</Caption>
            <Caption y={446} delay={1.2}>
              Patching the wrong carrier port can take down someone else's circuit.
            </Caption>
          </>
        )}

        {s === 'path' && (
          <>
            <text x={500} y={50} textAnchor="middle" className="fb-strong">
              DCIM: path for circuit XC-26-0418
            </text>
            {[
              ['A end', 'client cage C12, panel CP-1, ports 5-6'],
              ['trunk', 'zone trunk Z3, strands 23-24'],
              ['MMR', 'provider panel MP-3, ports 11-12'],
              ['Z end', 'carrier panel PP-14, ports 7-8 (from the LOA)'],
            ].map(([k, v], i) => (
              <g key={k} className="fb-in" style={d(0.3 + i * 0.45)}>
                <rect x={110} y={80 + i * 64} width={780} height={50} rx="8" className="kit-box is-plain" />
                <text x={130} y={111 + i * 64} className="fb-strong">
                  {k}
                </text>
                <text x={240} y={111 + i * 64} className="fb-small">
                  {v}
                </text>
                <text x={870} y={111 + i * 64} textAnchor="end" className="fb-ok">
                  reserved
                </text>
              </g>
            ))}
            <Caption y={380}>Reserve every port before you patch, so nobody else takes it on the way.</Caption>
          </>
        )}

        {s === 'run' && (
          <>
            <Path />
            <path d="M250 220 H300 V60 H520 V220 H585" className="xc-draw" />
            <g className="fb-in" style={d(2.4)}>
              <rect x={230} y={322} width={140} height={34} rx="4" className="cu-tag" />
              <text x={300} y={344} textAnchor="middle" className="fb-tiny">
                XC-26-0418 A
              </text>
              <rect x={620} y={322} width={140} height={34} rx="4" className="cu-tag" />
              <text x={690} y={344} textAnchor="middle" className="fb-tiny">
                XC-26-0418 Z
              </text>
            </g>
            <Caption y={400}>Inspect and clean at every connector, follow the tray, no tight bends, label both ends with the circuit ID.</Caption>
          </>
        )}

        {s === 'test' && (
          <>
            <Path light="ok" />
            <rect x={110} y={330} width={110} height={50} rx="6" className="xc-meter fb-in" style={d(0.3)} />
            <text x={165} y={360} textAnchor="middle" className="fb-tiny fb-in" style={d(0.3)}>
              light source
            </text>
            <rect x={680} y={330} width={110} height={50} rx="6" className="xc-meter fb-in" style={d(0.3)} />
            <text x={735} y={360} textAnchor="middle" className="fb-tiny fb-in" style={d(0.3)}>
              power meter
            </text>
            <Term x={250} y={330} w={400} delay={1} lines={['strand 1  1310 nm  loss 1.2 dB  budget 2.5', 'strand 2  1310 nm  loss 1.4 dB  budget 2.5', '+both pass, readings saved to the ticket']} />
            <Caption y={460}>A red fault locator first proves continuity; the meter then proves the loss fits the budget.</Caption>
          </>
        )}

        {s === 'demarc' && (
          <>
            <Path />
            <line x1={758} x2={758} y1={70} y2={360} className="xc-demarc" />
            <text x={758} y={384} textAnchor="middle" className="fb-strong">
              demarc
            </text>
            <g className="fb-in" style={d(0.6)}>
              <text x={400} y={410} textAnchor="middle" className="fb-small">
                ← the data center's cross-connect, its job to fix
              </text>
              <text x={880} y={410} textAnchor="middle" className="fb-small">
                carrier's network →
              </text>
            </g>
            <Caption y={450}>The demarcation point is where responsibility changes hands. Tests and loopbacks happen there.</Caption>
          </>
        )}

        {s === 'handover' && (
          <>
            <Term
              x={120}
              y={50}
              w={760}
              delay={0.2}
              lines={[
                'Ticket XC-26-0418   cross-connect, delivered',
                '  A end   C12 CP-1 ports 5-6',
                '  Z end   MMR-1 PP-14 ports 7-8 (carrier demarc)',
                '  media   OS2 single-mode, LC/UPC',
                '  loss    1.2 dB / 1.4 dB at 1310 nm (budget 2.5)',
                '  photos  both panels, both labels',
                '+closed 2026-11-27 15:40, the carrier brings up the service',
              ]}
            />
            <Mark x={300} y={300} ok delay={1} />
            <text x={322} y={305} className="fb-small fb-in" style={d(1)}>
              the client and the carrier both get the readings
            </text>
            <Mark x={300} y={340} ok delay={1.4} />
            <text x={322} y={345} className="fb-small fb-in" style={d(1.4)}>
              the DCIM shows the ports as in use, with the circuit ID
            </text>
          </>
        )}

        {s === 'loop' && (
          <>
            <Path light="carrier" loop cut />
            <Box x={40} y={350} w={440} h={110} title="Carrier: circuit down" lines={['"please put a hard loop on PP-14', 'ports 7-8, toward us"']} tone="warn" delay={0.2} />
            <Box x={520} y={350} w={440} h={110} title="Their test through the loop" lines={['passes: the fault is on the client side', 'fails: it is in the carrier\'s network']} tone="info" delay={1.4} />
            <Arrow x1={490} y1={404} x2={512} y2={404} delay={1.2} />
          </>
        )}
      </svg>
    </div>
  )
}

export const CROSS_CONNECT: StageLesson<XcStep> = {
  Stage: CarrierStage,
  metrics: [
    { id: 'circuit', label: 'Circuit', start: 'XC-26-0418' },
    { id: 'state', label: 'State', start: 'ordered' },
  ],
  intro: [
    'In a colocation data center, clients buy their connectivity from carriers that also sit in the building. The cable that joins them is a cross-connect, and installing, testing and troubleshooting cross-connects is daily work on the floor.',
  ],
  legend: [
    ['Cross-connect', 'A cable inside the building between two parties'],
    ['MMR', 'Meet-me room: where carriers end their cables in the building'],
    ['LOA / CFA', 'Letter of authorisation / connecting facility assignment: the carrier\'s permission and port'],
    ['Demarc', 'Demarcation point: where responsibility moves from one party to the other'],
  ],
  steps: [
    { scene: 'what', short: 'What', title: 'What a cross-connect is', explain: ['A client in cage C12 wants a circuit from a carrier. The carrier ends its fibre on a panel in the meet-me room (MMR); the data center provides the cable from there to the client\'s cage: the cross-connect.', 'It runs from the client\'s router to the cage panel, through a trunk in the overhead tray, across the provider\'s panel in the MMR to the carrier\'s panel.'], key: 'A cross-connect joins two parties inside the building, through the meet-me room.', m: { state: 'ordered' } },
    { scene: 'order', short: 'LOA', title: 'The LOA names the carrier\'s port', tag: 'action', explain: ['The client orders through the provider\'s portal and attaches the carrier\'s LOA/CFA: the carrier\'s permission to connect, with the exact panel, ports, connector and fibre type.', 'Check it against reality before you touch a cable: name, date, panel and ports, connector and fibre type. Any mismatch goes back for a corrected LOA.'], key: 'Check the LOA against the panel before patching anything.', m: { state: 'LOA checked' } },
    { scene: 'path', short: 'Path', title: 'Find and reserve the path', explain: ['In the DCIM you plan every segment: the client\'s cage panel, the zone trunk, the provider\'s panel in the MMR, and the carrier\'s panel from the LOA. Reserve each port, so nobody else uses it while you work.'], key: 'Every segment planned and reserved in the DCIM first.', m: { state: 'path reserved' } },
    { scene: 'run', short: 'Patch', title: 'Run, patch and label', tag: 'action', explain: ['Patch at each panel. Inspect and clean every connector before it goes in, follow the tray route, keep the bends gentle, and label both ends with the circuit ID.', 'Carrier cross-connects are usually single-mode OS2 with LC connectors; the LOA says which.'], key: 'Clean at every connector, label both ends with the circuit ID.', m: { state: 'patched' } },
    { scene: 'test', short: 'Test', title: 'Test before you hand over', tag: 'result', explain: ['A red visual fault locator proves the strands are continuous and in the right order. Then a light source at one end and a power meter at the other measure the loss of each strand against the budget.', 'The readings go into the ticket: they are your proof the cross-connect was good on the day.'], key: 'Continuity first, then loss per strand against the budget, saved in the ticket.', m: { state: 'tested, pass' } },
    { scene: 'demarc', short: 'Demarc', title: 'The demarcation point', explain: ['The carrier\'s panel port is the demarc: up to it, the cross-connect is the data center\'s responsibility; past it, the carrier\'s network.', 'When a circuit fails, the first question is which side of the demarc the fault is on.'], key: 'The demarc decides whose fault it is and where to test.', m: { state: 'demarc set' } },
    { scene: 'handover', short: 'Hand over', title: 'Close with the evidence', tag: 'result', explain: ['Close the ticket with the circuit ID, both ends, the media, the loss readings and photos of both panels. The DCIM marks the ports as in use. The carrier then brings up its service and the client confirms.'], key: 'Circuit ID, ports, readings and photos close the ticket.', m: { state: 'delivered' } },
    { scene: 'loop', short: 'Loopback', title: 'Later: "circuit down", loop at the demarc', tag: 'event', explain: ['Weeks later the carrier reports the circuit down and asks for a hard loop at the demarc, toward them. You plug a loopback into PP-14 ports 7-8, so their test light comes straight back.', 'If their test passes through your loop, their network is fine up to the demarc and the fault is on the client side: the cross-connect, the cage cords or the client\'s optic. If it fails, it is in the carrier\'s network. Remove the loop when they are done and log the times.'], key: 'A loop at the demarc splits the fault in two: carrier side or client side.', m: { state: 'fault isolated' } },
  ],
}

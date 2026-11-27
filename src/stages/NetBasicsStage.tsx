import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'
import { Arrow, Box, Caption, Term, d } from './kit'

// Network basics a technician is asked about: layers, switches, ARP, routers, VLANs, then IP and subnets.

type LayerScene = 'osi' | 'encap' | 'switch' | 'arp' | 'router' | 'vlan' | 'faults'
export interface LayerStep extends StageStep {
  scene: LayerScene
}

function Node({ x, y, name, sub, tone = 'blue' }: { x: number; y: number; name: string; sub?: string; tone?: string }) {
  return (
    <g>
      <rect x={x - 60} y={y - 26} width={120} height={52} rx="8" className={`nb-node is-${tone}`} />
      <text x={x} y={y - 3} textAnchor="middle" className="fb-small">
        {name}
      </text>
      {sub && (
        <text x={x} y={y + 15} textAnchor="middle" className="fb-tiny">
          {sub}
        </text>
      )}
    </g>
  )
}

/** A wire that lights up at a given delay. */
function Wire({ x1, y1, x2, y2, at, off }: { x1: number; y1: number; x2: number; y2: number; at?: number; off?: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="fb-strand is-dark" />
      {!off && at !== undefined && <line x1={x1} y1={y1} x2={x2} y2={y2} className="fb-light nb-flash" style={d(at)} />}
    </g>
  )
}

const LAYERS: [string, string, string][] = [
  ['1', 'Physical', 'cables, light, the link LED'],
  ['2', 'Data link', 'MAC addresses, switches, VLANs'],
  ['3', 'Network', 'IP addresses, routers'],
  ['4', 'Transport', 'TCP and UDP ports'],
  ['5', 'Session', ''],
  ['6', 'Presentation', 'TLS, encoding'],
  ['7', 'Application', 'SSH, HTTPS, Redfish'],
]

export function LayerStage({ steps, cur, replayKey }: StageProps<LayerStep>) {
  const st = steps[Math.max(0, cur)]
  const s = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {s === 'osi' && (
          <>
            {LAYERS.map(([n, name, what], i) => (
              <g key={n} className="fb-in" style={d(0.15 + i * 0.2)}>
                <rect x={80} y={400 - i * 52} width={420} height={44} rx="7" className={`nb-layer is-${i < 3 ? 'floor' : 'host'}`} />
                <text x={100} y={428 - i * 52} className="fb-strong">
                  {n}
                </text>
                <text x={130} y={428 - i * 52} className="fb-small">
                  {name}
                </text>
                <text x={490} y={428 - i * 52} textAnchor="end" className="fb-tiny">
                  {what}
                </text>
              </g>
            ))}
            <g className="fb-in" style={d(1.8)}>
              <path d="M520 296 h30 v148 h-30" className="kit-arrow" />
              <text x={570} y={340} className="fb-strong">
                what you touch on the floor
              </text>
              <text x={570} y={364} className="fb-small">
                most floor faults sit in layer 1:
              </text>
              <text x={570} y={384} className="fb-small">
                a cable, a dirty connector, a dead optic
              </text>
              <path d="M520 88 h30 v196 h-30" className="kit-arrow is-dashed" />
              <text x={570} y={180} className="fb-small">
                inside the servers: the OS and apps
              </text>
            </g>
          </>
        )}

        {s === 'encap' && (
          <>
            {[
              ['Ethernet frame', 'MAC aa:01 → bb:03', 'is-l2'],
              ['IP packet', '10.70.0.11 → 10.70.0.12', 'is-l3'],
              ['TCP segment', 'port 51022 → 22', 'is-l4'],
              ['data', 'ssh session', 'is-l7'],
            ].map(([t, sub, cls], i) => (
              <g key={t} className="fb-in" style={d(1.6 - i * 0.45)}>
                <rect x={80 + i * 70} y={60 + i * 48} width={840 - i * 140} height={330 - i * 96} rx="12" className={`nb-wrap ${cls}`} />
                <text x={100 + i * 70} y={88 + i * 48} className="fb-strong">
                  {t}
                </text>
                <text x={900 - i * 70} y={88 + i * 48} textAnchor="end" className="fb-small">
                  {sub}
                </text>
              </g>
            ))}
            <Caption y={440}>Each layer wraps the one above in its own envelope. A switch reads the outer one, a router the one inside.</Caption>
          </>
        )}

        {s === 'switch' && (
          <>
            <rect x={330} y={200} width={240} height={70} rx="8" className="nb-switch" />
            <text x={450} y={240} textAnchor="middle" className="fb-strong">
              switch
            </text>
            {[
              ['p1', 336, 196],
              ['p3', 512, 196],
              ['p2', 376, 288],
              ['p4', 552, 288],
            ].map(([t, x, y]) => (
              <text key={t as string} x={x as number} y={y as number} className="fb-tiny">
                {t}
              </text>
            ))}
            <Node x={140} y={90} name="A" sub="aa:01" />
            <Node x={140} y={380} name="C" sub="cc:02" />
            <Node x={760} y={90} name="B" sub="bb:03" />
            <Node x={760} y={380} name="D" sub="dd:04" />
            <Wire x1={200} y1={100} x2={350} y2={210} at={0.2} />
            <Wire x1={200} y1={370} x2={390} y2={260} at={1.2} />
            <Wire x1={700} y1={100} x2={510} y2={210} at={1.2} />
            <Wire x1={700} y1={370} x2={550} y2={260} at={1.2} />
            <line x1={700} y1={100} x2={510} y2={210} className="fb-light nb-flash" style={d(2.6)} />
            <line x1={200} y1={100} x2={350} y2={210} className="fb-light nb-flash" style={d(3.6)} />
            <rect x={620} y={160} width={340} height={120} rx="8" className="fb-card" />
            <text x={636} y={184} className="fb-strong">
              MAC table
            </text>
            <text x={636} y={214} className="fb-small fb-in" style={d(1)}>
              aa:01 → port 1 (learned from A)
            </text>
            <text x={636} y={238} className="fb-small fb-in" style={d(3)}>
              bb:03 → port 3 (learned from B)
            </text>
            <Caption y={455}>Unknown destination: the switch floods to every port. Once it has learned B, frames go to port 3 only.</Caption>
          </>
        )}

        {s === 'arp' && (
          <>
            <Node x={150} y={120} name="A" sub="10.70.0.11" />
            <Node x={500} y={60} name="B" sub="10.70.0.12" />
            <Node x={500} y={190} name="C" sub="10.70.0.13" />
            <Node x={850} y={120} name="D" sub="10.70.0.14" />
            <Wire x1={210} y1={110} x2={440} y2={65} at={0.3} />
            <Wire x1={210} y1={125} x2={440} y2={185} at={0.3} />
            <Wire x1={210} y1={120} x2={790} y2={120} at={0.3} />
            <line x1={440} y1={65} x2={210} y2={110} className="fb-light nb-flash" style={d(1.8)} />
            <Box x={60} y={250} w={420} h={80} title="A, to everyone (broadcast):" lines={['who has 10.70.0.12? tell 10.70.0.11']} tone="warn" delay={0.5} />
            <Box x={520} y={250} w={420} h={80} title="B, to A only:" lines={['10.70.0.12 is at bb:03']} tone="ok" delay={1.8} />
            <Term x={60} y={350} w={880} delay={2.4} lines={['$ ip neigh show 10.70.0.12', '+10.70.0.12 dev be0 lladdr bb:03:5e:00:00:03 REACHABLE']} />
            <Caption y={460}>ARP turns an IP address into a MAC address on the same network. No reply: wrong VLAN, a dead link, or the host is down.</Caption>
          </>
        )}

        {s === 'router' && (
          <>
            <rect x={40} y={60} width={340} height={260} rx="10" className="nb-net is-a" />
            <rect x={620} y={60} width={340} height={260} rx="10" className="nb-net is-b" />
            <text x={210} y={86} textAnchor="middle" className="fb-strong">
              10.70.0.0/24
            </text>
            <text x={790} y={86} textAnchor="middle" className="fb-strong">
              10.71.0.0/24
            </text>
            <Node x={150} y={190} name="A" sub="10.70.0.11" />
            <Node x={850} y={190} name="C" sub="10.71.0.20" />
            <rect x={430} y={150} width={140} height={80} rx="10" className="nb-router" />
            <text x={500} y={186} textAnchor="middle" className="fb-strong">
              router
            </text>
            <text x={500} y={206} textAnchor="middle" className="fb-tiny">
              .1 on both nets
            </text>
            <Wire x1={210} y1={190} x2={430} y2={190} at={0.3} />
            <Wire x1={570} y1={190} x2={790} y2={190} at={1.4} />
            <Box x={40} y={340} w={440} h={110} title="hop 1" lines={['MAC  aa:01 → router', 'IP   10.70.0.11 → 10.71.0.20']} delay={0.5} />
            <Box x={520} y={340} w={440} h={110} title="hop 2" lines={['MAC  router → cc:20', 'IP   10.70.0.11 → 10.71.0.20']} delay={1.6} />
            <Caption y={472} delay={2}>
              Another network: send it to the default gateway. The MACs change at every hop, the IPs stay the same.
            </Caption>
          </>
        )}

        {s === 'vlan' && (
          <>
            <rect x={200} y={170} width={600} height={90} rx="10" className="nb-switch" />
            {Array.from({ length: 8 }, (_, i) => {
              const v = i < 2 ? 'is-v10' : i < 4 ? 'is-v20' : i === 7 ? 'is-trunk' : ''
              return (
                <g key={i}>
                  <rect x={226 + i * 70} y={200} width={50} height={34} rx="5" className={`nb-port ${v}`} />
                  <text x={251 + i * 70} y={252} textAnchor="middle" className="fb-tiny">
                    {i + 1}
                  </text>
                </g>
              )
            })}
            <Node x={180} y={70} name="web1" sub="VLAN 10" tone="blue" />
            <Node x={370} y={70} name="db1" sub="VLAN 20" tone="amber" />
            <line x1={200} y1={96} x2={251} y2={200} className="nb-cable is-v10" />
            <line x1={390} y1={96} x2={391} y2={200} className="nb-cable is-v20" />
            <line x1={741} y1={234} x2={860} y2={380} className="nb-cable is-trunk" />
            <rect x={800} y={380} width={160} height={50} rx="8" className="nb-switch" />
            <text x={880} y={410} textAnchor="middle" className="fb-small">
              next switch
            </text>
            <Box x={40} y={300} w={360} h={110} title="Access port" lines={['one VLAN, untagged', 'servers, BMCs, most devices']} tone="blue" delay={0.6} />
            <Box x={420} y={300} w={340} h={110} title="Trunk port" lines={['many VLANs, each frame tagged', '(802.1Q); between switches']} tone="violet" delay={1.2} />
            <Caption y={455} delay={1.8}>
              VLAN 10 and VLAN 20 cannot talk without a router. A port in the wrong VLAN: link up, no ping.
            </Caption>
          </>
        )}

        {s === 'faults' && (
          <>
            {[
              ['link LED off, ethtool: no link', '1', 'cable, optic, port, light levels'],
              ['link up, no ARP reply', '2', 'VLAN on the port, MAC table, bond'],
              ['local works, other networks fail', '3', 'gateway, mask, route'],
              ['ping works, SSH or HTTPS fails', '4+', 'firewall, the service itself'],
            ].map(([sym, l, chk], i) => (
              <g key={sym} className="fb-in" style={d(0.2 + i * 0.45)}>
                <rect x={60} y={70 + i * 80} width={880} height={64} rx="9" className="kit-box is-plain" />
                <text x={80} y={108 + i * 80} className="fb-small">
                  {sym}
                </text>
                <circle cx={520} cy={102 + i * 80} r="20" className={`nb-badge is-${i}`} />
                <text x={520} y={107 + i * 80} textAnchor="middle" className="fb-strong">
                  {l}
                </text>
                <text x={560} y={108 + i * 80} className="fb-small">
                  {chk}
                </text>
              </g>
            ))}
            <text x={80} y={52} className="fb-label">
              symptom
            </text>
            <text x={520} y={52} textAnchor="middle" className="fb-label">
              layer
            </text>
            <text x={560} y={52} className="fb-label">
              check
            </text>
            <Caption y={440}>Work up from layer 1. Prove each layer before you blame the one above.</Caption>
          </>
        )}
      </svg>
    </div>
  )
}

export const NET_LAYERS: StageLesson<LayerStep> = {
  Stage: LayerStage,
  metrics: [{ id: 'layer', label: 'Layer', start: '-' }],
  intro: [
    'Network questions come up in every data center interview: what a switch does, what a router does, what a VLAN is, and how you tell which one is at fault. Step through the layers with one server talking to another.',
  ],
  legend: [
    ['MAC address', 'The hardware address of a network port, used inside one network'],
    ['IP address', 'The logical address, used to reach other networks'],
    ['ARP', 'Finds the MAC address that belongs to an IP address'],
    ['VLAN', 'A separate network carved out of one switch'],
  ],
  steps: [
    { scene: 'osi', short: 'Layers', title: 'Seven layers, three you touch', explain: ['The OSI model splits networking into seven layers. On the floor you mostly work with the bottom three: layer 1 is the cable and the light, layer 2 the switch and MAC addresses, layer 3 IP addresses and routers.', 'Most faults a technician finds are in layer 1: a cable in the wrong port, a dirty connector, a dead optic.'], key: 'L1 cable, L2 switch, L3 router: start at the bottom.', m: { layer: '1 to 7' } },
    { scene: 'encap', short: 'Envelopes', title: 'Envelopes inside envelopes', explain: ['Data from an application is wrapped in a TCP segment with port numbers, that in an IP packet with IP addresses, that in an Ethernet frame with MAC addresses, which goes on the wire as bits.', 'A switch only reads the outer envelope (MAC). A router opens it and reads the IP packet inside.'], key: 'Switches read MACs, routers read IPs.', m: { layer: '2, 3, 4' } },
    { scene: 'switch', short: 'Switch', title: 'How a switch learns', tag: 'event', explain: ['When a frame arrives, the switch writes the sender\'s MAC address and the port into its MAC table. If it does not know the destination yet, it floods the frame to every port.', 'B answers, the switch learns B is on port 3, and from then on frames for B go to port 3 only.'], key: 'The MAC table maps addresses to ports; unknown means flood.', m: { layer: '2' } },
    { scene: 'arp', short: 'ARP', title: 'ARP: from IP to MAC', tag: 'message', explain: ['A knows B\'s IP address but needs its MAC address to build the frame. It broadcasts "who has 10.70.0.12?" and B answers with its MAC. A keeps the answer in its ARP cache, which `ip neigh` shows.', 'No ARP reply on the same network usually means a wrong VLAN, a dead link, or the host is down.'], key: 'ARP: who has this IP? The owner answers with its MAC.', m: { layer: '2 and 3' } },
    { scene: 'router', short: 'Router', title: 'A router joins networks', explain: ['A sees that C is on another network, so it sends the frame to its default gateway, the router. The router forwards the packet to C\'s network with new MAC addresses; the IP addresses inside stay the same.'], key: 'Other network: send to the gateway. MACs change per hop, IPs stay.', m: { layer: '3' } },
    { scene: 'vlan', short: 'VLANs', title: 'VLANs, access and trunk ports', tag: 'technique', explain: ['VLANs split one switch into separate networks. An access port belongs to one VLAN and sends untagged frames: that is what servers and BMCs plug into. A trunk port carries many VLANs, each frame tagged with its VLAN number (802.1Q), usually between switches.', 'Two VLANs only talk through a router. A server port set to the wrong VLAN shows link up but answers no ping.'], key: 'Access: one VLAN untagged. Trunk: many VLANs tagged.', m: { layer: '2' } },
    { scene: 'faults', short: 'Which layer', title: 'Which layer is broken?', tag: 'result', explain: ['Read the symptom, name the layer, check the matching things. No link is layer 1. Link but no ARP is layer 2. Local fine but other networks fail is layer 3. Ping fine but the service fails is layer 4 or higher.'], key: 'Name the layer from the symptom, then work up from layer 1.', m: { layer: 'find it' } },
  ],
}

/* ---------- IP addresses and subnets ---------- */

type IpScene = 'addr' | 'mask' | 'same' | 'sizes' | 'private' | 'ping' | 'dhcp' | 'cmds'
export interface IpStep extends StageStep {
  scene: IpScene
}

const bin = (n: number) => n.toString(2).padStart(8, '0')

function Octets({ ip, y, netBits, delay = 0.2 }: { ip: number[]; y: number; netBits?: number; delay?: number }) {
  return (
    <g className="fb-in" style={d(delay)}>
      {ip.map((o, i) => (
        <g key={i}>
          <rect x={90 + i * 210} y={y} width={190} height={60} rx="8" className={`nb-octet${netBits !== undefined ? (i * 8 < netBits ? ' is-net' : ' is-host') : ''}`} />
          <text x={185 + i * 210} y={y + 40} textAnchor="middle" className="nb-big">
            {o}
          </text>
          {i < 3 && (
            <text x={290 + i * 210} y={y + 42} textAnchor="middle" className="nb-big">
              .
            </text>
          )}
          <text x={185 + i * 210} y={y + 86} textAnchor="middle" className="nb-bits">
            {bin(o)}
          </text>
        </g>
      ))}
    </g>
  )
}

export function IpStage({ steps, cur, replayKey }: StageProps<IpStep>) {
  const st = steps[Math.max(0, cur)]
  const s = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {s === 'addr' && (
          <>
            <text x={500} y={60} textAnchor="middle" className="fb-strong">
              an IPv4 address: 32 bits, written as four numbers from 0 to 255
            </text>
            <Octets ip={[10, 70, 0, 12]} y={100} />
            <Caption y={300}>Each number is one octet: eight bits. 10 = 00001010, 70 = 01000110.</Caption>
            <Caption y={340} delay={1.4}>
              IPv6 does the same with 128 bits in hex groups, like fd00:70::12, and /64 per network.
            </Caption>
          </>
        )}

        {s === 'mask' && (
          <>
            <text x={500} y={50} textAnchor="middle" className="fb-strong">
              10.70.0.12/24: the first 24 bits name the network, the last 8 the host
            </text>
            <Octets ip={[10, 70, 0, 12]} y={80} netBits={24} />
            <Octets ip={[255, 255, 255, 0]} y={220} netBits={24} delay={0.9} />
            <text x={60} y={256} textAnchor="end" className="fb-tiny">
              mask
            </text>
            <g className="fb-in" style={d(1.6)}>
              <text x={500} y={380} textAnchor="middle" className="fb-small">
                network 10.70.0.0 · broadcast 10.70.0.255 · hosts 10.70.0.1 to 10.70.0.254 (254)
              </text>
              <text x={500} y={406} textAnchor="middle" className="fb-small">
                the gateway is often .1 by habit, not by rule: read it from the plan
              </text>
            </g>
          </>
        )}

        {s === 'same' && (
          <>
            <text x={500} y={50} textAnchor="middle" className="fb-strong">
              same network? keep the network bits, compare
            </text>
            {[
              ['A  10.70.0.11/24', '→ 10.70.0.0', 'me'],
              ['B  10.70.0.12', '→ 10.70.0.0', 'same: ARP and send directly'],
              ['C  10.70.1.5', '→ 10.70.1.0', 'other network: via the gateway'],
            ].map(([a, n, r], i) => (
              <g key={a} className="fb-in" style={d(0.3 + i * 0.5)}>
                <rect x={80} y={90 + i * 76} width={840} height={58} rx="8" className={`kit-box is-${i === 2 ? 'warn' : i === 1 ? 'ok' : 'plain'}`} />
                <text x={100} y={125 + i * 76} className="fb-strong">
                  {a}
                </text>
                <text x={420} y={125 + i * 76} className="fb-small">
                  {n}
                </text>
                <text x={560} y={125 + i * 76} className="fb-small">
                  {r}
                </text>
              </g>
            ))}
            <Box x={80} y={330} w={840} h={90} title="The classic wrong mask" lines={['A set to /16 thinks 10.70.1.5 is local, sends ARP, gets no answer: "host unreachable" with a good cable.']} tone="bad" delay={1.8} />
          </>
        )}

        {s === 'sizes' && (
          <>
            <text x={500} y={40} textAnchor="middle" className="fb-strong">
              addresses = 2^(32 - prefix), hosts = addresses - 2
            </text>
            {[
              ['/24', 256, '254 hosts', 'a rack network'],
              ['/25', 128, '126', ''],
              ['/26', 64, '62', ''],
              ['/27', 32, '30', ''],
              ['/28', 16, '14', ''],
              ['/29', 8, '6', ''],
              ['/30', 4, '2', 'a point-to-point link'],
              ['/31', 2, '2', 'point-to-point, no broadcast (RFC 3021)'],
              ['/32', 1, '1', 'one host: a loopback'],
            ].map(([p, n, h, note], i) => (
              <g key={p as string}>
                <text x={80} y={82 + i * 42} className="fb-strong">
                  {p}
                </text>
                <rect x={130} y={66 + i * 42} width={Math.max(8, (Math.log2(n as number) + 1) * 46)} height={22} rx="4" className="nb-size fb-grow" style={d(0.2 + i * 0.12)} />
                <text x={150 + (Math.log2(n as number) + 1) * 46} y={82 + i * 42} className="fb-small">
                  {n} · {h}
                </text>
                <text x={920} y={82 + i * 42} textAnchor="end" className="fb-tiny">
                  {note}
                </text>
              </g>
            ))}
          </>
        )}

        {s === 'private' && (
          <>
            <Box x={60} y={50} w={420} h={170} title="Private ranges (RFC 1918)" lines={['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'not routed on the internet']} tone="plain" delay={0.2} />
            <Box x={520} y={50} w={420} h={170} title="One rack, three networks" lines={['data      10.70.0.0/24', 'back end  10.70.2.0/24, MTU 9000', 'BMCs      10.70.1.0/24, kept apart']} tone="info" delay={0.7} />
            <Caption y={290} delay={1.2}>
              The management network for BMCs is separate on purpose: a BMC can power off the server.
            </Caption>
            <Caption y={320} delay={1.4}>
              The rack's IP plan says which address each port gets. Never guess an address on someone else's network.
            </Caption>
          </>
        )}

        {s === 'ping' && (
          <>
            <Node x={100} y={110} name="A" sub="you" />
            <Node x={370} y={110} name="R1" sub="10.70.0.1" tone="violet" />
            <Node x={640} y={110} name="R2" sub="10.90.0.1" tone="violet" />
            <Node x={900} y={110} name="C" sub="10.71.0.20" />
            <Wire x1={160} y1={110} x2={310} y2={110} at={0.2} />
            <Wire x1={430} y1={110} x2={580} y2={110} at={0.8} />
            <Wire x1={700} y1={110} x2={840} y2={110} at={1.4} off />
            <path d="M720 96 l40 28 M720 124 l40 -28" className="xc-cut fb-in" style={d(1.6)} />
            <Term
              x={60}
              y={190}
              w={880}
              delay={0.6}
              lines={['$ ping -c 3 10.71.0.20', '!3 packets transmitted, 0 received, 100% packet loss', '$ traceroute -n 10.71.0.20', '+ 1  10.70.0.1   0.4 ms', '+ 2  10.90.0.1   0.9 ms', '! 3  * * *        # stops after R2: look between R2 and C']}
            />
            <Caption y={410}>ping asks "are you there?" and times the answer.</Caption>
            <Caption y={436} delay={1.2}>
              traceroute sends packets that expire one hop further each time, so every router on the way answers.
            </Caption>
          </>
        )}

        {s === 'dhcp' && (
          <>
            {['Discover', 'Offer', 'Request', 'Ack'].map((t, i) => (
              <g key={t}>
                <Box x={40 + i * 240} y={60} w={220} h={80} title={t} lines={[['who can give me an address?', 'here is 10.70.0.31', 'I take 10.70.0.31', 'yours, 12 hours'][i]]} tone={i % 2 ? 'ok' : 'plain'} delay={0.2 + i * 0.4} center />
                {i < 3 && <Arrow x1={263 + i * 240} y1={100} x2={279 + i * 240} y2={100} delay={0.4 + i * 0.4} />}
              </g>
            ))}
            <text x={500} y={180} textAnchor="middle" className="fb-small fb-in" style={d(1.8)}>
              DHCP hands out the address, mask, gateway and DNS servers (and in a rack often the PXE boot file)
            </text>
            <Box x={200} y={220} w={600} h={110} title="DNS" lines={['turns a name into an address: rk-n12.lab → 10.70.0.12', 'ping by IP works, ping by name fails: DNS']} tone="info" delay={2.2} />
          </>
        )}

        {s === 'cmds' && (
          <>
            <Term
              x={40}
              y={30}
              w={540}
              delay={0.2}
              lines={['# on the server', '$ ip -br addr', '+be0   UP   10.70.0.12/24', '$ ip route', '+default via 10.70.0.1 dev be0', '$ ip neigh', '+10.70.0.1 dev be0 lladdr 00:1c:73:..', '$ ipcalc 10.70.0.12/24', '+Network: 10.70.0.0/24   Hosts: 254']}
            />
            <Term
              x={600}
              y={30}
              w={360}
              delay={0.9}
              lines={['# on the switch', '> show interfaces status', '> show mac address-table', '> show vlan', '> show lldp neighbors']}
            />
            <Caption y={420}>Address, route, neighbour: three commands answer most "it cannot reach" questions on the server side.</Caption>
          </>
        )}
      </svg>
    </div>
  )
}

export const IP_SUBNETS: StageLesson<IpStep> = {
  Stage: IpStage,
  metrics: [
    { id: 'ip', label: 'Address', start: '10.70.0.12' },
    { id: 'net', label: 'Network', start: '-' },
  ],
  intro: ['Every port in a rack gets an address from the IP plan, and half the "it cannot reach" tickets come down to an address, a mask or a gateway. Read an address bit by bit, then size networks and trace a path.'],
  legend: [
    ['Prefix /24', 'The first 24 bits are the network part'],
    ['Gateway', 'The router a host sends to for other networks'],
    ['DHCP', 'Hands out addresses automatically'],
    ['DNS', 'Turns names into addresses'],
  ],
  steps: [
    { scene: 'addr', short: 'Address', title: 'Thirty-two bits', explain: ['An IPv4 address is 32 bits, written as four octets of eight bits each, every one a number from 0 to 255. 10.70.0.12 is 00001010.01000110.00000000.00001100.', 'IPv6 addresses are 128 bits, written in hex groups, and normally use a /64 per network.'], key: 'Four octets, eight bits each, 0 to 255.', m: { ip: '10.70.0.12' } },
    { scene: 'mask', short: 'Mask', title: 'The prefix splits network and host', explain: ['/24 means the first 24 bits are the network and the last 8 the host; written as a mask that is 255.255.255.0. The first address (10.70.0.0) names the network, the last (10.70.0.255) is the broadcast, and the 254 in between are for hosts.'], key: '/24 = 255.255.255.0 = 254 hosts.', m: { net: '10.70.0.0/24' } },
    { scene: 'same', short: 'Same net?', title: 'Same network or not?', tag: 'technique', explain: ['To know whether another host is local, keep the network bits of both addresses and compare. Same network: ARP for it and send directly. Different: send to the gateway.', 'A wrong mask breaks this quietly: the host thinks a far address is local, ARPs for it, and nothing answers.'], key: 'Compare the network parts; different means via the gateway.', m: { net: 'A, B: same · C: other' } },
    { scene: 'sizes', short: 'Sizes', title: 'Network sizes by prefix', explain: ['Every bit you add to the prefix halves the network. A /24 has 256 addresses and 254 hosts, a /30 four addresses and two hosts, the classic point-to-point link. A /31 has two addresses and no broadcast, used for point-to-point links, and a /32 is a single host.'], key: 'Hosts = 2^(32 - prefix) - 2; /30 and /31 for links, /32 for one host.', m: { net: 'sizes' } },
    { scene: 'private', short: 'Private', title: 'Private ranges and a rack\'s networks', explain: ['10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 are private: they are not routed on the internet, so data centers use them inside. A rack usually has several networks: data, back end and management for the BMCs, kept apart because a BMC can switch the server off.'], key: 'Private ranges inside; BMCs on their own management network.', m: { net: 'data · back end · BMC' } },
    { scene: 'ping', short: 'ping', title: 'ping and traceroute', tag: 'technique', explain: ['ping sends an ICMP echo and waits for the answer: is it reachable, and how fast. traceroute sends packets whose time to live runs out one hop further each time, so every router on the path answers in turn.', 'Where the answers stop is where to look.'], key: 'ping: is it there? traceroute: where does the path stop?', m: { net: 'stops after R2' } },
    { scene: 'dhcp', short: 'DHCP, DNS', title: 'DHCP and DNS', explain: ['DHCP gives a host its address, mask, gateway and DNS servers in four messages: discover, offer, request, acknowledge. In a rack the same DHCP answer often points to the PXE boot file.', 'DNS turns names into addresses. If ping by address works and ping by name fails, look at DNS.'], key: 'DHCP gives the address; DNS turns names into addresses.', m: { ip: '10.70.0.31 (DHCP)', net: '10.70.0.0/24' } },
    { scene: 'cmds', short: 'Commands', title: 'The commands to check it', tag: 'result', explain: ['On a Linux server, `ip -br addr` shows the addresses, `ip route` the gateway and `ip neigh` the ARP cache; `ipcalc` does the subnet maths. On the switch, the port status, the MAC table, the VLANs and the LLDP neighbours.'], key: 'Address, route and neighbour on the server; port, MAC and VLAN on the switch.', m: { ip: '10.70.0.12', net: '10.70.0.0/24' } },
  ],
}

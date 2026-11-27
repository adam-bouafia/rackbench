import type { Flow, Metric, StepTag } from '../engine/types'

// A node that is not reachable, isolated from the bottom up: power, BMC, console, link, switch, OS.

const isolate: Flow = {
  intro: [
    'A favourite interview scenario: a node in a new rack is not reachable. How do you isolate the fault?',
    'Work from the bottom up, one layer at a time, and prove each layer before you move up: power, the BMC, the console, the link, the switch port, then the operating system.',
  ],
  actors: [
    { id: 'tech', label: 'You', sub: 'test host', x: 110, y: 330, kind: 'person' },
    { id: 'power', label: 'Power', sub: 'feed, PDU, PSUs', x: 360, y: 130, kind: 'chip' },
    { id: 'bmc', label: 'BMC', sub: 'rk-n2 · 192.168.70.12', x: 610, y: 330, kind: 'bmc' },
    { id: 'link', label: 'Link', sub: 'NIC, optic, cable', x: 860, y: 130, kind: 'nic' },
    { id: 'sw', label: 'Switch port', sub: 'ToR eth1/9', x: 1110, y: 330, kind: 'switch' },
    { id: 'os', label: 'OS', sub: 'rk-n2 · 10.70.0.12', x: 1250, y: 130, kind: 'os' },
  ],
  keyPoints: [
    'Bottom up: power, BMC, console, link, switch, OS. Prove each layer before moving up.',
    'The BMC answers when the OS does not; the console shows whether the OS is up.',
    'Swap one part at a time and watch whether the fault follows the part.',
    'Record the cause and the evidence, then retest: a fix without a retest is a guess.',
  ],
  tryIt: [
    { cmd: './lab/faults.sh inject backend-link-down rk-n2', note: 'break a link on rk-n2' },
    { cmd: 'ipmitool -I lanplus -H 127.0.0.1 -p 6232 -U admin -P password -C 3 chassis power status', note: 'the BMC still answers' },
    { cmd: "ssh rk-n2 'ip -br link; ethtool be0 | grep Link'", note: 'find the dead link' },
    { cmd: './lab/faults.sh clear', note: 'repair everything' },
  ],
  links: [
    ['tech', 'power'],
    ['power', 'bmc'],
    ['tech', 'bmc'],
    ['bmc', 'link'],
    ['link', 'sw'],
    ['sw', 'os'],
  ],
  steps: [
    {
      from: 'tech',
      to: 'tech',
      proto: 'Event',
      summary: 'rk-n2 answers neither ping nor SSH',
      explain: [
        'The rack test cannot reach rk-n2. Before touching anything, write down what you see: since when, which addresses, what else in the rack still works.',
        'Then start at the bottom. A fault low in the stack (no power, no link) shows up as every symptom above it.',
      ],
      raw: `$ ping -c 3 10.70.0.12
3 packets transmitted, 0 received, 100% packet loss
$ ssh rk-n2
ssh: connect to host 10.70.0.12 port 22: No route to host`,
      rawLabel: 'The symptom',
      state: { tech: { text: 'no answer', tone: 'bad' } },
    },
    {
      from: 'tech',
      to: 'power',
      proto: 'Board',
      summary: 'Power first: feed, PDU outlet, PSU LEDs',
      explain: [
        'Is the PDU breaker on and the outlet live? Are both PSU LEDs green? An amber LED means no input or a PSU fault; one dark PSU means the server lost its redundancy, a finding even if it runs.',
        'Here both PSUs are green and the PDU meter shows the outlets drawing current.',
      ],
      state: { power: { text: 'both PSUs green', tone: 'ok' } },
    },
    {
      from: 'tech',
      to: 'bmc',
      proto: 'IPMI',
      summary: 'Ask the BMC: is the server on?',
      explain: [
        'The BMC sits on the management network and answers even when the OS does not. It says the chassis is on, and its event log shows no new errors.',
        'If the BMC did not answer either, the fault would be power, the management cable, or the BMC itself.',
      ],
      raw: `$ ipmitool -I lanplus -H 192.168.70.12 -U admin -P **** chassis power status
Chassis Power is on
$ ipmitool -I lanplus -H 192.168.70.12 -U admin -P **** sel elist last 3
  41 | 11/27/2026 | 09:14:02 | System Boot Initiated | Initiated by power up | Asserted`,
      rawLabel: 'Power status and the last events',
      state: { bmc: { text: 'on, SEL clean', tone: 'ok' } },
    },
    {
      from: 'tech',
      to: 'bmc',
      proto: 'IPMI',
      summary: 'Open the console over the BMC',
      explain: [
        'Serial over LAN shows the server\'s screen: the kernel booted and a login prompt waits. The OS is up, so the problem sits between the OS and the network.',
        'If the console showed a stuck POST or a kernel panic instead, that would be the lead to follow.',
      ],
      raw: `$ ipmitool -I lanplus -H 192.168.70.12 -U admin -P **** sol activate
Ubuntu 24.04 LTS rk-n2 ttyS0

rk-n2 login:`,
      rawLabel: 'Serial over LAN',
      state: { os: { text: 'booted, at login', tone: 'info' } },
    },
    {
      from: 'bmc',
      to: 'link',
      proto: 'Link',
      summary: 'From the console: is there a link?',
      explain: [
        'Log in on the console and ask the NIC. ethtool says no link on be0. Now the fault is narrowed to the link: the NIC port, the optic, the cable, or the switch port.',
      ],
      raw: `rk-n2$ ethtool be0 | grep -E 'Speed|Link detected'
	Speed: Unknown!
	Link detected: no`,
      rawLabel: 'ethtool on the node',
      state: { link: { text: 'no link', tone: 'bad' } },
    },
    {
      from: 'link',
      to: 'link',
      proto: 'Event',
      summary: 'Swap one part at a time',
      explain: [
        'Reseat the cable and the optic first. Then swap one part at a time and watch whether the fault follows the part: a known good cable (still down), then a known good optic: link up at 25G.',
        'Fibre also has a direction: transmit must meet receive at the other end. A swapped pair gives no link at all.',
      ],
      raw: `rk-n2$ ethtool be0 | grep -E 'Speed|Link detected'
	Speed: 25000Mb/s
	Link detected: yes`,
      rawLabel: 'After the optic swap',
      state: { link: { text: 'up, 25G (optic swapped)', tone: 'ok' } },
    },
    {
      from: 'link',
      to: 'sw',
      proto: 'Link',
      summary: 'Check the switch side too',
      explain: [
        'The switch port is up, in the right VLAN, with no errors counting, and LLDP shows rk-n2 be0 as its neighbour: the cable lands where the cabling table says.',
      ],
      raw: `switch# show interface eth1/9 status
Port    Name        Status  Vlan  Speed
eth1/9  rk-n2-be0   up      70    25G
switch# show lldp neighbors interface eth1/9
eth1/9  rk-n2  be0`,
      rawLabel: 'Switch port and LLDP',
      state: { sw: { text: 'up, VLAN 70, LLDP ok', tone: 'ok' } },
    },
    {
      from: 'sw',
      to: 'os',
      proto: 'SSH',
      summary: 'Up the stack: address, route, SSH',
      explain: [
        'With the link up, check the layers above it: the node has its address, the gateway answers, and SSH works again.',
        'Had the link been up from the start, these would have been the next places to look: a missing DHCP lease, a wrong VLAN, a firewall.',
      ],
      raw: `rk-n2$ ip -br addr show be0
be0  UP  10.70.0.12/24
$ ssh rk-n2 uptime
 09:31:07 up 17 min,  1 user,  load average: 0.08, 0.05, 0.02`,
      rawLabel: 'Back online',
      state: { os: { text: 'reachable', tone: 'ok' }, tech: { text: 'fixed', tone: 'ok' } },
    },
    {
      from: 'tech',
      to: 'tech',
      proto: 'Local',
      summary: 'Write it down: cause, evidence, fix, retest',
      explain: [
        'The faulty optic gets an RMA tag and goes into the report with the ethtool output before and after. Then the network tests run again on rk-n2, because a fix without a retest is a guess.',
        'In the interview, say the order out loud: power, BMC, console, link, switch, OS. One change at a time, and watch whether the fault follows the part.',
      ],
      raw: `rk-n2  be0  no link  ->  optic replaced (RMA 2611-07)  ->  link 25G, iperf3 23.4 Gb/s  PASS`,
      rawLabel: 'Report line',
    },
  ],
}

export const FLOWS4: Record<string, Flow> = { isolate }

interface StepExtra {
  short: string
  tag?: StepTag
  key?: string
  m?: Record<string, string>
}

export const EXTRAS4: Record<string, { metrics: Metric[]; appear?: Record<string, number>; steps: StepExtra[] }> = {
  isolate: {
    metrics: [
      { id: 'power', label: 'Power', start: '?' },
      { id: 'bmc', label: 'BMC', start: '?' },
      { id: 'link', label: 'Link', start: '?' },
      { id: 'os', label: 'OS', start: '?' },
    ],
    steps: [
      { short: 'Symptom', key: 'Write down what you see before you touch anything.' },
      { short: 'Power', m: { power: 'ok' }, key: 'Start at the bottom: power.' },
      { short: 'BMC', m: { bmc: 'on, clean' }, key: 'The BMC answers when the OS does not.' },
      { short: 'Console', m: { os: 'booted' }, key: 'The console shows whether the OS is up.' },
      { short: 'Link', m: { link: 'down' } },
      { short: 'Swap parts', tag: 'action', m: { link: 'up, 25G' }, key: 'Swap one part at a time; the fault follows the bad part.' },
      { short: 'Switch', key: 'Check both ends of a link.' },
      { short: 'OS', m: { os: 'reachable' } },
      { short: 'Report', tag: 'result', key: 'Power, BMC, console, link, switch, OS: bottom up, then retest.' },
    ],
  },
}

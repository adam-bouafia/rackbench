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


const remoteHands: Flow = {
  intro: [
    'Most work on a colocation or customer data center floor arrives as a ticket: a client somewhere else asks the on-site technician to be their hands. This lesson follows one ticket from arrival to closure, with the checks that keep a technician trusted.',
  ],
  keyPoints: [
    'Read the whole ticket and its procedure before moving; ask when anything is unclear.',
    'Match location, serial and part before touching anything; stop and escalate when the facts differ.',
    'Photos and command output before and after; the client confirms; the records are updated.',
  ],
  actors: [
    { id: 'client', label: 'Client NOC', sub: 'remote, owns the servers', x: 110, y: 130, kind: 'person' },
    { id: 'ticket', label: 'Ticket system', sub: 'ticket 48213 · P3', x: 400, y: 330, kind: 'service' },
    { id: 'tech', label: 'You', sub: 'technician on shift', x: 690, y: 130, kind: 'person' },
    { id: 'spares', label: 'Spares and RMA', sub: 'parts store', x: 980, y: 330, kind: 'service' },
    { id: 'rack', label: 'Rack C04', sub: 'U30 · S/N RL2611-012', x: 1250, y: 130, kind: 'server' },
  ],
  links: [
    ['client', 'ticket'],
    ['ticket', 'tech'],
    ['tech', 'spares'],
    ['tech', 'rack'],
  ],
  steps: [
    { from: 'client', to: 'ticket', proto: 'Event', summary: 'A ticket arrives: replace a failed disk', explain: ['The client\'s monitoring saw a disk fail and opens a remote-hands ticket: site, hall, rack, unit, serial, bay, the part, a priority (P3: within 4 hours) and the client contact.', 'Remote hands means simple tasks on request (reseat a cable, swap a disk); smart hands means more involved work, often with a written procedure (MOP).'], raw: `Ticket 48213 · Priority P3 · due 14:30
Site AMS-2, hall 3, rack C04, U30, S/N RL2611-012
Task: replace failed disk in bay 5 (RAID 1, hot-swap)
Part: 7.68 TB SAS SSD, PN 0X2DH3 · Contact: NOC +31 20 ...`, rawLabel: 'The ticket', state: { ticket: { text: 'new', tone: 'info' } } },
    { from: 'ticket', to: 'tech', proto: 'Event', summary: 'Read it all before moving', explain: ['Read the whole ticket and any attached procedure. Is the work inside an approved change window? Is anything unclear: which bay, whether the server may stay on, who to call?', 'Ask before you start, not halfway. A question costs minutes; a wrong pull costs a client outage.'], state: { tech: { text: 'scope clear', tone: 'ok' }, ticket: { text: 'accepted', tone: 'info' } } },
    { from: 'tech', to: 'spares', proto: 'Tool', summary: 'Get the part and check it matches', explain: ['Take the replacement from the client\'s spares (or the vendor shipment) and compare part numbers with the ticket and the failed drive\'s label. Note the new serial: it goes into the ticket and the asset records.', 'A wrong or incompatible part is found here, not in the rack.'], state: { spares: { text: 'PN matches', tone: 'ok' } } },
    { from: 'tech', to: 'rack', proto: 'Board', summary: 'Find the server and confirm it', explain: ['UID light on, rack and unit match, serial on the pull-out tag matches the ticket, amber fault light on bay 5. All four, or you stop.'], state: { rack: { text: 'located, bay 5 amber', tone: 'warn' } } },
    { from: 'tech', to: 'client', proto: 'Event', summary: 'Call before you pull', explain: ['Many clients want a go before any hands-on work: they check from their side that the array is healthy apart from that disk and that nothing else is running. Give your name, the ticket, the server and what you are about to do.'], state: { client: { text: 'go given', tone: 'ok' } } },
    { from: 'tech', to: 'rack', proto: 'Board', summary: 'Do the work, with photos before and after', explain: ['Photo of the front with the fault light and the serial tag; swap the disk; photo again with the new disk in place and its activity light.', 'Touch nothing else in the rack. If a cable is in the way, note it rather than re-route someone else\'s cabling.'], state: { rack: { text: 'new disk in, rebuilding', tone: 'info' } } },
    { from: 'rack', to: 'client', proto: 'Link', summary: 'The client confirms from their side', explain: ['The client sees the new disk and the rebuild running. Only they can confirm their service is fine; ask them to say so in the ticket.'], state: { client: { text: 'rebuild seen', tone: 'ok' } } },
    { from: 'tech', to: 'spares', proto: 'Tool', summary: 'The failed part: RMA or shred', explain: ['Log the failed drive\'s serial. Per the client\'s policy it goes back to the vendor with an RMA number, or stays on site for wiping or shredding: data-bearing parts never leave without permission.'], state: { spares: { text: 'RMA logged', tone: 'ok' } } },
    { from: 'tech', to: 'ticket', proto: 'Local', summary: 'Close with evidence and updated records', explain: ['Write what you did, the old and new serials, the times, the photos, and the client\'s confirmation. Update the asset database (DCIM): new serial in bay 5.', 'Anything still running (a rebuild) goes into the shift handover, so the next technician knows.'], raw: `48213 done 13:52. Bay 5 S6KNNA0T812345 -> S6KNNA0T899102 (PN 0X2DH3).
Photos before/after attached. Rebuild started 13:41, client confirmed 13:50.
Failed drive kept on site for shredding (client policy), log #771. DCIM updated.`, rawLabel: 'The closing note', state: { ticket: { text: 'closed', tone: 'ok' }, tech: { text: 'handover noted', tone: 'ok' } } },
    { from: 'tech', to: 'client', proto: 'Event', summary: 'When the facts do not match: stop and escalate', explain: ['If the serial is different, the fault light is on another bay, or a second disk is also failed: do not improvise. Stop, write what you found in the ticket, call the client and your shift lead, and wait for a decision.', 'Escalating is part of the job. Guessing on someone else\'s production server is not.'], state: { client: { text: 'informed', tone: 'info' } } },
  ],
}

export const FLOWS4: Record<string, Flow> = { isolate, 'remote-hands': remoteHands }

interface StepExtra {
  short: string
  tag?: StepTag
  key?: string
  m?: Record<string, string>
}

export const EXTRAS4: Record<string, { metrics: Metric[]; appear?: Record<string, number>; steps: StepExtra[] }> = {
  'remote-hands': {
    metrics: [
      { id: 'ticket', label: 'Ticket', start: '-' },
      { id: 'sla', label: 'Time left', start: '-' },
      { id: 'evidence', label: 'Evidence', start: 'none' },
    ],
    steps: [
      { short: 'Ticket', m: { ticket: 'new, P3', sla: '4 h' }, key: 'A ticket names place, serial, part, priority and contact.' },
      { short: 'Read it', tag: 'action', m: { ticket: 'accepted' }, key: 'Ask before you start, not halfway.' },
      { short: 'Part', tag: 'action', key: 'Check the part number before you walk to the rack.' },
      { short: 'Locate', tag: 'action', m: { sla: '3 h 20' }, key: 'Rack, UID light, serial, fault light: all must match.' },
      { short: 'Call', key: 'Get the go before hands-on work.' },
      { short: 'Swap', tag: 'action', m: { evidence: 'photos before/after' } },
      { short: 'Confirm', m: { evidence: '+ client confirmation' } },
      { short: 'RMA', key: 'Data-bearing parts leave only under the client\'s policy.' },
      { short: 'Close', tag: 'result', m: { ticket: 'closed', sla: 'met', evidence: 'complete' }, key: 'A ticket closes with evidence and updated records.' },
      { short: 'Escalate', tag: 'technique', key: 'When the facts differ: stop, write it down, escalate.' },
    ],
  },
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

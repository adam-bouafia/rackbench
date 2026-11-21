// The data center explorer: four zoom levels (data hall, row, rack, server), the parts you can
// click on each, and what they are. The numbers are typical values, not one real site.

export type Level = 'hall' | 'row' | 'rack' | 'server'
export type RackType = 'compute' | 'gpu' | 'network'
export type PartKind = 'patch' | 'mgmt' | 'tor' | 'fabric' | 'spine' | 'blank' | 'node' | 'storage' | 'gpu'

export interface Action {
  label: string
  hash: string
}
export interface Spot {
  title: string
  text: string
  lessons?: string[]
  actions?: Action[]
}
export interface Part {
  kind: PartKind
  u: number // bottom unit
  size: number
  id?: string
}

export const ROWS = ['A', 'B', 'C', 'D'] as const
export const RACKS_PER_ROW = 8

/** Rack types of each row, left to right. */
const ROW_TYPES: Record<string, RackType[]> = {
  A: ['network', 'network', 'compute', 'compute', 'compute', 'compute', 'compute', 'compute'],
  B: ['compute', 'compute', 'compute', 'compute', 'compute', 'compute', 'gpu', 'gpu'],
  C: ['compute', 'compute', 'compute', 'compute', 'compute', 'compute', 'compute', 'compute'],
  D: ['gpu', 'gpu', 'gpu', 'gpu', 'compute', 'compute', 'compute', 'compute'],
}
export const rackIds = (row: string) => Array.from({ length: RACKS_PER_ROW }, (_, i) => `${row}${String(i + 1).padStart(2, '0')}`)
export const rackType = (rack: string): RackType => ROW_TYPES[rack[0]]?.[Number(rack.slice(1)) - 1] ?? 'compute'
export const rowTypes = (row: string) => ROW_TYPES[row]

/** What is in a rack, from U42 down. */
export function rackParts(type: RackType): Part[] {
  const parts: Part[] = []
  const blanks = (from: number, to: number) => {
    for (let u = from; u >= to; u--) parts.push({ kind: 'blank', u, size: 1 })
  }
  if (type === 'network') {
    parts.push({ kind: 'patch', u: 42, size: 1 }, { kind: 'patch', u: 41, size: 1 }, { kind: 'patch', u: 40, size: 1 })
    parts.push({ kind: 'spine', u: 38, size: 1, id: 'spine01' }, { kind: 'spine', u: 37, size: 1, id: 'spine02' }, { kind: 'mgmt', u: 35, size: 1 })
    blanks(39, 39)
    blanks(36, 36)
    blanks(34, 1)
    return parts
  }
  parts.push({ kind: 'patch', u: 42, size: 1 }, { kind: 'mgmt', u: 41, size: 1 }, { kind: 'tor', u: 40, size: 1 })
  if (type === 'gpu') {
    parts.push({ kind: 'fabric', u: 39, size: 1 })
    blanks(38, 17)
    for (let i = 0; i < 4; i++) parts.push({ kind: 'gpu', u: 13 - i * 4, size: 4, id: `gpu${String(i + 1).padStart(2, '0')}` })
    return parts
  }
  blanks(39, 39)
  for (let i = 0; i < 24; i++) parts.push({ kind: 'node', u: 38 - i, size: 1, id: `node${String(i + 1).padStart(2, '0')}` })
  blanks(14, 5)
  parts.push({ kind: 'storage', u: 3, size: 2, id: 'stor01' }, { kind: 'storage', u: 1, size: 2, id: 'stor02' })
  return parts
}

const RACK_LAB: Action = { label: 'Build one in Rack Lab', hash: '#/lab' }
const RACK_SHIFT: Action = { label: 'Play Rack Shift', hash: '#/practice' }

export const LEVELS: Record<Level, { text: string; facts: string[]; lessons: string[]; hint: string; actions?: Action[] }> = {
  hall: {
    text: 'A room of racks, the power that feeds them and the air that cools them. The racks stand in rows that face each other, so every server takes cold air from the same aisle and blows hot air into the next one.',
    facts: [
      'Cold aisles get supply air at about 18 to 27 °C, the range ASHRAE recommends for server inlets.',
      'Every rack takes two power feeds, A and B, from separate UPS systems, so losing one side stops nothing.',
      'PUE is the total power of the site divided by the power of the IT equipment. The industry average is around 1.5; new large sites reach about 1.1 to 1.2.',
      'Racks arrive from the integration floor already built and tested, then roll into their row.',
    ],
    lessons: ['rack-journey', 'test-types', 'scale-test', 'gpu-rack'],
    hint: 'Click a row to walk into it, or any other part for what it does.',
    actions: [RACK_SHIFT],
  },
  row: {
    text: 'Eight racks side by side, all facing the cold aisle. Above them run the power and the network: two busways and a cable tray to the network row.',
    facts: [
      'Air flows front to back through every server: in from the cold aisle, out into the hot aisle.',
      'Servers cable to the switch in their own rack; only fiber uplinks leave the rack, through the tray.',
      'A GPU rack can draw several times the power of a compute rack.',
    ],
    lessons: ['rack-tour', 'lldp', 'bond', 'flaky', 'jumbo', 'thermal'],
    hint: 'Click a rack to open it.',
  },
  rack: {
    text: 'A 42U rack seen from the front. Switches on top, servers below, the heaviest servers at the bottom, a blanking panel in every open unit. The two PDUs are mounted at the back.',
    facts: [
      'One rack unit (U) is 44.45 mm, so a 42U rack is about 2 m tall.',
      'A loaded rack can weigh well over half a tonne: heavy servers go low so it cannot tip.',
      'Every server has two PSUs, one on PDU A and one on PDU B.',
      'Before it ships, every server is checked against the order, burned in and compared with its neighbours.',
    ],
    lessons: ['rack-tour', 'bom-check', 'outlier', 'ipmi-power', 'pxe', 'bios-update'],
    hint: 'Click a compute server to open it.',
    actions: [RACK_LAB, RACK_SHIFT],
  },
  server: {
    text: 'A 1U two-socket server from the top, with the lid off. Air enters at the front over the drives, the fan wall pulls it across the CPUs and the memory, and it leaves through the cards and the power supplies at the back.',
    facts: [
      'Each CPU has its own memory channels: a CPU and its DIMMs form one NUMA node.',
      'The BMC runs on standby power, so it answers over the network even when the server is off.',
      'Firmware is part of the build: the BIOS and BMC versions must match the baseline of the order.',
    ],
    lessons: ['server-anatomy', 'post-boot', 'storage', 'thermal', 'ipmi-power', 'tuning'],
    hint: 'Click a part for what it does and how it is tested.',
  },
}

export const SPOTS: Record<string, Spot> = {
  // data hall
  crah: {
    title: 'CRAH units',
    text: 'Computer room air handlers. Their fans push cold air into the cold aisles, here through a raised floor, and draw the hot air back over coils cooled with chilled water.',
    lessons: ['thermal'],
  },
  cold: {
    title: 'Cold aisle with containment',
    text: 'Doors and a roof close the cold aisle, so the supply air cannot mix with hot exhaust before it reaches the servers. Open rack units get blanking panels for the same reason.',
    lessons: ['thermal', 'rack-tour'],
    actions: [RACK_LAB],
  },
  hot: {
    title: 'Hot aisle',
    text: 'The backs of the racks blow into it, often at 35 to 45 °C. The air goes back to the CRAH units over the ceiling.',
    lessons: ['thermal'],
  },
  ups: {
    title: 'UPS and batteries',
    text: 'Uninterruptible power supplies carry the load on batteries for the seconds to minutes until the generators take over. Two independent systems feed side A and side B of every rack.',
    lessons: ['thermal', 'gpu-rack'],
  },
  busway: {
    title: 'Overhead busway',
    text: 'Power runs above each row in busbars with tap-off boxes. Each rack plugs its PDU A into the A busway and its PDU B into the B busway.',
    lessons: ['thermal'],
    actions: [RACK_LAB],
  },
  network: {
    title: 'Network racks',
    text: 'Spine switches and fiber patch panels. The top-of-rack switch of every rack has its uplinks here; a wrong or failing uplink is one of the things a cabling check finds.',
    lessons: ['lldp', 'flaky'],
  },
  staging: {
    title: 'Staging area',
    text: 'Racks come in on pallets, already built to the order, cabled, burned in and documented at the integration factory. That factory work is what Rack Shift lets you play: this one is order R-1042.',
    lessons: ['rack-journey'],
    actions: [RACK_SHIFT],
  },
  // row
  tray: {
    title: 'Cable tray',
    text: 'Fiber uplinks from each top-of-rack switch to the network row, two per switch so a single cable or optic can fail. LLDP shows which switch port each cable really lands on.',
    lessons: ['lldp', 'flaky'],
  },
  busA: {
    title: 'Busway A',
    text: 'Feeds PDU A of every rack in the row. With both feeds live each one carries about half the load; if B fails, A must carry everything, so a feed is planned to at most 80% of its rating.',
    lessons: ['thermal'],
    actions: [RACK_LAB],
  },
  busB: {
    title: 'Busway B',
    text: 'Feeds PDU B of every rack, from a different UPS than busway A. Testing a rack includes switching one feed off under load and checking that nothing goes down.',
    lessons: ['thermal'],
    actions: [RACK_LAB],
  },
  'rack-compute': {
    title: 'Compute rack',
    text: 'About 11 kW: 24 two-socket servers, 2 storage servers, a top-of-rack switch and a management switch.',
    lessons: ['rack-tour', 'scale-test'],
  },
  'rack-gpu': {
    title: 'GPU rack',
    text: 'Around 40 kW: four 8-GPU servers and a fabric switch. Racks like this draw more than air cooling handles comfortably, so many sites add rear-door heat exchangers or liquid cooling.',
    lessons: ['gpu-rack'],
  },
  'rack-network': {
    title: 'Network rack',
    text: 'Patch panels and the spine switches every top-of-rack switch in the hall connects to.',
    lessons: ['lldp'],
  },
  // rack
  patch: {
    title: 'Fiber patch panel',
    text: 'Where the uplink fibers from the switches meet the cables that run to the network row.',
    lessons: ['lldp'],
  },
  mgmt: {
    title: 'Management switch (1G)',
    text: 'Connects every BMC in the rack: the out-of-band network for power control, sensors, the event log and the remote console, even with the servers off.',
    lessons: ['ipmi-power', 'redfish', 'sel'],
  },
  tor: {
    title: 'Top-of-rack switch',
    text: 'Takes the two data ports of every server (25G, bonded for redundancy) and sends the traffic up to the spine over 100G uplinks. The MTU has to match end to end.',
    lessons: ['bond', 'jumbo', 'lldp'],
  },
  fabric: {
    title: 'Fabric switch (400G)',
    text: 'Connects the GPUs of different servers for collective operations such as all-reduce, tested with NCCL.',
    lessons: ['gpu-rack'],
  },
  spine: {
    title: 'Spine switch',
    text: 'Every top-of-rack switch in the hall connects to each spine, so any two servers are at most two switch hops apart.',
    lessons: ['lldp'],
  },
  blank: {
    title: 'Blanking panel',
    text: 'Closes an empty unit so hot exhaust cannot flow back to the front. Cheap, and one of the first things an integration check looks for.',
    lessons: ['thermal'],
    actions: [RACK_LAB],
  },
  storage: {
    title: '2U storage server',
    text: 'Twelve 16 TB drives behind an HBA or RAID controller. Heavy, so it sits at the bottom of the rack.',
    lessons: ['storage'],
  },
  gpu: {
    title: '8-GPU server (4U)',
    text: 'Eight GPUs on NVLink, two CPUs and 400G fabric ports, up to about 10 kW each. Its first checks: every GPU seen, the topology, DCGM diagnostics, then NCCL across servers.',
    lessons: ['gpu-rack'],
  },
  pduA: {
    title: 'PDU A (at the back)',
    text: 'A power strip fed by busway A, with metering per outlet. The rack is planned so that one PDU alone can carry everything in it.',
    lessons: ['thermal'],
    actions: [RACK_LAB],
  },
  pduB: {
    title: 'PDU B (at the back)',
    text: 'Fed by busway B. Every server has one PSU on PDU A and one on PDU B; a server with both cords on one side has no redundancy.',
    lessons: ['thermal'],
    actions: [RACK_LAB],
  },
  // server
  drives: {
    title: 'Front drive bays',
    text: 'Eight hot-swap NVMe drives behind a backplane. A drive that is not seated is not seen at all; a slow one stands out in fio against the same drives in the other servers.',
    lessons: ['storage', 'outlier'],
  },
  fans: {
    title: 'Fan wall',
    text: 'Seven fans that the BMC speeds up as temperatures rise. One failed fan shows up as a hot CPU and throttling under load.',
    lessons: ['thermal'],
  },
  cpus: {
    title: 'CPUs (two sockets)',
    text: 'Two processors linked to each other. Each one owns half of the memory and part of the PCIe lanes.',
    lessons: ['server-anatomy', 'tuning'],
  },
  dimms: {
    title: 'Memory: 16 DIMMs',
    text: 'Eight per CPU, populated the same way on both sides. A missing DIMM changes the total and unbalances the channels; correctable ECC errors in the event log point to one that is failing.',
    lessons: ['server-anatomy', 'bom-check'],
  },
  nic: {
    title: 'Network card: 2 × 25G',
    text: 'Two ports to the top-of-rack switch, bonded. The link speed, the MTU and the LLDP neighbour are checked on every port.',
    lessons: ['bond', 'jumbo', 'lldp'],
  },
  bmc: {
    title: 'BMC',
    text: 'A small computer on the board with its own network port: power control, sensors, the event log, a remote console and firmware updates, over IPMI and Redfish.',
    lessons: ['ipmi-power', 'redfish', 'sel'],
  },
  bios: {
    title: 'BIOS flash',
    text: 'Holds the firmware that starts the server: memory training, finding the devices, then the boot order, from disk or from the network.',
    lessons: ['post-boot', 'bios-update', 'pxe'],
  },
  psus: {
    title: 'Two power supplies',
    text: 'PSU 1 on feed A, PSU 2 on feed B. Either one can run the server alone, but the server only counts as redundant when both have input.',
    lessons: ['thermal'],
  },
}

export const PART_SPOT: Record<PartKind, string> = {
  patch: 'patch',
  mgmt: 'mgmt',
  tor: 'tor',
  fabric: 'fabric',
  spine: 'spine',
  blank: 'blank',
  node: 'node',
  storage: 'storage',
  gpu: 'gpu',
}

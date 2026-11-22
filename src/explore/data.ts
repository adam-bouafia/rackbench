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
  /** How a rack engineer checks it (server parts). */
  check?: string
  /** The words of docs/07 Part 2 this part teaches. */
  terms?: string[]
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
const BUILD: Action = { label: 'Build a server yourself', hash: '#/practice/build' }

export const LEVELS: Record<Level, { text: string; facts: string[]; lessons: string[]; hint: string; actions?: Action[]; parts?: string[] }> = {
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
    lessons: ['server-anatomy', 'raid-drives', 'post-boot', 'storage', 'thermal', 'ipmi-power', 'tuning'],
    hint: 'Click a part for what it does and how it is tested.',
    actions: [BUILD, { label: 'RAID and drives by hand', hash: '#/lesson/raid-drives' }],
    parts: ['chassis', 'front', 'drives', 'backplane', 'fans', 'sensors', 'cpus', 'upi', 'dimms', 'board', 'bios', 'bmc', 'm2', 'riser', 'nic', 'hba', 'psus'],
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
  // server: every part of docs Part 2, in the order of the parts list
  chassis: {
    title: 'Chassis (1U)',
    text: 'The metal box around everything: 1U high (44.45 mm), 19 inches wide, on rails in the rack. It holds the board, the fan wall, the drive backplane and the power supplies. The lid is off here.',
    check: 'Rails fitted, nothing bent, and the chassis model the order names.',
    terms: ['chassis', '1U', 'rails'],
    lessons: ['rack-tour'],
  },
  front: {
    title: 'Front panel and serial tag',
    text: 'On the rack ear: the power button, the UID (unit identify) LED and the status LEDs. A pull-out tag carries the serial number and, on many servers, the BMC MAC address and its own default password.',
    check: 'The serial on the tag matches the asset list for this rack unit and the serial in the firmware (dmidecode -s system-serial-number, ipmitool fru). In a full rack, turn the UID LED on (ipmitool chassis identify) to find the right server.',
    terms: ['serial number', 'UUID', 'FRU', 'UID LED', 'asset list'],
    lessons: ['bom-check', 'ipmi-power'],
  },
  drives: {
    title: 'Front drive bays: NVMe U.2',
    text: 'Eight hot-swap 2.5-inch U.2 bays with NVMe SSDs, which talk PCIe straight to the CPUs: the fastest kind of drive. Other servers put SATA or SAS drives here, or long thin E1.S rulers.',
    check: 'Every drive in the bay the order names, seen by the OS (lsblk, nvme list), healthy (smartctl -a) and as fast as the same drives in the other servers (fio). A drive that is not seated is not seen at all.',
    terms: ['SSD', 'NVMe', 'U.2', 'E1.S', 'hot-swap', 'SATA', 'SAS'],
    lessons: ['storage', 'raid-drives', 'outlier'],
  },
  backplane: {
    title: 'Drive backplane',
    text: 'The board behind the bays that every drive plugs into. It carries power and the data lanes: PCIe to the CPUs for NVMe, or cables to a RAID controller or HBA for SAS and SATA drives.',
    check: 'A drive missing in one bay: reseat it, then swap it with a drive from a working bay. If the fault stays with the bay, it is the backplane or its cable; if it moves with the drive, it is the drive.',
    terms: ['backplane', 'hot-swap', 'NVMe', 'SAS', 'SATA'],
    lessons: ['storage', 'raid-drives'],
  },
  fans: {
    title: 'Fan wall',
    text: 'Seven fans pull cold air in at the front and push it across the CPUs and the memory to the back. The BMC sets their speed from the temperature sensors.',
    check: 'Every fan reports a speed (ipmitool sdr type Fan). One failed fan shows up as a hot CPU and throttling under load.',
    terms: ['fans', 'airflow', 'SDR', 'throttling'],
    lessons: ['thermal'],
  },
  sensors: {
    title: 'Temperature sensors',
    text: 'Small sensors at the air inlet, on each CPU, near the memory and in the power supplies. The BMC reads them all the time, speeds the fans up as they warm, and logs an event when one crosses a threshold.',
    check: 'ipmitool sdr shows every reading with its thresholds. Under burn-in, compare them with the neighbours; a high inlet temperature is the room, not the server.',
    terms: ['sensor', 'threshold', 'SDR', 'SEL', 'inlet temperature'],
    lessons: ['thermal', 'sel'],
  },
  cpus: {
    title: 'CPUs (two sockets)',
    text: 'Two processors, Intel Xeon or AMD EPYC, each in its socket under a heatsink. Each CPU has many cores, and with hyper-threading each core runs two threads. Each CPU owns half of the memory and part of the PCIe lanes.',
    check: 'Model, sockets, cores per socket and threads per core match the BOM (lscpu). Under burn-in the temperature stays below the limit and the clock does not drop (turbostat).',
    terms: ['CPU', 'socket', 'core', 'thread', 'heatsink', 'lscpu'],
    lessons: ['server-anatomy', 'tuning'],
    actions: [BUILD],
  },
  upi: {
    title: 'The link between the CPUs (UPI)',
    text: 'The two sockets talk over a dedicated link: UPI on newer Intel Xeons (QPI before it), Infinity Fabric on AMD EPYC. A CPU with its own memory and PCIe devices is one NUMA node; reading the other CPU\'s memory crosses this link, so it is slower.',
    check: 'lscpu and numactl -H show two NUMA nodes. A slow benchmark can be NUMA placement, not a broken part: pin it to one node with numactl and run it again before you blame the hardware.',
    terms: ['UPI', 'QPI', 'Infinity Fabric', 'NUMA', 'NUMA node', 'numactl'],
    lessons: ['server-anatomy', 'tuning'],
  },
  dimms: {
    title: 'Memory: 16 RDIMMs',
    text: 'Eight slots per CPU, on its memory channels, filled in the order of the board\'s population table (first slot of each channel first: A1, B1, ...). Servers use registered DIMMs (RDIMM) with ECC, which corrects single-bit errors and reports them.',
    check: 'Count, size and slots match the BOM and the population table (dmidecode -t memory). A missing DIMM changes the total and unbalances the channels; correctable ECC errors in the event log during burn-in mean a DIMM is failing.',
    terms: ['DIMM', 'RDIMM', 'ECC', 'memory channel', 'population table'],
    lessons: ['server-anatomy', 'bom-check'],
    actions: [BUILD],
  },
  board: {
    title: 'Motherboard',
    text: 'The board everything plugs into: the two sockets, the memory slots, the PCIe slots and riser, the M.2 slot, the BIOS chip and the BMC. Supermicro names its generations, for example X13 for Intel and H13 for AMD; the board manual has the population table and the BMC chapter.',
    check: 'The firmware writes the hardware facts into the SMBIOS tables: vendor, board model, serial number, UUID, BIOS version and every DIMM. dmidecode reads them; the BMC keeps the FRU records (ipmitool fru).',
    terms: ['motherboard', 'X13 / H13', 'SMBIOS', 'dmidecode', 'UUID', 'FRU'],
    lessons: ['server-anatomy', 'bom-check'],
  },
  bios: {
    title: 'BIOS flash',
    text: 'The chip with the firmware that starts the server: POST (memory training, finding every device), then the boot order: disk, network (PXE) or virtual media.',
    check: 'Its version matches the baseline of the order on every server (dmidecode -s bios-version). Updated with SUM, one server first, then the rest.',
    terms: ['BIOS', 'UEFI', 'POST', 'boot order', 'firmware baseline'],
    lessons: ['post-boot', 'bios-update', 'pxe'],
  },
  bmc: {
    title: 'BMC',
    text: 'A small computer on the board with its own network port: power control, sensors, the event log, a remote console, virtual media and firmware updates, over IPMI and Redfish. It runs on standby power.',
    check: 'Reachable on the management network, its firmware on the baseline (ipmitool mc info), the event log saved and cleared after every test run.',
    terms: ['BMC', 'IPMI', 'Redfish', 'SEL', 'out of band'],
    lessons: ['ipmi-power', 'redfish', 'sel'],
  },
  m2: {
    title: 'M.2 boot drive',
    text: 'A small NVMe card that lies flat on the board (M.2 2280: 22 by 80 mm). It often holds the operating system, so the front bays stay free for data. It is not hot-swap: the server has to be opened to change it.',
    check: 'Seen by the OS like any other drive (nvme list), with the model and firmware the order names.',
    terms: ['M.2', 'boot drive', 'NVMe'],
    lessons: ['storage', 'raid-drives'],
  },
  riser: {
    title: 'PCIe riser and slots',
    text: 'A small board that turns PCIe slots sideways, so full cards fit flat in a 1U chassis. This riser has two slots, x16 and x8, both PCIe Gen5. A slot has 4, 8 or 16 lanes, and each generation doubles the speed per lane: Gen3, Gen4 and Gen5 carry about 1, 2 and 4 GB/s per lane each way.',
    check: 'Every card trains at its full width and speed: lspci -vv shows LnkCap (what it can do) and LnkSta (what it got). Narrower than capable is a fault: seating, the wrong slot, or a damaged card or riser.',
    terms: ['riser', 'PCIe', 'lane', 'x4 / x8 / x16', 'Gen3 / Gen4 / Gen5', 'link training', 'LnkCap / LnkSta'],
    lessons: ['server-anatomy', 'tuning'],
  },
  nic: {
    title: 'Network card: 2 × 25G',
    text: 'Two ports to the top-of-rack switch, bonded, in the x16 slot of the riser. The onboard ports and the BMC port are separate.',
    check: 'Link up at the right speed on both ports (ethtool), the right LLDP neighbour on each, bonded as planned, the MTU end to end, and the card at full PCIe width.',
    terms: ['NIC', '25G', 'bond', 'MTU', 'LLDP', 'ethtool'],
    lessons: ['bond', 'jumbo', 'lldp'],
  },
  hba: {
    title: 'Storage controller: RAID controller or HBA',
    text: 'An optional card in the x8 slot. A RAID controller combines disks into virtual disks (RAID 0, 1, 5, 6, 10); an HBA passes every disk through as it is (JBOD), for software such as ZFS or Ceph. The NVMe drives of this server go straight to the CPUs; a card like this is for SAS and SATA drives or an external disk shelf.',
    check: 'The BOM says which one, with its model and firmware. Check the virtual disks and their state with the vendor tool (for Broadcom cards, storcli), and that the OS sees the right number of disks.',
    terms: ['RAID controller', 'HBA', 'RAID 0 / 1 / 5 / 6 / 10', 'JBOD'],
    lessons: ['storage', 'raid-drives'],
  },
  psus: {
    title: 'Two power supplies (1+1)',
    text: 'PSU 1 on feed A, PSU 2 on feed B. Either one can run the server alone, but the server only counts as redundant when both have input. Hot air leaves through them at the back.',
    check: 'Both show input (ipmitool sdr type "Power Supply"). During burn-in, switch one feed off: nothing may go down, and the event log records it.',
    terms: ['PSU', '1+1', 'PDU', 'feed A / B'],
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

// Rack Shift: one shift on a rack integration floor. Three orders; for each rack the player
// builds it, checks the cabling, powers it on and checks it against the order, burns it in,
// writes the report and ships it. Everything here is data and pure functions; the screen is
// in RackShift.tsx.

export type Kind = 'node' | 'stor' | 'gpu' | 'tor' | 'mgmt' | 'blank'
export type ServerKind = 'node' | 'stor' | 'gpu'
export type Stage = 'build' | 'cable' | 'power' | 'burnin' | 'report'
export type TestStage = 'cable' | 'power' | 'burnin'
export type Cause = 'assembly' | 'cabling' | 'firmware' | 'part'
export type Port = 'BMC' | 'P1' | 'P2'

export const KINDS: Record<Kind, { label: string; size: number; watts: number; heavy: boolean; server: boolean; cls: string }> = {
  node: { label: '1U compute server', size: 1, watts: 450, heavy: false, server: true, cls: 'srv1' },
  stor: { label: '2U storage server', size: 2, watts: 700, heavy: true, server: true, cls: 'stor2' },
  gpu: { label: '2U GPU server', size: 2, watts: 1800, heavy: true, server: true, cls: 'gpu2' },
  tor: { label: '1U data switch', size: 1, watts: 150, heavy: false, server: false, cls: 'sw' },
  mgmt: { label: '1U management switch', size: 1, watts: 60, heavy: false, server: false, cls: 'sw' },
  blank: { label: 'Blanking panel', size: 1, watts: 0, heavy: false, server: false, cls: 'blank' },
}
const PREFIX: Record<Kind, string> = { node: 'node', stor: 'stor', gpu: 'gpu', tor: 'tor', mgmt: 'mgmt', blank: 'blank' }

export const RACK_U = 24
export const FEED_W = 230 * 32
export const FEED_LIMIT = FEED_W * 0.8
export const BASELINE = { bios: '1.4', bmc: '2.1' }

export const STAGES: { id: Stage; title: string; why: string }[] = [
  { id: 'build', title: 'Build', why: 'Build the rack from the order. Placement has reasons: switches on top for short cable runs, heavy servers low so the rack cannot tip, blanking panels so hot air cannot flow back to the front, and a load that one feed can carry alone.' },
  { id: 'cable', title: 'Cabling', why: 'The cabling team has run every cable. Before any test, compare the LLDP neighbour of every port with the cabling plan. A swapped cable still links, so only this check finds it.' },
  { id: 'power', title: 'Power on', why: 'Power on through the BMC and compare what every server reports with the order: CPUs, memory, drives, cards, firmware versions and both power supplies. A part missing at POST is usually not seated.' },
  { id: 'burnin', title: 'Burn-in', why: 'Run every server at full load for hours (seconds here), then read the results against the test plan. A fix is not done until the server passes the test again.' },
  { id: 'report', title: 'Report', why: 'The report ships with the rack. Every issue needs its evidence, the output that showed it, and a root cause, so the same fault is caught earlier next time.' },
]

export interface Spec {
  cpus: string
  mem: string
  memBad: string
  drives: string
  drivesBad: string
  extra: string
  fio: number
  net: number
  netMin: number
  port: '25G' | '100G'
  slow: string
}
export const SPEC: Record<ServerKind, Spec> = {
  node: { cpus: '2 × 32 cores', mem: '512 GB · 16 DIMMs', memBad: '480 GB · 15 DIMMs', drives: '2 × 3.84 TB NVMe', drivesBad: '1 × 3.84 TB NVMe', extra: '2 × 25G NIC', fio: 45.2, net: 23.5, netMin: 22, port: '25G', slow: '9.4' },
  stor: { cpus: '2 × 24 cores', mem: '256 GB · 8 DIMMs', memBad: '224 GB · 7 DIMMs', drives: '12 × 16 TB HDD, 2 NVMe', drivesBad: '11 × 16 TB HDD, 2 NVMe', extra: '2 × 25G NIC', fio: 51.6, net: 23.4, netMin: 22, port: '25G', slow: '9.4' },
  gpu: { cpus: '2 × 48 cores', mem: '1 TB · 16 DIMMs', memBad: '960 GB · 15 DIMMs', drives: '2 × 7.68 TB NVMe', drivesBad: '1 × 7.68 TB NVMe', extra: '4 GPU, 2 × 100G NIC', fio: 48.3, net: 94.1, netMin: 90, port: '100G', slow: '23.5' },
}

interface OrderDef {
  title: string
  ref: string
  customer: string
  items: Partial<Record<Kind, number>>
  faults: Record<TestStage, number>
}
export const ORDERS: OrderDef[] = [
  { title: 'Edge rack', ref: 'R-1041', customer: 'a regional hosting company', items: { node: 4, tor: 1, mgmt: 1 }, faults: { cable: 1, power: 1, burnin: 1 } },
  { title: 'Storage rack', ref: 'R-1042', customer: 'a university research group', items: { node: 4, stor: 2, tor: 1, mgmt: 1 }, faults: { cable: 1, power: 2, burnin: 2 } },
  { title: 'GPU rack', ref: 'R-1043', customer: 'an AI start-up', items: { gpu: 2, node: 4, tor: 1, mgmt: 1 }, faults: { cable: 2, power: 2, burnin: 2 } },
]

export type DefectKind =
  | 'swap' | 'bmc-port' | 'unplugged' | 'crossed'
  | 'dimm' | 'drive' | 'bios-old' | 'bios-new' | 'bmc-old' | 'psu'
  | 'fan' | 'ecc' | 'slow-disk' | 'link'

export interface Defect {
  id: string
  kind: DefectKind
  stage: TestStage
  server: string
  other?: string
  found: 'you' | 'qa' | null
  fixed: boolean
  retested: boolean
}

export interface Item {
  id: string
  kind: Kind
}
export interface Placed extends Item {
  u: number
}

export interface Order extends OrderDef {
  index: number
  list: Item[]
  servers: Item[]
  n: Record<string, number>
  kindOf: Record<string, Kind>
  defects: Defect[]
  fixes: Record<string, string[]>
  evidence: Record<string, string[]>
  jitter: Record<string, { temp: number; fio: number; net: number }>
}

// ---------- the faults ----------

export const CAUSES: { id: Cause; label: string }[] = [
  { id: 'assembly', label: 'Assembly: a part or cord not seated' },
  { id: 'cabling', label: 'Cabling: cable, optic or port' },
  { id: 'firmware', label: 'Firmware: not on the baseline' },
  { id: 'part', label: 'Faulty part: replace it' },
]

type Ctx = { n: Record<string, number>; kindOf: Record<string, Kind> }
const spec = (o: Ctx, id: string) => SPEC[o.kindOf[id] as ServerKind]

interface DefectSpec {
  stage: TestStage
  cause: Cause
  symptom: (d: Defect, o: Ctx) => string
  evidence: (d: Defect, o: Ctx) => string
  fixes: string[] // the first is the right one
  explain: string
}

export const DEFECTS: Record<DefectKind, DefectSpec> = {
  swap: {
    stage: 'cable',
    cause: 'cabling',
    symptom: (d) => `${d.server} P1 and ${d.other} P1 swapped at the switch`,
    evidence: (d, o) => `lldpctl on ${d.server}: P1 sees tor01 Eth1/${o.n[d.other!]}`,
    fixes: ['Re-cable to the plan'],
    explain: 'Two cables were swapped at the switch. Both ports still link, so only LLDP shows it. Compare every neighbour with the plan before any test runs.',
  },
  'bmc-port': {
    stage: 'cable',
    cause: 'cabling',
    symptom: (d) => `${d.server} BMC cabled to the data switch`,
    evidence: (d, o) => `lldpctl on ${d.server}: BMC sees tor01 Eth1/${40 + o.n[d.server]}`,
    fixes: ['Re-cable to the plan'],
    explain: 'The BMC cable sits in the data switch, so the BMC gets no address on the management network and nobody can power the server on or off remotely.',
  },
  unplugged: {
    stage: 'cable',
    cause: 'cabling',
    symptom: (d) => `${d.server} P2 not connected`,
    evidence: (d) => `ip link on ${d.server}: P2 NO-CARRIER, no LLDP neighbour`,
    fixes: ['Re-cable to the plan'],
    explain: 'No neighbour and no carrier: the cable is not plugged in at one end. The bond would run on one link and fail its redundancy test later.',
  },
  crossed: {
    stage: 'cable',
    cause: 'cabling',
    symptom: (d) => `${d.server} P1 and P2 crossed`,
    evidence: (d, o) => `lldpctl on ${d.server}: P1 sees tor01 Eth1/${o.n[d.server] + 24}`,
    fixes: ['Re-cable to the plan'],
    explain: 'P1 and P2 are crossed on one server. Both links work, but the switch settings of each port (VLANs, bond members) now land on the wrong interface.',
  },
  dimm: {
    stage: 'power',
    cause: 'assembly',
    symptom: (d) => `${d.server}: one DIMM not detected`,
    evidence: (d) => `dmidecode -t memory on ${d.server}: DIMM_D1 "No Module Installed"`,
    fixes: ['Reseat the DIMM in slot D1, then count again', 'Update the BIOS to the baseline', 'Replace both CPUs', 'Accept it: the capacity is close enough'],
    explain: 'A DIMM that is not fully latched is not seen at POST. Reseat it and count again; if it is still missing, move it to another slot to learn whether the DIMM or the slot is bad.',
  },
  drive: {
    stage: 'power',
    cause: 'assembly',
    symptom: (d) => `${d.server}: one drive not detected`,
    evidence: (d) => `lsblk on ${d.server}: one drive fewer than the order, bay 1 empty`,
    fixes: ['Reseat the drive in its bay, then check again', 'Reinstall the operating system', 'Replace the backplane', 'Accept it: the OS still boots'],
    explain: 'A drive not fully pushed into its bay is not seen by the controller. Reseat it before you suspect the drive or the backplane.',
  },
  'bios-old': {
    stage: 'power',
    cause: 'firmware',
    symptom: (d) => `${d.server}: BIOS 1.3, baseline 1.4`,
    evidence: (d) => `dmidecode -s bios-version on ${d.server}: 1.3`,
    fixes: ['Update the BIOS to the baseline 1.4', 'Update the BIOS to the newest release, 1.5', 'Leave it: the server boots'],
    explain: 'The order names a firmware baseline. Every server runs exactly that version, so results are comparable and the customer gets the setup they validated.',
  },
  'bios-new': {
    stage: 'power',
    cause: 'firmware',
    symptom: (d) => `${d.server}: BIOS 1.5, baseline 1.4`,
    evidence: (d) => `dmidecode -s bios-version on ${d.server}: 1.5`,
    fixes: ['Flash the baseline 1.4 so the rack matches', 'Leave it: newer is better', 'Update the other servers to 1.5'],
    explain: 'Newer is not the baseline. The customer validated 1.4; a server on 1.5 is a deviation. Changing the baseline is the customer’s decision, not the bench’s.',
  },
  'bmc-old': {
    stage: 'power',
    cause: 'firmware',
    symptom: (d) => `${d.server}: BMC 2.0, baseline 2.1`,
    evidence: (d) => `ipmitool mc info on ${d.server}: Firmware Revision 2.0`,
    fixes: ['Update the BMC firmware to the baseline 2.1', 'Reset the BMC (mc reset cold)', 'Leave it: the BMC answers'],
    explain: 'The BMC firmware is part of the baseline too. Update it like the BIOS and record both versions in the report.',
  },
  psu: {
    stage: 'power',
    cause: 'assembly',
    symptom: (d) => `${d.server}: PSU 2 has no input`,
    evidence: (d) => `ipmitool sdr type "Power Supply" on ${d.server}: PS2 AC lost`,
    fixes: ['Plug PSU 2 into feed B and check both inputs', 'Replace PSU 1', 'Leave it: one PSU runs the server'],
    explain: 'With one cord unplugged the server runs, but it has lost its redundancy: losing feed A would stop it. Both PSUs need input, from different feeds.',
  },
  fan: {
    stage: 'burnin',
    cause: 'part',
    symptom: (d) => `${d.server}: CPU at 97 °C and throttling under load`,
    evidence: (d) => `ipmitool sel on ${d.server}: Fan FAN4 Lower Critical going low`,
    fixes: ['Replace fan 4, then retest', 'Lower the burn-in load', 'Raise the temperature limit in the BIOS', 'Update the BIOS'],
    explain: 'One fan failed under load, so the CPU got hot and throttled. Throttling looks like low performance: read temperatures and throttle time, not only the benchmark.',
  },
  ecc: {
    stage: 'burnin',
    cause: 'part',
    symptom: (d) => `${d.server}: correctable ECC errors on DIMM C1`,
    evidence: (d) => `ipmitool sel on ${d.server}: 37 × Memory Correctable ECC, DIMM C1`,
    fixes: ['Replace DIMM C1, then retest', 'Ignore it: correctable errors are corrected', 'Reseat every DIMM in the server', 'Update the BMC'],
    explain: 'Correctable errors are corrected, but a DIMM that logs dozens during burn-in is failing. Replace it before it ships; the SEL names the slot.',
  },
  'slow-disk': {
    stage: 'burnin',
    cause: 'part',
    symptom: (d) => `${d.server}: drive about 30% under the rack median`,
    evidence: (d, o) => `fio on ${d.server}: ${(spec(o, d.server).fio * 0.68).toFixed(1)}k IOPS, median ${spec(o, d.server).fio}k`,
    fixes: ['Replace the drive, then retest', 'Run fio again until it passes', 'Accept it: fio numbers vary', 'Update the BIOS'],
    explain: 'Drives of the same model perform about the same. One far under the rack median is replaced; running the test again until it passes hides the fault.',
  },
  link: {
    stage: 'burnin',
    cause: 'cabling',
    symptom: (d, o) => `${d.server}: P1 below its ${spec(o, d.server).port} speed`,
    evidence: (d, o) => `ethtool P1 on ${d.server}: Speed ${spec(o, d.server).port === '25G' ? '10000' : '25000'}Mb/s on a ${spec(o, d.server).port} port`,
    fixes: ['Replace the cable or optic on P1, then retest', 'Raise the MTU to 9000', 'Replace the CPU', 'Accept it: the link is up'],
    explain: 'The link came up at a lower speed: 9.4 Gbit/s is a full 10G link, 23.5 a full 25G link. ethtool shows the negotiated speed; the usual cause is the cable or the optic.',
  },
}

const POOLS: Record<TestStage, DefectKind[]> = {
  cable: ['swap', 'bmc-port', 'unplugged', 'crossed'],
  power: ['dimm', 'drive', 'bios-old', 'bios-new', 'bmc-old', 'psu'],
  burnin: ['fan', 'ecc', 'slow-disk', 'link'],
}

const GENERIC = [
  'ipmitool sdr: all sensors within thresholds',
  'dmesg: no hardware errors',
  'stress-ng: 0 errors, all stressors passed',
  'ping -M do -s 8972 to every node: 0% loss',
  'smartctl -H: PASSED on every drive',
]

// ---------- making an order ----------

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], r: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ORDER_OF: Kind[] = ['node', 'stor', 'gpu', 'tor', 'mgmt']

export function makeOrder(index: number, seed: number): Order {
  const def = ORDERS[index]
  const r = rng(seed * 7 + index * 101 + 13)
  const list: Item[] = []
  for (const kind of ORDER_OF) {
    const count = def.items[kind] ?? 0
    for (let i = 1; i <= count; i++) list.push({ id: `${PREFIX[kind]}${String(i).padStart(2, '0')}`, kind })
  }
  const servers = list.filter((i) => KINDS[i.kind].server)
  const n = Object.fromEntries(servers.map((s, i) => [s.id, i + 1]))
  const kindOf = Object.fromEntries(list.map((i) => [i.id, i.kind]))
  const ctx = { n, kindOf }

  const defects: Defect[] = []
  for (const stage of ['cable', 'power', 'burnin'] as TestStage[]) {
    const kinds = shuffle(POOLS[stage], r).slice(0, def.faults[stage])
    const used = new Set<string>()
    for (const kind of kinds) {
      const free = shuffle(servers.filter((s) => !used.has(s.id)), r)
      const x = free[0]
      used.add(x.id)
      let other: string | undefined
      if (kind === 'swap') {
        other = free[1].id
        used.add(other)
      }
      defects.push({ id: `${kind}-${x.id}`, kind, stage, server: x.id, other, found: null, fixed: false, retested: false })
    }
  }

  const fixes: Record<string, string[]> = {}
  const evidence: Record<string, string[]> = {}
  const allEvidence = defects.map((d) => DEFECTS[d.kind].evidence(d, ctx))
  for (const d of defects) {
    fixes[d.id] = DEFECTS[d.kind].fixes.length > 1 ? shuffle(DEFECTS[d.kind].fixes, r) : DEFECTS[d.kind].fixes
    const right = DEFECTS[d.kind].evidence(d, ctx)
    const others = shuffle([...allEvidence.filter((e) => e !== right), ...GENERIC], r).slice(0, 2)
    evidence[d.id] = shuffle([right, ...others], r)
  }
  const jitter = Object.fromEntries(servers.map((s) => [s.id, { temp: 66 + Math.round(r() * 10), fio: 0.97 + r() * 0.05, net: (r() - 0.5) * 0.3 }]))
  return { ...def, index, list, servers, n, kindOf, defects, fixes, evidence, jitter }
}

// ---------- build ----------

export function occupied(rack: Placed[]) {
  const map = new Map<number, Placed>()
  for (const p of rack) for (let k = 0; k < KINDS[p.kind].size; k++) map.set(p.u + k, p)
  return map
}

export function fits(rack: Placed[], kind: Kind, u: number) {
  const occ = occupied(rack)
  const size = KINDS[kind].size
  if (u < 1 || u + size - 1 > RACK_U) return false
  for (let k = 0; k < size; k++) if (occ.has(u + k)) return false
  return true
}

export function rackLoad(rack: Placed[]) {
  return rack.reduce((s, p) => s + KINDS[p.kind].watts, 0)
}

export function buildRules(order: Order, rack: Placed[]) {
  const occ = occupied(rack)
  const missing = order.list.filter((i) => !rack.some((p) => p.id === i.id))
  const lowSwitch = rack.filter((p) => (p.kind === 'tor' || p.kind === 'mgmt') && p.u < RACK_U - 3)
  const highHeavy = rack.filter((p) => KINDS[p.kind].heavy && p.u + KINDS[p.kind].size - 1 > RACK_U / 2)
  const open = Array.from({ length: RACK_U }, (_, i) => i + 1).filter((u) => !occ.has(u))
  const load = rackLoad(rack)
  return [
    { ok: missing.length === 0, title: 'Everything on the order is in the rack', fail: `Still on the cart: ${missing.map((i) => i.id).join(', ')}.` },
    { ok: lowSwitch.length === 0, title: 'Switches in the top four units', fail: `Move up: ${lowSwitch.map((p) => `${p.id} (U${p.u})`).join(', ')}. Every server cables up to them, so they sit on top.` },
    { ok: highHeavy.length === 0, title: 'Heavy servers in the lower half (U1 to U12)', fail: `Move down: ${highHeavy.map((p) => `${p.id} (U${p.u})`).join(', ')}. A top-heavy rack can tip when a server slides out on its rails.` },
    { ok: open.length === 0, title: 'Blanking panels in every open unit', fail: `${open.length} open unit${open.length === 1 ? '' : 's'}. Through an open unit, hot exhaust air flows back to the cold front.` },
    { ok: load <= FEED_LIMIT, title: 'One feed can carry the whole rack', fail: `${load} W is over ${FEED_LIMIT} W, 80% of one 230 V × 32 A feed.` },
  ]
}

// ---------- cabling ----------

export const PORTS: Port[] = ['BMC', 'P1', 'P2']

export function planned(n: number, port: Port) {
  if (port === 'BMC') return `mgmt01 Gi1/0/${n}`
  return `tor01 Eth1/${port === 'P1' ? n : n + 24}`
}

export function cableDefect(defects: Defect[], server: string, port: Port) {
  return defects.find(
    (d) =>
      d.stage === 'cable' &&
      !d.fixed &&
      ((d.kind === 'swap' && port === 'P1' && (d.server === server || d.other === server)) ||
        (d.kind === 'bmc-port' && port === 'BMC' && d.server === server) ||
        (d.kind === 'unplugged' && port === 'P2' && d.server === server) ||
        (d.kind === 'crossed' && port !== 'BMC' && d.server === server)),
  )
}

export function lldp(order: Order, defects: Defect[], server: string, port: Port) {
  const n = order.n[server]
  const d = cableDefect(defects, server, port)
  if (!d) return planned(n, port)
  if (d.kind === 'swap') return planned(order.n[d.server === server ? d.other! : d.server], 'P1')
  if (d.kind === 'bmc-port') return `tor01 Eth1/${40 + n}`
  if (d.kind === 'unplugged') return 'none (no carrier)'
  return planned(n, port === 'P1' ? 'P2' : 'P1')
}

// ---------- power on and inventory ----------

export type PCol = 'cpus' | 'mem' | 'drives' | 'extra' | 'bios' | 'bmc' | 'psu'
export const PCOLS: { id: PCol; label: string; cmd: string }[] = [
  { id: 'cpus', label: 'CPUs', cmd: 'lscpu' },
  { id: 'mem', label: 'Memory', cmd: 'dmidecode -t memory' },
  { id: 'drives', label: 'Drives', cmd: 'lsblk; nvme list' },
  { id: 'extra', label: 'Cards', cmd: 'lspci' },
  { id: 'bios', label: 'BIOS', cmd: 'dmidecode -s bios-version' },
  { id: 'bmc', label: 'BMC', cmd: 'ipmitool mc info' },
  { id: 'psu', label: 'PSUs', cmd: 'ipmitool sdr type "Power Supply"' },
]
const PCOL_OF: Partial<Record<DefectKind, PCol>> = { dimm: 'mem', drive: 'drives', 'bios-old': 'bios', 'bios-new': 'bios', 'bmc-old': 'bmc', psu: 'psu' }

export function expectedCell(kind: ServerKind, col: PCol) {
  const s = SPEC[kind]
  return { cpus: s.cpus, mem: s.mem, drives: s.drives, extra: s.extra, bios: BASELINE.bios, bmc: BASELINE.bmc, psu: '2 of 2 with input' }[col]
}

export function powerCell(order: Order, defects: Defect[], server: string, col: PCol) {
  const kind = order.kindOf[server] as ServerKind
  const d = defects.find((x) => x.stage === 'power' && x.server === server && !x.fixed && PCOL_OF[x.kind] === col)
  if (!d) return { value: expectedCell(kind, col), defect: undefined }
  const value = { dimm: SPEC[kind].memBad, drive: SPEC[kind].drivesBad, 'bios-old': '1.3', 'bios-new': '1.5', 'bmc-old': '2.0', psu: '1 of 2 with input' }[d.kind as 'dimm']
  return { value, defect: d }
}

// ---------- burn-in ----------

export type BCol = 'err' | 'temp' | 'thr' | 'fio' | 'net' | 'sel'
export const BCOLS: { id: BCol; label: string; rule: string }[] = [
  { id: 'err', label: 'Errors', rule: 'stress-ng --verify: 0 errors' },
  { id: 'temp', label: 'Max °C', rule: 'CPU at most 85 °C' },
  { id: 'thr', label: 'Throttled', rule: 'no throttling: 0 s' },
  { id: 'fio', label: 'fio k IOPS', rule: 'within 15% of the median of the same server type' },
  { id: 'net', label: 'iperf3 Gb/s', rule: 'at least 22 on 25G ports, 90 on 100G ports' },
  { id: 'sel', label: 'New SEL', rule: 'no new events in the system event log' },
]
const BCOLS_OF: Partial<Record<DefectKind, BCol[]>> = { fan: ['temp', 'thr', 'sel'], ecc: ['sel'], 'slow-disk': ['fio'], link: ['net'] }

export function burnCell(order: Order, defects: Defect[], server: string, col: BCol) {
  const kind = order.kindOf[server] as ServerKind
  const s = SPEC[kind]
  const j = order.jitter[server]
  const d = defects.find((x) => x.stage === 'burnin' && x.server === server && !x.retested && BCOLS_OF[x.kind]?.includes(col))
  const k = d?.kind
  const value = {
    err: '0',
    temp: k === 'fan' ? '97' : String(j.temp),
    thr: k === 'fan' ? '1260 s' : '0 s',
    fio: (k === 'slow-disk' ? s.fio * 0.68 : s.fio * j.fio).toFixed(1),
    net: k === 'link' ? s.slow : (s.net + j.net).toFixed(1),
    sel: k === 'fan' ? 'FAN4 low' : k === 'ecc' ? '37 × ECC C1' : 'none',
  }[col]
  return { value, defect: d }
}

export function medianFio(order: Order, defects: Defect[], kind: ServerKind) {
  const vals = order.servers.filter((s) => s.kind === kind).map((s) => Number(burnCell(order, defects, s.id, 'fio').value)).sort((a, b) => a - b)
  const m = Math.floor(vals.length / 2)
  return vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2
}

export function bcolsOf(kind: DefectKind) {
  return BCOLS_OF[kind] ?? []
}
export function pcolOf(kind: DefectKind) {
  return PCOL_OF[kind]
}

// ---------- scoring ----------

export const POINTS = { build: 40, buildFail: 10, find: 15, wrong: 5, qa: 15, evidence: 10, cause: 10 }

export function maxPoints(order: Order) {
  return POINTS.build + order.defects.length * (POINTS.find + POINTS.evidence + POINTS.cause)
}

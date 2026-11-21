import type { Metric, StepTag } from '../engine/types'

// Presentation extras for the step-through lessons: metrics above the diagram, when each device
// appears, and per step a short stepper label, a tag, a key idea and the metric values that change.
// Steps are 1-based here, like the stepper.

interface StepExtra {
  short: string
  tag?: StepTag
  key?: string
  m?: Record<string, string>
}

interface FlowExtra {
  metrics: Metric[]
  appear?: Record<string, number>
  steps: StepExtra[]
}

export const EXTRAS: Record<string, FlowExtra> = {
  'ipmi-power': {
    metrics: [
      { id: 'session', label: 'Session', start: 'none' },
      { id: 'cipher', label: 'Cipher suite', start: '-' },
      { id: 'priv', label: 'Privilege', start: '-' },
      { id: 'power', label: 'Server power', start: 'off' },
    ],
    appear: { board: 11 },
    steps: [
      { short: 'Ask', m: { session: 'starting' } },
      { short: 'Capabilities' },
      { short: 'Propose suite', m: { cipher: '17 (SHA256)' }, key: 'The cipher suite is chosen per session with -C. Current firmware often refuses the old suite 3.' },
      { short: 'Accepted', m: { session: 'negotiating' } },
      { short: 'RAKP 1' },
      { short: 'RAKP 2', key: 'The password never crosses the wire: each side proves it knows it with an HMAC.' },
      { short: 'RAKP 3' },
      { short: 'RAKP 4', m: { session: 'open, encrypted' } },
      { short: 'Privilege', m: { priv: 'Administrator' } },
      { short: 'Power up', key: 'Every power action is one byte of Chassis Control: up, down, cycle, hard reset, soft off.' },
      { short: 'Button', tag: 'event', m: { power: 'on, POST' }, key: 'The BMC runs on standby power, so it works while the server itself is off.' },
      { short: 'Done' },
      { short: 'Close', m: { session: 'closed', priv: '-' } },
    ],
  },
  'ipmi-boot': {
    metrics: [
      { id: 'flag', label: 'Boot flag', start: 'none' },
      { id: 'power', label: 'Power', start: 'on' },
      { id: 'boots', label: 'Boots from', start: 'disk' },
    ],
    appear: { bios: 3, nic: 6 },
    steps: [
      { short: 'Set flag', m: { flag: 'PXE, once' }, key: 'The next boot device is stored in the BMC; the BIOS reads it at every start.' },
      { short: 'Cycle', m: { power: 'cycling' } },
      { short: 'POST', m: { power: 'on, POST' } },
      { short: 'Ask BMC', key: 'BIOS and BMC talk over an internal interface (KCS or SSIF), not over the network.' },
      { short: 'Answer' },
      { short: 'To NIC', m: { boots: 'network' } },
      { short: 'Cleared', tag: 'result', m: { flag: 'cleared' }, key: 'After a network boot, set the disk back and read the setting back.' },
    ],
  },
  redfish: {
    metrics: [
      { id: 'session', label: 'Session', start: 'none' },
      { id: 'boot', label: 'Boot override', start: 'None' },
      { id: 'power', label: 'Power', start: 'On' },
    ],
    appear: { host: 6 },
    steps: [
      { short: 'Root' },
      { short: 'Links', key: 'Redfish is discoverable: follow the @odata.id links, never guess a path.' },
      { short: 'Log in' },
      { short: 'Token', m: { session: 'open (7)' }, key: 'Log in once per BMC and reuse the X-Auth-Token.' },
      { short: 'Systems' },
      { short: 'System' },
      { short: 'Set PXE', key: 'A boot override is a PATCH; power is a POST to an action.' },
      { short: 'Accepted', m: { boot: 'Pxe, once' } },
      { short: 'Restart', tag: 'action' },
      { short: 'Reboots', m: { power: 'restarting' } },
      { short: 'Log out', m: { session: 'closed' }, key: 'Always delete the session: BMCs only have a few slots.' },
    ],
  },
  sel: {
    metrics: [
      { id: 'sel', label: 'SEL entries', start: '?' },
      { id: 'suspect', label: 'Suspect', start: '-' },
      { id: 'verdict', label: 'Verdict', start: '-' },
    ],
    appear: { cpu: 2, dimm: 3 },
    steps: [
      { short: 'Save, clear', tag: 'technique', m: { sel: '0' }, key: 'Save, then clear the SEL at the start of every run, and save it again at the end.' },
      { short: 'Burn-in', m: { verdict: 'running' } },
      { short: 'Bit flip' },
      { short: 'Logged', m: { sel: '1', suspect: 'DIMM A1' } },
      { short: 'Repeats', m: { sel: '14' }, key: 'Corrected errors do not fail the test. They fill the log, so read the log.' },
      { short: 'Read SEL' },
      { short: 'Swap', tag: 'technique', m: { suspect: 'DIMM or slot?' } },
      { short: 'Follows', m: { suspect: 'the DIMM', verdict: 'FAIL' }, key: 'If the fault follows the part, it is the part. If it stays, it is the slot or the board.' },
      { short: 'Replace', m: { sel: '0', verdict: 'PASS' } },
      { short: 'Report', tag: 'result' },
    ],
  },
  pxe: {
    metrics: [
      { id: 'ip', label: 'IP address', start: 'none' },
      { id: 'file', label: 'Boot file', start: '-' },
      { id: 'kernel', label: 'Kernel', start: '-' },
      { id: 'os', label: 'Operating system', start: '-' },
    ],
    appear: { http: 5, os: 8 },
    steps: [
      { short: 'Discover', key: 'Option 93 tells the server whether the client is BIOS or UEFI, so it can pick the right boot file.' },
      { short: 'Offer', m: { ip: 'offered' } },
      { short: 'Request' },
      { short: 'Ack', m: { ip: '192.168.70.13', file: 'boot.ipxe' } },
      { short: 'Script', m: { file: 'loaded' }, key: 'One boot script can serve a whole rack.' },
      { short: 'Kernel', m: { kernel: 'vmlinuz-lts' } },
      { short: 'Initrd', m: { kernel: '+ initramfs' } },
      { short: 'Boot', m: { os: 'starting' } },
      { short: 'DHCP again', m: { ip: 'again, from Linux' }, key: 'Linux does not inherit the ROM network setup: it asks DHCP again.' },
      { short: 'Modules' },
      { short: 'Running', m: { os: 'running in RAM' } },
    ],
  },
  'bios-update': {
    metrics: [
      { id: 'n1', label: 'rk-n1 BIOS', start: '?' },
      { id: 'n2', label: 'rk-n2 BIOS', start: '?' },
      { id: 'n3', label: 'rk-n3 BIOS', start: '?' },
      { id: 'bom', label: 'BOM asks', start: '1.5' },
    ],
    appear: { b2: 2, b3: 3 },
    steps: [
      { short: 'Read n1', m: { n1: '1.4' } },
      { short: 'Read n2', m: { n2: '1.4' } },
      { short: 'Read n3', m: { n3: '1.3' }, key: 'Racks arrive with mixed firmware: read every node before you change anything.' },
      { short: 'Record', tag: 'technique' },
      { short: 'Flash n1', m: { n1: 'flashing' }, key: 'One node first: a bad image or a power cut then costs one node, not the rack.' },
      { short: 'Cold boot', m: { n1: 'rebooting' }, key: 'Some updates reset BIOS settings to defaults: compare them and apply them again.' },
      { short: 'Verify', m: { n1: '1.5' } },
      { short: 'rk-n2', m: { n2: '1.5' } },
      { short: 'rk-n3', m: { n3: '1.5' } },
      { short: 'Report', tag: 'result' },
    ],
  },
  flaky: {
    metrics: [
      { id: 'carrier', label: 'Carrier changes', start: '-' },
      { id: 'fails', label: 'Bond failures', start: '-' },
      { id: 'tput', label: 'Throughput', start: '-' },
      { id: 'verdict', label: 'Verdict', start: '-' },
    ],
    appear: { cable: 2, sw: 2 },
    steps: [
      { short: 'Counters', tag: 'technique', m: { carrier: '2', fails: '0' }, key: 'Read the link counters at the start and at the end of every run.' },
      { short: 'iperf3', m: { tput: 'running' } },
      { short: 'Link drops', m: { carrier: '4', fails: '1' } },
      { short: 'Failover' },
      { short: 'Back' },
      { short: 'Twice more', m: { carrier: '8', fails: '3' } },
      { short: 'Result', m: { tput: '21.1 Gbit/s' }, key: 'On throughput alone, this node would pass.' },
      { short: 'Counters' },
      { short: 'Verdict', tag: 'result', m: { verdict: 'FAIL: link flaps' }, key: 'Counters that moved during a run are a finding, even when every test passed.' },
      { short: 'Isolate', tag: 'technique' },
      { short: 'Retest', tag: 'result', m: { verdict: 'PASS', carrier: 'no change' } },
    ],
  },
  'rack-journey': {
    metrics: [
      { id: 'level', label: 'Level', start: '-' },
      { id: 'stage', label: 'Stage', start: 'ordered' },
      { id: 'findings', label: 'Findings', start: '0' },
    ],
    appear: { rack: 3, test: 4, report: 9 },
    steps: [
      { short: 'Order', tag: 'action', key: 'The BOM is the contract: every later check compares against it.' },
      { short: 'L10 build', m: { level: 'L10', stage: 'building' } },
      { short: 'L11 rack', m: { level: 'L11', stage: 'racked' } },
      { short: 'BOM check', tag: 'technique', m: { stage: 'testing' }, key: 'The BOM check runs first: a burn-in on the wrong parts is a day lost.' },
      { short: 'Firmware' },
      { short: 'Burn-in' },
      { short: 'Network', key: 'Several racks tested as one system is L12.' },
      { short: 'Finding', m: { findings: '1, fixed' } },
      { short: 'Report', m: { stage: 'reported' } },
      { short: 'Ship', tag: 'result', m: { stage: 'shipped' } },
    ],
  },
  'post-boot': {
    metrics: [
      { id: 'power', label: 'Power', start: 'off' },
      { id: 'bmc', label: 'BMC', start: 'off' },
      { id: 'post', label: 'POST', start: '-' },
      { id: 'os', label: 'OS', start: '-' },
    ],
    appear: { cpu: 3, bios: 3, pcie: 5, disk: 7 },
    steps: [
      { short: 'Standby', m: { power: 'standby', bmc: 'ready' }, key: 'The BMC is up before the server: that is why it can power the server on.' },
      { short: 'Power on', m: { power: 'on' } },
      { short: 'Reset', m: { post: 'started' }, key: 'POST codes on the BMC tell where a server stopped.' },
      { short: 'Memory', m: { post: 'memory training' }, key: 'A DIMM that fails training is disabled: the board lists it, the OS does not see it.' },
      { short: 'PCIe', m: { post: 'PCIe devices' } },
      { short: 'SEL' },
      { short: 'Boot', m: { post: 'done', os: 'loading' } },
      { short: 'Kernel', m: { os: 'starting' } },
      { short: 'Up', tag: 'result', m: { os: 'up' } },
    ],
  },
  'scale-test': {
    metrics: [
      { id: 'booted', label: 'Booted', start: '0 / 32' },
      { id: 'results', label: 'Results in', start: '0 / 32' },
      { id: 'outliers', label: 'Outliers', start: '-' },
      { id: 'verdict', label: 'Rack', start: '-' },
    ],
    appear: { nodes: 2, store: 4, report: 8 },
    steps: [
      { short: 'PXE all', tag: 'action' },
      { short: 'Booted', m: { booted: '32 / 32' }, key: 'One test image everywhere: differences now come from the hardware.' },
      { short: 'Run suite', key: 'Parallel, with a time limit per node: a hang is a result, not a wait.' },
      { short: 'Results', m: { results: '31 / 32' } },
      { short: 'Timeout', m: { verdict: 'node 17: no result' } },
      { short: 'Compare', tag: 'technique', m: { outliers: '1 (storage)' } },
      { short: 'Save SEL' },
      { short: 'Report', m: { verdict: 'FAIL: 2 findings' } },
      { short: 'Rerun', tag: 'result', m: { verdict: 'PASS after fixes' } },
    ],
  },
  'issue-8d': {
    metrics: [
      { id: 'status', label: 'Status', start: 'new' },
      { id: 'fio', label: 'rk-n2 vs median', start: '-40%' },
      { id: 'scope', label: 'Scope', start: '1 node' },
    ],
    appear: { team: 6, cust: 8 },
    steps: [
      { short: 'D1 team', m: { status: 'open' } },
      { short: 'D2 problem', key: 'Numbers, place and evidence. Never just "slow".' },
      { short: 'D3 contain', tag: 'technique', m: { status: 'contained', scope: 'batch checked' } },
      { short: 'D4 swap', tag: 'technique', key: 'The fault followed the disk: it is the disk.' },
      { short: 'D4 cause', m: { status: 'root cause found' } },
      { short: 'D5-D6 fix', m: { fio: 'within 2%', status: 'fixed, verified' }, key: 'Verify the fix with the test that found the problem.' },
      { short: 'D7 prevent', key: 'Add a check so it cannot come back: here, disk firmware in the BOM check.' },
      { short: 'D8 close', tag: 'result', m: { status: 'closed' } },
    ],
  },
  'gpu-rack': {
    metrics: [
      { id: 'gpus', label: 'GPUs seen', start: '?' },
      { id: 'dcgm', label: 'DCGM', start: '-' },
      { id: 'nccl', label: 'NCCL busbw', start: '-' },
      { id: 'power', label: 'Power', start: '-' },
    ],
    appear: { fab: 5, g2: 6 },
    steps: [
      { short: 'nvidia-smi', m: { gpus: '8 / 8' } },
      { short: 'Topology', key: 'GPUs and NICs must sit on the paths the platform was designed with.' },
      { short: 'DCGM', m: { dcgm: 'level 3 pass' } },
      { short: 'PCIe, ECC', key: 'Read link state under load: idle GPUs lower their link speed.' },
      { short: 'Fabric' },
      { short: 'NCCL', m: { nccl: 'measured' } },
      { short: 'Pairwise', tag: 'technique', m: { nccl: 'one slow pair' } },
      { short: 'Power', tag: 'result', m: { power: 'up to ~10 kW per server' } },
    ],
  },
}

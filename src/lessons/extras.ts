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
  storage: {
    metrics: [
      { id: 'seen', label: 'Drives seen', start: '?' },
      { id: 'fw', label: 'Firmware', start: '?' },
      { id: 'health', label: 'Health', start: '?' },
      { id: 'array', label: 'Array', start: '-' },
    ],
    appear: { ctl: 2, sas: 3, os: 4 },
    steps: [
      { short: 'NVMe', key: 'NVMe is PCIe: a drive at x2 instead of x4 is a finding.' },
      { short: 'Controller', key: 'An HBA passes disks through; a RAID controller shows virtual disks.' },
      { short: 'Backplane' },
      { short: 'Inventory', tag: 'technique', m: { seen: 'all, per BOM', fw: 'one drive differs' }, key: 'Drive firmware belongs in the BOM check.' },
      { short: 'Vendor tool' },
      { short: 'SMART', m: { health: '0 media errors' } },
      { short: 'fio per drive', tag: 'technique' },
      { short: 'Pull a drive', tag: 'result', m: { array: 'degraded, rebuilt' } },
    ],
  },
  thermal: {
    metrics: [
      { id: 'temp', label: 'CPU temp', start: '38 °C' },
      { id: 'fans', label: 'Fans', start: '30%' },
      { id: 'watts', label: 'Input power', start: '210 W' },
      { id: 'state', label: 'State', start: 'idle' },
    ],
    appear: { fans: 2, psu: 6, pdu: 7 },
    steps: [
      { short: 'Sensors' },
      { short: 'Fan curve' },
      { short: 'Burn-in', m: { temp: '71 °C', fans: '62%', state: 'full load' }, key: 'Wait for the steady state: temperatures rise for many minutes.' },
      { short: 'Fan fails', m: { fans: '85% (one failed)' } },
      { short: 'Throttle', m: { temp: '96 °C', state: 'throttling' }, key: 'Throttling does not crash anything: it shows as a slow node.' },
      { short: 'Watts', m: { watts: '780 W' } },
      { short: 'Feed A off', tag: 'technique', m: { state: 'on PSU 2 only' }, key: 'Test redundancy by switching one feed off under load.' },
      { short: 'Baseline', tag: 'result' },
    ],
  },
  lldp: {
    metrics: [
      { id: 'ports', label: 'Ports checked', start: '0' },
      { id: 'bad', label: 'Mismatches', start: '-' },
    ],
    appear: { kit: 3, table: 4 },
    steps: [
      { short: 'Announce' },
      { short: 'lldpd' },
      { short: 'Collect', m: { ports: '6 of 6' } },
      { short: 'Compare', tag: 'technique' },
      { short: 'Mismatch', m: { bad: '1: rk-n2 be1' }, key: 'A wrong cable often links and passes pings: only this check finds it.' },
      { short: 'Fix', m: { bad: '0' } },
      { short: 'Record', tag: 'result' },
    ],
  },
  'test-script': {
    metrics: [
      { id: 'safety', label: 'Safety', start: 'none' },
      { id: 'output', label: 'Output', start: 'text' },
      { id: 'exit', label: 'Exit code', start: 'always 0' },
    ],
    appear: { node: 2, out: 5, ci: 7 },
    steps: [
      { short: 'Strict', m: { safety: 'set -euo pipefail' }, key: 'Without it, a script can fail half way and still report success.' },
      { short: 'Timeouts', m: { safety: '+ timeouts' } },
      { short: 'JSON in', m: { output: 'data' } },
      { short: 'BOM file', tag: 'technique' },
      { short: 'JSON out', m: { output: 'one result per test' } },
      { short: 'Exit code', m: { exit: '0 / 1 / 2' }, key: '"Could not test" is never a pass.' },
      { short: 'Test it', tag: 'technique', key: 'If the script passes a node with a known fault, the script is broken.' },
      { short: 'Version', tag: 'result' },
    ],
  },
  windows: {
    metrics: [
      { id: 'inv', label: 'Inventory', start: '-' },
      { id: 'events', label: 'Errors in log', start: '-' },
      { id: 'disk', label: 'DiskSpd', start: '-' },
    ],
    appear: { log: 5, disk: 6 },
    steps: [
      { short: 'Remoting' },
      { short: 'CIM', m: { inv: 'collected' } },
      { short: 'JSON', key: 'ConvertTo-Json makes Windows results comparable with Linux ones.' },
      { short: 'Drivers' },
      { short: 'Event log', m: { events: '0' }, key: 'Get-WinEvent is the dmesg of Windows.' },
      { short: 'DiskSpd', m: { disk: 'measured' } },
      { short: 'Network' },
      { short: 'Verdict', tag: 'result' },
    ],
  },
  tuning: {
    metrics: [
      { id: 'gap', label: 'Behind rack', start: '8%' },
      { id: 'cause', label: 'Suspect', start: 'settings?' },
    ],
    appear: { osx: 4, nic: 6 },
    steps: [
      { short: 'Symptom' },
      { short: 'BIOS diff', tag: 'technique', key: 'Compare every node\'s settings with the approved file.' },
      { short: 'Profile', m: { cause: 'power profile' } },
      { short: 'OS side' },
      { short: 'NUMA', key: 'Pin benchmarks so every node runs them the same way.' },
      { short: 'NIC IRQs' },
      { short: 'Fix', m: { gap: 'within 1%' } },
      { short: 'Goal', tag: 'result', key: 'Performance or energy efficiency is the customer\'s choice; the test enforces it.' },
    ],
  },
}

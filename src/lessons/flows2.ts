import type { Flow } from '../engine/types'

// Lessons added for the course structure Foundations -> Architecture -> ... -> Deep dives.
// No runtime imports here, so scripts/narrate.ts can load this file with Node too.

const rackJourney: Flow = {
  intro: [
    'A customer orders a rack, not a pile of servers. Between the order and the truck, a rack integration team builds every server, puts them into the rack with switches, cables and power, and tests the whole rack until it can be switched on at the customer and just work.',
    'The industry names the levels: L10 is one complete, tested server; L11 is a cabled rack tested as a rack; L12 is several racks tested as one cluster.',
  ],
  actors: [
    { id: 'cust', label: 'Customer', sub: 'order and BOM', x: 120, y: 330, kind: 'person' },
    { id: 'build', label: 'Build area', sub: 'L10: each server', x: 330, y: 150, kind: 'server' },
    { id: 'rack', label: 'Rack', sub: 'L11: cabled rack', x: 540, y: 330, kind: 'service' },
    { id: 'test', label: 'Test station', sub: 'the test kit', x: 750, y: 150, kind: 'laptop' },
    { id: 'report', label: 'Report', sub: 'per node and rack', x: 960, y: 330, kind: 'os' },
  ],
  links: [
    ['cust', 'build'],
    ['build', 'rack'],
    ['rack', 'test'],
    ['test', 'report'],
  ],
  steps: [
    {
      from: 'cust',
      to: 'build',
      proto: 'Tool',
      summary: 'An order with a bill of materials',
      explain: [
        'The BOM names every part of every server: CPU model, DIMMs per slot, drives, NICs, firmware versions. It also fixes the rack elevation (which server in which unit) and the cabling table.',
        'Everything the team tests later is checked against this document.',
      ],
    },
    {
      from: 'build',
      to: 'build',
      proto: 'Board',
      summary: 'L10: build and test each server',
      explain: ['Boards, CPUs, memory, drives and cards are assembled, and each server gets a first test: it powers on, passes POST, and shows every part it should have.'],
    },
    {
      from: 'build',
      to: 'rack',
      proto: 'Tool',
      summary: 'L11: rack, cable and power',
      explain: [
        'Servers go onto rails in the units the elevation says, switches at the top, PDUs at the back. Every cable follows the cabling table and carries a label on both ends.',
        'Each server has one power supply on PDU A and one on PDU B, so a whole feed can fail without stopping anything.',
      ],
    },
    {
      from: 'test',
      to: 'rack',
      proto: 'SSH',
      summary: 'Check every node against the BOM',
      explain: ['Serial numbers per rack unit, CPUs, memory as the board and the OS see it, disks, NICs and MACs. A node with the wrong parts would waste a day of burn-in, so this runs first.'],
    },
    {
      from: 'test',
      to: 'rack',
      proto: 'HTTPS',
      summary: 'Update and verify firmware, out of band',
      explain: ['Through each BMC: read the BIOS and BMC versions, update one node first, verify, then the rest. Versions before and after go into the report.'],
    },
    {
      from: 'test',
      to: 'rack',
      proto: 'SSH',
      summary: 'Burn-in: hours of load, every log watched',
      explain: ['CPU, memory and storage under sustained load, with the system event logs saved before and after. Early failures show up under heat and time, not in a five-minute test.'],
    },
    {
      from: 'test',
      to: 'rack',
      proto: 'Link',
      summary: 'Network tests across the whole rack',
      explain: [
        'Links at the right speed, bonds healthy, jumbo frames between every pair, throughput between every pair, link counters read before and after.',
        'When several racks are delivered as one system, the same tests run across racks: that is L12.',
      ],
    },
    {
      from: 'rack',
      to: 'test',
      proto: 'Event',
      summary: 'A finding: one disk far slower than the others',
      explain: ['One node is 40% under the rack median on random reads. It is isolated (swap the disk, rerun), fixed and retested before the rack moves on. The later lessons show each of these tools.'],
    },
    {
      from: 'test',
      to: 'report',
      proto: 'Local',
      summary: 'The test report',
      explain: ['Page one: pass or fail per node and for the rack. Then every number next to its threshold, the findings with evidence, and the configuration: firmware versions, MACs, serials.'],
    },
    {
      from: 'report',
      to: 'cust',
      proto: 'Tool',
      summary: 'Ship the rack with its report',
      explain: ['The customer receives a rack that has already run the way it will run in their data centre, and the evidence that it did.'],
    },
  ],
  keyPoints: [
    'L10 is a server, L11 a cabled and tested rack, L12 several racks tested as one cluster.',
    'The BOM is the contract: parts, firmware, elevation and cabling are checked against it.',
    'Order of work: BOM check, firmware, burn-in, network, report.',
  ],
  tryIt: [
    { cmd: './provision-rack.sh', note: 'build the three-node rack' },
    { cmd: 'cat bom.yaml', note: 'the golden configuration' },
    { cmd: './faults.sh random', note: 'then find the fault' },
  ],
}

const postBoot: Flow = {
  intro: [
    'From the power cord to a login prompt, a server goes through a fixed sequence. A rack engineer needs it in their head: when a server stops somewhere on the way, where it stops says what is wrong.',
  ],
  actors: [
    { id: 'psu', label: 'PSUs', sub: 'two, 1+1', x: 110, y: 330, kind: 'nic' },
    { id: 'bmc', label: 'BMC', sub: 'standby power', x: 380, y: 130, kind: 'bmc' },
    { id: 'cpu', label: 'CPUs + memory', sub: '2 sockets', x: 650, y: 330, kind: 'chip' },
    { id: 'bios', label: 'BIOS / UEFI', sub: 'POST, boot order', x: 920, y: 130, kind: 'os' },
    { id: 'pcie', label: 'PCIe devices', sub: 'NICs, NVMe, HBA', x: 1190, y: 330, kind: 'nic' },
    { id: 'disk', label: 'Boot disk', sub: 'bootloader, kernel', x: 1190, y: 90, kind: 'disk' },
  ],
  links: [
    ['psu', 'bmc'],
    ['bmc', 'cpu'],
    ['cpu', 'bios'],
    ['bios', 'pcie'],
    ['bios', 'disk'],
  ],
  steps: [
    {
      from: 'psu',
      to: 'bmc',
      proto: 'Board',
      summary: 'Cord in: standby power, the BMC boots',
      explain: ['The power supplies give a small standby rail as soon as the server has AC. The BMC lives on it and boots its own Linux, about a minute, while the server itself is still off.'],
    },
    {
      from: 'bmc',
      to: 'psu',
      proto: 'Board',
      summary: 'Power on: the main rails come up',
      explain: ['Someone presses the button or sends a power-on over IPMI or Redfish. The PSUs bring up the main rails in order and signal "power good".'],
    },
    {
      from: 'bmc',
      to: 'cpu',
      proto: 'Board',
      summary: 'Reset released: the CPUs run the firmware',
      explain: ['The CPUs come out of reset and start executing the BIOS from its flash chip. From here the BIOS sends progress codes (POST codes) that the BMC shows; a server that stops here shows its last code.'],
    },
    {
      from: 'bios',
      to: 'cpu',
      proto: 'Board',
      summary: 'Memory training',
      explain: [
        'The BIOS trains every memory channel: timings and voltages for each DIMM. It is the slowest part of POST on a big server, and longer still on the first boot after memory changed.',
        'A DIMM that fails training is disabled. The server boots, with less memory: the board lists it, the OS does not see it.',
      ],
    },
    {
      from: 'bios',
      to: 'pcie',
      proto: 'Board',
      summary: 'PCIe enumeration: links trained, devices found',
      explain: ['Each PCIe link trains to a width and speed (what lspci shows as LnkSta). Cards with option ROMs run them: a NIC adds its network boot, a RAID controller its setup screen.'],
    },
    {
      from: 'bios',
      to: 'bmc',
      proto: 'IPMI',
      summary: 'BIOS and BMC talk: boot options, errors to the SEL',
      explain: ['Over the internal interface the BIOS asks the BMC for boot overrides and reports what went wrong: a disabled DIMM, a failed device. Those become SEL entries.'],
    },
    {
      from: 'bios',
      to: 'disk',
      proto: 'Board',
      summary: 'Boot device: the bootloader starts',
      explain: ['Following the boot order (or the override), UEFI loads the bootloader from the EFI system partition, or hands over to a NIC for network boot.'],
    },
    {
      from: 'disk',
      to: 'cpu',
      proto: 'Board',
      summary: 'Kernel and initramfs: Linux starts',
      explain: ['The kernel finds the hardware again in its own way and logs it: the dmesg of the first seconds is where missing devices, PCIe errors and memory warnings first show.'],
    },
    {
      from: 'cpu',
      to: 'cpu',
      proto: 'Local',
      summary: 'Up: now inventory and tests can run',
      explain: ['Right after boot a rack test reads: memory against the BOM, every disk and NIC, link widths and speeds, and the kernel log for errors.'],
    },
  ],
  keyPoints: [
    'The BMC runs on standby power and is the first thing to come up.',
    'POST codes tell where a server stopped.',
    'A DIMM that fails training disappears from the OS but not from the board.',
    'The first dmesg lines show what the kernel found and what it did not.',
  ],
  tryIt: [
    { cmd: 'virsh console rk-n1', note: 'watch a node boot' },
    { cmd: "ssh rk-n1 'sudo dmesg -T | head -60'", note: 'the first seconds of the kernel' },
    { cmd: "ssh rk-n1 'sudo dmidecode -t memory; grep MemTotal /proc/meminfo'" },
  ],
}

const scaleTest: Flow = {
  intro: [
    'Three nodes you can test by hand. A rack has 32, and a cluster several racks. The tests are the same; what changes is that they run in parallel, every node reports the same way, and nodes are compared with each other.',
  ],
  actors: [
    { id: 'host', label: 'Test host', sub: 'the test kit', x: 110, y: 330, kind: 'laptop' },
    { id: 'bmcs', label: '32 BMCs', sub: 'out of band', x: 400, y: 130, kind: 'bmc' },
    { id: 'nodes', label: '32 nodes', sub: 'one rack', x: 690, y: 330, kind: 'server' },
    { id: 'store', label: 'Results store', sub: 'JSON per node', x: 980, y: 130, kind: 'service' },
    { id: 'report', label: 'Report', sub: 'rack summary', x: 1250, y: 330, kind: 'os' },
  ],
  links: [
    ['host', 'bmcs'],
    ['bmcs', 'nodes'],
    ['nodes', 'store'],
    ['host', 'store'],
    ['store', 'report'],
  ],
  steps: [
    {
      from: 'host',
      to: 'bmcs',
      proto: 'HTTPS',
      summary: 'Boot every node into the test image',
      explain: ['One loop over the BMCs, in parallel: set a one-time network boot and restart. Every node will run the same test image.'],
      raw: `for b in $(cat bmcs.txt); do
  ( redfish_pxe_once "$b" && redfish_restart "$b" ) &
done
wait`,
      rawLabel: 'The idea, in shell',
    },
    {
      from: 'bmcs',
      to: 'nodes',
      proto: 'Board',
      summary: '32 nodes boot the same test image',
      explain: ['Same kernel, same tools, same versions on every node: a difference in results now comes from the hardware, not from the software.'],
    },
    {
      from: 'host',
      to: 'nodes',
      proto: 'SSH',
      summary: 'Start the suite on all nodes at once',
      explain: ['Parallel, with a time limit per node. A node that hangs must not hold up the other 31, and a hang is a result too.'],
      raw: `printf '%s\\n' node{01..32} | xargs -P 32 -I{} timeout 2h ssh {} /opt/kit/run-suite`,
      rawLabel: 'One way to do it',
    },
    {
      from: 'nodes',
      to: 'store',
      proto: 'HTTP',
      summary: 'Each node sends its results as JSON',
      explain: ['Inventory, fio, stress-ng, iperf3, link counters, kernel log: one file per node, keyed by serial number rather than hostname, so a swapped node cannot hide.'],
    },
    {
      from: 'nodes',
      to: 'nodes',
      proto: 'Event',
      summary: 'Node 17 never reports',
      explain: ['Its time limit runs out. That is a finding, not a gap: open its console through the BMC and read its SEL.'],
    },
    {
      from: 'host',
      to: 'store',
      proto: 'HTTPS',
      summary: 'Compare: rack medians and outliers',
      explain: ['For every test, the median of the rack. Any node under the fixed minimum or 15% under the median fails. With 32 nodes, one bad node cannot move the median.'],
    },
    {
      from: 'host',
      to: 'bmcs',
      proto: 'IPMI',
      summary: 'Save every SEL, then clear it',
      explain: ['Hardware events during the run belong to the evidence. Cleared afterwards, so the next run starts empty.'],
    },
    {
      from: 'store',
      to: 'report',
      proto: 'Local',
      summary: 'One report for the rack',
      explain: ['Pass or fail per node and for the rack, the outliers, the findings with evidence. The tool exits non-zero when anything failed, so a pipeline can stop on it.'],
    },
    {
      from: 'report',
      to: 'report',
      proto: 'Local',
      summary: 'Fix, then rerun only what failed',
      explain: ['After a part is swapped, rerun the failed tests on that node with the same version of the kit, and add the rerun to the report.'],
    },
  ],
  keyPoints: [
    'Parallel runs with a time limit per node; a hang is a result.',
    'One test image for all nodes, so differences come from the hardware.',
    'Results keyed by serial number, compared against the rack median.',
    'The kit exits non-zero on failure so automation can gate on it.',
  ],
  tryIt: [
    { cmd: "onall 'stress-ng --cpu 2 --timeout 30s --metrics-brief'", note: 'the same command on every node' },
    { cmd: "printf '%s\\n' rk-n1 rk-n2 rk-n3 | xargs -P 3 -I{} timeout 120 ssh {} 'sudo fio /tmp/rack.fio --output-format=json' " },
  ],
}

const issue8d: Flow = {
  intro: [
    'A rack engineer finds problems, but the job is only done when the problem is understood and cannot come back. Many customers expect an 8D report for a serious issue: eight steps from the team to the closure.',
    'The example: one node of a rack is far slower on storage than its neighbours.',
  ],
  actors: [
    { id: 'eng', label: 'Rack engineer', sub: 'you', x: 110, y: 330, kind: 'person' },
    { id: 'node', label: 'rk-n2', sub: 'U11, RL2611-012', x: 400, y: 130, kind: 'server' },
    { id: 'tracker', label: 'Issue', sub: 'the 8D record', x: 700, y: 330, kind: 'os' },
    { id: 'team', label: 'Hardware team', sub: 'and the vendor', x: 990, y: 130, kind: 'person' },
    { id: 'cust', label: 'Customer', sub: 'quality contact', x: 1260, y: 330, kind: 'person' },
  ],
  links: [
    ['eng', 'node'],
    ['eng', 'tracker'],
    ['tracker', 'team'],
    ['team', 'node'],
    ['tracker', 'cust'],
  ],
  steps: [
    {
      from: 'eng',
      to: 'tracker',
      proto: 'Tool',
      summary: 'D1: open the issue and name the team',
      explain: ['Who works on it: you, someone from hardware or quality, and the vendor of the suspect part when it comes to that.'],
    },
    {
      from: 'eng',
      to: 'node',
      proto: 'SSH',
      summary: 'D2: describe the problem with data',
      explain: ['Not "the disk is slow": fio random read 10,900 IOPS against a rack median of 18,200, on every run, on node rk-n2 in U11, disk model and firmware, slot, the date of the run. Attach the result files.'],
    },
    {
      from: 'eng',
      to: 'node',
      proto: 'Tool',
      summary: 'D3: contain it',
      explain: ['Stop the problem from travelling while you look for the cause: the node is marked, the rack does not ship, and other racks with the same disk batch are checked.'],
    },
    {
      from: 'eng',
      to: 'node',
      proto: 'Tool',
      summary: 'D4: find the root cause by swapping',
      explain: ['Swap the disk with one from a good node and rerun. The slowness follows the disk. SMART is clean; the firmware version differs from the other disks.'],
    },
    {
      from: 'eng',
      to: 'tracker',
      proto: 'Tool',
      summary: 'D4 result: an older disk firmware',
      explain: ['Root cause, with evidence: the disk came from a batch with an older firmware that the BOM did not pin. (An illustrative example; real causes vary.)'],
    },
    {
      from: 'team',
      to: 'node',
      proto: 'Tool',
      summary: 'D5 and D6: fix and verify',
      explain: ['The approved firmware goes on the disk, and the same fio job runs again: within 2% of the rack median. The fix is verified with the test that found the problem.'],
    },
    {
      from: 'team',
      to: 'tracker',
      proto: 'Tool',
      summary: 'D7: make sure it cannot come back',
      explain: ['Disk firmware is added to the BOM check, and incoming parts from that batch are checked before they are built in.'],
    },
    {
      from: 'tracker',
      to: 'cust',
      proto: 'HTTPS',
      summary: 'D8: close it and tell the customer',
      explain: ['The report: what happened, the evidence, the cause, the fix, the prevention. Then the team is thanked and the issue closed.'],
    },
  ],
  keyPoints: [
    'Describe a problem with numbers, location and evidence, not adjectives.',
    'Contain first, then find the cause.',
    'Prove the cause by swapping: the fault follows the part.',
    'Verify the fix with the same test, and add a check so it cannot return.',
  ],
  tryIt: [
    { cmd: './faults.sh inject slow-data-disk rk-n2', note: 'then write the 8D for it' },
    { cmd: "ssh rk-n2 'sudo fio /tmp/rack.fio --output-format=json'" },
  ],
}

const gpuRack: Flow = {
  intro: [
    'A large share of rack integration today is AI clusters: servers with eight GPUs on an NVLink baseboard, several 400G network ports each, and racks that draw far more power. The method stays the same; the tests and the limits change.',
  ],
  actors: [
    { id: 'eng', label: 'Test host', sub: 'the kit', x: 110, y: 330, kind: 'laptop' },
    { id: 'g1', label: 'GPU server 1', sub: '8 GPUs, NVLink', x: 420, y: 130, kind: 'server' },
    { id: 'fab', label: '400G fabric', sub: 'InfiniBand or RoCE', x: 720, y: 330, kind: 'switch' },
    { id: 'g2', label: 'GPU server 2', sub: '8 GPUs, NVLink', x: 1020, y: 130, kind: 'server' },
  ],
  links: [
    ['eng', 'g1'],
    ['g1', 'fab'],
    ['fab', 'g2'],
    ['eng', 'g2'],
  ],
  steps: [
    {
      from: 'eng',
      to: 'g1',
      proto: 'SSH',
      summary: 'All GPUs present? nvidia-smi',
      explain: ['Eight GPUs listed, the right model and driver, sane temperatures. A GPU missing here is a seating, riser or power problem, like any PCIe device.'],
      raw: `$ nvidia-smi -L
GPU 0: ... (UUID: GPU-...)
...
GPU 7: ... (UUID: GPU-...)`,
      rawLabel: 'Command',
    },
    {
      from: 'eng',
      to: 'g1',
      proto: 'SSH',
      summary: 'How is it wired? nvidia-smi topo -m',
      explain: ['The matrix of how each GPU reaches the others (NVLink) and each NIC (through which PCIe switch, on which CPU). It must match the platform\'s design; a GPU on the wrong path is slower in every test.'],
    },
    {
      from: 'g1',
      to: 'g1',
      proto: 'Local',
      summary: 'NVIDIA DCGM diagnostics, short then long',
      explain: ['dcgmi diag -r 1 is a quick health check; -r 3 runs longer stress and bandwidth tests per GPU. Failures name the GPU and the test.'],
      raw: '$ dcgmi diag -r 3',
      rawLabel: 'Command',
    },
    {
      from: 'eng',
      to: 'g1',
      proto: 'SSH',
      summary: 'Check PCIe links and ECC under load',
      explain: ['GPUs lower their link speed when idle, so read LnkSta while they work. ECC error counters must stay at zero during burn-in.'],
      raw: '$ nvidia-smi -q -d ECC',
      rawLabel: 'Command',
    },
    {
      from: 'g1',
      to: 'fab',
      proto: 'Link',
      summary: 'Fabric ports up at full speed',
      explain: ['Every 400G port linked at its rated speed and width, with the right cable or transceiver. ibstat shows InfiniBand ports; ethtool shows Ethernet ones.'],
    },
    {
      from: 'g1',
      to: 'g2',
      proto: 'Link',
      summary: 'NCCL all-reduce across both servers',
      explain: ['The nccl-tests all_reduce_perf benchmark moves data between all GPUs of both servers and reports the bus bandwidth. It is compared with what the platform should reach.'],
      raw: '$ mpirun -np 16 ... all_reduce_perf -b 8 -e 8G -f 2 -g 1',
      rawLabel: 'Shape of the command',
    },
    {
      from: 'g2',
      to: 'eng',
      proto: 'SSH',
      summary: 'One pair is slow: test pairwise to find it',
      explain: ['When the whole run is low, split it: node pairs, then single NICs. A port trained at a lower speed or a bad cable shows as the one slow pair.'],
    },
    {
      from: 'eng',
      to: 'eng',
      proto: 'Local',
      summary: 'Power and cooling at full load',
      explain: ['An 8-GPU server can draw several kilowatts, up to around 10 kW in current designs. PDUs, feeds and cooling (often direct liquid cooling) are part of the test: temperatures and power must stay in range for the whole burn-in.'],
    },
  ],
  keyPoints: [
    'First: every GPU present, topology as designed, ECC clean.',
    'DCGM for per-GPU health, NCCL tests for GPU-to-GPU bandwidth across nodes.',
    'Read PCIe link state under load: GPUs downtrain when idle.',
    'Power and cooling are tested, not assumed.',
  ],
}

export const FLOWS2: Record<string, Flow> = {
  'rack-journey': rackJourney,
  'post-boot': postBoot,
  'scale-test': scaleTest,
  'issue-8d': issue8d,
  'gpu-rack': gpuRack,
}

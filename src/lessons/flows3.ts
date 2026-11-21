import type { Flow } from '../engine/types'

// Deeper lessons: storage, heat and power, cabling checks, test scripts, Windows, tuning.
// No runtime imports here, so scripts/narrate.ts can load this file with Node too.

const storage: Flow = {
  intro: [
    'A server can carry NVMe drives, SAS and SATA drives, a RAID controller or a plain HBA. What the operating system sees, and how you test it, depends on which path a drive takes.',
  ],
  actors: [
    { id: 'cpu', label: 'CPU', sub: 'PCIe lanes', x: 110, y: 330, kind: 'chip' },
    { id: 'nvme', label: 'NVMe drives', sub: 'PCIe x4 each', x: 400, y: 130, kind: 'disk' },
    { id: 'ctl', label: 'RAID or HBA', sub: 'SAS / SATA controller', x: 690, y: 330, kind: 'nic' },
    { id: 'sas', label: 'SAS/SATA drives', sub: 'on the backplane', x: 980, y: 130, kind: 'disk' },
    { id: 'os', label: 'Linux', sub: 'lsblk, nvme, smartctl', x: 1260, y: 330, kind: 'os' },
  ],
  links: [
    ['cpu', 'nvme'],
    ['cpu', 'ctl'],
    ['ctl', 'sas'],
    ['os', 'nvme'],
    ['os', 'ctl'],
  ],
  steps: [
    {
      from: 'cpu',
      to: 'nvme',
      proto: 'Board',
      summary: 'NVMe: each drive on its own PCIe link',
      explain: ['An NVMe drive talks PCIe directly, usually four lanes, with no controller in between. Its link must train at full width and speed like any PCIe device: a drive at x2 is a finding.'],
    },
    {
      from: 'cpu',
      to: 'ctl',
      proto: 'Board',
      summary: 'SAS and SATA go through a controller',
      explain: [
        'An HBA passes each disk through to the operating system. A RAID controller combines disks into virtual disks and shows the OS only those.',
        'Which one the BOM asks for decides what you see in Linux and which tools you need.',
      ],
    },
    {
      from: 'ctl',
      to: 'sas',
      proto: 'Board',
      summary: 'The backplane connects the bays',
      explain: ['Drives sit in front bays on a backplane, cabled to the controller. Bay numbers on the chassis must map to the slots the controller reports, or the wrong drive gets pulled later.'],
    },
    {
      from: 'os',
      to: 'nvme',
      proto: 'SSH',
      summary: 'Inventory: model, serial, firmware',
      explain: ['Every drive against the BOM: model, capacity, firmware revision. Drives from different batches can carry different firmware.'],
      raw: `$ sudo nvme list
$ lsblk -d -o NAME,SIZE,MODEL,SERIAL,REV`,
      rawLabel: 'Commands',
    },
    {
      from: 'os',
      to: 'ctl',
      proto: 'SSH',
      summary: 'Behind a RAID controller, ask the controller',
      explain: ['The OS sees virtual disks only. The physical drives, their state and the controller firmware come from the controller vendor\'s tool, for example storcli for Broadcom MegaRAID controllers.'],
    },
    {
      from: 'os',
      to: 'sas',
      proto: 'SSH',
      summary: 'Health: SMART and NVMe logs',
      explain: ['Media errors, reallocated sectors, wear (percentage used on NVMe) and temperature. New drives start at zero errors; anything else on a new drive is a finding.'],
      raw: `$ sudo smartctl -a /dev/sda
$ sudo nvme smart-log /dev/nvme0`,
      rawLabel: 'Commands',
    },
    {
      from: 'os',
      to: 'nvme',
      proto: 'SSH',
      summary: 'Performance: the same fio job on every drive',
      explain: ['One job file, run per drive. Drives of the same model must give the same numbers within a node and across the rack; the outlier rule applies to drives as well as nodes.'],
    },
    {
      from: 'ctl',
      to: 'ctl',
      proto: 'Event',
      summary: 'Pull a drive under load: degraded, then rebuild',
      explain: [
        'For RAID: remove one drive while the array is busy. The controller must report the array as degraded, the locate LED must find the right bay, and after the drive goes back the rebuild must finish.',
        'Never on a disk that holds the operating system or data you need.',
      ],
    },
  ],
  keyPoints: [
    'NVMe is PCIe: check link width and speed like any card.',
    'HBA passes disks through; RAID shows virtual disks and needs the vendor tool.',
    'Drive firmware belongs in the BOM check.',
    'Test the failure path too: degraded state, locate LED, rebuild.',
  ],
  tryIt: [
    { cmd: "ssh rk-n1 'lsblk -d -o NAME,SIZE,MODEL,SERIAL'" },
    { cmd: "ssh rk-n1 'sudo smartctl -a /dev/vda'", note: 'virtual disks have no SMART data: note what it says' },
    { cmd: './faults.sh inject data-disk-missing rk-n1', note: 'a drive that disappears' },
  ],
}

const thermal: Flow = {
  intro: [
    'Heat and power are what a burn-in really tests. A server that is fine for five minutes can throttle after forty, and a power supply that looks fine alone can fail when its partner is switched off.',
  ],
  actors: [
    { id: 'cpu', label: 'CPUs', sub: 'under load', x: 110, y: 330, kind: 'chip' },
    { id: 'bmc', label: 'BMC', sub: 'sensors and SEL', x: 400, y: 130, kind: 'bmc' },
    { id: 'fans', label: 'Fans', sub: 'speed set by the BMC', x: 690, y: 330, kind: 'nic' },
    { id: 'psu', label: 'PSU 1 + PSU 2', sub: 'redundant', x: 980, y: 130, kind: 'server' },
    { id: 'pdu', label: 'PDU A / PDU B', sub: 'two feeds', x: 1260, y: 330, kind: 'switch' },
  ],
  links: [
    ['cpu', 'bmc'],
    ['bmc', 'fans'],
    ['psu', 'bmc'],
    ['psu', 'pdu'],
  ],
  steps: [
    {
      from: 'cpu',
      to: 'bmc',
      proto: 'Board',
      summary: 'Temperature sensors report to the BMC',
      explain: ['CPU, memory, inlet air, voltage regulators, add-in cards: each sensor has thresholds. The BMC reads them all the time, on or off.'],
      raw: '$ ipmitool ... sdr type Temperature',
      rawLabel: 'Command',
    },
    {
      from: 'bmc',
      to: 'fans',
      proto: 'Board',
      summary: 'The BMC sets the fan speed',
      explain: ['A fan curve maps temperature to fan speed. Fan modes (standard, optimal, full speed) change that curve; the BOM or the customer may specify one.'],
      raw: '$ ipmitool ... sdr type Fan',
      rawLabel: 'Command',
    },
    {
      from: 'cpu',
      to: 'cpu',
      proto: 'Event',
      summary: 'Burn-in: full load, the temperature climbs',
      explain: ['Temperatures rise for many minutes before they settle. A steady state well below the throttling point is what a healthy node shows.'],
    },
    {
      from: 'fans',
      to: 'bmc',
      proto: 'Event',
      summary: 'A fan fails: the others speed up, the SEL logs it',
      explain: ['The remaining fans compensate and the BMC logs a fan event. During burn-in that is a finding even if nothing overheats.'],
    },
    {
      from: 'cpu',
      to: 'cpu',
      proto: 'Event',
      summary: 'Too hot: the CPU throttles',
      explain: ['The CPU lowers its clock to protect itself. Nothing crashes, but the node falls behind its neighbours: turbostat shows the lower frequency, the benchmark shows an outlier.'],
      raw: "$ sudo turbostat --quiet --show PkgWatt,Busy%,Bzy_MHz,PkgTmp --interval 5",
      rawLabel: 'Command',
    },
    {
      from: 'psu',
      to: 'bmc',
      proto: 'Board',
      summary: 'Power readings, per PSU and for the server',
      explain: ['The BMC reports input power. Under full load it is the number that goes into the rack power budget.'],
      raw: '$ ipmitool ... dcmi power reading',
      rawLabel: 'Command (on BMCs that support DCMI)',
    },
    {
      from: 'pdu',
      to: 'psu',
      proto: 'Event',
      summary: 'Feed A off: PSU 2 carries the server alone',
      explain: ['Switch one feed off during load. The server keeps running on the other supply, the BMC logs the lost input, and the remaining supply must handle the full load.'],
    },
    {
      from: 'bmc',
      to: 'bmc',
      proto: 'Local',
      summary: 'Record the baseline: temperatures, fan speed, watts',
      explain: ['Steady-state numbers per node go into the report. Across a rack they should be close; one node running hotter or drawing more is worth a look.'],
    },
  ],
  keyPoints: [
    'Burn-in is a heat test: wait for the steady state.',
    'Throttling does not crash anything; it shows as a slow node.',
    'A fan or PSU event during burn-in is a finding.',
    'Test redundancy by switching one feed off under load.',
  ],
  tryIt: [
    { cmd: "ssh rk-n1 'stress-ng --cpu 2 --timeout 120s --metrics-brief'" },
    { cmd: './faults.sh inject cpu-throttle rk-n3', note: 'the slow-node picture of throttling' },
    { cmd: 'obmc sdr elist', note: 'Lab 3b: sensors on real BMC firmware' },
  ],
}

const lldp: Flow = {
  intro: [
    'A rack has hundreds of cables. One in the wrong switch port often still links up, and the tests pass until the wrong VLAN or the wrong bond member bites. LLDP lets every server port tell you where it is really plugged in.',
  ],
  actors: [
    { id: 'n2', label: 'rk-n2', sub: 'be0, be1', x: 110, y: 330, kind: 'server' },
    { id: 'sw', label: 'Back-end switch', sub: 'ports 1 to 48', x: 420, y: 130, kind: 'switch' },
    { id: 'kit', label: 'Test kit', sub: 'on the test host', x: 730, y: 330, kind: 'laptop' },
    { id: 'table', label: 'Cabling table', sub: 'from the design', x: 1040, y: 130, kind: 'os' },
  ],
  links: [
    ['n2', 'sw'],
    ['kit', 'n2'],
    ['kit', 'table'],
  ],
  steps: [
    {
      from: 'sw',
      to: 'n2',
      proto: 'Link',
      summary: 'The switch announces itself on every port',
      explain: ['LLDP frames go out on each port, every 30 seconds by default: the switch name, its chassis ID and the port ID.'],
    },
    {
      from: 'n2',
      to: 'n2',
      proto: 'Local',
      summary: 'lldpd on the server records what it hears',
      explain: ['With lldpd running, each server port knows its neighbour: which switch, which port.'],
      raw: `$ sudo lldpctl be1
Interface:    be1, via: LLDP
  SysName:    sw-be-01
  PortID:     ifname Ethernet9`,
      rawLabel: 'Example output (made up for practice)',
    },
    {
      from: 'kit',
      to: 'n2',
      proto: 'SSH',
      summary: 'Read the neighbours of every port, as JSON',
      explain: ['The kit collects the neighbour of every port on every node, in one format it can compare.'],
      raw: '$ sudo lldpctl -f json',
      rawLabel: 'Command',
    },
    {
      from: 'kit',
      to: 'table',
      proto: 'Tool',
      summary: 'Compare with the cabling table',
      explain: ['Expected: rk-n2 be1 to sw-be-01 port 4. Found: port 9.'],
    },
    {
      from: 'kit',
      to: 'kit',
      proto: 'Event',
      summary: 'Mismatch: rk-n2 be1 is in port 9',
      explain: ['Two cables swapped, or one plugged one row off. The link is up and pings work, which is exactly why only this check finds it.'],
    },
    {
      from: 'kit',
      to: 'n2',
      proto: 'Tool',
      summary: 'Move the cable, read LLDP again',
      explain: ['Fix it at the rack, check the labels on both ends, and read the neighbours again until every row matches.'],
    },
    {
      from: 'kit',
      to: 'table',
      proto: 'Local',
      summary: 'The verified cabling goes into the report',
      explain: ['The report lists every port with its verified neighbour. A later question about the cabling is answered from it.'],
    },
  ],
  keyPoints: [
    'A wrong cable often links and passes pings.',
    'LLDP tells each port which switch and port it reaches.',
    'Compare LLDP neighbours with the cabling table, row by row.',
  ],
  tryIt: [
    { cmd: "onall 'sudo apt-get install -y lldpd'", note: 'note: a Linux bridge does not forward LLDP by default, so in the lab nodes may see nothing; that is itself worth explaining' },
    { cmd: 'for n in rk-n1 rk-n2 rk-n3; do virsh domiflist $n; done', note: 'the lab cabling, from the host' },
  ],
}

const testScript: Flow = {
  intro: [
    'The posting asks for test utilities and test script automation. A test script is trusted only if it never passes by accident: it stops on errors, times out instead of hanging, writes data rather than prose, and its exit code tells the truth.',
  ],
  actors: [
    { id: 'eng', label: 'You', sub: 'writing the check', x: 110, y: 330, kind: 'person' },
    { id: 'sh', label: 'check-node.sh', sub: 'the test script', x: 400, y: 130, kind: 'os' },
    { id: 'node', label: 'rk-n1', sub: 'the node under test', x: 690, y: 330, kind: 'server' },
    { id: 'out', label: 'result.json', sub: 'one per test', x: 980, y: 130, kind: 'service' },
    { id: 'ci', label: 'Pipeline', sub: 'checks the checker', x: 1260, y: 330, kind: 'laptop' },
  ],
  links: [
    ['eng', 'sh'],
    ['sh', 'node'],
    ['sh', 'out'],
    ['ci', 'sh'],
  ],
  steps: [
    {
      from: 'eng',
      to: 'sh',
      proto: 'Tool',
      summary: 'Start strict: set -euo pipefail',
      explain: ['Stop at the first failing command, treat unset variables as errors, and let a failure inside a pipe count. Without it, a script can fail half way and still report success.'],
      raw: `#!/usr/bin/env bash
set -euo pipefail`,
      rawLabel: 'First lines',
    },
    {
      from: 'sh',
      to: 'node',
      proto: 'SSH',
      summary: 'Every remote call has a time limit',
      explain: ['A node that hangs must not hang the test. BatchMode stops ssh from waiting for a password.'],
      raw: 'timeout 300 ssh -o BatchMode=yes -o ConnectTimeout=5 "$node" "$cmd"',
      rawLabel: 'Pattern',
    },
    {
      from: 'sh',
      to: 'node',
      proto: 'SSH',
      summary: 'Collect facts as data, not as text',
      explain: ['Most tools speak JSON: parse it instead of cutting columns out of text that changes between versions.'],
      raw: `lsblk -J -b -o NAME,SIZE,SERIAL
ip -j link
lscpu -J`,
      rawLabel: 'JSON sources',
    },
    {
      from: 'sh',
      to: 'sh',
      proto: 'Local',
      summary: 'Compare with expected values from the BOM',
      explain: ['Expected values live in one file (the BOM), never inside the script. The same script then checks any rack.'],
    },
    {
      from: 'sh',
      to: 'out',
      proto: 'Local',
      summary: 'Write one result per test',
      explain: ['Test name, measured value, threshold, verdict, and the path to the evidence. A report is then generated from these files, not from someone reading logs.'],
      raw: `{ "test": "TC-STO-01", "node": "rk-n1", "value": 18240,
  "unit": "IOPS", "min": 14560, "verdict": "pass",
  "evidence": "results/20261121-0930/rk-n1/fio.json" }`,
      rawLabel: 'Example result',
    },
    {
      from: 'sh',
      to: 'sh',
      proto: 'Event',
      summary: 'The exit code tells the truth',
      explain: ['0 when everything passed, 1 when something failed, 2 when a test could not run at all. "Could not test" is never a pass.'],
    },
    {
      from: 'ci',
      to: 'sh',
      proto: 'Tool',
      summary: 'Test the checker itself',
      explain: ['ShellCheck on every change, and a run against a node with a known injected fault: if the script passes a broken node, the script is broken.'],
      raw: `shellcheck check-node.sh
./faults.sh inject slow-data-disk rk-n2 && ! ./check-node.sh rk-n2`,
      rawLabel: 'In the pipeline',
    },
    {
      from: 'ci',
      to: 'out',
      proto: 'Local',
      summary: 'Every result names the kit version',
      explain: ['The git commit of the kit goes into every result, so a number can always be traced to the exact script that produced it.'],
    },
  ],
  keyPoints: [
    'set -euo pipefail, a timeout on every remote call.',
    'JSON in, JSON out; expected values come from the BOM file.',
    'Exit codes: pass, fail, and "could not test", which is never a pass.',
    'Prove the script fails a node with a known fault.',
  ],
  tryIt: [
    { cmd: 'shellcheck lab/*.sh', note: 'the lab scripts pass it' },
    { cmd: "ssh rk-n1 'lsblk -J -b -o NAME,SIZE,SERIAL' | jq ." },
    { cmd: './faults.sh inject memory-missing rk-n2', note: 'then make your check fail on it' },
  ],
}

const windows: Flow = {
  intro: [
    'Some customers run Windows Server, and the posting asks for Windows and Linux scripting. The tests are the same; the tools are PowerShell, CIM classes, the event log and DiskSpd.',
  ],
  actors: [
    { id: 'host', label: 'Test host', sub: 'PowerShell 7', x: 110, y: 330, kind: 'laptop' },
    { id: 'win', label: 'Windows node', sub: 'Windows Server', x: 420, y: 130, kind: 'server' },
    { id: 'log', label: 'Event log', sub: 'System, Application', x: 730, y: 330, kind: 'os' },
    { id: 'disk', label: 'Data disk', sub: 'test target', x: 1040, y: 130, kind: 'disk' },
  ],
  links: [
    ['host', 'win'],
    ['win', 'log'],
    ['win', 'disk'],
  ],
  steps: [
    {
      from: 'host',
      to: 'win',
      proto: 'SSH',
      summary: 'Connect: PowerShell remoting',
      explain: ['Over SSH or WinRM, one session per node, the same loop as on Linux.'],
      raw: `$s = New-PSSession -HostName win-n1 -UserName admin
Invoke-Command -Session $s -ScriptBlock { hostname }`,
      rawLabel: 'PowerShell',
    },
    {
      from: 'host',
      to: 'win',
      proto: 'SSH',
      summary: 'Inventory with CIM classes',
      explain: ['CPUs, memory per slot, disks, network adapters: the same fields as the Linux inventory.'],
      raw: `Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores
Get-CimInstance Win32_PhysicalMemory | Select-Object DeviceLocator, Capacity, Speed
Get-PhysicalDisk | Select-Object FriendlyName, SerialNumber, Size, HealthStatus
Get-NetAdapter | Select-Object Name, MacAddress, LinkSpeed, Status`,
      rawLabel: 'PowerShell',
    },
    {
      from: 'win',
      to: 'host',
      proto: 'SSH',
      summary: 'Return JSON, for the same report',
      explain: ['ConvertTo-Json turns the objects into the format the Linux side writes, so one report covers both.'],
      raw: 'Get-PhysicalDisk | Select-Object SerialNumber, Size | ConvertTo-Json',
      rawLabel: 'PowerShell',
    },
    {
      from: 'host',
      to: 'win',
      proto: 'SSH',
      summary: 'Drivers and their versions',
      explain: ['Driver versions are part of compatibility: the NIC and storage drivers must match what the BOM or the customer image asks for.'],
      raw: `Get-CimInstance Win32_PnPSignedDriver | Select-Object DeviceName, DriverVersion
pnputil /enum-drivers`,
      rawLabel: 'Commands',
    },
    {
      from: 'host',
      to: 'log',
      proto: 'SSH',
      summary: 'Errors in the System log since the run started',
      explain: ['The Windows counterpart of reading dmesg: anything at error level during the run is a finding.'],
      raw: "Get-WinEvent -FilterHashtable @{ LogName = 'System'; Level = 2; StartTime = $start }",
      rawLabel: 'PowerShell',
    },
    {
      from: 'host',
      to: 'disk',
      proto: 'SSH',
      summary: 'Storage benchmark with DiskSpd',
      explain: ['Microsoft\'s DiskSpd plays the role of fio: random 4K reads, queue depth 32, four threads, 60 seconds, caching off, latency recorded.'],
      raw: 'diskspd.exe -c1G -d60 -r -w0 -t4 -o32 -b4K -Sh -L D:\\test.dat',
      rawLabel: 'Command',
    },
    {
      from: 'host',
      to: 'win',
      proto: 'SSH',
      summary: 'Network checks: Test-NetConnection and iperf3',
      explain: ['Reachability and ports with Test-NetConnection; throughput with iperf3, which also runs on Windows.'],
      raw: 'Test-NetConnection 10.70.0.12 -Port 22',
      rawLabel: 'PowerShell',
    },
    {
      from: 'win',
      to: 'win',
      proto: 'Local',
      summary: 'Same verdict rules as on Linux',
      explain: ['BOM match, minimums, the outlier rule, events during the run: the operating system changes, the method does not.'],
    },
  ],
  keyPoints: [
    'CIM classes give the inventory; ConvertTo-Json makes it comparable.',
    'Get-WinEvent is the dmesg of Windows.',
    'DiskSpd is the fio of Windows.',
    'Same method, same verdict rules, different tools.',
  ],
  tryIt: [
    { cmd: 'dotnet tool install --global PowerShell', note: 'PowerShell 7 on Linux, for the language' },
    { cmd: 'pwsh -c "Get-Process | Select-Object -First 3 | ConvertTo-Json"' },
  ],
}

const tuning: Flow = {
  intro: [
    'Identical hardware, different numbers. When parts and firmware match, the difference is often a setting: in the BIOS, in the operating system, or in where the benchmark runs.',
  ],
  actors: [
    { id: 'bench', label: 'Benchmark', sub: 'the test kit', x: 110, y: 330, kind: 'laptop' },
    { id: 'bios', label: 'BIOS settings', sub: 'power, C-states, turbo', x: 400, y: 130, kind: 'os' },
    { id: 'cpu', label: 'CPUs', sub: '2 sockets, 2 NUMA nodes', x: 690, y: 330, kind: 'chip' },
    { id: 'osx', label: 'Linux settings', sub: 'governor, tuned', x: 980, y: 130, kind: 'os' },
    { id: 'nic', label: 'NIC', sub: 'queues and IRQs', x: 1260, y: 330, kind: 'nic' },
  ],
  links: [
    ['bench', 'bios'],
    ['bios', 'cpu'],
    ['bench', 'cpu'],
    ['osx', 'cpu'],
    ['cpu', 'nic'],
  ],
  steps: [
    {
      from: 'bench',
      to: 'cpu',
      proto: 'SSH',
      summary: 'One node 8% behind, with identical parts',
      explain: ['BOM check passes, firmware matches, no errors in the logs. The next suspects are the settings.'],
    },
    {
      from: 'bench',
      to: 'bios',
      proto: 'HTTPS',
      summary: 'Compare the BIOS settings with the golden file',
      explain: ['Export the settings of every node and diff them against the approved file. Vendor tools save settings to a file; Redfish exposes them as the Bios resource\'s Attributes.'],
      raw: 'GET /redfish/v1/Systems/1/Bios   ->   "Attributes": { ... }',
      rawLabel: 'Redfish',
    },
    {
      from: 'bios',
      to: 'cpu',
      proto: 'Board',
      summary: 'Found: an energy-saving power profile on one node',
      explain: ['Deeper C-states and a lower power profile save energy at idle but add latency and lower sustained clocks. The rest of the rack runs the performance profile the BOM asks for.'],
    },
    {
      from: 'bench',
      to: 'osx',
      proto: 'SSH',
      summary: 'OS side: governor and tuned profile',
      explain: ['The CPU frequency governor and the tuned profile must match too, or the OS undoes what the BIOS set.'],
      raw: `$ cpupower frequency-info --policy
$ tuned-adm active`,
      rawLabel: 'Commands',
    },
    {
      from: 'bench',
      to: 'cpu',
      proto: 'SSH',
      summary: 'NUMA: where the benchmark runs matters',
      explain: ['A process on socket 0 reading memory of socket 1 is slower. Pin benchmarks so every node runs them the same way.'],
      raw: '$ numactl --cpunodebind=0 --membind=0 <benchmark>',
      rawLabel: 'Command',
    },
    {
      from: 'cpu',
      to: 'nic',
      proto: 'Board',
      summary: 'NIC: interrupts on the right socket',
      explain: ['A NIC belongs to one socket. Its interrupts and the traffic-handling threads should run there; ring buffer sizes matter at high rates.'],
      raw: `$ cat /sys/class/net/be0/device/numa_node
$ ethtool -g be0
$ grep be0 /proc/interrupts`,
      rawLabel: 'Commands',
    },
    {
      from: 'bios',
      to: 'bios',
      proto: 'Tool',
      summary: 'Fix the drift, rerun, record the settings',
      explain: ['Apply the approved profile, rerun the same benchmark: back within 1% of its neighbours. The settings file becomes part of the BOM check.'],
    },
    {
      from: 'bench',
      to: 'bench',
      proto: 'Local',
      summary: 'Tune for the customer\'s goal',
      explain: ['Fastest is not always right: some customers want the lowest energy per job, and the power profile is how they get it. The approved settings come from the customer, and the test checks every node follows them.'],
    },
  ],
  keyPoints: [
    'Same parts and firmware but different numbers: compare the settings.',
    'BIOS power profile, OS governor and NUMA placement all move benchmark results.',
    'Settings belong in the BOM check like firmware versions.',
    'Performance or energy efficiency is the customer\'s choice; the test enforces it.',
  ],
  tryIt: [
    { cmd: "ssh rk-n1 'numactl --hardware; cat /sys/class/net/be0/device/numa_node'" },
    { cmd: "ssh rk-n1 'numactl --cpunodebind=0 --membind=0 stress-ng --cpu 1 --timeout 30s --metrics-brief'" },
  ],
}

export const FLOWS3: Record<string, Flow> = {
  storage,
  thermal,
  lldp,
  'test-script': testScript,
  windows,
  tuning,
}

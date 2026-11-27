// The Toolbox: what a technician and a rack engineer reach for, on the belt and on the screen.
// Used by the Toolbox page (the wall and Pack the bag), the "Tools of the trade" flashcards and search.

export type ToolGroup = 'belt' | 'fibre' | 'copper' | 'console' | 'safety' | 'records' | 'open' | 'vendor'
export type Icon =
  | 'strap'
  | 'nut'
  | 'screw'
  | 'torch'
  | 'cutter'
  | 'velcro'
  | 'label'
  | 'bag'
  | 'scope'
  | 'clicker'
  | 'vfl'
  | 'meter'
  | 'loop'
  | 'optic'
  | 'tester'
  | 'toner'
  | 'console'
  | 'cart'
  | 'laptop'
  | 'shoe'
  | 'glove'
  | 'ear'
  | 'lift'
  | 'term'
  | 'web'
  | 'ticket'
  | 'db'
  | 'camera'

export interface Tool {
  id: string
  name: string
  group: ToolGroup
  icon: Icon
  /** What it is, one sentence. */
  what: string
  /** When you reach for it. */
  when: string
  /** How to use it: a command or short steps. */
  how: string
  mistake?: string
  lesson?: string
}

export const GROUPS: { id: ToolGroup; title: string; note: string }[] = [
  { id: 'belt', title: 'On your belt', note: 'hand tools for every job' },
  { id: 'fibre', title: 'Fibre kit', note: 'inspect, clean, prove' },
  { id: 'copper', title: 'Copper kit', note: 'trace and certify' },
  { id: 'console', title: 'Console', note: 'when the network is gone' },
  { id: 'safety', title: 'Safety', note: 'what keeps you whole' },
  { id: 'records', title: 'Records', note: 'where the job is written' },
  { id: 'open', title: 'On the screen: open tools', note: 'work on any vendor' },
  { id: 'vendor', title: 'On the screen: vendor tools', note: 'Supermicro first, then the others' },
]

export const TOOLS: Tool[] = [
  // on the belt
  { id: 'esd', name: 'ESD wrist strap', group: 'belt', icon: 'strap', what: 'A wrist band on a cord with a clip, to keep you at the same potential as the chassis.', when: 'Every time a lid comes off or a part leaves its bag: DIMMs, CPUs, cards, boards.', how: 'Band snug on the skin, clip on bare metal of the chassis or the grounded mat, then touch the part.', mistake: 'Clipping onto a painted surface, or wearing it over a sleeve.', lesson: 'floor-safety' },
  { id: 'bag', name: 'Anti-static bags', group: 'belt', icon: 'bag', what: 'Shielding bags that keep static away from parts.', when: 'Carrying a part to and from the rack, and for the failed part you take out.', how: 'Part in, fold the top, label it with the serial and the ticket number.', lesson: 'fru-swap' },
  { id: 'screwdriver', name: 'Screwdriver set', group: 'belt', icon: 'screw', what: 'Phillips and Torx bits, magnetic tip, for caddies, lids, rails and brackets.', when: 'Moving a disk into a new caddy, a lid with screws, rail brackets, cage nut screws.', how: 'Right bit for the head, hand-tight: stripped screws cost more time than they save.', mistake: 'A loose screw dropped into a running server.' },
  { id: 'cagenut', name: 'Cage nut tool', group: 'belt', icon: 'nut', what: 'A small hook that pulls the second wing of a cage nut into a square hole.', when: 'Fitting switches, patch panels, shelves and anything else with screws into square-hole posts.', how: 'Hook one wing inside the hole, then pull the other in with the tool.', mistake: 'Using a screwdriver instead: it slips, into your fingers.', lesson: 'rack-stack' },
  { id: 'torch', name: 'Torch or headlamp', group: 'belt', icon: 'torch', what: 'Light for the back of a rack and under floor tiles.', when: 'Reading labels and LEDs at the back, finding the right port in a dense panel.', how: 'Headlamp keeps both hands free.' },
  { id: 'cutter', name: 'Flush cutters', group: 'belt', icon: 'cutter', what: 'Small cutters for cable ties and packaging straps.', when: 'Removing old zip ties and unboxing in the staging room.', how: 'Cut away from cables, collect the offcuts.', mistake: 'Cutting a tie on a fibre bundle and nicking the fibre.' },
  { id: 'velcro', name: 'Velcro ties', group: 'belt', icon: 'velcro', what: 'Hook-and-loop straps for dressing cables.', when: 'Every cable you run, especially fibre.', how: 'Snug, not tight. Never zip-tie fibre.', lesson: 'copper' },
  { id: 'label', name: 'Label printer', group: 'belt', icon: 'label', what: 'Prints wrap-around labels for cables and flags for devices.', when: 'Both ends of every cable you run, every device you install.', how: 'Text from the cabling plan: from and to, or the circuit ID.', mistake: 'Labelling only one end.', lesson: 'copper' },
  // fibre
  { id: 'scope', name: 'Fibre inspection scope', group: 'fibre', icon: 'scope', what: 'A small microscope for the end face of a connector.', when: 'Before every connector goes into a port, and when a link has weak light or CRC errors.', how: 'Inspect, clean if needed, inspect again, then connect.', mistake: 'Skipping it because the dust cap was on.', lesson: 'fiber-clean' },
  { id: 'cleaner', name: 'One-click cleaner and wipes', group: 'fibre', icon: 'clicker', what: 'A pen that cleans a connector end face with a click; lint-free wipes and fluid for stubborn dirt.', when: 'Whenever the scope shows dirt, and on every new cross-connect.', how: 'Push into the connector or port, click once, inspect again.', lesson: 'fiber-clean' },
  { id: 'vfl', name: 'Visual fault locator', group: 'fibre', icon: 'vfl', what: 'A red laser pen that shines visible light into a fibre.', when: 'Tracing a strand through panels, finding breaks and tight bends, checking polarity.', how: 'Plug in at one end, look for the red glow at the other end or along the run.', mistake: 'Looking straight into a connector: point it at a card or the panel.', lesson: 'fiber-polarity' },
  { id: 'meter', name: 'Light source and power meter', group: 'fibre', icon: 'meter', what: 'A known light at one end and a meter at the other: measures the loss of a link.', when: 'Proving a new cross-connect or trunk before hand-over; finding the bad segment of a weak link.', how: 'Reference the pair first, then measure each strand at the right wavelength and save the reading.', lesson: 'cross-connect' },
  { id: 'loopback', name: 'Loopback plugs', group: 'fibre', icon: 'loop', what: 'A plug that connects transmit to receive, fibre or copper.', when: 'When a carrier or the client asks for a hard loop to test their side.', how: 'Plug into the port the ticket names, log the time, remove it when they are done.', lesson: 'cross-connect' },
  { id: 'optics', name: 'Known-good optics and cords', group: 'fibre', icon: 'optic', what: 'Spare transceivers and patch cords that you know work.', when: 'Swapping one part at a time to see whether a fault follows the part.', how: 'Same type as the ticket says (SR, LR, DAC); log what you swapped.', lesson: 'isolate' },
  // copper
  { id: 'tester', name: 'Cable tester or certifier', group: 'copper', icon: 'tester', what: 'Checks the wire map of a copper cable; a certifier also measures it against Cat6A limits.', when: 'Every new copper run, and a cable that links at a lower speed than it should.', how: 'Main unit at one end, remote at the other, save the result per cable.', mistake: 'Trusting a wire map pass for 10G: only a certifier catches a split pair.', lesson: 'copper' },
  { id: 'toner', name: 'Toner and probe', group: 'copper', icon: 'toner', what: 'A tone generator on one end and a probe that beeps near the right cable.', when: 'Finding which unlabelled cable in a bundle goes where.', how: 'Clip the tone on one end, sweep the probe along the bundle at the other, then label it.', lesson: 'copper' },
  // console
  { id: 'console-cable', name: 'Console cable', group: 'console', icon: 'console', what: 'USB to RJ45 or DB9 serial cable for the console port of switches and some servers.', when: 'A switch or a device has lost its management address and must be reached directly.', how: 'screen /dev/ttyUSB0 115200 (or 9600 on many switches); the ticket says which.', lesson: 'isolate' },
  { id: 'cart', name: 'Crash cart', group: 'console', icon: 'cart', what: 'A trolley with a monitor, keyboard and mouse, or a USB KVM adapter for a laptop.', when: 'A server shows no network and the client asks what is on its screen.', how: 'VGA or HDMI and USB to the server front or back; photograph the screen for the ticket.' },
  { id: 'laptop', name: 'Work laptop', group: 'console', icon: 'laptop', what: 'The site laptop with a terminal, the console tools and access to the ticket system.', when: 'Console work, BMC checks on a local port, reading the work order at the rack.', how: 'Only the site\'s approved laptop on a client\'s port.' },
  // safety
  { id: 'shoes', name: 'Safety shoes', group: 'safety', icon: 'shoe', what: 'Steel or composite toe caps.', when: 'Every shift on the floor and in the loading dock.', how: 'On before you enter the floor.', lesson: 'floor-safety' },
  { id: 'gloves', name: 'Work gloves', group: 'safety', icon: 'glove', what: 'Cut-resistant gloves.', when: 'Rails, cage nuts, sharp chassis edges, unboxing. Off for fine work with parts.', how: 'Grip gloves for lifting, off when handling DIMMs.', lesson: 'floor-safety' },
  { id: 'ears', name: 'Hearing protection', group: 'safety', icon: 'ear', what: 'Ear plugs or ear defenders.', when: 'Long work in loud halls and next to running GPU servers.', how: 'In before the noise, not after.', lesson: 'floor-safety' },
  { id: 'lift', name: 'Server lift', group: 'safety', icon: 'lift', what: 'A trolley with a platform that raises a server to the height of its rails.', when: 'Anything above the one-person limit, and every GPU server.', how: 'Rails fitted first, lift to the rail height, slide across, lock the wheels.', lesson: 'rack-stack' },
  // records
  { id: 'ticket', name: 'Ticket system', group: 'records', icon: 'ticket', what: 'Where every request, incident and change lives, with its evidence.', when: 'Before, during and after every job: no ticket, no work.', how: 'Read it fully, update it as you go, close it with readings and photos.', lesson: 'remote-hands' },
  { id: 'dcim', name: 'DCIM', group: 'records', icon: 'db', what: 'The database of racks, devices, power ports, network ports and cables.', when: 'Finding a rack or port, reserving ports, recording every install or change.', how: 'Look it up before you go, update it before you close the ticket.', lesson: 'rack-stack' },
  { id: 'camera', name: 'Phone camera', group: 'records', icon: 'camera', what: 'Evidence for the ticket: the port, the label, the LED, the screen.', when: 'Only where the site allows it, only the ticket\'s equipment.', how: 'Before and after, close enough to read the label.', lesson: 'floor-security' },
  // open tools
  { id: 'ipmitool', name: 'ipmitool', group: 'open', icon: 'term', what: 'The open command line tool for IPMI: power, sensors, event log, console, FRU.', when: 'Power on or off, read sensors and the SEL, open the serial console, on any vendor\'s BMC.', how: 'ipmitool -I lanplus -H <bmc> -U <user> -P <pass> power status', lesson: 'ipmi-power' },
  { id: 'redfish', name: 'curl and Redfish', group: 'open', icon: 'web', what: 'The REST API of modern BMCs, read with curl or any HTTP client.', when: 'Inventory, power, boot settings and firmware on many servers from a script.', how: 'curl -k -u <user>:<pass> https://<bmc>/redfish/v1/Systems', lesson: 'redfish' },
  { id: 'ethtool', name: 'ethtool', group: 'open', icon: 'term', what: 'Shows a network port\'s link, speed and the optic\'s light levels.', when: 'Link down, slow link, CRC errors, checking an optic.', how: 'ethtool be0 · ethtool -m be0 (light levels) · ethtool -S be0 (counters)', lesson: 'fiber-clean' },
  { id: 'lldpctl', name: 'lldpctl', group: 'open', icon: 'term', what: 'Shows which switch and port a server port is plugged into, from LLDP.', when: 'Proving every cable matches the cabling plan.', how: 'lldpctl be0', lesson: 'lldp' },
  { id: 'smartctl', name: 'smartctl and nvme-cli', group: 'open', icon: 'term', what: 'Drive health: SMART attributes, error logs, wear.', when: 'Before burn-in, after a disk error, before an RMA.', how: 'smartctl -a /dev/sda · nvme smart-log /dev/nvme0', lesson: 'storage' },
  { id: 'storcli', name: 'storcli', group: 'open', icon: 'term', what: 'The command line tool for Broadcom (LSI) RAID controllers.', when: 'Which disk failed, start a locate LED, watch a rebuild.', how: 'storcli /c0 /eall /sall show · storcli /c0 /e252 /s5 start locate', lesson: 'fru-swap' },
  { id: 'dmidecode', name: 'dmidecode and lshw', group: 'open', icon: 'term', what: 'Hardware inventory from the firmware tables and the kernel: serials, BIOS, CPUs, DIMMs.', when: 'Checking a node against the BOM.', how: 'dmidecode -t system · dmidecode -t memory · lshw -short', lesson: 'bom-check' },
  { id: 'stress-ng', name: 'stress-ng', group: 'open', icon: 'term', what: 'Loads CPUs, memory and more, and checks the results while it runs.', when: 'Burn-in: find weak parts before the rack ships.', how: 'stress-ng --cpu 0 --vm 2 --vm-bytes 75% --verify --timeout 12h', lesson: 'outlier' },
  { id: 'fio', name: 'fio', group: 'open', icon: 'term', what: 'The standard disk benchmark and load tool.', when: 'Disk burn-in and comparing a node\'s disks with the others.', how: 'fio --name=rand --filename=/dev/vdb --rw=randrw --bs=4k --iodepth=32 --runtime=600', mistake: 'Running write tests on a disk that holds data.', lesson: 'outlier' },
  { id: 'iperf3', name: 'iperf3', group: 'open', icon: 'term', what: 'Measures network throughput between two hosts.', when: 'Proving links and bonds reach their speed, and jumbo frames work end to end.', how: 'iperf3 -s on one node, iperf3 -c <ip> -P 4 -t 30 on the other', lesson: 'jumbo' },
  { id: 'memtester', name: 'memtester', group: 'open', icon: 'term', what: 'A memory test that runs inside Linux.', when: 'Memory burn-in, a DIMM under suspicion.', how: 'memtester 4G 3 (size and loops)', lesson: 'outlier' },
  { id: 'mtr', name: 'ping, traceroute, mtr', group: 'open', icon: 'term', what: 'Reachability and the path to a host.', when: '"It cannot reach": is it there, and where does the path stop?', how: 'ping -c 3 <ip> · traceroute -n <ip> · mtr -rw <ip>', lesson: 'ip-subnets' },
  // vendor tools
  { id: 'bmc-web', name: 'BMC web interface', group: 'vendor', icon: 'web', what: 'The BMC\'s own web page: sensors, event log, remote console, virtual media.', when: 'One server, by hand: watch a boot on the remote console, mount an ISO.', how: 'https://<bmc-ip>, user ADMIN, the unique password from the sticker or the vault.', lesson: 'vendor-tools' },
  { id: 'ipmicfg', name: 'IPMICFG', group: 'vendor', icon: 'term', what: 'Supermicro\'s in-band tool for the BMC\'s own settings, run from the server\'s OS.', when: 'A BMC address nobody knows, a BMC that needs a reset.', how: 'ipmicfg -m · ipmicfg -dhcp off · ipmicfg -m <ip> · ipmicfg -r', mistake: 'ipmicfg -fd: factory defaults wipe the BMC settings and users.', lesson: 'vendor-tools' },
  { id: 'smcipmitool', name: 'SMCIPMITool', group: 'vendor', icon: 'term', what: 'Supermicro\'s out-of-band command line tool for one BMC or many.', when: 'Power, sensors, the event log and virtual media on Supermicro servers from your laptop.', how: 'SMCIPMITool <bmc> ADMIN <password> ipmi power status', lesson: 'vendor-tools' },
  { id: 'sum', name: 'SUM (Supermicro Update Manager)', group: 'vendor', icon: 'term', what: 'Updates BIOS and BMC firmware and reads or writes BIOS settings files, in band or out of band.', when: 'Bringing a rack to one BIOS version and one golden settings file.', how: 'sum -i <bmc> -u ADMIN -p <pw> -c GetBiosInfo · -c UpdateBios --file <bin>', mistake: 'Forgetting each target node needs a licence key.', lesson: 'vendor-tools' },
  { id: 'saa', name: 'SAA (SuperServer Automation Assistant)', group: 'vendor', icon: 'term', what: 'Supermicro\'s newer all-in-one CLI that brings SUM, SMCIPMITool and IPMICFG together.', when: 'X12/H12 boards and newer, and always on X14/H14.', how: 'Run it without arguments for its command list; the migration guide maps the old commands.', lesson: 'vendor-tools' },
  { id: 'sd5', name: 'SuperDoctor 5', group: 'vendor', icon: 'term', what: 'An agent inside the OS that watches hardware health and sends alerts.', when: 'Health monitoring on Supermicro servers in production.', how: 'Installed in the OS; alerts by e-mail or SNMP; SSM watches many servers.', lesson: 'vendor-tools' },
  { id: 'other-vendors', name: 'racadm, iLOrest, OneCLI', group: 'vendor', icon: 'term', what: 'The remote CLIs of Dell (iDRAC), HPE (iLO) and Lenovo (XClarity Controller).', when: 'The same jobs on other vendors\' servers.', how: 'Learn the job with ipmitool and Redfish, then map it to the vendor\'s name for it.', lesson: 'vendor-tools' },
]

export const toolById = (id: string) => TOOLS.find((t) => t.id === id)

/* ---------- Pack the bag ---------- */

export interface PackOrder {
  title: string
  detail: string
  /** Tools you must bring. "a|b" means either one. */
  need: string[]
  /** Tools that are fine to bring for this job. */
  ok: string[]
  why: string
}

/** Never counted against you: you always carry these. */
export const ALWAYS = ['ticket', 'torch', 'shoes', 'camera', 'laptop']

export const PACK_TOOLS = ['esd', 'bag', 'screwdriver', 'cagenut', 'cutter', 'velcro', 'label', 'scope', 'cleaner', 'vfl', 'meter', 'loopback', 'optics', 'tester', 'toner', 'console-cable', 'cart', 'gloves', 'ears', 'lift', 'ipmitool', 'stress-ng', 'fio', 'memtester', 'iperf3', 'smartctl', 'sum', 'saa', 'ethtool', 'storcli']

export const ORDERS: PackOrder[] = [
  { title: 'Replace a failed disk', detail: 'C04-U30, bay 5, hot-swap SAS SSD; the new disk comes without a caddy.', need: ['esd', 'screwdriver', 'bag'], ok: ['storcli', 'label', 'gloves'], why: 'The new disk goes into the old caddy (screws), the failed one into an anti-static bag with its serial, and the strap is on before you touch either.' },
  { title: 'New 25G fibre between two racks', detail: 'C06 storage1 p1 to C04 tor1 eth1/30, 25 m through the row\'s panels, SR optics.', need: ['scope', 'cleaner', 'label', 'velcro'], ok: ['vfl', 'meter', 'optics', 'cutter', 'ethtool'], why: 'Inspect and clean every connector, dress the run with velcro and label both ends. A VFL or meter helps prove it.' },
  { title: 'Install a 2U server', detail: 'C04 U21-U22, 28 kg, sliding rails in the box, two PDUs.', need: ['lift', 'screwdriver', 'label', 'velcro', 'gloves'], ok: ['cagenut', 'cutter', 'esd', 'ipmitool'], why: '28 kg is above the one-person limit: the lift (or a second person). Gloves for the rails, a screwdriver for the thumbscrews and brackets, labels and velcro for the cables.' },
  { title: 'Switch lost its management address', detail: 'The client asks you to plug into the console of mgmt1 in C04 and read its config.', need: ['console-cable'], ok: ['label'], why: 'With no address the only way in is the serial console: the console cable and the site laptop.' },
  { title: 'Which cable goes to port 24?', detail: 'An unlabelled copper bundle at the back of C02; the client needs the one to patch panel port 24.', need: ['toner', 'label'], ok: ['tester', 'velcro', 'cutter'], why: 'Tone on the panel port, probe the bundle until it beeps, then label the cable so nobody has to tone it again.' },
  { title: 'Hard loop at the demarc', detail: 'The carrier asks for a fibre loop on MMR-1 PP-14 ports 7-8, toward them.', need: ['loopback', 'scope', 'cleaner'], ok: ['meter', 'vfl', 'label'], why: 'A fibre loopback plug, inspected and cleaned like any connector before it goes into the carrier\'s port.' },
  { title: 'Swap DIMM B1', detail: 'The server is shut down by the client; DIMM B1 is in the event log with hundreds of ECC errors.', need: ['esd', 'bag'], ok: ['screwdriver', 'gloves', 'ipmitool'], why: 'Strap on, cords out, the new DIMM out of its bag and the old one into it. Gloves come off for the DIMM itself.' },
  { title: 'What is on the screen?', detail: 'A server shows no network; the client asks what its screen says.', need: ['cart'], ok: ['console-cable', 'ipmitool'], why: 'A crash cart (monitor and keyboard, or a USB KVM for the laptop) shows the screen; photograph it for the ticket.' },
  { title: 'Burn in a new node', detail: 'rk-n14 must run 12 hours of CPU, memory and disk load before hand-over.', need: ['stress-ng', 'fio', 'ipmitool'], ok: ['memtester', 'iperf3', 'smartctl'], why: 'stress-ng for CPU and memory with --verify, fio on the data disk, and ipmitool to watch the sensors and the SEL while it runs.' },
  { title: 'One BIOS for twelve nodes', detail: 'A Supermicro X13 rack: same BIOS version and the golden settings file on every node.', need: ['sum|saa'], ok: ['ipmitool'], why: 'SUM (or SAA, the newer CLI) updates the BIOS and pushes the settings file out of band, node by node.' },
  { title: 'Certify a new 10G copper run', detail: '60 m of Cat6A from C02 to the office patch room, 10GBASE-T.', need: ['tester', 'label', 'velcro'], ok: ['toner', 'cutter'], why: 'Only a certifier proves a run for 10G; then label and dress it.' },
  { title: 'Link up but CRC errors climb', detail: 'C04 tor1 eth1/9 to rk-n12 be0, SR optics, Rx -11.8 dBm.', need: ['scope', 'cleaner'], ok: ['meter', 'optics', 'ethtool', 'vfl'], why: 'Weak light with errors is dirt until proven otherwise: inspect, clean, inspect, retest, then swap optics if it stays.' },
]

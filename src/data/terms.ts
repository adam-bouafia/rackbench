// Generated from the Rackbench terms guide (one entry per term, grouped by part). Do not edit by hand.
export interface TermPart {
  part: number
  title: string
  terms: { t: string; d: string }[]
}

export const TERMS: TermPart[] = [
 {
  "part": 1,
  "title": "Four ground truths",
  "terms": [
   {
    "t": "T1. A server is two computers in one box",
    "d": "The main computer (CPUs, memory, disks, network cards, the operating system) and a small computer that is always on as long as the power cords are in: the BMC, with its own network port. That is why a server can be powered on, watched and repaired from a desk."
   },
   {
    "t": "T2. A rack is many servers that are supposed to be identical",
    "d": "So every server is checked against a written expectation (the bill of materials, the firmware versions, the thresholds) and against its neighbours. Different from the paper or from the neighbours means a finding."
   },
   {
    "t": "T3. All communication between machines is done by sending packets over links",
    "d": "A link is a cable or an optic between two ports. Speed, errors and wrong cabling all live on links."
   },
   {
    "t": "T4. A test compares an actual result with an expected one, and writes the difference down with evidence",
    "d": "A test without an expected result, or one that cannot fail, is not a test."
   }
  ]
 },
 {
  "part": 2,
  "title": "The main computer",
  "terms": [
   {
    "t": "CPU",
    "d": "(central processing unit). The processor. Servers use Intel Xeon or AMD EPYC. The BOM names the model; lscpu shows it. (Lab 2)"
   },
   {
    "t": "Socket",
    "d": "The place on the board where a CPU sits. A server board has one or two (sometimes more). (Lab 2)"
   },
   {
    "t": "Core and thread",
    "d": "A core is one processing unit inside the CPU; with hyper-threading each core runs two threads. lscpu shows sockets, cores per socket and threads per core. (Lab 2)"
   },
   {
    "t": "NUMA",
    "d": "(non-uniform memory access). In a two-socket server each CPU has its own memory. A CPU reading its own memory is fast; reading the other CPU's memory is slower, because the data crosses between the sockets. Why you care: a benchmark that runs on one socket with memory on the other gives worse numbers, so a \"slow node\" can be a NUMA placement, not a broken part. (Lab 2)"
   },
   {
    "t": "QPI, UPI, Infinity Fabric",
    "d": "The link between the two sockets: QPI (QuickPath Interconnect) on older Intel Xeons, UPI (Ultra Path Interconnect) on newer ones, Infinity Fabric on AMD EPYC. A NUMA access to the other socket's memory crosses this link, which is why it is slower."
   },
   {
    "t": "NUMA node",
    "d": "One CPU plus the memory and PCIe devices attached to it. Two sockets usually means two NUMA nodes. lscpu and numactl -H show them. (Lab 2)"
   },
   {
    "t": "Memory channel",
    "d": "A path between a CPU and its memory slots. Each CPU has several. Bandwidth is best when every channel has the same DIMMs. (Lab 2)"
   },
   {
    "t": "DIMM",
    "d": "(dual in-line memory module). One memory stick. (Lab 2)"
   },
   {
    "t": "RDIMM",
    "d": "(registered DIMM). A server DIMM with a register chip that buffers the signals, so a board can carry more memory reliably. Servers use RDIMMs, not desktop DIMMs."
   },
   {
    "t": "ECC",
    "d": "(error-correcting code). Extra bits stored with the data so the memory can correct a single-bit error and detect a double-bit error. Corrected errors are reported to the BMC event log and the OS. Why you care: a DIMM that throws correctable errors during burn-in is failing; corrected is not healthy. (Lab 4)"
   },
   {
    "t": "Population table",
    "d": "The page in the board manual that says which slot to fill first (usually the first slot of each channel, labelled A1, B1, ...) and how to fill the board with fewer DIMMs. A missing or misplaced DIMM is a BOM finding. (Lab 2, Lab 9)"
   },
   {
    "t": "PCIe",
    "d": "(Peripheral Component Interconnect Express). The connection between the CPU and cards and drives (network cards, NVMe drives, GPUs, controllers). (Lab 2)"
   },
   {
    "t": "Lane, x4, x8, x16",
    "d": "PCIe carries data on lanes; a slot has 4, 8 or 16 of them. More lanes, more bandwidth."
   },
   {
    "t": "PCIe generation (Gen3, Gen4, Gen5)",
    "d": "Each generation doubles the speed per lane: about 1, 2 and 4 GB/s per lane in each direction."
   },
   {
    "t": "Link training, LnkCap and LnkSta",
    "d": "When a card starts, it agrees a width and speed with the slot. lspci -vv shows LnkCap (what it can do) and LnkSta (what it got). Narrower width than capable is a fault (bad seating, wrong slot, damaged card); a lower speed at idle can be power saving, so check it under load. (Lab 2)"
   },
   {
    "t": "Riser",
    "d": "A small board that turns a PCIe slot sideways so full cards fit in a flat 1U or 2U chassis."
   },
   {
    "t": "Storage: SSD, NVMe, SATA, SAS",
    "d": "SSD is a solid-state drive. NVMe drives talk PCIe directly and are the fastest; SATA and SAS are older drive interfaces (SAS for servers, with dual ports and higher reliability). (Lab 2, Lab 4)"
   },
   {
    "t": "Form factors: U.2, E1.S, M.2",
    "d": "Shapes of NVMe drives: U.2 is a 2.5-inch hot-swap drive, E1.S a long, thin hot-swap ruler, M.2 a small card on the board, often the boot drive."
   },
   {
    "t": "RAID",
    "d": "(redundant array of independent disks). Several disks combined into one virtual disk, for speed, safety or both. The levels to know:"
   },
   {
    "t": "RAID 0",
    "d": "(striping): data split across all disks. Fastest, full capacity, no protection: one dead disk loses everything."
   },
   {
    "t": "RAID 1",
    "d": "(mirroring): two disks hold the same data. Survives one disk failure, half the capacity, fast reads."
   },
   {
    "t": "RAID 5",
    "d": "(striping with one parity): survives one disk failure, capacity of N minus 1 disks, slower writes (parity is calculated on every write); a rebuild on big disks is long and risky."
   },
   {
    "t": "RAID 6",
    "d": "(two parities): survives two disk failures, capacity N minus 2, slower writes than RAID 5."
   },
   {
    "t": "RAID 10",
    "d": "(mirrors, then striped): survives one failure per mirror pair, half the capacity, fast reads and writes. Common for databases."
   },
   {
    "t": "JBOD",
    "d": "(\"just a bunch of disks\"). Disks with no RAID: each one shown to the OS on its own (or simply joined end to end). No protection; software (ZFS, Ceph) often does the redundancy instead. Also the name for a disk shelf: an enclosure full of drives with no server inside."
   },
   {
    "t": "SATA versus SAS",
    "d": "SATA: 6 Gb/s, one port, desktop roots, cheaper, large capacity. SAS: 12 Gb/s (24 Gb/s newest), full duplex, two ports (two controllers can reach the drive, so one path can fail), deeper command queues, faster spinning drives (10k and 15k rpm), built for servers. Physically the connectors look alike: SATA has a gap between the data and the power contacts; SAS fills that gap with a plastic bridge, and the second port's seven pins sit on the back of the plug. A SAS backplane or controller accepts SATA drives; a SATA one does not accept SAS drives (the bridge hits the key in the socket)."
   },
   {
    "t": "RAID controller and HBA",
    "d": "(host bus adapter). A RAID controller combines disks and shows the OS virtual disks; an HBA passes every disk through as it is. The BOM says which, with model and firmware."
   },
   {
    "t": "NIC",
    "d": "(network interface card). A network port: onboard ports plus add-in cards, often 25G or 100G and up. (Lab 5)"
   },
   {
    "t": "PSU",
    "d": "(power supply unit). Servers have two, redundant: 1+1 means either one alone can run the server. (Lab 1, Lab 4)"
   },
   {
    "t": "Fans and sensors",
    "d": "Temperature sensors on the board; the BMC speeds the fans up as they warm. A failed fan shows as a hot CPU and throttling. (Lab 3)"
   },
   {
    "t": "Chassis",
    "d": "The box: the frame, fans, backplane and power supplies around the board."
   },
   {
    "t": "Board generations: X13 (Intel), H13 (AMD)",
    "d": "Supermicro names its motherboard generations; the manual of one of them is the reading for memory population and the BMC chapter. (Lab 9)"
   },
   {
    "t": "SMBIOS",
    "d": "(System Management BIOS). Tables the firmware fills with the hardware facts: vendor, model, serial number, BIOS version, every DIMM. dmidecode reads them. (Lab 2)"
   },
   {
    "t": "Serial number, UUID",
    "d": "The unique identity of a server (the UUID is a long unique ID). The BOM and the asset list say which serial sits in which rack unit; a swapped server is a finding. (Lab 2)"
   },
   {
    "t": "FRU",
    "d": "(field replaceable unit). A part you can swap on site, and the BMC record of its serial and part numbers. ipmitool fru reads it. (Lab 3)"
   }
  ]
 },
 {
  "part": 3,
  "title": "The BMC",
  "terms": [
   {
    "t": "BMC",
    "d": "(baseboard management controller). The always-on computer on the board, with its own network port: power control, sensors, event log, remote console, virtual media, firmware updates, even when the server is off. (Lab 3)"
   },
   {
    "t": "Out-of-band and in-band",
    "d": "Out-of-band means through the BMC, over its own network, independent of the OS. In-band means from inside the running OS. Firmware can be updated either way."
   },
   {
    "t": "Management network (out-of-band network)",
    "d": "A separate network that only carries the BMC ports, apart from the data network. (Lab 1)"
   },
   {
    "t": "ASPEED AST2500 (and AST2600)",
    "d": "The chip most server BMCs run on. The OpenBMC lab emulates an AST2500. (Lab 3b)"
   },
   {
    "t": "IPMI",
    "d": "(Intelligent Platform Management Interface). The older, binary protocol for talking to a BMC, on UDP port 623. Still used everywhere. (Lab 3)"
   },
   {
    "t": "ipmitool",
    "d": "The command-line tool for IPMI: ipmitool -I lanplus -H <bmc> -U <user> -P <password> <command>. lanplus is the IPMI 2.0 interface over the network. (Lab 3)"
   },
   {
    "t": "Cipher suite 3 and 17",
    "d": "How an IPMI session authenticates and encrypts: suite 17 uses SHA-256 and is preferred on newer BMCs; suite 3 uses SHA-1 and is older. You pick it with -C 17. (Lab 3, Lab 3b)"
   },
   {
    "t": "power status | on | off | cycle | soft",
    "d": "Read power state, switch on, switch off hard, off and on again, or ask the OS to shut down cleanly (soft). (Lab 3)"
   },
   {
    "t": "chassis bootdev pxe | disk",
    "d": "Set the next boot device. (Lab 3, Lab 6)"
   },
   {
    "t": "SDR",
    "d": "(sensor data repository) and ipmitool sdr. The list of sensors with their readings and thresholds: temperatures, fans, voltages, power. (Lab 3)"
   },
   {
    "t": "SEL",
    "d": "(system event log) and ipmitool sel elist. The BMC's log of hardware events: memory errors, power supply loss, temperature over threshold. Save it after every test run, then clear it, so the next run starts clean and every entry belongs to one run. (Lab 3, Lab 3b)"
   },
   {
    "t": "SOL",
    "d": "(serial over LAN) and sol activate. The server's serial console through the BMC, for a node you cannot reach over the network. (Lab 3)"
   },
   {
    "t": "mc info",
    "d": "The BMC's own firmware version and capabilities. (Lab 3)"
   },
   {
    "t": "Redfish",
    "d": "The modern REST and JSON API for BMCs, defined by the DMTF, at https://<bmc>/redfish/v1/. Easier to script than IPMI, preferred for automation. (Lab 3)"
   },
   {
    "t": "REST and JSON",
    "d": "REST: resources at URLs, read with GET, changed with POST, PATCH and DELETE. JSON: the text format of the answers. curl sends the requests, jq picks fields out of the JSON. (Lab 3)"
   },
   {
    "t": "DMTF",
    "d": "(Distributed Management Task Force). The standards body behind Redfish and SMBIOS."
   },
   {
    "t": "Systems, Chassis, Managers, UpdateService",
    "d": "The main Redfish collections: Systems is the server (power, boot, CPUs, memory), Chassis is the box (sensors, power supplies), Managers is the BMC itself, UpdateService handles firmware. (Lab 3)"
   },
   {
    "t": "ComputerSystem.Reset",
    "d": "The Redfish action for power: a POST with a ResetType (On, ForceOff, GracefulShutdown, ForceRestart, PowerCycle). (Lab 3)"
   },
   {
    "t": "Boot override (PATCH Boot)",
    "d": "Setting the next boot device in Redfish: a PATCH of the system's Boot object, for example PXE, once. (Lab 3)"
   },
   {
    "t": "Redfish session and X-Auth-Token",
    "d": "A script logs in once per BMC (POST to SessionService/Sessions), uses the token it gets back, and deletes the session at the end. BMCs allow few sessions, so a script that never logs out locks itself out. (Lab 3)"
   },
   {
    "t": "Virtual media and remote console",
    "d": "The BMC can present an ISO file to the server as if it were a USB or DVD drive, and show the screen remotely. One way to install an OS on a node."
   },
   {
    "t": "ADMIN and the unique password",
    "d": "Supermicro BMCs use the user ADMIN; newer boards ship with a unique password printed on a label instead of one shared default."
   },
   {
    "t": "OpenBMC",
    "d": "Open-source BMC firmware, a Linux Foundation project. Most Supermicro boards run Supermicro's own BMC firmware, but IPMI commands and the standard Redfish resources are the same on both. (Lab 3b)"
   },
   {
    "t": "virtualbmc and sushy-tools",
    "d": "In the lab: virtualbmc answers IPMI for each VM, sushy-tools answers Redfish. They let you practise the real commands without a real BMC. (Lab 3)"
   },
   {
    "t": "QEMU",
    "d": "The emulator that runs the lab VMs and the OpenBMC firmware. (Lab 1, Lab 3b)"
   }
  ]
 },
 {
  "part": 4,
  "title": "Starting a server",
  "terms": [
   {
    "t": "Standby power",
    "d": "With the cords in, the BMC is powered even when the server is \"off\". (Lab 3)"
   },
   {
    "t": "POST",
    "d": "(power-on self test). The first thing the firmware does: memory training, then finding every device (device enumeration). A server that does not finish POST never boots."
   },
   {
    "t": "Memory training",
    "d": "The firmware tunes the timing of every DIMM at start-up. Long boots on servers with a lot of memory are mostly this."
   },
   {
    "t": "POST code",
    "d": "A two-digit code the firmware shows (on the board or in the BMC) as it goes; the last code tells where a server stopped."
   },
   {
    "t": "BIOS and UEFI",
    "d": "The firmware that runs POST and starts the boot. UEFI is the modern replacement for the old BIOS, but people still say \"BIOS\" for both. BIOS settings are part of the build. (Lab 2, fw.sh)"
   },
   {
    "t": "Boot order",
    "d": "Where the firmware looks for something to boot: local disk, the network, or virtual media from the BMC."
   },
   {
    "t": "Secure Boot",
    "d": "UEFI checks the signature of what it boots and refuses unsigned code. An OS image that does not boot with Secure Boot on is a compatibility finding."
   },
   {
    "t": "PXE",
    "d": "(preboot execution environment). Network boot built into the NIC firmware. (Lab 6)"
   },
   {
    "t": "DHCP",
    "d": "(dynamic host configuration protocol). Gives a machine its IP address, and for network boot also the name and location of a boot file. Step one of PXE. (Lab 6)"
   },
   {
    "t": "TFTP",
    "d": "(trivial file transfer protocol). The simple, old protocol classic PXE uses to download the boot file. (Lab 6)"
   },
   {
    "t": "iPXE and HTTP boot",
    "d": "iPXE is a better network boot loader that can download over HTTP (faster, more reliable than TFTP); UEFI can also boot over HTTP itself. The lab uses iPXE. (Lab 6)"
   },
   {
    "t": "Boot file, kernel, initrd",
    "d": "(initial RAM disk, initramfs). The loader downloads a kernel and a small RAM disk; the OS starts from them and can install itself to disk. Network boot in order: DHCP, boot file, loader, kernel and initrd, OS. That is how a whole rack gets its OS at once. (Lab 6)"
   },
   {
    "t": "Firmware update",
    "d": "New BIOS or BMC firmware, applied in-band or out-of-band. On a rack: one node first, verify, then the rest, with versions written down before and after. (Lab 3, fw.sh)"
   },
   {
    "t": "Baseline (firmware baseline)",
    "d": "The exact versions the customer ordered. Every node runs exactly those, not the newest. (Rack Shift, fw.sh)"
   },
   {
    "t": "Cold boot",
    "d": "A full power off and on, needed after some firmware changes. (fw.sh)"
   }
  ]
 },
 {
  "part": 5,
  "title": "The rack",
  "terms": [
   {
    "t": "Rack, 19-inch",
    "d": "The standard frame: 19 inches wide between the mounting rails. (Lab 1)"
   },
   {
    "t": "U",
    "d": "(rack unit). The height unit: 1U = 44.45 mm. Racks are 42U or 48U; servers are 1U, 2U, 4U. (Lab 1, Rack Lab)"
   },
   {
    "t": "Rails",
    "d": "Servers slide in on rails; heavy servers are lifted by two people or a lift."
   },
   {
    "t": "Integration levels L10, L11, L12",
    "d": "L10: one complete, tested server. L11: servers in a rack with switches, cabling and power, tested as a rack. L12: several racks tested as one cluster (network, storage, GPU communication, long stress runs)."
   },
   {
    "t": "Rack integration",
    "d": "Building the rack to the order and testing it before it ships."
   },
   {
    "t": "BOM",
    "d": "(bill of materials). The list of exactly what the customer ordered: CPU model, memory per slot, disks, NICs, firmware versions. It is the contract: the first check on every node. (Lab 2, Rack Shift)"
   },
   {
    "t": "R-Burn and S-Burn",
    "d": "The names of Supermicro's burn-in programmes in its rack services brochure."
   },
   {
    "t": "PDU",
    "d": "(power distribution unit). The power strip at the back of the rack. (Lab 1, Rack Lab)"
   },
   {
    "t": "Power budget of a server",
    "d": "Add the parts: CPU TDP (thermal design power, the watts a CPU is designed to dissipate) times the CPUs, plus DIMMs, drives, cards, GPUs and fans; divide by the PSU efficiency (about 0.94 for a Titanium-rated supply) to get the power drawn from the wall. Better: read the real number from the BMC (power readings) while the server runs burn-in, because nameplate values overstate the normal draw."
   },
   {
    "t": "Power budget of a rack",
    "d": "Add the servers, switches and everything else. One feed must carry it all if the other fails, and a feed is planned to at most 80% of its rating. Single-phase 230 V, 32 A: 230 × 32 = 7.36 kW, 80% is about 5.9 kW. Three-phase 400 V, 32 A: 400 × 32 × 1.73 is about 22 kW, 80% about 17.7 kW. Phase balancing: spread the load evenly over the three phases of a three-phase PDU. (Rack Lab)"
   },
   {
    "t": "Feed A and feed B",
    "d": "Two PDUs on separate power feeds; each server has one PSU on PDU A and one on PDU B, so a whole feed can fail without stopping anything. (Rack Lab)"
   },
   {
    "t": "C13/C14 and C19/C20",
    "d": "The power cord connectors: C13/C14 for normal servers, C19/C20 for high-power (GPU) servers."
   },
   {
    "t": "Cabling table",
    "d": "The list of every cable: node, port, switch, switch port. Part of the rack documentation; cables are labelled at both ends to match it. (Lab 1, Lab 5)"
   },
   {
    "t": "Airflow, cold aisle, hot aisle",
    "d": "Air goes through servers front to back: cold air in from the cold aisle, hot air out into the hot aisle. (Data center explorer)"
   },
   {
    "t": "Blanking panel",
    "d": "A cover for an empty rack unit, so hot air cannot flow back to the front. (Rack Lab)"
   },
   {
    "t": "Rack elevation",
    "d": "The drawing of what goes in which unit of the rack; you build to it."
   },
   {
    "t": "Crash cart",
    "d": "A trolley with a keyboard and monitor that someone wheels to a server that cannot be reached remotely."
   },
   {
    "t": "RMA",
    "d": "(return merchandise authorisation). Sending a faulty part back to the vendor with a report; the replacement comes from stock."
   },
   {
    "t": "SOP",
    "d": "(standard operating procedure). The written step-by-step way the team does a task, so every rack is built the same way."
   },
   {
    "t": "ESD",
    "d": "(electrostatic discharge). A static spark can kill a component: wear a wrist strap, work on a mat, hold parts by their edges."
   }
  ]
 },
 {
  "part": 6,
  "title": "The network",
  "terms": [
   {
    "t": "Ethernet speeds: 1, 10, 25, 100, 200, 400 GbE",
    "d": "Gigabit Ethernet speeds. Servers usually 25G or 100G, GPU servers 400G. (Lab 5)"
   },
   {
    "t": "Port form factors: SFP28, QSFP28, QSFP56, QSFP-DD, OSFP",
    "d": "The slot a transceiver or cable plugs into: SFP28 for 25G, QSFP28 for 100G, QSFP56 for 200G, QSFP-DD and OSFP for 400G and up."
   },
   {
    "t": "Transceiver (optic)",
    "d": "The module in the port that turns electrical signals into light for fibre. Its rated speed must match the port."
   },
   {
    "t": "DAC",
    "d": "(direct attach copper). A short copper cable with the plugs built on; cheap, for within a rack."
   },
   {
    "t": "AOC",
    "d": "(active optical cable). A fibre cable with the optics built into both ends."
   },
   {
    "t": "Fibre, LC duplex, MPO",
    "d": "Fibre with separate transceivers. LC duplex is the common two-fibre connector; MPO carries many fibres for parallel optics. Clean fibre ends before connecting."
   },
   {
    "t": "Switch, switch port, top of rack",
    "d": "The switch connects the servers; each server port goes to one switch port; the switch usually sits at the top of the rack. (Lab 5)"
   },
   {
    "t": "MAC address",
    "d": "The hardware address of a network port. The lab gives every port a fixed MAC. (Lab 1)"
   },
   {
    "t": "VLAN",
    "d": "(virtual LAN, 802.1Q tag). Splits one physical network into separate networks by tagging packets. (Lab 5)"
   },
   {
    "t": "Bond (bonding)",
    "d": "Two ports combined into one logical port, for redundancy or speed. (Lab 5)"
   },
   {
    "t": "Active-backup",
    "d": "A bond mode: one port carries the traffic, the other waits; if the active link goes down, the backup takes over. (Lab 5)"
   },
   {
    "t": "MII monitor and gratuitous ARP",
    "d": "The bond's link check (MII monitor) notices the link is down; after the switch-over the bond sends a gratuitous ARP so the switch learns where the address now lives. A few packets are lost and the failure count goes up. (Lab 5)"
   },
   {
    "t": "LACP",
    "d": "(802.3ad). A bond mode where both links carry traffic, agreed with the switch. MLAG (multi-chassis link aggregation) lets the two links go to two different switches, so a whole switch can fail."
   },
   {
    "t": "MTU",
    "d": "(maximum transmission unit). The largest packet a link carries: 1500 bytes by default. (Lab 5)"
   },
   {
    "t": "Jumbo frames (MTU 9000)",
    "d": "Larger packets for storage and cluster traffic. Every hop must agree: a mismatch passes small pings and breaks big transfers. Prove it end to end with ping -M do -s 8972 between every pair (\"do not fragment\", 9000 minus 28 bytes of headers). (Lab 5)"
   },
   {
    "t": "LLDP",
    "d": "(link layer discovery protocol). Switches and servers announce themselves on every link. With lldpd on the server, lldpctl shows which switch and switch port each server port is plugged into; compared with the cabling table, a swapped cable shows at once. (Rack Shift)"
   },
   {
    "t": "Intermittent link",
    "d": "A bad cable or transceiver that passes a throughput test but drops the link now and then. The evidence is in the counters. (Lab 5, flaky-link)"
   },
   {
    "t": "carrier_changes, link failure count, CRC errors",
    "d": "Counters per port: how often the link went down and up, how often the bond lost a link, how many packets arrived damaged. Read them before and after a test with ip -s link and ethtool -S. (Lab 5)"
   },
   {
    "t": "ethtool",
    "d": "Shows a port's negotiated speed and duplex, and its counters. A 25G port at 10G shows here. (Lab 5)"
   },
   {
    "t": "InfiniBand and RoCE",
    "d": "InfiniBand is a separate high-speed network common in HPC and AI clusters (ibstat, ibdiagnet); RoCE (RDMA over converged Ethernet) brings the same direct memory access to Ethernet."
   },
   {
    "t": "NAT",
    "d": "(network address translation). In the lab the management network reaches the internet through NAT on the host. (Lab 1)"
   }
  ]
 },
 {
  "part": 7,
  "title": "Testing",
  "terms": [
   {
    "t": "Functional test",
    "d": "Does it work at all: POST, every part seen, boots the OS. (Test types lesson)"
   },
   {
    "t": "Compatibility test",
    "d": "Does this part work with that board, firmware and OS."
   },
   {
    "t": "Performance test",
    "d": "Does it reach the expected numbers, and the same numbers as its neighbours. (Lab 4)"
   },
   {
    "t": "Stress test",
    "d": "Does it keep working at full load. (Lab 4)"
   },
   {
    "t": "Reliability test, burn-in",
    "d": "Does it keep working for hours or days without errors in the logs. Burn-in runs for hours because early failures show under sustained heat and load. (Lab 4)"
   },
   {
    "t": "Baseline (performance) and threshold",
    "d": "The expected numbers: a fixed minimum, and the median of the identical neighbours. (Lab 4)"
   },
   {
    "t": "Outlier",
    "d": "A node that is above the minimum but far from its neighbours (for example more than 15% under the median). It fails until explained: same model and firmware? same slot? PCIe width? (Lab 4)"
   },
   {
    "t": "Test plan",
    "d": "Scope, setup, the tests, and the pass criteria. (Lab 10, the kit)"
   },
   {
    "t": "Test case",
    "d": "One check: steps, expected result, actual result, with an ID such as TC-BOM-01. (The kit)"
   },
   {
    "t": "Test report",
    "d": "What the customer receives: configuration, what ran, results against thresholds, failures with evidence, open issues. (Lab 10)"
   },
   {
    "t": "Finding and issue",
    "d": "A finding is a difference written in the report; an issue is the ticket for the team that fixes it."
   },
   {
    "t": "Failure analysis",
    "d": "Reproduce, isolate (swap the part: does the error follow the part or stay with the slot?), root cause, corrective action, verify. (Lab 8)"
   },
   {
    "t": "Root cause and corrective action",
    "d": "Why it really failed, and what changes so it does not happen again."
   },
   {
    "t": "8D report",
    "d": "(eight disciplines). A structured problem report customers ask for on serious issues: team and problem description, containment, root cause, corrective and preventive action, and closure. (Issue to 8D lesson)"
   },
   {
    "t": "Regression",
    "d": "Passed yesterday, fails today: first ask what changed (firmware, cable, room temperature, other load), then reproduce and compare logs."
   }
  ]
 },
 {
  "part": 8,
  "title": "Tools on a test bench",
  "terms": [
   {
    "t": "lscpu",
    "d": "CPUs, sockets, cores, threads, NUMA nodes. (Lab 2)"
   },
   {
    "t": "lshw",
    "d": "A full hardware list. (Lab 2)"
   },
   {
    "t": "lspci, lspci -vv",
    "d": "PCIe devices, and with -vv their link capability and status. (Lab 2)"
   },
   {
    "t": "dmidecode",
    "d": "SMBIOS: vendor, model, serial, BIOS version, every DIMM slot. (Lab 2)"
   },
   {
    "t": "lsblk, nvme, smartctl, SMART",
    "d": "Disks and partitions; NVMe drives and their health; SMART is the drive's own health record (Self-Monitoring, Analysis and Reporting Technology). (Lab 2, Lab 4)"
   },
   {
    "t": "free, MemTotal",
    "d": "Memory as the OS sees it. (Lab 2)"
   },
   {
    "t": "ip, ethtool",
    "d": "Ports, addresses, link state, speed, counters. (Lab 5)"
   },
   {
    "t": "sensors",
    "d": "(lm_sensors). Temperatures and fans as the OS sees them. (Lab 4)"
   },
   {
    "t": "stress-ng",
    "d": "Loads CPU, memory, disks; with --verify it checks the results, so silent errors show. (Lab 4)"
   },
   {
    "t": "memtester",
    "d": "Writes and reads memory patterns to find bad memory. (Lab 4)"
   },
   {
    "t": "fio",
    "d": "(flexible I/O tester). Disk benchmark: reads and writes with fixed patterns. In the lab only on the data disk /dev/vdb. (Lab 4)"
   },
   {
    "t": "iperf3",
    "d": "Network throughput between two nodes. (Lab 5)"
   },
   {
    "t": "STREAM",
    "d": "Memory bandwidth benchmark. (Lab 4)"
   },
   {
    "t": "turbostat",
    "d": "CPU frequency per core, power and temperature: shows throttling. (Lab 4)"
   },
   {
    "t": "vmstat, uptime",
    "d": "Load and memory pressure at a glance. (Lab 4)"
   },
   {
    "t": "dmesg, journalctl",
    "d": "The kernel log and the system log. The kit scans them for known bad patterns: I/O error, link down, Machine Check, EDAC, out of memory, hung task, call trace. (Lab 4, the kit)"
   },
   {
    "t": "Machine Check (MCE)",
    "d": "The CPU's own report of a hardware error."
   },
   {
    "t": "EDAC, rasdaemon, ras-mc-ctl",
    "d": "EDAC is the Linux memory error reporting; rasdaemon collects these hardware error events and ras-mc-ctl summarises them (corrected errors per DIMM). (Lab 4)"
   },
   {
    "t": "ipmitool, curl, jq",
    "d": "IPMI from the command line; Redfish requests; JSON fields. (Lab 3)"
   },
   {
    "t": "ssh, a for loop",
    "d": "Run one command on many nodes and save the output per node: the start of every test script."
   },
   {
    "t": "virsh, virt-install",
    "d": "Control and create the KVM nodes. (Lab 1)"
   },
   {
    "t": "Snapshot",
    "d": "A saved state of all nodes, to break things and go back. (Lab 0, Lab 1)"
   }
  ]
 },
 {
  "part": 9,
  "title": "Vendor tools",
  "terms": [
   {
    "t": "SUM",
    "d": "(Supermicro Update Manager). Updates BIOS and BMC firmware and changes BIOS settings, in-band or out-of-band, on many servers at once. Commands like sum -i <bmc> -u ADMIN -p <password> -c GetBiosInfo, -c UpdateBios --file <file>, -c GetCurrentBiosCfg --file bios.xml, -c ChangeBiosCfg --file bios.xml. Some functions need a node licence. Why a rack team uses it on every rack: one tool, every node, the same versions and settings. (fw.sh plays it in the lab)"
   },
   {
    "t": "SMCIPMITool",
    "d": "Supermicro's IPMI command-line tool, with extras for their boards."
   },
   {
    "t": "SuperDoctor 5",
    "d": "Health monitoring from inside the OS."
   },
   {
    "t": "SSM",
    "d": "(Supermicro Server Manager) and SuperCloud Composer. Management of many servers and racks."
   }
  ]
 },
 {
  "part": 10,
  "title": "GPU racks",
  "terms": [
   {
    "t": "GPU",
    "d": "(graphics processing unit). The accelerator AI work runs on."
   },
   {
    "t": "HGX",
    "d": "NVIDIA's baseboard with four or eight GPUs linked together. Supermicro builds servers around it."
   },
   {
    "t": "NVLink and NVSwitch",
    "d": "NVIDIA's fast links between GPUs inside a server, and the switch chips that connect them all."
   },
   {
    "t": "nvidia-smi, nvidia-smi topo -m",
    "d": "Lists the GPUs (present, temperature, ECC errors); topo shows how GPUs and NICs connect."
   },
   {
    "t": "DCGM, dcgmi diag -r 1 | 2 | 3",
    "d": "NVIDIA's GPU diagnostics, from a quick level 1 to a long level 3."
   },
   {
    "t": "NCCL, all_reduce_perf",
    "d": "NVIDIA's library for GPUs talking to each other, and the test that measures bus bandwidth between GPUs and nodes."
   },
   {
    "t": "HPL",
    "d": "(High-Performance Linpack). The whole-cluster benchmark."
   },
   {
    "t": "HPC",
    "d": "(high-performance computing). Large compute clusters."
   },
   {
    "t": "Liquid cooling (direct liquid cooling)",
    "d": "GPU racks draw so much power that many are cooled with liquid, not only air."
   }
  ]
 },
 {
  "part": 11,
  "title": "The Windows side",
  "terms": [
   {
    "t": "Windows Server",
    "d": "The server edition of Windows; the lab uses Windows Server 2022 or 2025 evaluation images. (Lab 7)"
   },
   {
    "t": "PowerShell (pwsh)",
    "d": "Windows' shell and scripting language, also on Linux as pwsh. Commands are called cmdlets and return objects, not text. (Lab 7)"
   },
   {
    "t": "Get-CimInstance",
    "d": "Reads hardware facts (CPU, memory, BIOS, serial) from Windows' management classes, like dmidecode does on Linux. (Lab 7)"
   },
   {
    "t": "Get-PhysicalDisk, Get-NetAdapter",
    "d": "Disks and network ports. (Lab 7)"
   },
   {
    "t": "Get-WinEvent",
    "d": "The Windows event log, like journalctl. (Lab 7)"
   },
   {
    "t": "Test-NetConnection",
    "d": "Checks that a host and port answer. (Lab 7)"
   },
   {
    "t": "Invoke-Command",
    "d": "Runs a script block on remote machines: PowerShell's way to run one command on many nodes."
   },
   {
    "t": "Invoke-RestMethod, ConvertTo-Json, ConvertFrom-Json",
    "d": "Redfish from PowerShell: send the request, read the JSON as objects. (Lab 7)"
   },
   {
    "t": "foreach",
    "d": "Loop over node names. (Lab 7)"
   }
  ]
 },
 {
  "part": 12,
  "title": "The lab's words",
  "terms": [
   {
    "t": "rk-n1, rk-n2, rk-n3",
    "d": "The three nodes, in rack units U10, U11, U12, with serials RL2611-011 to 013. (Lab 1)"
   },
   {
    "t": "rack-data and rack-backend",
    "d": "The management network (192.168.70.0/24, with DHCP and NAT) and the isolated back end with MTU 9000. (Lab 1)"
   },
   {
    "t": "mgmt0, be0, be1",
    "d": "Each node's management port and two back-end ports (bonded as bond0 in Lab 5). (Lab 5)"
   },
   {
    "t": "vda and vdb",
    "d": "The OS disk and the data disk; fio only ever touches vdb. (Lab 4)"
   },
   {
    "t": "bom.yaml",
    "d": "The lab's bill of materials, what every node must match. (Lab 2, the kit)"
   },
   {
    "t": "faults.sh",
    "d": "Plants one of 11 faults: data-disk-missing, slow-data-disk, backend-link-down, slow-backend, memory-missing, mgmt-link-down, bmc-down, cpu-throttle, flaky-link, bios-drift, mtu-mismatch. (Lab 8)"
   },
   {
    "t": "fw.sh",
    "d": "Plays a vendor update tool: lists and changes the node BIOS versions (1.2 to 1.5), then cold-boots. (Lab 3)"
   },
   {
    "t": "bmc.sh and obmc.sh",
    "d": "Start the emulated BMCs (IPMI on ports 6231 to 6233, Redfish on 8000) and the OpenBMC firmware in QEMU. (Lab 3, Lab 3b)"
   },
   {
    "t": "snapshot-rack.sh",
    "d": "Save and restore all three nodes at once. (Lab 0)"
   }
  ]
 }
]

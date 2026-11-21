import { useState } from 'react'

interface Entry {
  cmd: string
  what: string
}
interface Sheet {
  id: string
  title: string
  color: string
  entries: Entry[]
}

const IPMI = 'ipmitool -I lanplus -C 17 -H <bmc> -U <user> -P <pass>'

export const SHEETS: Sheet[] = [
  {
    id: 'ipmi',
    title: 'IPMI with ipmitool',
    color: 'var(--c-bmc)',
    entries: [
      { cmd: `${IPMI} power status`, what: 'Is the server on? Works while the server is off.' },
      { cmd: `${IPMI} power on | off | cycle | soft`, what: 'Power actions; soft asks the OS to shut down (ACPI).' },
      { cmd: `${IPMI} chassis bootdev pxe [options=efiboot]`, what: 'Next boot from the network; add efiboot on UEFI servers.' },
      { cmd: `${IPMI} chassis bootparam get 5`, what: 'Read back the stored boot flags.' },
      { cmd: `${IPMI} sdr elist`, what: 'Sensors: temperatures, fans, voltages, with thresholds.' },
      { cmd: `${IPMI} sel elist`, what: 'The system event log, with readable descriptions.' },
      { cmd: `${IPMI} sel clear`, what: 'Empty the event log (save it first).' },
      { cmd: `${IPMI} fru print`, what: 'Serial and part numbers of board, chassis and PSUs.' },
      { cmd: `${IPMI} mc info`, what: 'BMC firmware version and capabilities.' },
      { cmd: `${IPMI} mc reset cold`, what: 'Restart the BMC itself (the server keeps running).' },
      { cmd: `${IPMI} lan print 1`, what: 'BMC network settings: IP, MAC, gateway, VLAN.' },
      { cmd: `${IPMI} sol activate`, what: 'Serial console over LAN; leave with ~.' },
      { cmd: `${IPMI} chassis identify 15`, what: 'Blink the UID LED for 15 seconds to find the server.' },
    ],
  },
  {
    id: 'redfish',
    title: 'Redfish with curl',
    color: 'var(--c-bmc)',
    entries: [
      { cmd: 'curl -sk https://<bmc>/redfish/v1 | jq .', what: 'Service root; follow the @odata.id links from here.' },
      { cmd: "curl -sk -i -X POST -H 'Content-Type: application/json' -d '{\"UserName\":\"<user>\",\"Password\":\"<pass>\"}' https://<bmc>/redfish/v1/SessionService/Sessions", what: 'Log in: keep X-Auth-Token and Location from the headers.' },
      { cmd: 'curl -sk -H "X-Auth-Token: $T" https://<bmc>/redfish/v1/Systems/<id> | jq .', what: 'Power state, BIOS version, CPUs, memory, boot override.' },
      { cmd: "curl -sk -X PATCH -H \"X-Auth-Token: $T\" -H 'Content-Type: application/json' -d '{\"Boot\":{\"BootSourceOverrideTarget\":\"Pxe\",\"BootSourceOverrideEnabled\":\"Once\"}}' https://<bmc>/redfish/v1/Systems/<id>", what: 'One-time PXE boot.' },
      { cmd: "curl -sk -X POST -H \"X-Auth-Token: $T\" -H 'Content-Type: application/json' -d '{\"ResetType\":\"ForceRestart\"}' https://<bmc>/redfish/v1/Systems/<id>/Actions/ComputerSystem.Reset", what: 'Restart; pick ResetType from its AllowableValues.' },
      { cmd: 'curl -sk -H "X-Auth-Token: $T" https://<bmc>/redfish/v1/UpdateService/FirmwareInventory | jq .', what: 'Firmware versions: BIOS, BMC, others.' },
      { cmd: 'curl -sk -X DELETE -H "X-Auth-Token: $T" https://<bmc><Location>', what: 'Log out: BMCs allow few sessions.' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory from Linux',
    color: 'var(--c-rack)',
    entries: [
      { cmd: 'lscpu', what: 'Sockets, cores, threads, NUMA nodes, CPU model.' },
      { cmd: 'numactl --hardware', what: 'Memory per NUMA node: unequal means unequal DIMMs per socket.' },
      { cmd: 'sudo dmidecode -t system -t baseboard -t bios', what: 'Manufacturer, product, serials, BIOS vendor and version.' },
      { cmd: 'sudo dmidecode -s bios-version', what: 'Just the BIOS version, for scripts.' },
      { cmd: 'sudo dmidecode -t memory', what: 'One block per DIMM slot: locator, size, speed, part number.' },
      { cmd: 'lspci -tv', what: 'The PCIe tree.' },
      { cmd: "sudo lspci -vv -s <addr> | grep -E 'LnkCap|LnkSta'", what: 'Link width and speed: capable versus trained.' },
      { cmd: 'lsblk -o NAME,SIZE,MODEL,SERIAL', what: 'Disks with serials.' },
      { cmd: 'sudo nvme list', what: 'NVMe drives, models, firmware.' },
      { cmd: 'sudo smartctl -a /dev/<disk>', what: 'Disk health, errors, wear.' },
      { cmd: 'ethtool <nic>', what: 'Link speed, duplex, link detected.' },
      { cmd: 'sudo lshw -short', what: 'A one-page hardware list.' },
      { cmd: 'sensors', what: 'Temperatures and fans as the OS sees them.' },
    ],
  },
  {
    id: 'burnin',
    title: 'Burn-in and benchmarks',
    color: 'var(--c-test)',
    entries: [
      { cmd: 'stress-ng --cpu 0 --cpu-method matrixprod --timeout 60s --metrics-brief', what: 'CPU load on every core, with bogo ops per second.' },
      { cmd: 'stress-ng --vm 4 --vm-bytes 80% --verify --timeout 4h', what: 'Memory stress that reads back every value.' },
      { cmd: 'sudo memtester 8G 3', what: 'Memory test patterns, three passes.' },
      { cmd: 'sudo fio --name=rr --filename=/dev/<data disk> --direct=1 --ioengine=libaio --rw=randread --bs=4k --iodepth=32 --runtime=60 --time_based --output-format=json', what: 'Random read IOPS. Writes destroy data: only on a data disk.' },
      { cmd: 'iperf3 -s -D', what: 'Throughput server, in the background.' },
      { cmd: 'iperf3 -c <peer> -t 30 -P 4 -J', what: 'Throughput client, four streams, JSON output.' },
      { cmd: 'sudo turbostat --quiet --show PkgWatt,Busy%,Bzy_MHz --interval 5', what: 'CPU power and frequency under load: throttling shows here.' },
    ],
  },
  {
    id: 'network',
    title: 'Network checks',
    color: 'var(--c-test)',
    entries: [
      { cmd: 'ping -M do -s 8972 -c 3 <peer>', what: 'Jumbo frames end to end: 9000 - 20 - 8 = 8972.' },
      { cmd: 'cat /proc/net/bonding/bond0', what: 'Active slave, MII status, link failure count per port.' },
      { cmd: 'cat /sys/class/net/<nic>/carrier_changes', what: 'Link up and down events since boot.' },
      { cmd: 'ip -s link show <nic>', what: 'Packets, errors and drops per interface.' },
      { cmd: 'ethtool -S <nic>', what: 'Driver counters: CRC errors, discards.' },
      { cmd: 'sudo lldpctl', what: 'Which switch and port each server port is plugged into.' },
      { cmd: "journalctl -k --since -10min | grep -i -E 'link|bond'", what: 'Link events in the kernel log.' },
    ],
  },
  {
    id: 'boot',
    title: 'Boot, PXE and logs',
    color: 'var(--c-boot)',
    entries: [
      { cmd: 'DHCP option 53 / 54 / 51', what: 'Message type, server identifier, lease time.' },
      { cmd: 'DHCP option 60 / 93 / 77', what: 'PXEClient vendor class, client architecture (0 BIOS, 7 UEFI x64), user class "iPXE".' },
      { cmd: 'DHCP option 66 / 67', what: 'TFTP server name and boot file name.' },
      { cmd: 'kernel <url> ip=dhcp ... / initrd <url> / boot', what: 'The three lines of an iPXE boot script.' },
      { cmd: 'sudo efibootmgr -v', what: 'UEFI boot entries and order.' },
      { cmd: 'sudo dmesg -T | tail -50', what: 'Recent kernel messages with readable times.' },
      { cmd: 'sudo ras-mc-ctl --errors', what: 'Memory errors with the DIMM label (rasdaemon).' },
    ],
  },
  {
    id: 'lab',
    title: 'rackbench lab',
    color: 'var(--c-practice)',
    entries: [
      { cmd: './provision-rack.sh', what: 'Build the networks and the three nodes.' },
      { cmd: './snapshot-rack.sh save clean | revert clean', what: 'Save or restore all three nodes at once.' },
      { cmd: './bmc.sh start && source env.sh', what: 'Emulated BMCs and the shortcuts.' },
      { cmd: 'bmc rk-n1 power status', what: 'IPMI to one node through the shortcut.' },
      { cmd: 'rfsys rk-n1', what: 'Redfish system resource of one node.' },
      { cmd: './fw.sh list | update <node> <version>', what: 'BIOS versions; flash one node.' },
      { cmd: './obmc.sh run', what: 'OpenBMC in QEMU: real SEL, sensors, Redfish sessions.' },
      { cmd: './faults.sh random | reveal | clear', what: 'One hidden fault, the answer, undo.' },
      { cmd: "onall '<command>'", what: 'Run a command on every node.' },
    ],
  },
]

export function Cheatsheets() {
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState('')
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const match = (e: Entry) => words.every((w) => `${e.cmd} ${e.what}`.toLowerCase().includes(w))
  const copy = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopied(cmd)
      setTimeout(() => setCopied(''), 1200)
    } catch {
      /* blocked */
    }
  }
  return (
    <div className="sheets">
      <header className="page-head">
        <p className="eyebrow">Cheatsheets</p>
        <h1>The commands a rack engineer types every day</h1>
        <div className="sheet-search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter: sel, mtu, bios, fio…" aria-label="Filter commands" />
        </div>
      </header>
      <div className="sheet-grid">
        {SHEETS.map((s) => {
          const list = s.entries.filter(match)
          if (!list.length) return null
          return (
            <section key={s.id} className="card sheet" id={`sheet-${s.id}`}>
              <h2 className="sheet-title">
                <i style={{ background: s.color }} />
                {s.title}
              </h2>
              <ul>
                {list.map((e) => (
                  <li key={e.cmd}>
                    <button className="sheet-cmd" onClick={() => copy(e.cmd)} title="Copy">
                      <code>{e.cmd}</code>
                      <span className="sheet-copy">{copied === e.cmd ? 'copied' : 'copy'}</span>
                    </button>
                    <span className="sheet-what">{e.what}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

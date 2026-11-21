import { useState } from 'react'
import { Verdict } from '../engine/ui'
import { markDone } from '../progress'

interface Q {
  q: string
  options: string[]
  answer: number
  why: string
  lesson: string
}

const QUESTIONS: Q[] = [
  { q: 'A server does not respond to SSH, but ipmitool power status says "Chassis Power is on". What do you open next?', options: ['A support ticket for a dead server', 'The serial console through the BMC', 'A new burn-in run', 'The BIOS update tool'], answer: 1, why: 'The BMC is alive and the server has power, so look at what the operating system or the boot is doing: the console (Serial over LAN) shows it.', lesson: 'ipmi-power' },
  { q: 'Why does ipmitool not send your password over the network with -I lanplus?', options: ['It is encrypted with AES first', 'RAKP messages prove both sides know it with an HMAC', 'IPMI has no passwords', 'It sends a hash of it'], answer: 1, why: 'In RAKP messages 2 and 3 each side sends an HMAC keyed with the password. The password itself never crosses the wire.', lesson: 'ipmi-power' },
  { q: 'What is the largest ping payload that proves a 9000-byte MTU end to end?', options: ['9000', '8992', '8972', '8000'], answer: 2, why: '9000 minus 20 bytes of IPv4 header and 8 bytes of ICMP header leaves 8972 bytes of payload. Use -M do so nothing is fragmented.', lesson: 'jumbo' },
  { q: 'A node passes every throughput test, but its bond Link Failure Count rose by 3 during the run. Verdict?', options: ['Pass: the numbers are fine', 'Fail: an intermittent link', 'Pass with a note', 'Rerun until it passes'], answer: 1, why: 'Counters that moved during a run are a finding. A link that drops in a 10-minute test will drop in production.', lesson: 'flaky' },
  { q: 'Correctable ECC errors appear on DIMM A1. You move the DIMM to B1 and the errors now name B1. What is bad?', options: ['Slot A1', 'The memory controller', 'The DIMM', 'The BIOS'], answer: 2, why: 'The errors followed the part, so the part is bad. If they had stayed on A1 with another DIMM there, the slot or the board would be the suspect.', lesson: 'sel' },
  { q: 'Why do you save and clear the SEL at the start of every test run?', options: ['The SEL is small and fills up', 'So the run starts from an empty log and old events are kept as evidence', 'Clearing resets the BMC', 'The BIOS requires it'], answer: 1, why: 'Old entries would mix with new ones. Save them (they may matter later), clear, and save again at the end of the run.', lesson: 'sel' },
  { q: 'On a rack of 16 nodes, which order is right for a BIOS update?', options: ['All nodes at once, to save time', 'One node, verify, then the rest one at a time', 'Half the rack, then the other half', 'Only the nodes that fail tests'], answer: 1, why: 'A bad image or a power cut during the flash then costs one node, not the rack. Record versions before and after.', lesson: 'bios-update' },
  { q: 'In PXE, what tells the DHCP server whether a client boots in BIOS or UEFI mode?', options: ['Option 53', 'Option 60 only', 'Option 93, the client architecture', 'The MAC address'], answer: 2, why: 'Option 93 carries the client architecture (0 for BIOS x86, 7 for UEFI x64), so the server can hand out the right boot file.', lesson: 'pxe' },
  { q: 'Why does Linux ask DHCP again after iPXE already got an address?', options: ['The lease expired', 'The operating system does not inherit the boot ROM network setup', 'To get a different address', 'It does not; it reuses it'], answer: 1, why: 'The kernel starts with its own network stack. With ip=dhcp on the command line it requests its own lease.', lesson: 'pxe' },
  { q: 'Two power supplies per server, one on PDU A and one on PDU B. Why?', options: ['To double the power', 'So one feed can fail without stopping the server', 'Because one PSU is for the BMC', 'To balance the noise'], answer: 1, why: 'Each feed alone must carry the server. A rack test proves it by switching one feed off during burn-in.', lesson: 'rack-tour' },
  { q: 'A NIC reports LnkCap x16 Gen4 and LnkSta x8 Gen4 under load. What do you suspect?', options: ['Nothing, that is normal', 'Wrong slot, bad riser or a BIOS setting', 'A bad cable', 'A driver bug only'], answer: 1, why: 'The card trained at half its lanes. Check the slot, the riser and the BIOS PCIe settings; a lower width is a fault even at idle.', lesson: 'server-anatomy' },
  { q: 'Storage on one node is 18% under the rack median but above the fixed minimum. Pass or fail?', options: ['Pass: it is above the minimum', 'Fail as an outlier until explained', 'Pass if the others are fast', 'Only fail after 24 hours'], answer: 1, why: 'Identical hardware should give near-identical numbers. An outlier fails until you know why: model, firmware, slot, link width.', lesson: 'outlier' },
  { q: 'Which runs first on a newly integrated rack?', options: ['24-hour burn-in', 'Network throughput matrix', 'The BOM check', 'BIOS update'], answer: 2, why: 'A burn-in on a node with the wrong parts or firmware is wasted time. Check every node against the BOM first.', lesson: 'bom-check' },
  { q: 'In Redfish, how do you set a one-time PXE boot?', options: ['POST to ComputerSystem.Reset', 'PATCH the Boot object with BootSourceOverrideTarget Pxe and Enabled Once', 'PUT /redfish/v1/Pxe', 'GET with ?boot=pxe'], answer: 1, why: 'Boot override is a PATCH of the system resource; power actions are POSTs to an action target.', lesson: 'redfish' },
  { q: 'An active-backup bond loses its active cable. Pings run every 200 ms with miimon 100. About how many are lost?', options: ['None ever', 'About 0 to 1', 'About 10', 'All until the cable is back'], answer: 1, why: 'The bond notices within one MII interval (up to 100 ms) and moves to the backup, then sends a gratuitous ARP. At most one ping falls in that gap.', lesson: 'bond' },
]

export function Quiz() {
  const [i, setI] = useState(0)
  const [pick, setPick] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const q = QUESTIONS[i]

  const choose = (k: number) => {
    if (pick !== null) return
    setPick(k)
    if (k === q.answer) setScore((s) => s + 1)
  }
  const next = () => {
    if (i + 1 >= QUESTIONS.length) {
      setFinished(true)
      markDone('quiz')
      return
    }
    setI(i + 1)
    setPick(null)
  }
  const restart = () => {
    setI(0)
    setPick(null)
    setScore(0)
    setFinished(false)
  }

  if (finished)
    return (
      <div className="quiz">
        <h2>
          {score} of {QUESTIONS.length} right
        </h2>
        <p className="muted">{score >= 12 ? 'Ready for the rack.' : score >= 8 ? 'Solid. Go back to the lessons behind the ones you missed.' : 'Take the lessons again, then come back.'}</p>
        <button className="btn btn-primary" onClick={restart}>
          Again
        </button>
      </div>
    )

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span>
          Question {i + 1} of {QUESTIONS.length}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="quiz-bar">
        <div style={{ width: `${(i / QUESTIONS.length) * 100}%` }} />
      </div>
      <h2 className="quiz-q">{q.q}</h2>
      <ol className="quiz-options">
        {q.options.map((o, k) => {
          const state = pick === null ? '' : k === q.answer ? ' is-right' : k === pick ? ' is-wrong' : ' is-dim'
          return (
            <li key={o}>
              <button className={`quiz-opt${state}`} onClick={() => choose(k)}>
                <span className="quiz-letter">{'ABCD'[k]}</span>
                {o}
              </button>
            </li>
          )
        })}
      </ol>
      {pick !== null && (
        <div className="quiz-why">
          <Verdict ok={pick === q.answer}>{pick === q.answer ? 'Right' : 'Not quite'}</Verdict> {q.why}{' '}
          <a href={`#/lesson/${q.lesson}`}>Lesson →</a>
          <div>
            <button className="btn btn-primary" onClick={next}>
              {i + 1 >= QUESTIONS.length ? 'See the score' : 'Next question'} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

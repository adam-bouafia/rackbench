import type { CSSProperties } from 'react'
import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'

// Replacing failed parts on the floor: find the server, then a disk, a PSU, a fan and a DIMM, then the RMA.

type Scene = 'locate' | 'disk' | 'rebuild' | 'psu' | 'fan' | 'dimm' | 'post' | 'rma'
export interface SwapStep extends StageStep {
  scene: Scene
}

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` })

function Term({ x, y, w, lines }: { x: number; y: number; w: number; lines: string[] }) {
  return (
    <g className="fb-in" style={d(0.4)}>
      <rect x={x} y={y} width={w} height={20 + lines.length * 19} rx="10" className="fb-term" />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 25 + i * 19} className={`fb-term-text${l.startsWith('!') ? ' is-bad' : l.startsWith('+') ? ' is-ok' : ''}`}>
          {l.replace(/^[!+]/, '')}
        </text>
      ))}
    </g>
  )
}

/** Front of a 2U server with 12 drive bays. */
function Front({ x, y, fault, out, fresh }: { x: number; y: number; fault?: number; out?: boolean; fresh?: boolean }) {
  return (
    <g>
      <rect x={x + 5} y={y + 5} width={700} height={130} rx="8" className="fb-shadow" />
      <rect x={x} y={y} width={700} height={130} rx="8" className="sw-chassis" />
      <circle cx={x + 24} cy={y + 30} r="8" className="sw-uid" />
      <text x={x + 24} y={y + 56} textAnchor="middle" className="fb-tiny">
        UID
      </text>
      {Array.from({ length: 12 }, (_, i) => {
        const bx = x + 60 + (i % 6) * 104
        const by = y + 12 + Math.floor(i / 6) * 58
        const isFault = i === fault
        return (
          <g key={i} className={isFault && out ? 'sw-out' : isFault && fresh ? 'sw-in' : ''}>
            <rect x={bx} y={by} width={96} height={50} rx="4" className={`sw-bay${isFault && fresh ? ' is-new' : ''}`} />
            <line x1={bx + 10} x2={bx + 70} y1={by + 38} y2={by + 38} className="sw-handle" />
            <circle cx={bx + 84} cy={by + 12} r="4" className={isFault && !fresh ? 'sw-led-fault' : isFault && fresh ? 'sw-led-act' : 'sw-led-ok'} />
            <text x={bx + 8} y={by + 18} className="fb-tiny">
              {i}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Back of the server: two PSUs, fans, ports. */
function Back({ x, y, psu2, psuOut, psuNew }: { x: number; y: number; psu2?: 'fault' | 'ok'; psuOut?: boolean; psuNew?: boolean }) {
  return (
    <g>
      <rect x={x + 5} y={y + 5} width={700} height={130} rx="8" className="fb-shadow" />
      <rect x={x} y={y} width={700} height={130} rx="8" className="sw-chassis" />
      <circle cx={x + 24} cy={y + 30} r="8" className="sw-uid" />
      {[0, 1, 2, 3].map((k) => (
        <rect key={k} x={x + 60 + k * 44} y={y + 20} width={34} height={20} rx="3" className="sw-port" />
      ))}
      <rect x={x + 60} y={y + 60} width={34} height={20} rx="3" className="sw-port is-bmc" />
      <text x={x + 77} y={y + 96} textAnchor="middle" className="fb-tiny">
        BMC
      </text>
      <rect x={x + 330} y={y + 18} width={170} height={94} rx="6" className="sw-psu" />
      <circle cx={x + 480} cy={y + 34} r="5" className="sw-led-ok" />
      <text x={x + 415} y={y + 70} textAnchor="middle" className="fb-small">
        PSU 1 · feed A
      </text>
      <g className={psuOut ? 'sw-psu-out' : psuNew ? 'sw-psu-in' : ''}>
        <rect x={x + 515} y={y + 18} width={170} height={94} rx="6" className={`sw-psu${psuNew ? ' is-new' : ''}`} />
        <circle cx={x + 665} cy={y + 34} r="5" className={psu2 === 'fault' && !psuNew ? 'sw-led-fault' : 'sw-led-ok'} />
        <text x={x + 600} y={y + 70} textAnchor="middle" className="fb-small">
          PSU 2 · feed B
        </text>
      </g>
    </g>
  )
}

export function SwapStage({ steps, cur, replayKey }: StageProps<SwapStep>) {
  const st = steps[Math.max(0, cur)]
  const scene = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {scene === 'locate' && (
          <>
            <rect x={90} y={30} width={300} height={420} rx="10" className="fb-panel" />
            {Array.from({ length: 10 }, (_, i) => (
              <g key={i}>
                <rect x={110} y={48 + i * 39} width={260} height={30} rx="4" className={`sw-chassis${i === 4 ? ' is-target' : ''}`} />
                <text x={124} y={68 + i * 39} className="fb-tiny">
                  U{38 - i * 2}
                </text>
                {i === 4 && <circle cx={350} cy={63 + i * 39} r="7" className="sw-uid is-on" />}
              </g>
            ))}
            <Term
              x={440}
              y={50}
              w={500}
              lines={['ticket 48213: replace failed disk', '  site AMS-2 · hall 3 · rack C04 · U30', '  server S/N RL2611-012 · bay 5', '$ ipmitool -H 10.70.1.12 ... chassis identify 300', '+Chassis identify interval: 300 seconds']}
            />
            <text x={690} y={260} textAnchor="middle" className="fb-strong">
              Three checks before you touch it:
            </text>
            <text x={690} y={290} textAnchor="middle" className="fb-label">
              right rack and unit, blue UID light on,
            </text>
            <text x={690} y={312} textAnchor="middle" className="fb-label">
              serial on the pull-out tag = ticket
            </text>
          </>
        )}
        {(scene === 'disk' || scene === 'rebuild') && (
          <>
            <Front x={150} y={40} fault={5} out={scene === 'disk'} fresh={scene === 'rebuild'} />
            <Term
              x={150}
              y={220}
              w={700}
              lines={
                scene === 'disk'
                  ? ['$ storcli /c0 /eall /sall show | grep -E "Slt|5 "', '!252:5   14 Failed  RAID1 7.276 TB SAS HDD', '$ storcli /c0 /e252 /s5 start locate     # bay LED blinks', '+bay 5 fault LED on, all other disks Onln: safe to pull']
                  : ['$ storcli /c0 /e252 /s5 show rebuild', '+Drive /c0/e252/s5   Progress 12%   Estimated time left 3 h 40 min', '$ storcli /c0 /v0 show', 'state: Dgrd while rebuilding, then Optl']
              }
            />
            {scene === 'rebuild' && (
              <g className="fb-in" style={d(0.8)}>
                <rect x={150} y={360} width={700} height={22} rx="6" className="fb-track" />
                <rect x={150} y={360} width={700} height={22} rx="6" className="sw-progress" />
                <text x={500} y={410} textAnchor="middle" className="fb-label">
                  rebuild running: do not pull a second disk of this array until it is done
                </text>
              </g>
            )}
          </>
        )}
        {scene === 'psu' && (
          <>
            <Back x={150} y={40} psu2="fault" psuOut />
            <g className="fb-in" style={d(2.2)}>
              <Back x={150} y={210} psu2="ok" psuNew />
            </g>
            <text x={500} y={384} textAnchor="middle" className="fb-label">
              check PSU 1 is healthy and its feed is live, unplug the cord of PSU 2, pull, insert the new one, plug in
            </text>
            <text x={500} y={410} textAnchor="middle" className="fb-ok">
              PSU 1 carries the server the whole time: no downtime
            </text>
            <text x={500} y={440} textAnchor="middle" className="fb-small">
              ipmitool sdr type "Power Supply"  →  PS1 Status ok · PS2 Status ok
            </text>
          </>
        )}
        {scene === 'fan' && (
          <>
            <rect x={150} y={40} width={700} height={260} rx="10" className="sw-chassis" />
            <text x={500} y={30} textAnchor="middle" className="fb-label">
              top view, lid off
            </text>
            {Array.from({ length: 6 }, (_, i) => (
              <g key={i} className={i === 3 ? 'sw-fan-swap' : ''}>
                <rect x={190 + i * 105} y={70} width={90} height={90} rx="8" className={`sw-fanbox${i === 3 ? ' is-fault' : ''}`} />
                <circle cx={235 + i * 105} cy={115} r="34" className={i === 3 ? 'sw-fan is-stop' : 'sw-fan'} />
                <text x={235 + i * 105} y={185} textAnchor="middle" className="fb-tiny">
                  FAN{i + 1}
                </text>
              </g>
            ))}
            <Term x={150} y={320} w={700} lines={['$ ipmitool sdr type Fan', '!FAN4  | 0 RPM     | cr   (before)', '+FAN4  | 8600 RPM  | ok   (after the swap, others back to normal speed)']} />
          </>
        )}
        {(scene === 'dimm' || scene === 'post') && (
          <>
            <rect x={150} y={40} width={700} height={250} rx="10" className="sw-chassis" />
            {[0, 1].map((cpu) => (
              <g key={cpu}>
                <rect x={300 + cpu * 270} y={120} width={90} height={90} rx="6" className="sw-cpu" />
                <text x={345 + cpu * 270} y={170} textAnchor="middle" className="fb-tiny">
                  CPU{cpu + 1}
                </text>
                {Array.from({ length: 8 }, (_, k) => {
                  const isB1 = cpu === 0 && k === 1
                  return (
                    <rect
                      key={k}
                      x={240 + cpu * 270 + (k < 4 ? 0 : 160)}
                      y={70 + (k % 4) * 46}
                      width={40}
                      height={36}
                      rx="3"
                      className={`sw-dimm${isB1 ? (scene === 'dimm' ? ' is-fault sw-blink' : ' is-new') : ''}`}
                    />
                  )
                })}
              </g>
            ))}
            <text x={500} y={30} textAnchor="middle" className="fb-label">
              {scene === 'dimm' ? 'powered off, both cords out, ESD strap on: DIMM B1 from the event log' : 'power on: POST trains the memory, then check from the OS'}
            </text>
            <Term
              x={150}
              y={305}
              w={700}
              lines={
                scene === 'dimm'
                  ? ['$ ipmitool sel elist | grep -i memory', '!  Memory #0x87 | Correctable ECC | Asserted | DIMM B1  (x 214)', '$ ssh rk-n12 sudo shutdown -h now      # with the client\'s OK, or they shut it down']
                  : ['$ ssh rk-n12 "sudo dmidecode -t memory | grep -c \'Size: 64 GB\'"', '+16', '$ ipmitool sel elist | tail -2', '+System Boot Initiated  |  no new memory events']
              }
            />
          </>
        )}
        {scene === 'rma' && (
          <>
            <rect x={120} y={80} width={340} height={240} rx="10" className="sw-box" />
            <rect x={160} y={120} width={260} height={120} rx="6" className="cu-tag" />
            {['RMA 2611-0731', 'part: 7.68 TB SAS SSD', 'S/N: S6KNNA0T812345', 'from: C04-U30 bay 5'].map((t, i) => (
              <text key={t} x={176} y={146 + i * 24} className="fb-small">
                {t}
              </text>
            ))}
            <text x={290} y={290} textAnchor="middle" className="fb-strong">
              ship back in the new part's box
            </text>
            <rect x={540} y={80} width={360} height={240} rx="10" className="fb-card" />
            <text x={720} y={116} textAnchor="middle" className="fb-strong">
              Data on the disk?
            </text>
            {['Many clients keep failed drives:', 'they stay on site, are logged,', 'then wiped or shredded under', 'their policy, never shipped.', 'The vendor gets a certificate', 'instead of the drive.'].map((t, i) => (
              <text key={t} x={720} y={150 + i * 24} textAnchor="middle" className="fb-label">
                {t}
              </text>
            ))}
            <text x={500} y={380} textAnchor="middle" className="fb-label">
              Then update the asset record: old serial out, new serial in, same bay. Close the ticket with photos and output.
            </text>
          </>
        )}
      </svg>
    </div>
  )
}

export const FRU_SWAP: StageLesson<SwapStep> = {
  Stage: SwapStage,
  metrics: [
    { id: 'server', label: 'Server', start: '-' },
    { id: 'part', label: 'Part', start: '-' },
    { id: 'downtime', label: 'Downtime', start: '-' },
  ],
  intro: ['Replacing failed parts is daily work for a data center technician. The part is the easy bit; finding the right server, knowing what is safe to pull while it runs, and proving the fix are what the job is about.'],
  legend: [
    ['FRU', 'Field replaceable unit: a part you swap on site'],
    ['Hot-swap', 'Replaceable while the server runs'],
    ['UID LED', 'A blue light you switch on remotely to find one server among hundreds'],
  ],
  steps: [
    { scene: 'locate', short: 'Find it', title: 'The right server, three times checked', tag: 'action', explain: ['The ticket names the site, hall, rack, unit and serial. Switch on the UID light through the BMC (or ask the client to), walk to the rack, and match the serial on the pull-out tag with the ticket.', 'Pulling a part from the wrong server is the classic expensive mistake: two failed disks in one array instead of one.'], key: 'Rack, UID light, serial: all three must match before you touch anything.', m: { server: 'C04-U30, S/N matches' } },
    { scene: 'disk', short: 'Disk', title: 'A hot-swap disk', tag: 'action', explain: ['The failed disk shows an amber fault light; the RAID controller confirms slot 5 failed and every other disk is online. Then it is safe: press the latch, pull the caddy, move the disk to the new caddy if needed, slide the new one in.', 'If another disk in the same array is degraded or rebuilding, stop and escalate: pulling now could lose the array.'], key: 'Check the controller: one failed disk, all others online, then pull.', m: { part: 'disk, bay 5', downtime: 'none' } },
    { scene: 'rebuild', short: 'Rebuild', title: 'The rebuild starts by itself', tag: 'result', explain: ['The controller sees the new disk and rebuilds onto it; the activity light blinks and the controller reports progress. The array is degraded until it finishes, often hours on large disks.', 'Note the progress in the ticket, and check the end state (optimal) before closing, or hand it over to the next shift.'], key: 'Not done until the array is optimal again.' },
    { scene: 'psu', short: 'PSU', title: 'A power supply, with the other one carrying the load', tag: 'action', explain: ['PSU 2 is amber. First check PSU 1 is green and its feed is live: if both were on one dying feed, pulling one would drop the server. Then unplug PSU 2\'s cord, pull it out, slide the new one in, plug back.', 'Both green, and the BMC sensors show both supplies OK with input power.'], key: 'Before pulling a PSU: the other one must be healthy and powered.', m: { part: 'PSU 2', downtime: 'none' } },
    { scene: 'fan', short: 'Fan', title: 'A fan module', explain: ['Most server fans are hot-swap modules. With one stopped, the others spin faster to compensate and the CPU may throttle. Swap it quickly, since the server is short of airflow while the lid or the module is out.', 'Afterwards the fans settle back to normal speed: check the readings.'], key: 'Fans are hot-swap, but swap them fast.', m: { part: 'FAN4', downtime: 'none' } },
    { scene: 'dimm', short: 'DIMM', title: 'Memory: not hot-swap', tag: 'event', explain: ['The event log names DIMM B1 with hundreds of correctable errors. Memory cannot be swapped while running: the server is shut down (agree the time with the client), both power cords come out, and you wait for standby power to drain.', 'ESD strap on, lid off, find B1 by the label printed on the board, open the clips, swap with the same part number.'], key: 'No hot-swap for DIMMs: shut down, unplug, ESD strap, then the slot from the label.', m: { part: 'DIMM B1', downtime: 'planned window' } },
    { scene: 'post', short: 'Verify', title: 'Power on and prove it', tag: 'result', explain: ['Memory training runs during POST; then the OS must see all 16 DIMMs at the right size, and the event log must stay quiet. Hand the server back to the client and let them confirm their service is up.'], key: 'Verify from the OS and the event log, then the client confirms.' },
    { scene: 'rma', short: 'RMA', title: 'Return the part, update the records', explain: ['The failed part goes back to the vendor with an RMA number and its serial, usually in the box the new part came in.', 'Drives that held data often never leave the site: the client\'s policy says wipe or shred, logged with the serial. Update the asset record (old serial out, new serial in) and close the ticket with photos and command output.'], key: 'The ticket closes with evidence and updated asset records, not with the swap.' },
  ],
}

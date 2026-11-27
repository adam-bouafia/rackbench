import { useEffect, useMemo, useState } from 'react'
import { Verdict } from '../engine/ui'
import { markDone } from '../progress'
import { Person } from '../stages/kit'

// Floor walk: the technician's round. Three stops (cold aisle, hot aisle, corridor), each with a few
// things wrong. Click what you see, choose what you do, and the walk shows what you missed.

type Stop = 'cold' | 'hot' | 'corridor'
interface Item {
  id: string
  stop: Stop
  /** Drawn only when it is a fault (a box, a puddle, a person). */
  onlyFault?: boolean
  name: string
  see: [string, string]
  right: string
  wrong: string[]
  why: string
  hit: { x: number; y: number; w: number; h: number }
}

const RX = (i: number) => 40 + i * 178
const SLOT = (k: number) => 50 + k * 22

const ITEMS: Item[] = [
  // cold aisle
  { id: 'temp', stop: 'cold', name: 'Inlet sensor on rack C01', see: ['The inlet sensor on the door reads 23 °C.', 'The inlet sensor on the door reads 31 °C.'], right: 'Report it to facilities with the reading and the rack, then look for an open gap or door nearby', wrong: ['Prop the rack door open so it cools down', 'Nothing: servers can take 31 °C'], why: 'Most sites keep server inlets between 18 and 27 °C. 31 °C means a cooling problem or hot air leaking to the front: facilities need it now, with the number.', hit: { x: RX(0) + 92, y: 6, w: 72, h: 34 } },
  { id: 'led', stop: 'cold', name: 'Server in rack C02, U30', see: ['All front LEDs are green.', 'An amber fault LED on the server front; the others are green.'], right: 'Note the rack, U, serial and LED, and report it through a ticket to the client', wrong: ['Pull it out on its rails to look inside', 'Power-cycle it with the front button'], why: 'It is the client\'s server: you report what you see with the details, and touch it only with a ticket.', hit: { x: RX(1) + 6, y: SLOT(4) - 4, w: 148, h: 28 } },
  { id: 'blank', stop: 'cold', name: 'Rack C03, U19', see: ['A blanking panel fills the empty unit.', 'An empty unit with no blanking panel: you can see into the hot aisle.'], right: 'Report it so a blanking panel is fitted', wrong: ['Leave it: an open gap helps the airflow', 'Push a sheet of cardboard into the gap'], why: 'An open U lets hot exhaust flow back to the front, and the servers next to it breathe it. Blanking panels, never cardboard.', hit: { x: RX(2) + 6, y: SLOT(7) - 4, w: 148, h: 28 } },
  { id: 'door', stop: 'cold', name: 'Rack C04, front door', see: ['The front door is closed and locked.', 'The front door stands open and nobody is working at the rack.'], right: 'Close it, check the lock, and report it to security', wrong: ['Leave it open: someone must be coming back', 'Photograph the open rack for the client'], why: 'An open, unattended rack is a security gap in a client\'s space. Close it and let security find out who left it.', hit: { x: RX(3) - 4, y: 38, w: 168, h: 324 } },
  { id: 'rails', stop: 'cold', name: 'Rack C05, U12', see: ['Every server sits flush in the rack.', 'A server is pulled out on its rails, with nobody around.'], right: 'Report it to the shift lead; do not push a client\'s server back yourself', wrong: ['Push it back in', 'Pull it out further to check it'], why: 'Someone may be mid-job with cables attached. A server left out blocks the aisle and makes the rack top-heavy: report it and let the owner deal with it.', hit: { x: RX(4) - 10, y: SLOT(9) - 8, w: 180, h: 36 } },
  { id: 'tile', stop: 'cold', name: 'Floor tile in front of C03', see: ['A perforated floor tile, flat in its place.', 'A floor tile is lifted and leaning on the next one: an open hole in the floor.'], right: 'Stand by it or put up a barrier, and call facilities', wrong: ['Step over it carefully and carry on', 'Put it back yourself and say nothing'], why: 'An open floor is a fall hazard, and the tile may be up for work. Guard it and call facilities, who know why it is up.', hit: { x: 420, y: 384, w: 80, h: 44 } },
  { id: 'box', stop: 'cold', onlyFault: true, name: 'Cardboard box in the aisle', see: ['', 'A cardboard box from a delivery is left in the cold aisle.'], right: 'Take it to the staging room and report it', wrong: ['Push it under the rack', 'Leave it for the cleaners'], why: 'Cardboard brings dust and fire load onto the floor and blocks the aisle. Unboxing happens in the staging room.', hit: { x: 64, y: 346, w: 102, h: 72 } },
  { id: 'cable', stop: 'cold', onlyFault: true, name: 'Cable across the aisle', see: ['', 'A loose patch cable runs across the aisle at foot height.'], right: 'Make it safe and open a ticket to have it routed properly', wrong: ['Unplug it so nobody trips', 'Step over it'], why: 'It is a trip hazard and someone\'s live link. Unplugging it could take a client down: mark it and get it routed.', hit: { x: 630, y: 364, w: 250, h: 60 } },
  // hot aisle
  { id: 'pdu', stop: 'hot', name: 'PDU A on rack C02', see: ['The display reads 8.2 A on a 16 A circuit.', 'The display reads 14.6 A on a 16 A circuit.'], right: 'Report it: over 80 % of the breaker, so no new load on this circuit', wrong: ['Move some cords to PDU B yourself', 'Nothing: it is still under 16 A'], why: 'Circuits are kept under about 80 % of the breaker. At 14.6 A one more server, or the other feed failing, trips it. Capacity planning and the client must know.', hit: { x: RX(1) - 2, y: 38, w: 86, h: 28 } },
  { id: 'psu', stop: 'hot', name: 'Server in rack C03, U25, back', see: ['Both power cords are in, both PSUs green.', 'The cord of PSU 2 hangs loose and PSU 2 is dark.'], right: 'Report it through a ticket to the client: no redundancy; plug it in only with their go', wrong: ['Plug it into any free outlet nearby', 'Ignore it: the server is still running'], why: 'The server now hangs on one feed. The wrong outlet or an overloaded circuit makes it worse: report it, and plug in where the plan says once they agree.', hit: { x: RX(2) + 6, y: SLOT(5) - 4, w: 148, h: 52 } },
  { id: 'psuled', stop: 'hot', name: 'Server in rack C04, U31, back', see: ['Both PSU LEDs are green.', 'PSU 1 shows an amber LED.'], right: 'Open a ticket: a failed PSU, the server runs on the other one', wrong: ['Pull the PSU out and reseat it', 'Unplug both cords and plug them back'], why: 'A failed PSU means no redundancy. Report it with the serial; the swap is its own ticket, done after checking the other PSU.', hit: { x: RX(3) + 6, y: SLOT(3) - 4, w: 148, h: 28 } },
  { id: 'contain', stop: 'hot', name: 'Containment door', see: ['The containment door at the end of the aisle is closed.', 'The containment door is propped open.'], right: 'Close it, and report it if you can tell who propped it', wrong: ['Leave it open: the hot aisle needs air', 'Wedge it wider so people can pass'], why: 'An open containment door mixes hot exhaust with the cold supply, and cooling works harder for every server in the row.', hit: { x: 924, y: 38, w: 70, h: 326 } },
  { id: 'water', stop: 'hot', onlyFault: true, name: 'Water on the floor', see: ['', 'A puddle on the floor in front of C01 and C02.'], right: 'Keep clear, no electrical work near it, call facilities at once', wrong: ['Mop it up with paper towels', 'Unplug the nearest server'], why: 'Water near power is dangerous and may be a cooling leak. Stay away, keep others away, and get facilities there fast.', hit: { x: 60, y: 394, w: 240, h: 54 } },
  { id: 'fibre', stop: 'hot', name: 'Fibre from C05 to the tray', see: ['The yellow fibre rises to the tray in a gentle curve.', 'The yellow fibre is bent sharply over the tray edge.'], right: 'Open a ticket to have it re-routed', wrong: ['Pull it tight so it lies straight', 'Fold it back the other way'], why: 'A tight bend leaks light and can crack the glass: the link degrades long before it breaks. Get it re-routed with a proper bend.', hit: { x: RX(4) + 100, y: 4, w: 70, h: 40 } },
  { id: 'tools', stop: 'hot', onlyFault: true, name: 'Tools on top of rack C03', see: ['', 'A screwdriver and a spare optic lie on top of the rack.'], right: 'Take them away and hand them in', wrong: ['Leave them: someone will come back', 'Put them inside the rack'], why: 'Loose tools fall into fans and onto people, and parts left out go missing from the stock count.', hit: { x: RX(2) + 24, y: 22, w: 112, h: 20 } },
  // corridor
  { id: 'extinguisher', stop: 'corridor', name: 'Fire extinguisher', see: ['The extinguisher hangs on its bracket, easy to reach.', 'Boxes are stacked in front of the extinguisher.'], right: 'Clear it and report it to facilities', wrong: ['Leave it: it can be reached over the boxes', 'Move the extinguisher next to the boxes'], why: 'Fire equipment and exits stay clear at all times; seconds count when they are needed.', hit: { x: 50, y: 226, w: 130, h: 166 } },
  { id: 'epo', stop: 'corridor', name: 'Emergency power off button', see: ['The EPO button sits behind its clear cover.', 'The clear cover of the EPO button is missing.'], right: 'Report it to facilities at once and keep carts and people away from it', wrong: ['Tape a sheet of paper over it', 'Nothing: everyone knows not to press it'], why: 'Without its cover, a bump with a cart or a ladder can switch off the whole hall. It needs fixing now.', hit: { x: 186, y: 188, w: 80, h: 84 } },
  { id: 'wedge', stop: 'corridor', name: 'Door to data hall 1', see: ['The secure door is closed.', 'The secure door is wedged open.'], right: 'Remove the wedge, close the door and report it to security', wrong: ['Leave it: someone is carrying boxes', 'Close it later on your way back'], why: 'A wedged secure door defeats the badge readers and the access logs. Close it and tell security; whoever needs it open asks them.', hit: { x: 292, y: 102, w: 156, h: 292 } },
  { id: 'tailgater', stop: 'corridor', onlyFault: true, name: 'Two people at the hall door', see: ['', 'Someone walks through right behind a colleague without badging.'], right: 'Stop them, ask them to badge, and call security if they cannot', wrong: ['Nothing: they came with a colleague', 'Hold the door for them'], why: 'Everyone badges at every door. Tailgating is the easiest way in, and stopping it is part of the job.', hit: { x: 494, y: 322, w: 124, h: 76 } },
  { id: 'visitor', stop: 'corridor', onlyFault: true, name: 'Visitor by data hall 2', see: ['', 'A person with a visitor badge stands alone by the hall door.'], right: 'Ask who their escort is, stay with them, and call security', wrong: ['Let them in: they have a badge', 'Tell them to wait and walk on'], why: 'A visitor is escorted every minute. Stay with them until their escort or security takes over.', hit: { x: 690, y: 322, w: 64, h: 76 } },
  { id: 'drive', stop: 'corridor', onlyFault: true, name: 'Cart in the corridor', see: ['', 'A cart with a pulled drive on it, and nobody around.'], right: 'Put it in the locked media bin, log the serial and report it', wrong: ['Leave it for whoever pulled it', 'Take it to the RMA shelf'], why: 'A drive can hold a client\'s data. One left alone is a gap in the chain of custody: secure it, log it, report it.', hit: { x: 794, y: 298, w: 156, h: 98 } },
]

const STOPS: { id: Stop; title: string; note: string }[] = [
  { id: 'cold', title: 'Cold aisle, row C', note: 'rack fronts and the floor' },
  { id: 'hot', title: 'Hot aisle, row C', note: 'rack backs, power and cables' },
  { id: 'corridor', title: 'Corridor to the halls', note: 'doors, safety kit, people' },
]
const FINE = 'Looks fine, move on'

const shuffle = <T,>(a: T[]) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

function pickFaults(): Set<string> {
  const out = new Set<string>()
  for (const s of STOPS) {
    const items = shuffle(ITEMS.filter((i) => i.stop === s.id))
    const k = 3 + (Math.random() < 0.5 ? 1 : 0)
    items.slice(0, k).forEach((i) => out.add(i.id))
  }
  return out
}

/* ---------- the three scenes ---------- */

function Racks({ back }: { back?: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <rect x={RX(i)} y={40} width={160} height={320} rx="5" className="fw-rack" />
          <text x={RX(i) + 4} y={34} className="fb-tiny">
            C0{i + 1}
            {back ? ' back' : ''}
          </text>
        </g>
      ))}
    </>
  )
}

function Slot({ i, k, led = 'ok', blank, out, back, psu = ['ok', 'ok'], cordB = true }: { i: number; k: number; led?: 'ok' | 'fault'; blank?: 'panel' | 'gap'; out?: boolean; back?: boolean; psu?: ['ok' | 'fault' | 'off', 'ok' | 'fault' | 'off']; cordB?: boolean }) {
  const x = RX(i) + (back ? 26 : 12)
  const w = back ? 108 : 136
  const y = SLOT(k)
  if (blank === 'panel') return <rect x={RX(i) + 12} y={y} width={136} height={20} rx="2" className="fw-blank" />
  if (blank === 'gap')
    return (
      <g>
        <rect x={RX(i) + 12} y={y} width={136} height={20} rx="2" className="fw-gap" />
        <path d={`M${RX(i) + 40} ${y + 10} h80`} className="fw-hotleak" />
      </g>
    )
  if (out)
    return (
      <g>
        <rect x={x - 14} y={y - 5} width={w + 28} height={30} rx="3" className="fw-server is-out" />
        <path d={`M${x - 14} ${y + 26} l-10 8 M${x + w + 14} ${y + 26} l10 8`} className="fw-rail" />
        <circle cx={x + w + 4} cy={y + 10} r="3" className="sw-led-ok" />
      </g>
    )
  return (
    <g>
      <rect x={x} y={y} width={w} height={20} rx="2" className="fw-server" />
      {!back && <circle cx={x + w - 11} cy={y + 10} r={led === 'fault' ? 5.5 : 4} className={led === 'fault' ? 'sw-led-fault' : 'sw-led-ok'} />}
      {back && (
        <>
          <rect x={x + w - 40} y={y + 3} width={16} height={14} rx="2" className="fw-psu" />
          <rect x={x + w - 20} y={y + 3} width={16} height={14} rx="2" className="fw-psu" />
          <circle cx={x + w - 32} cy={y + 7} r="2.4" className={psu[0] === 'fault' ? 'sw-led-fault' : psu[0] === 'off' ? 'fb-dot-off' : 'sw-led-ok'} />
          <circle cx={x + w - 12} cy={y + 7} r="2.4" className={psu[1] === 'fault' ? 'sw-led-fault' : psu[1] === 'off' ? 'fb-dot-off' : 'sw-led-ok'} />
          <path d={`M${x + w - 32} ${y + 17} V${y + 19} H${RX(i) + 22}`} className="fw-cord is-a" />
          {cordB ? <path d={`M${x + w - 12} ${y + 17} V${y + 21} H${RX(i) + 140}`} className="fw-cord is-b" /> : <path d={`M${x + w - 12} ${y + 17} q4 18 -6 34`} className="fw-cord is-b is-loose" />}
        </>
      )}
    </g>
  )
}

function Floor() {
  return (
    <g>
      {Array.from({ length: 12 }, (_, c) =>
        [0, 1].map((r) => <rect key={`${c}-${r}`} x={20 + c * 80} y={384 + r * 44} width={80} height={44} className="fw-tile" />),
      )}
    </g>
  )
}

function ColdScene({ f }: { f: (id: string) => boolean }) {
  return (
    <>
      <Floor />
      <rect x={420} y={384} width={80} height={44} className={f('tile') ? 'fw-hole' : 'fw-tile is-perf'} />
      {f('tile') && <path d="M500 428 l24 -50 l70 0 l-24 50 z" className="fw-tile-up" />}
      <Racks />
      {Array.from({ length: 5 }, (_, i) =>
        Array.from({ length: 14 }, (_, k) => {
          if (i === 1 && k === 4) return <Slot key={k} i={i} k={k} led={f('led') ? 'fault' : 'ok'} />
          if (i === 2 && k === 7) return <Slot key={k} i={i} k={k} blank={f('blank') ? 'gap' : 'panel'} />
          if (i === 4 && k === 9) return <Slot key={k} i={i} k={k} out={f('rails')} />
          if ((i === 0 && k > 10) || (i === 3 && k === 12)) return <Slot key={k} i={i} k={k} blank="panel" />
          return <Slot key={k} i={i} k={k} />
        }),
      )}
      {f('door') ? <path d={`M${RX(3)} 40 l-34 -10 v340 l34 -10 z`} className="fw-door is-open" /> : <rect x={RX(3) + 2} y={42} width={156} height={316} rx="4" className="fw-door" />}
      <rect x={RX(0) + 96} y={10} width={64} height={26} rx="4" className="fb-term" />
      <text x={RX(0) + 128} y={28} textAnchor="middle" className={`fb-term-text${f('temp') ? ' is-bad' : ' is-ok'}`}>
        {f('temp') ? '31 °C' : '23 °C'}
      </text>
      {f('box') && (
        <g>
          <rect x={68} y={352} width={94} height={62} rx="3" className="sw-box" />
          <path d="M68 370 h94 M115 352 v18" className="fw-tape" />
        </g>
      )}
      {f('cable') && <path d={`M${RX(3) + 130} 352 C ${RX(3) + 140} 410 ${RX(4) + 20} 410 ${RX(4) + 40} 352`} className="fw-loose" />}
    </>
  )
}

function HotScene({ f }: { f: (id: string) => boolean }) {
  return (
    <>
      <Floor />
      <rect x={20} y={10} width={890} height={12} rx="3" className="fw-tray" />
      <Racks back />
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <rect x={RX(i) + 6} y={60} width={14} height={290} rx="3" className="sf-pdu" />
          <rect x={RX(i) + 140} y={60} width={14} height={290} rx="3" className="sf-pdu" />
        </g>
      ))}
      <rect x={RX(1)} y={40} width={82} height={24} rx="4" className="fb-term" />
      <text x={RX(1) + 41} y={57} textAnchor="middle" className={`fb-term-text${f('pdu') ? ' is-bad' : ' is-ok'}`}>
        A {f('pdu') ? '14.6' : '8.2'} A
      </text>
      {Array.from({ length: 5 }, (_, i) =>
        Array.from({ length: 13 }, (_, k) => {
          const kk = k + 1
          if (i === 2 && kk === 5) return <Slot key={k} i={i} k={kk} back psu={['ok', f('psu') ? 'off' : 'ok']} cordB={!f('psu')} />
          if (i === 3 && kk === 3) return <Slot key={k} i={i} k={kk} back psu={[f('psuled') ? 'fault' : 'ok', 'ok']} />
          if (i === 2 && kk === 6) return null
          return <Slot key={k} i={i} k={kk} back />
        }),
      )}
      {f('contain') ? (
        <>
          <path d="M930 40 l50 -14 v340 l-50 -14 z" className="fw-door is-open" />
          <path d="M915 200 h60 M915 240 h60" className="fw-hotleak" />
        </>
      ) : (
        <rect x={930} y={40} width={58} height={320} rx="4" className="fw-contain" />
      )}
      {f('fibre') ? <path d={`M${RX(4) + 130} 44 V30 L${RX(4) + 150} 22 L${RX(4) + 152} 14`} className="fw-fibre is-kink" /> : <path d={`M${RX(4) + 130} 44 C ${RX(4) + 130} 30 ${RX(4) + 140} 24 ${RX(4) + 152} 20`} className="fw-fibre" />}
      {f('tools') && (
        <g>
          <path d={`M${RX(2) + 36} 34 h50`} className="fw-screwdriver" />
          <rect x={RX(2) + 96} y={28} width={30} height={10} rx="2" className="fb-optic" />
        </g>
      )}
      {f('water') && <ellipse cx={180} cy={420} rx={110} ry={20} className="fw-water" />}
    </>
  )
}

function CorridorScene({ f }: { f: (id: string) => boolean }) {
  return (
    <>
      <rect x={0} y={60} width={1000} height={332} className="fw-wall" />
      <rect x={0} y={392} width={1000} height={88} className="fw-floor" />
      <rect x={108} y={210} width={44} height={14} rx="3" className="fw-sign" />
      <text x={130} y={221} textAnchor="middle" className="fw-sign-text">
        FIRE
      </text>
      <rect x={116} y={250} width={28} height={84} rx="10" className="fw-ext" />
      {f('extinguisher') && (
        <g>
          <rect x={58} y={318} width={70} height={74} rx="3" className="sw-box" />
          <rect x={110} y={282} width={70} height={110} rx="3" className="sw-box" />
        </g>
      )}
      <rect x={196} y={198} width={60} height={64} rx="6" className="sf-epo-box" />
      <circle cx={226} cy={230} r={16} className="sf-epo" />
      {!f('epo') && <rect x={202} y={204} width={48} height={52} rx="6" className="sf-cover" />}
      <text x={226} y={284} textAnchor="middle" className="fb-tiny">
        EPO
      </text>
      <rect x={300} y={110} width={140} height={282} rx="4" className="fw-frame" />
      {f('wedge') ? (
        <>
          <path d="M300 110 l-40 18 v250 l40 14 z" className="fw-hall-door is-open" />
          <path d="M300 392 l26 0 l-26 -14 z" className="fw-wedge" />
          <rect x={302} y={112} width={136} height={278} className="fw-dark" />
        </>
      ) : (
        <rect x={302} y={112} width={136} height={278} rx="3" className="fw-hall-door" />
      )}
      <text x={370} y={100} textAnchor="middle" className="fb-tiny">
        DATA HALL 1
      </text>
      <rect x={452} y={220} width={18} height={30} rx="4" className="sc-reader" />
      <circle cx={461} cy={232} r={4} className="sc-led-ok" />
      {f('tailgater') && (
        <>
          <Person x={520} y={380} tone="blue" badge />
          <Person x={588} y={380} tone="slate" />
        </>
      )}
      <rect x={660} y={150} width={120} height={30} rx="4" className="fw-sign is-hall" />
      <text x={720} y={170} textAnchor="middle" className="fb-tiny">
        DATA HALL 2 →
      </text>
      {f('visitor') && (
        <g>
          <Person x={722} y={380} tone="amber" />
          <rect x={726} y={356} width={12} height={12} rx="2" className="sc-visitor" />
        </g>
      )}
      {f('drive') && (
        <g>
          <rect x={800} y={330} width={140} height={10} rx="3" className="fw-cart" />
          <path d="M812 340 v40 M928 340 v40" className="fw-cart-leg" />
          <circle cx={812} cy={386} r={6} className="fw-wheel" />
          <circle cx={928} cy={386} r={6} className="fw-wheel" />
          <rect x={846} y={316} width={44} height={14} rx="2" className="fw-drive" />
        </g>
      )}
    </>
  )
}

/* ---------- the game ---------- */

interface Pick {
  choice: string
  points: number
}

export function FloorWalk() {
  const [walk, setWalk] = useState(0)
  const faults = useMemo(() => pickFaults(), [walk])
  const [stop, setStop] = useState(0)
  const [sel, setSel] = useState<string | null>(null)
  const [picks, setPicks] = useState<Record<string, Pick>>({})
  const [revealed, setRevealed] = useState<Set<Stop>>(new Set())
  const done = stop >= STOPS.length
  const cur = STOPS[Math.min(stop, STOPS.length - 1)]
  const f = (id: string) => faults.has(id)
  const visible = ITEMS.filter((i) => i.stop === cur.id && (!i.onlyFault || f(i.id)))
  const item = sel ? ITEMS.find((i) => i.id === sel)! : null
  const options = useMemo(() => (item ? [FINE, ...shuffle([item.right, ...item.wrong])] : []), [item])
  const score = Object.values(picks).reduce((s, p) => s + p.points, 0)
  const stopFaults = ITEMS.filter((i) => i.stop === cur.id && f(i.id))
  const isRevealed = revealed.has(cur.id)

  useEffect(() => {
    if (done) markDone('floor-walk')
  }, [done])

  const choose = (c: string) => {
    if (!item || picks[item.id] || isRevealed) return
    const fault = f(item.id)
    const points = fault ? (c === item.right ? 100 : 0) : c === FINE ? 0 : -25
    setPicks((p) => ({ ...p, [item.id]: { choice: c, points } }))
  }
  const finishStop = () => {
    setRevealed((r) => new Set([...r, cur.id]))
    setSel(null)
  }
  const nextStop = () => {
    setStop((s) => s + 1)
    setSel(null)
  }

  if (done) {
    const all = ITEMS.filter((i) => f(i.id))
    const found = all.filter((i) => picks[i.id]?.choice === i.right).length
    const falseAlarms = Object.entries(picks).filter(([id, p]) => !f(id) && p.choice !== FINE).length
    return (
      <div className="fw page-fit">
        <section className="panel fw-main fw-end">
          <p className="eyebrow">Walk complete</p>
          <h1 className="pi-h">
            {found} of {all.length} problems handled right · {score} points
          </h1>
          <p className="muted">
            {falseAlarms ? `${falseAlarms} false alarm${falseAlarms > 1 ? 's' : ''}. ` : 'No false alarms. '}A floor walk is the cheapest preventive action there is: most incidents were visible on the floor before they became tickets.
          </p>
          <div className="toolbar">
            <button
              className="btn btn-primary"
              onClick={() => {
                setWalk((w) => w + 1)
                setStop(0)
                setSel(null)
                setPicks({})
                setRevealed(new Set())
              }}
            >
              New walk →
            </button>
            <a className="btn" href="#/lesson/floor-safety">
              Safety lesson
            </a>
            <a className="btn" href="#/lesson/floor-security">
              Security lesson
            </a>
          </div>
        </section>
      </div>
    )
  }

  const Scene = cur.id === 'cold' ? ColdScene : cur.id === 'hot' ? HotScene : CorridorScene
  const pick = item ? picks[item.id] : undefined

  return (
    <div className="fw page-fit">
      <section className="panel fw-main">
        <div className="pi-head">
          <span className="chip">
            Stop {stop + 1} of {STOPS.length}: {cur.title}
          </span>
          <span className="muted">{isRevealed ? 'What you missed is outlined in red' : `${cur.note}: click anything that looks wrong, or that you want to check`}</span>
        </div>
        <svg viewBox="0 0 1000 480" className="fw-svg" role="img" aria-label={cur.title}>
          <Scene f={f} />
          {visible.map((i) => {
            const p = picks[i.id]
            const missed = isRevealed && f(i.id) && p?.choice !== i.right
            const cls = missed ? ' is-missed' : p ? (p.points > 0 || (p.points === 0 && !f(i.id)) ? ' is-ok' : ' is-bad') : ''
            return (
              <rect
                key={i.id}
                x={i.hit.x}
                y={i.hit.y}
                width={i.hit.w}
                height={i.hit.h}
                rx="6"
                className={`fw-hit${sel === i.id ? ' is-sel' : ''}${cls}`}
                onClick={() => setSel(i.id)}
                role="button"
                aria-label={i.name}
              />
            )
          })}
        </svg>
        <div className="toolbar">
          {!isRevealed ? (
            <button className="btn btn-primary" onClick={finishStop}>
              Done here: show what I missed →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={nextStop}>
              {stop + 1 < STOPS.length ? `Walk on: ${STOPS[stop + 1].title}` : 'End the walk'} →
            </button>
          )}
          <span className="muted small">
            {stopFaults.filter((i) => picks[i.id]?.choice === i.right).length} handled{isRevealed ? ` of ${stopFaults.length} here` : ''}
          </span>
        </div>
        <div className="fw-log">
          <h4 className="panel-sub">Your notes from this walk</h4>
          {Object.keys(picks).length === 0 ? (
            <p className="muted small">Nothing checked yet. Look along the rack fronts, the floor and the doors, then click what you want to check.</p>
          ) : (
            <ul>
              {ITEMS.filter((i) => picks[i.id]).map((i) => {
                const p = picks[i.id]
                const ok = f(i.id) ? p.choice === i.right : p.choice === FINE
                return (
                  <li key={i.id} className={ok ? 'is-ok' : 'is-bad'}>
                    <strong>{i.name}</strong> <span className="muted">{p.choice === FINE ? 'looked fine' : p.choice}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
      <aside className="panel fw-side">
        {!item ? (
          isRevealed ? (
            <>
              <h3 className="panel-title">At this stop</h3>
              <ul className="fw-list">
                {stopFaults.map((i) => (
                  <li key={i.id} className={picks[i.id]?.choice === i.right ? 'is-ok' : 'is-bad'}>
                    <strong>{i.name}</strong>
                    <span>{i.see[1]}</span>
                    <span className="muted">Do: {i.right}.</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h3 className="panel-title">Floor walk</h3>
              <p className="muted small">Three stops, a few problems at each. Click what you see, then choose what you do: 100 points for the right action, minus 25 for raising an alarm over something that is fine.</p>
              <div className="rr-stats">
                <div>
                  <span>Score</span>
                  <strong>{score}</strong>
                </div>
                <div>
                  <span>Checked</span>
                  <strong>{Object.keys(picks).length}</strong>
                </div>
              </div>
              <h4 className="panel-sub">What to look at</h4>
              <ul className="pi-rules">
                <li>LEDs, displays and sensor readings</li>
                <li>Gaps, open doors, things pulled out</li>
                <li>The floor: tiles, boxes, cables, water</li>
                <li>Doors, people and badges</li>
              </ul>
            </>
          )
        ) : (
          <>
            <h3 className="panel-title">{item.name}</h3>
            <p>{f(item.id) ? item.see[1] : item.see[0]}</p>
            <div className="pi-options">
              {options.map((o) => {
                const right = f(item.id) ? o === item.right : o === FINE
                const state = !pick && !isRevealed ? '' : right ? ' is-right' : pick?.choice === o ? ' is-wrong' : ' is-dim'
                return (
                  <button key={o} className={`quiz-opt fw-opt${state}`} onClick={() => choose(o)} disabled={!!pick || isRevealed}>
                    {o}
                  </button>
                )
              })}
            </div>
            {(pick || isRevealed) && (
              <div className="quiz-why">
                <Verdict ok={pick ? pick.points > 0 || (!f(item.id) && pick.choice === FINE) : false}>
                  {pick ? (pick.points > 0 ? 'Right call' : !f(item.id) && pick.choice === FINE ? 'Right, nothing wrong here' : !f(item.id) ? 'False alarm' : 'Not this one') : 'Missed'}
                </Verdict>{' '}
                {f(item.id) ? item.why : 'This one was fine. Checking is good; raising an alarm over it costs everyone time.'}
              </div>
            )}
            <button className="btn-text" onClick={() => setSel(null)}>
              ← back to the walk
            </button>
          </>
        )}
      </aside>
    </div>
  )
}

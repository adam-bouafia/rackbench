import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'
import { Arrow, Box, Caption, Mark, Person, Term, d } from './kit'

// Safety and security on the data center floor: two lessons, each with its own stage.

type SafetyScene = 'esd' | 'lift' | 'tip' | 'ppe' | 'power' | 'heat' | 'fire' | 'epo' | 'clean'
export interface SafetyStep extends StageStep {
  scene: SafetyScene
}

function Rack({ x, y, out, tilt, feet }: { x: number; y: number; out: number[]; tilt?: boolean; feet?: boolean }) {
  // Side view: the rack is 140 wide (depth) and 300 high, the front is on the right.
  return (
    <g className={tilt ? 'sf-tilt' : ''} style={{ transformOrigin: `${x + 140}px ${y + 300}px` }}>
      <rect x={x} y={y} width={140} height={300} rx="4" className="sf-rack" />
      {Array.from({ length: 10 }, (_, i) => {
        const isOut = out.includes(i)
        return <rect key={i} x={x + 8 + (isOut ? 120 : 0)} y={y + 8 + i * 29} width={124} height={22} rx="3" className={`sw-chassis${isOut ? ' is-target' : ''}`} />
      })}
      {feet && <rect x={x + 136} y={y + 296} width={40} height={8} rx="2" className="sf-foot" />}
    </g>
  )
}

export function SafetyStage({ steps, cur, replayKey }: StageProps<SafetyStep>) {
  const st = steps[Math.max(0, cur)]
  const s = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {s === 'esd' && (
          <>
            <rect x={80} y={70} width={360} height={170} rx="10" className="sw-chassis" />
            <text x={260} y={60} textAnchor="middle" className="fb-label">
              server, lid off, cords out
            </text>
            {[0, 1, 2, 3].map((k) => (
              <rect key={k} x={130 + k * 34} y={110} width={24} height={90} rx="3" className="sw-dimm" />
            ))}
            <rect x={300} y={120} width={70} height={70} rx="6" className="sw-cpu" />
            <rect x={400} y={200} width={30} height={30} rx="3" className="sf-ground" />
            <text x={415} y={258} textAnchor="middle" className="fb-tiny">
              bare metal
            </text>
            <g className="fb-in" style={d(0.4)}>
              <ellipse cx={560} cy={150} rx={40} ry={26} className="sf-strap" />
              <path d="M520 160 q-20 30 -40 20 t-30 30 t-35 15" className="sf-cord" />
              <rect x={406} y={206} width={18} height={10} rx="2" className="sf-clip" />
              <text x={560} y={110} textAnchor="middle" className="fb-strong">
                wrist strap
              </text>
            </g>
            <g className="fb-in" style={d(1)}>
              <rect x={660} y={70} width={240} height={170} rx="10" className="sf-bag" />
              <rect x={740} y={110} width={24} height={90} rx="3" className="sw-dimm" />
              <text x={780} y={260} textAnchor="middle" className="fb-label">
                parts stay in their anti-static bag
              </text>
            </g>
            <g className="fb-in" style={d(1.6)}>
              <text x={120} y={320} className="fb-small">
                you feel a spark
              </text>
              <rect x={300} y={306} width={600} height={20} rx="5" className="fb-track" />
              <rect x={300} y={306} width={600} height={20} rx="5" className="sf-volt is-feel fb-grow" />
              <text x={910} y={346} textAnchor="end" className="fb-tiny">
                about 3,000 V and up
              </text>
              <text x={120} y={390} className="fb-small">
                a chip can be hurt
              </text>
              <rect x={300} y={376} width={600} height={20} rx="5" className="fb-track" />
              <rect x={300} y={376} width={22} height={20} rx="5" className="sf-volt is-harm fb-grow" />
              <text x={330} y={416} className="fb-tiny">
                under 100 V for sensitive parts: no spark, no warning
              </text>
            </g>
          </>
        )}

        {s === 'lift' && (
          <>
            <text x={80} y={60} className="fb-strong">
              Typical weights
            </text>
            {[
              ['1U server', 18, 'about 15-20 kg'],
              ['2U server', 32, 'about 25-35 kg'],
              ['4U GPU server', 65, 'about 50-70 kg'],
              ['8U GPU server', 130, 'up to about 130 kg'],
            ].map(([name, kg, label], i) => (
              <g key={name as string}>
                <text x={80} y={110 + i * 62} className="fb-small">
                  {name}
                </text>
                <rect x={260} y={94 + i * 62} width={(kg as number) * 4.6} height={24} rx="5" className={`sf-weight fb-grow${(kg as number) > 25 ? ' is-heavy' : ''}`} style={d(0.3 + i * 0.25)} />
                <text x={Math.max(270 + (kg as number) * 4.6, 376)} y={112 + i * 62} className="fb-tiny">
                  {label}
                </text>
              </g>
            ))}
            <line x1={260 + 23 * 4.6} x2={260 + 23 * 4.6} y1={80} y2={330} className="fb-limit" />
            <text x={260 + 23 * 4.6} y={350} textAnchor="middle" className="fb-bad">
              one-person limit: the site's rule, often around 20-25 kg
            </text>
            <g className="fb-in" style={d(1.6)}>
              <Person x={330} y={430} tone="blue" />
              <Person x={380} y={430} tone="amber" />
              <text x={420} y={420} className="fb-small">
                above the limit: two people, or the server lift
              </text>
              <text x={420} y={442} className="fb-small">
                GPU servers: always the lift, rails fitted first
              </text>
            </g>
          </>
        )}

        {s === 'tip' && (
          <>
            <text x={250} y={44} textAnchor="middle" className="fb-ok">
              safe
            </text>
            <Rack x={160} y={70} out={[7]} feet />
            <text x={250} y={404} textAnchor="middle" className="fb-small">
              one server out, stabiliser foot down
            </text>
            <text x={250} y={426} textAnchor="middle" className="fb-small">
              heavy servers at the bottom
            </text>
            <g className="fb-in" style={d(0.6)}>
              <text x={680} y={44} textAnchor="middle" className="fb-bad">
                tips over
              </text>
              <Rack x={590} y={70} out={[0, 1, 2]} tilt />
              <text x={700} y={404} textAnchor="middle" className="fb-small">
                three out at the top, no foot: the weight moves
              </text>
              <text x={700} y={426} textAnchor="middle" className="fb-small">
                past the front edge and the rack falls toward you
              </text>
            </g>
          </>
        )}

        {s === 'ppe' && (
          <>
            <Box x={60} y={60} w={420} h={150} title="Safety shoes" lines={['servers, PSUs and pallets', 'land on feet: steel or composite toe']} tone="amber" delay={0.2} />
            <Box x={520} y={60} w={420} h={150} title="Gloves" lines={['rails, cage nuts and chassis edges cut;', 'unboxing knives and straps too']} tone="teal" delay={0.6} />
            <Box x={60} y={240} w={420} h={150} title="Hearing protection" lines={['a full hall can run above 80 dB;', 'long shifts there need ear protection']} tone="violet" delay={1} />
            <Box x={520} y={240} w={420} h={150} title="Eyes and fibre" lines={['never look into an optic or a fibre end:', 'the light can be invisible infrared;', 'offcuts go in the fibre waste bin']} tone="bad" delay={1.4} />
            <Caption y={440}>No loose sleeves, lanyards or jewellery near fans and moving rails.</Caption>
          </>
        )}

        {s === 'power' && (
          <>
            <text x={250} y={46} textAnchor="middle" className="fb-ok">
              your work
            </text>
            <rect x={150} y={70} width={60} height={330} rx="6" className="sf-pdu" />
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={164} y={120 + i * 26} width={32} height={16} rx="3" className="sf-outlet" />
            ))}
            <rect x={156} y={78} width={48} height={30} rx="4" className="fb-term" />
            <text x={180} y={98} textAnchor="middle" className="fb-term-text is-ok">
              9.6 A
            </text>
            <path d="M330 160 C 280 160 260 178 200 178" className="sf-power-cord fb-in" style={d(0.6)} />
            <rect x={330} y={140} width={80} height={40} rx="5" className="sw-psu fb-in" style={d(0.6)} />
            <text x={250} y={430} textAnchor="middle" className="fb-small">
              server cords into PDU outlets, after reading the PDU load
            </text>
            <g className="fb-in" style={d(1.2)}>
              <text x={730} y={46} textAnchor="middle" className="fb-bad">
                not your work
              </text>
              <rect x={600} y={70} width={260} height={330} rx="8" className="sf-panel" />
              {[0, 1, 2, 3].map((k) => (
                <rect key={k} x={640} y={110 + k * 60} width={60} height={34} rx="4" className="sf-breaker" />
              ))}
              <rect x={720} y={170} width={40} height={34} rx="4" className="sf-breaker is-off" />
              <path d="M730 170 v-14 a10 10 0 0 1 20 0 v14" className="sf-lock" />
              <rect x={770} y={200} width={74} height={60} rx="4" className="sf-tag" />
              <text x={807} y={222} textAnchor="middle" className="fb-tiny">
                DANGER
              </text>
              <text x={807} y={240} textAnchor="middle" className="fb-tiny">
                DO NOT
              </text>
              <text x={807} y={254} textAnchor="middle" className="fb-tiny">
                OPERATE
              </text>
              <text x={730} y={430} textAnchor="middle" className="fb-small">
                panels, PDU internals, busway tap boxes: electricians,
              </text>
              <text x={730} y={450} textAnchor="middle" className="fb-small">
                with lockout/tagout: a lock and a tag on the breaker
              </text>
            </g>
          </>
        )}

        {s === 'heat' && (
          <>
            <rect x={80} y={80} width={360} height={260} rx="10" className="sf-cold" />
            <rect x={560} y={80} width={360} height={260} rx="10" className="sf-hot" />
            <text x={260} y={120} textAnchor="middle" className="fb-strong">
              cold aisle
            </text>
            <text x={740} y={120} textAnchor="middle" className="fb-strong">
              hot aisle
            </text>
            <text x={260} y={200} textAnchor="middle" className="sf-temp">
              18-27 °C
            </text>
            <text x={740} y={200} textAnchor="middle" className="sf-temp">
              35-45 °C+
            </text>
            <text x={260} y={240} textAnchor="middle" className="fb-small">
              the server inlet range most sites aim for
            </text>
            <text x={740} y={240} textAnchor="middle" className="fb-small">
              the exhaust of every server in the row
            </text>
            {[0, 1, 2].map((k) => (
              <path key={k} d={`M450 ${150 + k * 50} H550`} className="sf-flow fb-in" style={d(0.3 + k * 0.2)} />
            ))}
            <g className="fb-in" style={d(1)}>
              <text x={500} y={390} textAnchor="middle" className="fb-small">
                Long jobs in the hot aisle: plan breaks and drink water.
              </text>
              <text x={500} y={414} textAnchor="middle" className="fb-small">
                Contained aisles: close the door behind you, or hot and cold air mix.
              </text>
            </g>
          </>
        )}

        {s === 'fire' && (
          <>
            {[
              ['VESDA', 'pipes sample the air: smoke', 'found early'],
              ['Alarm 1', 'one detector: staff', 'check the zone'],
              ['Alarm 2', 'confirmed: sounders,', 'strobes, countdown'],
              ['Discharge', 'gas fills the room', 'room stays shut'],
            ].map(([t, a, b], i) => (
              <g key={t} className="fb-in" style={d(0.3 + i * 0.5)}>
                <Box x={40 + i * 240} y={70} w={210} h={110} title={t} lines={[a, b]} tone={i === 3 ? 'bad' : i === 2 ? 'warn' : 'plain'} />
                {i < 3 && <Arrow x1={252 + i * 240} y1={125} x2={278 + i * 240} y2={125} />}
              </g>
            ))}
            <g className="fb-in" style={d(2.2)}>
              <circle cx={140} cy={290} r="26" className="sf-strobe" />
              <rect x={210} y={278} width={300} height={24} rx="6" className="fb-track" />
              <rect x={210} y={278} width={300} height={24} rx="6" className="sf-countdown" />
              <text x={360} y={330} textAnchor="middle" className="fb-bad">
                countdown before the gas, often about 30 s
              </text>
              <rect x={820} y={230} width={100} height={150} rx="6" className="sf-exit" />
              <text x={870} y={220} textAnchor="middle" className="fb-ok">
                EXIT
              </text>
              <Person x={620} y={360} tone="blue" className="sf-walk" />
            </g>
            <Caption y={440} tone="bad" delay={2.6}>
              Alarm 2 sounds: leave now, nearest exit, close the doors, never wedge them. Re-enter only when cleared.
            </Caption>
          </>
        )}

        {s === 'epo' && (
          <>
            <rect x={110} y={70} width={260} height={300} rx="12" className="sf-epo-box" />
            <text x={240} y={110} textAnchor="middle" className="fb-strong">
              EMERGENCY
            </text>
            <text x={240} y={132} textAnchor="middle" className="fb-strong">
              POWER OFF
            </text>
            <circle cx={240} cy={240} r="70" className="sf-epo" />
            <rect x={150} y={150} width={180} height={180} rx="14" className="sf-cover fb-in" style={d(0.4)} />
            <text x={240} y={400} textAnchor="middle" className="fb-small">
              behind a cover, on purpose
            </text>
            <Box x={450} y={70} w={480} h={130} title="What it does" lines={['cuts power to the IT load of the room,', 'often the UPS output too: every server', 'in the hall goes dark at once']} tone="bad" delay={0.8} />
            <Box x={450} y={220} w={480} h={130} title="When to press it" lines={['to protect a life: a fire fed by power, or', 'a person in contact with live parts.', 'Never to stop one server.']} tone="warn" delay={1.4} />
            <g className="fb-in" style={d(2)}>
              <text x={690} y={392} textAnchor="middle" className="fb-small">
                Someone stuck to live parts: do not touch them. Cut the power,
              </text>
              <text x={690} y={414} textAnchor="middle" className="fb-small">
                call 112 and the site emergency number. Water on the floor:
              </text>
              <text x={690} y={436} textAnchor="middle" className="fb-small">
                keep clear of electrics and call facilities.
              </text>
            </g>
          </>
        )}

        {s === 'clean' && (
          <>
            {[
              ['No food or drink on the floor', 'spills and servers do not mix'],
              ['Unbox in the staging room', 'cardboard brings dust and fire load'],
              ['Aisles and exits clear', 'no carts, boxes or cables left behind'],
              ['Tools back in the kit', 'a screw in a fan or a PSU is a fault'],
              ['Report what you see', 'loose tiles, cables across aisles, leaks'],
            ].map(([t, sub], i) => (
              <g key={t} className="fb-in" style={d(0.2 + i * 0.35)}>
                <Mark x={150} y={90 + i * 72} ok />
                <text x={180} y={88 + i * 72} className="fb-strong">
                  {t}
                </text>
                <text x={180} y={108 + i * 72} className="fb-small">
                  {sub}
                </text>
              </g>
            ))}
            <Caption y={450}>Housekeeping is safety: most floor incidents start with something left where it should not be.</Caption>
          </>
        )}
      </svg>
    </div>
  )
}

export const FLOOR_SAFETY: StageLesson<SafetyStep> = {
  Stage: SafetyStage,
  metrics: [
    { id: 'hazard', label: 'Hazard', start: '-' },
    { id: 'rule', label: 'Your rule', start: '-' },
  ],
  intro: [
    'Every data center starts your first day with a safety induction, and interviews for floor jobs ask about it. The rules are short and strict, because the floor mixes heavy metal, high power, heat, lasers and gas fire suppression.',
    'Step through what can hurt you or the hardware, and what you do about it.',
  ],
  legend: [
    ['ESD', 'Electrostatic discharge: a static shock that can damage chips without you feeling it'],
    ['LOTO', 'Lockout/tagout: a lock and a tag on a breaker, so no one switches it on during work'],
    ['VESDA', 'Very early smoke detection: pipes that sample the air for smoke'],
    ['EPO', 'Emergency power off: one button that cuts power to the room'],
  ],
  steps: [
    { scene: 'esd', short: 'ESD', title: 'Static you cannot feel', tag: 'technique', explain: ['You only feel a static spark from about 3,000 V, but a sensitive chip can be damaged by less than 100 V. So the damage happens without a spark and without a warning, and shows up weeks later as a flaky DIMM.', 'Wear a wrist strap clipped to bare metal on the chassis (or the grounded mat), touch parts by their edges, and keep them in their anti-static bag until they go in.'], key: 'Strap on before the lid comes off, parts in their bags until they go in.', m: { hazard: 'static', rule: 'strap + bag' } },
    { scene: 'lift', short: 'Lifting', title: 'Heavy, heavier, GPU', tag: 'technique', explain: ['A 1U server is light enough for one person, a 2U often is not, and a GPU server can weigh as much as two people. Every site has a one-person limit; above it you lift with two people or with the server lift.', 'Lift with your legs, keep the server close, and fit the rails before you lift.'], key: 'Above the site limit: two people or the lift, every time.', m: { hazard: 'weight', rule: 'team lift' } },
    { scene: 'tip', short: 'Tipping', title: 'A rack can fall toward you', tag: 'event', explain: ['A loaded rack weighs hundreds of kilograms, and every server you slide out on its rails moves the weight toward the front. With the heavy servers at the top and several pulled out, the rack tips over.', 'Fill racks from the bottom up, put the stabiliser foot down, and pull out one server at a time.'], key: 'One server out at a time, heavy at the bottom, foot down.', m: { hazard: 'tipping rack', rule: 'one out at a time' } },
    { scene: 'ppe', short: 'PPE', title: 'What you wear', explain: ['Personal protective equipment for the floor is simple: safety shoes, gloves for rails and sharp edges, hearing protection in loud halls, and respect for lasers.', 'Optics send infrared light you cannot see. Never look into a port or a fibre end; use the power meter or the inspection scope. Fibre offcuts are glass splinters: they go in the fibre waste bin, never on the floor.'], key: 'Shoes, gloves, ears, and never look into a fibre.', m: { hazard: 'cuts, noise, laser', rule: 'PPE on' } },
    { scene: 'power', short: 'Power', title: 'Your plugs, the electricians\' panels', tag: 'technique', explain: ['A technician plugs server cords into PDU outlets, after reading the PDU\'s load so the circuit is not overloaded. Everything behind the outlet belongs to the electricians: panels, breakers, busway tap boxes and the inside of a PDU.', 'When they work on a circuit they lock the breaker and hang a tag on it: lockout/tagout. A locked, tagged breaker is never switched by anyone else. And never plug a power strip into another power strip.'], key: 'You plug and unplug cords; panels and breakers are for electricians under lockout/tagout.', m: { hazard: 'live power', rule: 'outlets only' } },
    { scene: 'heat', short: 'Heat', title: 'The hot aisle', explain: ['Servers breathe cold air from the cold aisle and blow it hot into the hot aisle. Most sites keep server inlets between 18 and 27 °C; the hot aisle is often 35 to 45 °C or more.', 'Plan long jobs there with breaks and water, and close containment doors behind you so hot and cold air do not mix.'], key: 'Hot aisle work: breaks, water, doors closed.', m: { hazard: 'heat', rule: 'short stints' } },
    { scene: 'fire', short: 'Fire', title: 'When the fire alarm goes', tag: 'event', explain: ['Data halls detect smoke early with air-sampling pipes (VESDA). A confirmed alarm starts a countdown, then the room is flooded with a clean-agent or inert gas that puts the fire out without water.', 'Inert gas lowers the oxygen in the room. When the second alarm sounds, leave at once by the nearest exit and close the doors behind you: the gas only works if the room stays shut. Go to the assembly point and wait until the fire team clears the room.'], key: 'Second alarm: leave now, close the doors, never wedge them, wait to be cleared.', m: { hazard: 'fire and gas', rule: 'leave and close' } },
    { scene: 'epo', short: 'EPO', title: 'The emergency power off button', tag: 'event', explain: ['The EPO button cuts power to the room\'s IT load, often including the UPS output. It exists to protect lives: a fire fed by electricity, or a person in contact with live parts.', 'Pressed by accident it causes the biggest outage the site can have, which is why it sits behind a cover. If someone is stuck to live parts, do not touch them: cut the power, then call 112 and the site\'s emergency number.'], key: 'EPO is for lives, never for equipment; keep its cover on.', m: { hazard: 'electric shock', rule: 'cut power, call 112' } },
    { scene: 'clean', short: 'Housekeeping', title: 'Leave the floor as you found it', explain: ['Most incidents on the floor start with something left behind: a box in an aisle, a cable across the floor, a lifted floor tile, a screw in a fan.', 'Unbox in the staging room, keep food and drink out, clear the aisles and exits, put tools back, and report hazards you find even when they are not yours.'], key: 'Clean floor, clear exits, report hazards.', m: { hazard: 'clutter', rule: 'leave it clean' } },
  ],
}

/* ---------- security ---------- */

type SecScene = 'layers' | 'mantrap' | 'tailgate' | 'visitors' | 'ticket' | 'photos' | 'goods' | 'media' | 'report'
export interface SecStep extends StageStep {
  scene: SecScene
}

export function SecurityStage({ steps, cur, replayKey }: StageProps<SecStep>) {
  const st = steps[Math.max(0, cur)]
  const s = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {s === 'layers' && (
          <>
            {[
              ['Fence and gate', 'cameras, vehicle check'],
              ['Reception', 'ID checked, signed in'],
              ['Badge + PIN or biometrics', 'every door logs who'],
              ['Mantrap', 'one person at a time'],
              ['Data hall', 'your badge must be allowed'],
              ['Client cage', 'key or badge per client'],
              ['Rack', 'locked doors'],
            ].map(([t, sub], i) => (
              <g key={t} className="fb-in" style={d(0.2 + i * 0.3)}>
                <rect x={40 + i * 38} y={40 + i * 26} width={920 - i * 76} height={400 - i * 52} rx="12" className={`sc-layer is-${i}`} />
                <text x={56 + i * 38} y={62 + i * 26} className="fb-small">
                  {i + 1}. {t}
                </text>
                <text x={944 - i * 38} y={62 + i * 26} textAnchor="end" className="fb-tiny">
                  {sub}
                </text>
              </g>
            ))}
            <Person x={500} y={272} tone="blue" badge className="sc-walk-in" />
          </>
        )}

        {s === 'mantrap' && (
          <>
            <rect x={300} y={120} width={400} height={220} rx="8" className="sc-room" />
            <text x={500} y={110} textAnchor="middle" className="fb-strong">
              mantrap: only one door opens at a time
            </text>
            <rect x={292} y={170} width={16} height={130} className="sc-door is-a" />
            <rect x={692} y={170} width={16} height={130} className="sc-door is-b" />
            <text x={300} y={360} textAnchor="middle" className="fb-tiny">
              door 1
            </text>
            <text x={700} y={360} textAnchor="middle" className="fb-tiny">
              door 2
            </text>
            <circle cx={500} cy={150} r="9" className="sc-sensor" />
            <text x={520} y={154} className="fb-tiny">
              sensor: one person
            </text>
            <Person x={200} y={300} tone="blue" badge className="sc-through" />
            <text x={140} y={420} className="fb-small">
              badge in, door 1 shuts, the floor or a camera checks you are alone, then door 2 opens.
            </text>
            <text x={140} y={442} className="fb-small">
              Two people inside: neither door opens, security comes.
            </text>
          </>
        )}

        {s === 'tailgate' && (
          <>
            <rect x={560} y={90} width={24} height={240} className="sc-door is-open" />
            <rect x={600} y={180} width={28} height={40} rx="5" className="sc-reader" />
            <circle cx={614} cy={194} r="5" className="sc-led-ok" />
            <Person x={440} y={300} tone="blue" badge className="sc-pass" />
            <g className="sc-follow">
              <Person x={330} y={300} tone="slate" />
            </g>
            <g className="fb-in" style={d(1.8)}>
              <Mark x={470} y={220} ok={false} />
              <text x={470} y={370} textAnchor="middle" className="fb-bad">
                no badge read
              </text>
            </g>
            <Box x={680} y={80} w={290} h={250} title="Tailgating" lines={['Never hold a secure door', 'for anyone, even a colleague', 'you know. Everyone badges.', '', 'Someone follows you: stop,', 'ask them to badge, call', 'the security desk.']} tone="warn" delay={1.2} />
          </>
        )}

        {s === 'visitors' && (
          <>
            <Box x={60} y={60} w={420} h={250} title="Access list: client Acme" lines={['J. de Vries    authorised, ID checked', 'A. Ruiz        authorised, can escort', 'K. Smit        visitor, escort: A. Ruiz', '', 'Not on the list: no entry.', 'Call the client\'s contact, never', 'decide it yourself.']} tone="plain" delay={0.2} />
            <g className="fb-in" style={d(0.8)}>
              <Person x={620} y={290} tone="amber" badge />
              <Person x={690} y={290} tone="blue" badge />
              <rect x={580} y={330} width={150} height={40} rx="6" className="sc-visitor" />
              <text x={655} y={355} textAnchor="middle" className="fb-tiny">
                VISITOR · ESCORTED
              </text>
            </g>
            <text x={780} y={200} className="fb-small">
              a visitor is never
            </text>
            <text x={780} y={222} className="fb-small">
              alone on the floor,
            </text>
            <text x={780} y={244} className="fb-small">
              not even for a minute
            </text>
            <Caption y={430}>Visitors sign in with ID, wear the badge where it shows, and stay with their escort until they sign out.</Caption>
          </>
        )}

        {s === 'ticket' && (
          <>
            <rect x={80} y={80} width={120} height={200} rx="18" className="sc-phone" />
            <rect x={96} y={110} width={88} height={130} rx="6" className="fb-term" />
            <text x={140} y={300} textAnchor="middle" className="fb-tiny">
              incoming call
            </text>
            <Box x={240} y={80} w={330} h={110} title="The caller says:" lines={['"I am the client. Please power', 'cycle our server in U30, now."']} tone="warn" delay={0.4} />
            <Arrow x1={580} y1={135} x2={640} y2={135} delay={1} />
            <Box x={650} y={60} w={300} h={260} title="You:" lines={['1. Ask for a ticket in the', '   client portal', '2. Or call back on the number', '   in the contact list', '3. Check the name against', '   the access list', '4. Then do the work']} tone="ok" delay={1.2} />
            <Caption y={400}>No ticket, no work. A confident voice on the phone is the oldest trick in social engineering.</Caption>
          </>
        )}

        {s === 'photos' && (
          <>
            <rect x={110} y={120} width={200} height={140} rx="16" className="sc-camera" />
            <circle cx={210} cy={190} r="44" className="sc-lens" />
            <rect x={140} y={100} width={60} height={26} rx="6" className="sc-camera" />
            {[
              [true, 'with the site\'s permission'],
              [true, 'only the client\'s own equipment in the ticket'],
              [true, 'labels, ports, LEDs: the evidence for the ticket'],
              [false, 'other clients\' cages and racks'],
              [false, 'doors, cameras, readers, security systems'],
            ].map(([ok, t], i) => (
              <g key={t as string} className="fb-in" style={d(0.3 + i * 0.35)}>
                <Mark x={400} y={110 + i * 60} ok={ok as boolean} />
                <text x={424} y={115 + i * 60} className="fb-small">
                  {t}
                </text>
              </g>
            ))}
          </>
        )}

        {s === 'goods' && (
          <>
            <text x={250} y={56} textAnchor="middle" className="fb-strong">
              coming in
            </text>
            <rect x={120} y={80} width={130} height={100} rx="6" className="sw-box" />
            <Arrow x1={260} y1={130} x2={320} y2={130} delay={0.4} />
            <Box x={330} y={80} w={130} h={100} title="Ticket" lines={['IN-5521', 'matches']} tone="ok" delay={0.6} center />
            <text x={290} y={220} textAnchor="middle" className="fb-small">
              matched to a ticket, logged, stored in the client's area
            </text>
            <g className="fb-in" style={d(1.2)}>
              <text x={750} y={56} textAnchor="middle" className="fb-strong">
                going out
              </text>
              <rect x={620} y={80} width={130} height={100} rx="6" className="sw-box" />
              <Arrow x1={760} y1={130} x2={820} y2={130} />
              <Box x={830} y={80} w={140} h={100} title="Removal form" lines={['signed by an', 'authorised name']} tone="warn" center />
              <text x={790} y={220} textAnchor="middle" className="fb-small">
                nothing leaves without it, security checks at the exit
              </text>
            </g>
            <Caption y={330}>Goods in and goods out both leave a paper trail: what, whose, who signed, when.</Caption>
          </>
        )}

        {s === 'media' && (
          <>
            {[
              ['Pulled', 'serial, time, who'],
              ['Locked bin', 'media cage, logged'],
              ['Destroyed', 'shredded or degaussed'],
              ['Certificate', 'one line per serial'],
            ].map(([t, sub], i) => (
              <g key={t}>
                <Box x={50 + i * 240} y={140} w={190} h={110} title={t} lines={[sub]} tone={i === 3 ? 'ok' : 'plain'} delay={0.3 + i * 0.5} center />
                {i < 3 && <Arrow x1={244 + i * 240} y1={195} x2={286 + i * 240} y2={195} delay={0.5 + i * 0.5} />}
              </g>
            ))}
            <text x={500} y={100} textAnchor="middle" className="fb-strong">
              chain of custody for a drive that held data
            </text>
            <Term x={180} y={300} w={640} delay={2.4} lines={['# media log', 'S6KNNA0T812345  pulled 02:14 by tech 0412   bin M-3', 'S6KNNA0T812345  shredded 09:30, certificate SH-2611-88']} />
            <Caption y={450}>Every hand-over is written down. A gap in the chain is a data breach risk.</Caption>
          </>
        )}

        {s === 'report' && (
          <>
            {[
              'a fire or secure door wedged open',
              'someone without a visible badge',
              'a visitor on their own',
              'a broken lock, reader or camera',
              'equipment left in an aisle or a corridor',
            ].map((t, i) => (
              <g key={t} className="fb-in" style={d(0.2 + i * 0.3)}>
                <Mark x={130} y={100 + i * 56} ok={false} />
                <text x={156} y={105 + i * 56} className="fb-small">
                  {t}
                </text>
              </g>
            ))}
            <Arrow x1={560} y1={210} x2={660} y2={210} delay={1.8} />
            <Box x={670} y={130} w={260} h={160} title="Security desk" lines={['tell them what,', 'where and when;', 'they decide']} tone="info" delay={2} center />
            <Caption y={440}>Security would rather have ten false alarms than one missed tailgater.</Caption>
          </>
        )}
      </svg>
    </div>
  )
}

export const FLOOR_SECURITY: StageLesson<SecStep> = {
  Stage: SecurityStage,
  metrics: [{ id: 'layer', label: 'Rule', start: '-' }],
  intro: [
    'Clients put their servers in a colocation data center because it is hard to get into. The technician is part of that security: you decide every day who you let through a door, whose equipment you touch, and what you let leave the building.',
  ],
  legend: [
    ['Mantrap', 'A small room with two doors that never open at the same time'],
    ['Tailgating', 'Following someone through a secure door without badging'],
    ['Access list', 'The names a client allows into its space'],
    ['Chain of custody', 'A written record of every hand-over of a part that holds data'],
  ],
  steps: [
    { scene: 'layers', short: 'Layers', title: 'Security in layers', explain: ['From the fence to the rack, every layer checks you again: a gate, reception with an ID check, badge and PIN or biometrics on every door, a mantrap, the data hall, the client\'s cage and finally the locked rack.', 'Each door logs who went through and when, so the badge you carry is personal: never lend it.'], key: 'Every layer checks again, and your badge is yours alone.', m: { layer: 'seven layers' } },
    { scene: 'mantrap', short: 'Mantrap', title: 'The mantrap', tag: 'event', explain: ['Between the public side and the floor sits a mantrap: two doors that never open together. You badge in, the first door closes, sensors or a camera check that only one person is inside, then the second door opens.', 'If two people try to pass together, neither door opens and security comes.'], key: 'One person per cycle; you never bring a second person through.', m: { layer: 'one at a time' } },
    { scene: 'tailgate', short: 'Tailgating', title: 'Never hold the door', tag: 'technique', explain: ['Tailgating is the easiest way into a building: walk close behind someone who has a badge. Polite people hold doors, which is why the rule is absolute: never hold a secure door for anyone, even a colleague you know well.', 'If someone follows you, stop, ask them to badge, and call the security desk if they cannot.'], key: 'Everyone badges at every door; report anyone who follows.', m: { layer: 'no tailgating' } },
    { scene: 'visitors', short: 'Visitors', title: 'Access lists and escorts', explain: ['Each client gives the site a list of people allowed into its space. A name on the list gets in after an ID check; a name not on it does not, whatever they say. You call the client\'s contact, you do not decide it yourself.', 'Visitors sign in, wear a visible visitor badge and stay with their escort the whole time.'], key: 'On the list and ID checked, or no entry; visitors are always escorted.', m: { layer: 'access list' } },
    { scene: 'ticket', short: 'Ticket', title: 'No ticket, no work', tag: 'technique', explain: ['You touch a client\'s equipment only with a ticket that names it. A phone call asking for urgent work, however confident, is not a ticket: ask for one through the portal, or call back on the number in the contact list.', 'This protects the client from social engineering, and you from doing damage on someone\'s word.'], key: 'Work only from a ticket; verify callers through known channels.', m: { layer: 'ticket first' } },
    { scene: 'photos', short: 'Photos', title: 'Photos and evidence', explain: ['Photos are often the evidence a ticket needs: the port, the label, the LED. Take them only where the site allows it, and only of the client\'s own equipment in the ticket.', 'Never photograph other clients\' racks or the security systems: doors, readers and cameras.'], key: 'Photograph only the ticket\'s equipment, with permission.', m: { layer: 'photo rules' } },
    { scene: 'goods', short: 'Goods', title: 'Goods in, goods out', explain: ['Deliveries are matched to a ticket, logged and stored in the client\'s area. Nothing leaves the building without a removal form signed by someone on the client\'s access list; security checks it at the exit.'], key: 'A paper trail for everything that comes in or goes out.', m: { layer: 'removal form' } },
    { scene: 'media', short: 'Media', title: 'Chain of custody for drives', tag: 'technique', explain: ['A failed drive still holds the client\'s data. From the moment you pull it, every hand-over is logged by serial: pulled by whom and when, into a locked media bin, then shredded or degaussed, with a certificate that lists the serial.', 'A gap in that chain is a possible data breach, which is why most clients never let drives leave the site.'], key: 'Log the serial at every hand-over, from the bay to the certificate.', m: { layer: 'chain of custody' } },
    { scene: 'report', short: 'Report', title: 'See it, report it', explain: ['A wedged door, a person without a badge, a visitor on their own, a broken lock: report it to the security desk with what, where and when. They decide what it is.', 'Nobody is blamed for a false alarm; a missed tailgater can cost a client its trust in the site.'], key: 'Report anything odd; false alarms are fine.', m: { layer: 'report it' } },
  ],
}

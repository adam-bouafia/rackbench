import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'
import { Box, Caption, Mark, Term, d } from './kit'

// A change window run by the method of procedure, a failed check, the rollback, and the shift handover.

type Scene = 'types' | 'mop' | 'pre' | 'steps' | 'fail' | 'rollback' | 'post' | 'handover'
export interface ChangeStep extends StageStep {
  scene: Scene
}

const MOP_STEPS = [
  ['02:03', 'announce the start on the bridge call'],
  ['02:05', 'network team shuts tor1 eth1/49'],
  ['02:07', 'swap the QSFP28 optic, clean and inspect'],
  ['02:09', 'check: link up at 100G, Rx above -8 dBm'],
  ['02:12', 'network team brings the port back'],
  ['02:20', 'post-checks, end the call'],
]

function Steps({ done, failAt }: { done: number; failAt?: number }) {
  return (
    <g>
      {MOP_STEPS.map(([t, txt], i) => {
        const state = failAt === i ? 'bad' : i < done ? 'ok' : 'todo'
        return (
          <g key={t} className={i < done || failAt === i ? 'fb-in' : ''} style={d(0.2 + i * 0.4)}>
            <rect x={60} y={56 + i * 54} width={560} height={44} rx="8" className={`kit-box is-${state === 'bad' ? 'bad' : state === 'ok' ? 'ok' : 'plain'}`} />
            <text x={80} y={83 + i * 54} className="fb-small">
              {i + 1}. {txt}
            </text>
            <text x={600} y={83 + i * 54} textAnchor="end" className="fb-tiny">
              {i < done || failAt === i ? t : ''}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function ChangeStage({ steps, cur, replayKey }: StageProps<ChangeStep>) {
  const st = steps[Math.max(0, cur)]
  const s = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {s === 'types' && (
          <>
            <Box x={40} y={40} w={450} h={130} title="Incident" lines={['something broke: restore the service', 'priority P1 (down) to P4 (low)']} tone="bad" delay={0.2} />
            <Box x={510} y={40} w={450} h={130} title="Service request" lines={['a routine ask from a client:', 'reseat a cable, a photo, a power cycle']} tone="info" delay={0.6} />
            <Box x={40} y={190} w={450} h={130} title="Change" lines={['planned work that carries risk:', 'written, approved, then done in a window']} tone="warn" delay={1} />
            <Box x={510} y={190} w={450} h={130} title="Problem" lines={['the root cause behind repeated incidents,', 'found and removed for good']} tone="violet" delay={1.4} />
            <Caption y={380}>These are the ITIL words most data centers use in their ticket system.</Caption>
            <Caption y={406} delay={1.8}>
              A P1 incident may need an emergency change: approved fast by the on-call manager, written up afterwards.
            </Caption>
          </>
        )}

        {s === 'mop' && (
          <>
            <rect x={60} y={30} width={460} height={420} rx="10" className="cw-doc" />
            <text x={86} y={66} className="fb-strong">
              MOP C-1182: replace optic tor1 eth1/49
            </text>
            {[
              ['Scope', 'one 100G optic in rack C04'],
              ['Window', 'Saturday 02:00-04:00'],
              ['Approval', 'change board, ticket C-1182'],
              ['Contacts', 'client NOC, network on-call'],
              ['Pre-checks', 'what "before" looks like'],
              ['Steps', 'each with its expected result'],
              ['Rollback', 'how to undo every step'],
              ['Post-checks', 'what "done" looks like'],
            ].map(([k, v], i) => (
              <g key={k} className="fb-in" style={d(0.2 + i * 0.25)}>
                <Mark x={98} y={104 + i * 42} ok />
                <text x={120} y={109 + i * 42} className="fb-small">
                  {k}
                </text>
                <text x={250} y={109 + i * 42} className="fb-tiny">
                  {v}
                </text>
              </g>
            ))}
            <Box x={570} y={120} w={380} h={170} title="Method of procedure" lines={['the script for the window:', 'written and approved before,', 'followed line by line during']} tone="info" delay={2.4} />
          </>
        )}

        {s === 'pre' && (
          <>
            <Box x={40} y={40} w={430} h={170} title="Before 02:00" lines={['new optic and a spare cord on site', 'access booked, tools in the bag', 'bridge call joined', 'client NOC and network on-call ready']} delay={0.2} />
            <Box x={510} y={40} w={450} h={170} title="Go / no-go" lines={['client NOC     go', 'network team   go', 'you            go']} tone="ok" delay={0.8} />
            <Term x={40} y={240} w={920} delay={1.4} lines={['# pre-check: the "before" state, saved to the ticket', '> show interfaces eth1/49 status', '+eth1/49   connected   100G   QSFP28 SR4', '> show interfaces eth1/49 transceiver   # Rx -2.1 dBm on all four lanes', '# plus a photo of the port and its label']} />
          </>
        )}

        {s === 'steps' && (
          <>
            <Steps done={3} />
            <Box x={660} y={60} w={300} h={210} title="On the call" lines={['say each step before', 'you do it, and when', 'it is done', '', 'do only what the', 'MOP says']} tone="info" delay={1.4} />
          </>
        )}

        {s === 'fail' && (
          <>
            <Steps done={3} failAt={3} />
            <g className="fb-in" style={d(1.8)}>
              <polygon points="800,60 850,80 870,130 850,180 800,200 750,180 730,130 750,80" className="cw-stop" />
              <text x={800} y={140} textAnchor="middle" className="cw-stop-text">
                STOP
              </text>
            </g>
            <Term x={660} y={230} w={300} delay={2.2} lines={['!eth1/49  notconnect', '!Rx  -40.0 dBm  all lanes', 'clean + reseat: no change']} />
            <Caption y={420} tone="bad" delay={2.6}>
              The check failed. Report it on the call; the change lead decides. No improvising on a live network.
            </Caption>
          </>
        )}

        {s === 'rollback' && (
          <>
            <Box x={40} y={40} w={440} h={200} title="Rollback (from the MOP)" lines={['1. put the old optic back in', '2. network team brings the port up', '3. compare with the pre-check', '4. say "rolled back" on the call']} tone="warn" delay={0.2} />
            <Term x={520} y={40} w={440} delay={1} lines={['> show interfaces eth1/49 status', '+eth1/49   connected   100G', '+Rx -2.1 dBm, same as the pre-check', '+02:31 service back as before']} />
            <Caption y={330}>A rollback inside the window is a good outcome: the service is safe and nothing is hidden.</Caption>
            <Caption y={356} delay={1.4}>
              The change closes as "rolled back", with the reason.
            </Caption>
          </>
        )}

        {s === 'post' && (
          <>
            <Term
              x={60}
              y={40}
              w={880}
              delay={0.2}
              lines={[
                'Change C-1182   status: rolled back',
                '  02:03 start · 02:09 step 4 failed: no light from the new optic',
                '  02:24 rollback done, 02:31 service as before (pre-check matched)',
                '  cause: new optic dead on arrival, RMA opened, photos attached',
                '  next: new optic from stock, change rescheduled for next window',
              ]}
            />
            <Caption y={230}>The timeline, the evidence and the next step: whoever reads it later knows exactly what happened.</Caption>
          </>
        )}

        {s === 'handover' && (
          <>
            <rect x={60} y={24} width={880} height={400} rx="10" className="cw-doc" />
            <text x={86} y={58} className="fb-strong">
              Shift handover 07:00 · night to day
            </text>
            {[
              ['Tickets', '3 open: 48213 rebuild at 70%, check at 10:00'],
              ['Changes', 'C-1182 rolled back, optic from stock, reschedule'],
              ['Incidents', 'PDU B C04 high-load alarm 03:40, facilities told'],
              ['Deliveries', '2 pallets for Acme at 09:00, ticket IN-5521'],
              ['Visitors', 'K. Smit 13:00, escort A. Ruiz'],
              ['Parts', 'RMA 2611-0731 waiting for the courier'],
              ['Access', 'all keys and badges returned'],
            ].map(([k, v], i) => (
              <g key={k} className="fb-in" style={d(0.2 + i * 0.3)}>
                <text x={86} y={100 + i * 42} className="fb-small">
                  {k}
                </text>
                <text x={240} y={100 + i * 42} className="fb-small">
                  {v}
                </text>
              </g>
            ))}
            <Caption y={456} delay={2.4}>
              Written in the log, walked through face to face, read back by the next shift.
            </Caption>
          </>
        )}
      </svg>
    </div>
  )
}

export const CHANGE_WINDOW: StageLesson<ChangeStep> = {
  Stage: ChangeStage,
  metrics: [
    { id: 'change', label: 'Change', start: 'C-1182' },
    { id: 'state', label: 'State', start: 'approved' },
  ],
  intro: [
    'Shift work on the floor runs on tickets, changes and handovers. A change window is planned work on live equipment, done by a written procedure at a quiet hour. Follow one optic replacement that does not go to plan, then hand the shift over.',
  ],
  legend: [
    ['MOP', 'Method of procedure: the approved step-by-step script for a change'],
    ['Change window', 'The agreed time slot for planned work'],
    ['Bridge call', 'The conference call everyone in the change joins'],
    ['Rollback', 'The steps that undo the change'],
  ],
  steps: [
    { scene: 'types', short: 'Ticket types', title: 'Incident, request, change, problem', explain: ['Most ticket systems use the ITIL words. An incident is something broken, with a priority from P1 (service down) to P4. A service request is a routine ask. A change is planned work with risk, approved before it is done. A problem is the root cause behind repeated incidents.'], key: 'Broken = incident, routine = request, planned risk = change, root cause = problem.', m: { state: 'approved' } },
    { scene: 'mop', short: 'MOP', title: 'The method of procedure', explain: ['A change is written down before it happens: scope, window, approval, contacts, the checks that describe "before", every step with its expected result, how to undo each step, and the checks that describe "done".', 'During the window you follow it line by line.'], key: 'The MOP is written and approved before; followed line by line during.', m: { state: 'MOP ready' } },
    { scene: 'pre', short: 'Pre-checks', title: 'Before the window: go or no-go', tag: 'action', explain: ['Parts, tools and access are ready before the window opens, and everyone joins the bridge call. Each party says go or no-go.', 'Then you capture the "before" state: port status, light levels, a photo. Without it you cannot prove a rollback worked.'], key: 'Everyone says go, and the before state is saved.', m: { state: 'go' } },
    { scene: 'steps', short: 'Execute', title: 'Step by step, out loud', tag: 'action', explain: ['Say each step on the call before you do it and when it is done, with the time. Do only what the MOP says, in its order.'], key: 'Announce, do, confirm, one step at a time.', m: { state: 'in progress' } },
    { scene: 'fail', short: 'Check fails', title: 'A check fails: stop', tag: 'event', explain: ['Step 4 expects the link up with good light. The new optic shows no light at all, and cleaning and reseating, which the MOP allows, change nothing.', 'Stop. Report it on the call and let the change lead decide. Trying things that are not in the MOP on a live network is how a small failure becomes an outage.'], key: 'Failed check: stop, report, let the lead decide.', m: { state: 'step 4 failed' } },
    { scene: 'rollback', short: 'Rollback', title: 'Roll back and prove it', tag: 'result', explain: ['The lead calls a rollback. You put the old optic back, the network team brings the port up, and you compare with the pre-check: same status, same light levels. The service is back as before, well inside the window.'], key: 'Roll back, then prove the before state is back.', m: { state: 'rolled back' } },
    { scene: 'post', short: 'Close', title: 'Close the change honestly', explain: ['The change closes as rolled back, with the timeline, the cause (a dead-on-arrival optic), the RMA, the photos and the next step. A rolled-back change with a clear record is a success; a hidden failure is not.'], key: 'Timeline, cause, evidence, next step.', m: { state: 'closed: rolled back' } },
    { scene: 'handover', short: 'Handover', title: 'The shift handover', tag: 'technique', explain: ['At the end of the shift the next team gets a written handover and a walk-through: open tickets and their state, changes done or pending, incidents, expected deliveries, booked visitors and escorts, parts waiting for RMA, and keys and badges.', 'They read it back, so nothing depends on memory.'], key: 'Written, walked through, read back: nothing left in your head.', m: { state: 'handed over' } },
  ],
}

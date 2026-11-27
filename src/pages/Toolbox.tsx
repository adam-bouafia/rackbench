import { useEffect, useMemo, useState } from 'react'
import { ALWAYS, GROUPS, ORDERS, PACK_TOOLS, TOOLS, toolById, type PackOrder } from '../data/tools'
import { lessonById } from '../lessons/index'
import { Verdict } from '../engine/ui'
import { markDone } from '../progress'
import { ToolIcon } from './ToolIcon'

// The Toolbox: a pegboard of the tools of the job, each with what, when and how,
// and Pack the bag: read a work order, pack what the job needs, and see what you forgot.

const shuffle = <T,>(a: T[]) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

function Detail({ id, go }: { id: string; go: (h: string) => void }) {
  const t = toolById(id)
  if (!t) return null
  const lesson = t.lesson ? lessonById(t.lesson) : null
  const group = GROUPS.find((g) => g.id === t.group)
  return (
    <div className="tb-detail" key={id}>
      <div className="tb-detail-head">
        <span className="tb-detail-icon">
          <ToolIcon icon={t.icon} size={64} />
        </span>
        <div>
          <span className="chip">{group?.title}</span>
          <h2>{t.name}</h2>
        </div>
      </div>
      <p>{t.what}</p>
      <h4 className="panel-sub">When you reach for it</h4>
      <p>{t.when}</p>
      <h4 className="panel-sub">How</h4>
      <pre className="tb-how">{t.how}</pre>
      {t.mistake && (
        <>
          <h4 className="panel-sub">The usual mistake</h4>
          <p className="tb-mistake">{t.mistake}</p>
        </>
      )}
      {lesson && (
        <button className="btn" onClick={() => go(`#/lesson/${lesson.id}`)}>
          Lesson: {lesson.title} →
        </button>
      )}
    </div>
  )
}

function Wall({ sel, go }: { sel: string; go: (h: string) => void }) {
  return (
    <div className="tb-wall">
      {GROUPS.map((g) => (
        <section key={g.id} className={`tb-group is-${g.id}`}>
          <h3 className="tb-group-title">
            {g.title} <span>{g.note}</span>
          </h3>
          <div className="tb-pegs">
            {TOOLS.filter((t) => t.group === g.id).map((t) => (
              <button key={t.id} className={`tb-tool${sel === t.id ? ' is-sel' : ''}`} onClick={() => go(`#/toolbox/${t.id}`)} title={t.what}>
                <span className="tb-hook" aria-hidden="true" />
                <ToolIcon icon={t.icon} />
                <span className="tb-name">{t.name}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

interface Result {
  packed: string[]
  missing: string[]
  extras: string[]
  fine: string[]
  points: number
}

function check(o: PackOrder, picked: Set<string>): Result {
  const packed: string[] = []
  const missing: string[] = []
  for (const n of o.need) {
    const alts = n.split('|')
    const hit = alts.find((a) => picked.has(a))
    if (hit) packed.push(hit)
    else missing.push(alts[0])
  }
  const allowed = new Set([...o.need.flatMap((n) => n.split('|')), ...o.ok, ...ALWAYS])
  const extras = [...picked].filter((p) => !allowed.has(p))
  const fine = [...picked].filter((p) => o.ok.includes(p))
  const points = packed.length * 20 - missing.length * 20 - extras.length * 5 + (!missing.length && !extras.length ? 20 : 0)
  return { packed, missing, extras, fine, points }
}

function PackTheBag() {
  const [round, setRound] = useState(0)
  const orders = useMemo(() => shuffle(ORDERS).slice(0, 6), [round])
  const [n, setN] = useState(0)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<Result | null>(null)
  const [score, setScore] = useState(0)
  const [perfect, setPerfect] = useState(0)
  const done = n >= orders.length
  const o = orders[Math.min(n, orders.length - 1)]

  useEffect(() => {
    if (done) markDone('pack-bag')
  }, [done])

  const toggle = (id: string) => {
    if (result) return
    setPicked((p) => {
      const q = new Set(p)
      if (q.has(id)) q.delete(id)
      else q.add(id)
      return q
    })
  }
  const go = () => {
    const r = check(o, picked)
    setResult(r)
    setScore((s) => s + r.points)
    if (!r.missing.length && !r.extras.length) setPerfect((p) => p + 1)
  }
  const next = () => {
    setN((v) => v + 1)
    setPicked(new Set())
    setResult(null)
  }
  const name = (id: string) => toolById(id)?.name ?? id

  if (done)
    return (
      <div className="tb-pack-done">
        <p className="eyebrow">Round complete</p>
        <h2>
          {score} points · {perfect} of {orders.length} bags exactly right
        </h2>
        <p className="muted">A forgotten tool is a second walk to the store room, or a job done without the right check. An extra one is only weight.</p>
        <div className="toolbar">
          <button
            className="btn btn-primary"
            onClick={() => {
              setRound((r) => r + 1)
              setN(0)
              setScore(0)
              setPerfect(0)
              setPicked(new Set())
              setResult(null)
            }}
          >
            New round →
          </button>
        </div>
      </div>
    )

  return (
    <div className="tb-pack">
      <div className="tb-order">
        <span className="chip">
          Work order {n + 1} of {orders.length}
        </span>
        <h2>{o.title}</h2>
        <p>{o.detail}</p>
      </div>
      <div className="tb-pegs is-pack">
        {PACK_TOOLS.map((id) => {
          const t = toolById(id)!
          const st = !result ? (picked.has(id) ? ' is-picked' : '') : result.packed.includes(id) ? ' is-right' : result.missing.includes(id) ? ' is-missing' : result.extras.includes(id) ? ' is-extra' : picked.has(id) ? ' is-fine' : ' is-dim'
          return (
            <button key={id} className={`tb-tool${st}`} onClick={() => toggle(id)} aria-pressed={picked.has(id)}>
              <span className="tb-hook" aria-hidden="true" />
              <ToolIcon icon={t.icon} size={36} />
              <span className="tb-name">{t.name}</span>
            </button>
          )
        })}
      </div>
      {!result ? (
        <div className="toolbar">
          <button className="btn btn-primary" onClick={go}>
            Go to the rack with {picked.size} tool{picked.size === 1 ? '' : 's'} →
          </button>
          <span className="muted small">Always with you: {ALWAYS.map(name).join(', ')}.</span>
        </div>
      ) : (
        <div className="quiz-why">
          <Verdict ok={!result.missing.length ? (result.extras.length ? 'warn' : true) : false}>
            {!result.missing.length ? (result.extras.length ? 'Everything needed, plus extra weight' : 'Exactly right') : 'Something is missing'}
          </Verdict>{' '}
          {o.why}
          <ul className="tb-result">
            {result.missing.map((id) => (
              <li key={id} className="is-bad">
                forgot: {o.need.find((x) => x.split('|').includes(id))!.split('|').map(name).join(' or ')}
              </li>
            ))}
            {result.extras.map((id) => (
              <li key={id} className="is-warn">
                not needed: {name(id)}
              </li>
            ))}
            {result.fine.map((id) => (
              <li key={id}>fine to bring: {name(id)}</li>
            ))}
          </ul>
          <div>
            <button className="btn btn-primary" onClick={next}>
              {n + 1 < orders.length ? 'Next work order' : 'See the round'} →
            </button>
          </div>
        </div>
      )}
      <div className="tb-score">
        <span>Score</span>
        <strong>{score}</strong>
      </div>
    </div>
  )
}

export function Toolbox({ mode, tool, go }: { mode: 'wall' | 'pack'; tool?: string; go: (h: string) => void }) {
  const sel = tool && toolById(tool) ? tool : 'esd'
  return (
    <div className="tb page-fit">
      <section className="panel tb-main">
        <div className="tb-head">
          <div>
            <h2 className="tb-title">Toolbox</h2>
            <p className="muted small">{mode === 'wall' ? `${TOOLS.length} tools on the wall: hand tools, testers, consoles and the software you run. Pick one.` : 'Read the work order, pack what the job needs, then go to the rack.'}</p>
          </div>
          <div className="seg">
            <button className={mode === 'wall' ? 'on' : ''} onClick={() => go('#/toolbox')}>
              The wall
            </button>
            <button className={mode === 'pack' ? 'on' : ''} onClick={() => go('#/toolbox/pack')}>
              Pack the bag
            </button>
          </div>
        </div>
        {mode === 'wall' ? <Wall sel={sel} go={go} /> : <PackTheBag />}
      </section>
      <aside className="panel tb-side">
        {mode === 'wall' ? (
          <Detail id={sel} go={go} />
        ) : (
          <>
            <h3 className="panel-title">Pack the bag</h3>
            <p className="muted small">Six work orders per round. 20 points for each tool the job needs, minus 20 for each one you forgot, minus 5 for dead weight, and 20 extra for a bag that is exactly right.</p>
            <h4 className="panel-sub">Rules of thumb</h4>
            <ul className="pi-rules">
              <li>A lid comes off: ESD strap and anti-static bags.</li>
              <li>Any fibre connector: scope and cleaner.</li>
              <li>Anything you run gets labels and velcro.</li>
              <li>Above the one-person limit: the lift.</li>
              <li>No network: console cable or crash cart.</li>
              <li>Unknown cable: the toner, then a label.</li>
            </ul>
            <button className="btn" onClick={() => go('#/toolbox')}>
              Look a tool up on the wall
            </button>
          </>
        )}
      </aside>
    </div>
  )
}

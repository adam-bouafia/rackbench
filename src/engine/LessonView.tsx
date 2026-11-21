import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Flow, LessonMeta } from './types'
import { PROTO_KEY, protoColor } from './types'
import { IsoStage } from './IsoStage'
import { SequenceView } from './SequenceView'
import { stateUpTo } from './MapView'
import { CodeBlock } from './ui'
import { CHAPTERS, LESSONS } from '../lessons/index'
import { markDone, useDone, useStored } from '../progress'
import { setAssistantContext } from '../assistant/Assistant'
import { useT } from '../i18n'

/* ---------- shared pieces ---------- */

export function LessonHead({ meta, steps }: { meta: LessonMeta; steps?: number }) {
  const t = useT()
  const [tryOpen, setTryOpen] = useState(false)
  const done = useDone().includes(meta.id)
  const ci = CHAPTERS.findIndex((c) => c.id === meta.chapter)
  const inChapter = LESSONS.filter((l) => l.chapter === meta.chapter)
  const n = inChapter.findIndex((l) => l.id === meta.id) + 1
  return (
    <header className="lh">
      <div className="lh-crumb">
        <span>
          {String(ci + 1).padStart(2, '0')}. {CHAPTERS[ci]?.title}
        </span>
        <span className="sep">/</span>
        <span>
          {t('lesson')} {n} {t('of')} {inChapter.length}
        </span>
        {done && <span className="chip chip-done">{t('done')}</span>}
      </div>
      <div className="lh-row">
        <div>
          <h1>{meta.title}</h1>
          <p className="lh-blurb">{meta.blurb}</p>
        </div>
        <div className="lh-chips">
          <span className="chip chip-time">{meta.minutes} {t('min')}</span>
          <span className="chip chip-level">{t(meta.level)}</span>
          {steps !== undefined && (
            <span className="chip chip-steps">
              {steps} {t('steps')}
            </span>
          )}
          {meta.lab && (
            <button className={`chip chip-lab${tryOpen ? ' is-on' : ''}`} onClick={() => setTryOpen(!tryOpen)}>
              {meta.lab} ▾
            </button>
          )}
        </div>
      </div>
      {tryOpen && <TryItPanel meta={meta} onClose={() => setTryOpen(false)} />}
    </header>
  )
}

function tryItems(meta: LessonMeta, flow?: Flow) {
  return flow?.tryIt ?? meta.tryIt ?? []
}

let flowForTry: Flow | undefined
function TryItPanel({ meta, onClose }: { meta: LessonMeta; onClose: () => void }) {
  const t = useT()
  const items = tryItems(meta, flowForTry)
  return (
    <div className="tryit-pop">
      <div className="tryit-pop-head">
        <strong>
          {t('tryIt')} · {meta.lab}
        </strong>
        <button className="btn-text" onClick={onClose}>
          ×
        </button>
      </div>
      <CodeBlock code={items.map((i) => (i.note ? `${i.cmd}    # ${i.note}` : i.cmd)).join('\n')} label="Commands" />
      <a href="#/labs" className="muted small">
        Set up the lab first: Run it yourself →
      </a>
    </div>
  )
}

export function LearnCard({ items, ticked }: { items: string[]; ticked: number }) {
  const t = useT()
  return (
    <section className="panel learn">
      <h3 className="panel-title">{t('youllLearn')}</h3>
      <ul>
        {items.map((it, i) => (
          <li key={it} className={i < ticked ? 'is-on' : ''}>
            <span className="box" aria-hidden="true" />
            {it}
          </li>
        ))}
      </ul>
    </section>
  )
}

const typing = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

// Narration MP3s are optional: scripts/narrate.ts writes them and public/audio/manifest.json.
let manifest: Promise<Record<string, number> | null> | null = null
function loadManifest() {
  manifest ??= fetch('audio/manifest.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { lessons?: Record<string, number> } | null) => j?.lessons ?? null)
    .catch(() => null)
  return manifest
}
function useNarration(id: string) {
  const [has, setHas] = useState(false)
  useEffect(() => {
    let live = true
    loadManifest().then((m) => live && setHas(!!m && (m[id] ?? 0) > 0))
    return () => {
      live = false
    }
  }, [id])
  return has
}

const Glyph = ({ d }: { d: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

/** The messages as a capture-style list: number, time, source, destination, protocol, info. */
function PacketTable({ flow, cur, onPick }: { flow: Flow; cur: number; onPick: (i: number) => void }) {
  const t = useT()
  const ip = (id: string) => {
    const a = flow.actors.find((x) => x.id === id)
    const m = a?.sub?.match(/\d+\.\d+\.\d+\.\d+/)
    return m ? m[0] : (a?.label ?? id)
  }
  let time = 0
  const rows = flow.steps.map((s, i) => {
    time += i === 0 ? 0 : s.proto === 'Board' || s.proto === 'Event' ? 0.412 : s.proto === 'Tool' || s.proto === 'Local' ? 0.6 : 0.008 + (i % 3) * 0.003
    return { s, i, time }
  })
  return (
    <div className="pkt-wrap">
      <table className="pkt">
        <thead>
          <tr>
            <th>No.</th>
            <th>{t('time')}</th>
            <th>{t('source')}</th>
            <th>{t('destination')}</th>
            <th>{t('protocol')}</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ s, i, time }) => (
            <tr key={i} className={i === cur ? 'is-current' : i > cur ? 'is-future' : ''} onClick={() => onPick(i)}>
              <td>
                <span className="pkt-n" style={{ background: protoColor(s.proto) }}>
                  {i + 1}
                </span>
              </td>
              <td>{time.toFixed(3)}s</td>
              <td>{ip(s.from)}</td>
              <td>{s.from === s.to ? '-' : ip(s.to)}</td>
              <td>{s.proto}</td>
              <td className="pkt-info">{s.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pkt-note">{t('pktNote')}</p>
    </div>
  )
}

/* ---------- step-through lesson ---------- */

export function FlowLessonView({ meta, flow }: { meta: LessonMeta; flow: Flow }) {
  const t = useT()
  flowForTry = flow
  const n = flow.steps.length
  const [cur, setCur] = useState(-1)
  const [paused, setPaused] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [view, setView] = useStored<'map' | 'seq' | 'pkt'>('rackbench:view', 'map')
  const [openDetails, setOpenDetails] = useState(false)
  const hasAudio = useNarration(meta.id)
  const [narrate, setNarrate] = useStored<'on' | 'off'>('rackbench:narrate', 'off')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const stepperRef = useRef<HTMLOListElement>(null)

  const go = useCallback(
    (i: number) => {
      setCur(Math.max(-1, Math.min(n - 1, i)))
      setPaused(false)
    },
    [n],
  )
  const replay = useCallback(() => {
    setReplayKey((k) => k + 1)
    setPaused(false)
    if (cur < 0) go(0)
  }, [cur, go])
  const playPause = useCallback(() => {
    if (cur < 0) go(0)
    else setPaused((p) => !p)
  }, [cur, go])

  // narration of the current step, when audio files exist and the viewer turned it on
  useEffect(() => {
    const a = audioRef.current
    if (narrate !== 'on' || !hasAudio || cur < 0) {
      a?.pause()
      return
    }
    const audio = a ?? (audioRef.current = new Audio())
    audio.src = `audio/${meta.id}/${String(cur + 1).padStart(2, '0')}.mp3`
    audio.play().catch(() => undefined)
  }, [cur, narrate, hasAudio, meta.id, replayKey])
  useEffect(() => {
    if (paused) audioRef.current?.pause()
  }, [paused])
  useEffect(() => () => audioRef.current?.pause(), [])

  useEffect(() => {
    if (cur === n - 1) markDone(meta.id)
    panelRef.current?.scrollTo({ top: 0 })
    setOpenDetails(false)
    const ol = stepperRef.current
    const li = ol?.children[Math.max(0, cur)] as HTMLElement | undefined
    if (ol && li) ol.scrollLeft = li.offsetLeft - ol.offsetLeft - ol.clientWidth / 2 + li.offsetWidth / 2
  }, [cur, n, meta.id])

  useEffect(() => {
    go(-1)
  }, [meta.id, go])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ' ') {
        e.preventDefault()
        playPause()
      } else if (e.key === 'ArrowRight') go(cur + 1)
      else if (e.key === 'ArrowLeft') go(cur - 1)
      else if (e.key === 'r') replay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playPause, replay, go, cur])

  useEffect(() => {
    const s = cur >= 0 ? flow.steps[cur] : null
    setAssistantContext({
      page: meta.title,
      text: s
        ? `Step ${cur + 1} of ${n}: ${s.summary} (${s.proto}, ${s.from} to ${s.to})\n${s.explain.join(' ')}\n${(s.fields ?? []).map((f) => `${f.name}: ${f.value}${f.note ? ` (${f.note})` : ''}`).join('\n')}`
        : flow.intro.join(' '),
    })
  }, [cur, flow, meta.title, n])

  // metric values after the current step, and what changed in it
  const metricVals = (upTo: number) => {
    const out: Record<string, string> = {}
    for (const m of flow.metrics ?? []) out[m.id] = m.start ?? '-'
    for (let i = 0; i <= upTo && i < n; i++) Object.assign(out, flow.steps[i].m ?? {})
    return out
  }
  const vals = metricVals(cur)
  const prevVals = metricVals(cur - 1)
  const step = cur >= 0 ? flow.steps[cur] : null
  const name = (id: string) => flow.actors.find((a) => a.id === id)?.label ?? id

  const changes: { sign: '+' | '~'; text: string }[] = []
  if (step) {
    for (const a of flow.actors) if ((flow.appear?.[a.id] ?? 1) === cur + 1 && cur > 0) changes.push({ sign: '+', text: `${a.label} joins` })
    const before = stateUpTo(flow, cur - 1)
    const changedMetrics = (flow.metrics ?? []).filter((m) => vals[m.id] !== prevVals[m.id])
    for (const [id, b] of Object.entries(step.state ?? {})) {
      const old = before[id]
      // skip when a metric about the same device already tells it
      if (changedMetrics.some((m) => m.label.startsWith(name(id)))) continue
      if (!old || old.text !== b.text) changes.push({ sign: old ? '~' : '+', text: `${name(id)}: ${b.text}` })
    }
    for (const m of changedMetrics) changes.push({ sign: '~', text: `${m.label}: ${prevVals[m.id]} → ${vals[m.id]}` })
  }
  const learnTicked = cur < 0 ? 0 : Math.min(meta.learn.length, Math.floor(((cur + 1) / n) * meta.learn.length + 0.0001))

  return (
    <div className="lv">
      <section className="lv-center">
        <LessonHead meta={meta} steps={n} />
        <div className="stage-card">
          <div className="stage-top">
            <div className="metrics">
              {(flow.metrics ?? []).map((m) => (
                <div key={m.id} className={`metric${step && vals[m.id] !== prevVals[m.id] ? ' is-changed' : ''}`}>
                  <span>{m.label}</span>
                  <strong>{vals[m.id]}</strong>
                </div>
              ))}
            </div>
            <div className="stage-ctl">
              <div className="seg seg-sm">
                <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>
                  {t('diagram')}
                </button>
                <button className={view === 'seq' ? 'on' : ''} onClick={() => setView('seq')}>
                  {t('sequence')}
                </button>
                <button className={view === 'pkt' ? 'on' : ''} onClick={() => setView('pkt')}>
                  {t('packets')}
                </button>
              </div>
              {hasAudio && (
                <button className={`btn btn-sm${narrate === 'on' ? ' btn-on' : ''}`} onClick={() => setNarrate(narrate === 'on' ? 'off' : 'on')} title="Narration">
                  ♪
                </button>
              )}
              <button className="btn btn-sm" onClick={replay} title="Replay this step (R)">
                <Glyph d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" /> {t('replay')}
              </button>
              <button className={`btn btn-sm${paused || cur < 0 ? ' btn-go' : ''}`} onClick={playPause} title="Pause or play (space)">
                {paused || cur < 0 ? <Glyph d="M7 5l12 7-12 7z" /> : <Glyph d="M8 5v14M16 5v14" />} {paused || cur < 0 ? t('play') : t('pause')}
              </button>
            </div>
          </div>
          <div className="stage-body">
            {view === 'map' ? (
              <IsoStage flow={flow} cur={cur} paused={paused} replayKey={replayKey} />
            ) : view === 'seq' ? (
              <SequenceView flow={flow} cur={cur} onPick={go} />
            ) : (
              <PacketTable flow={flow} cur={cur} onPick={go} />
            )}
          </div>
        </div>
        <div className="stepper-card">
          <div className="stepper-head">
            <span>{t('inThisLesson')}</span>
            <span>{cur < 0 ? `${n} ${t('steps')}` : `${t('step')} ${cur + 1} ${t('of')} ${n}`}</span>
          </div>
          <ol className="stepper" ref={stepperRef}>
            {flow.steps.map((s, i) => (
              <li key={i} className={i === cur ? 'is-current' : i < cur ? 'is-past' : ''}>
                <button onClick={() => go(i)} title={s.summary}>
                  <span className="dot">{i + 1}</span>
                  <span className="lbl">{s.short}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className="lv-right">
        <section className="panel step-panel">
          <div className="step-scroll" ref={panelRef}>
            <div className="step-head">
              <span>{step ? `${t('step')} ${cur + 1} / ${n}` : meta.title}</span>
              <span className={`tag tag-${step?.tag ?? 'goal'}`}>{t(`tag_${step?.tag ?? 'goal'}` as 'tag_goal')}</span>
            </div>
            {!step ? (
              <>
                <h2 className="step-title">{t('start')}</h2>
                {flow.intro.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <dl className="legend-list">
                  {flow.actors.map((a) => (
                    <div key={a.id}>
                      <dt>{a.label}</dt>
                      <dd>{a.sub}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <>
                <div className="step-route">
                  <span className="chip proto" data-proto={PROTO_KEY[step.proto]}>
                    {step.proto}
                  </span>
                  {name(step.from)}
                  {step.from !== step.to && <> → {name(step.to)}</>}
                </div>
                <h2 className="step-title">{step.summary}</h2>
                {step.explain.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {step.key && (
                  <div className="key-idea">
                    <span className="key-icon" aria-hidden="true">
                      ✦
                    </span>
                    <div>
                      <strong>{t('keyIdea')}</strong>
                      <p>{step.key}</p>
                    </div>
                  </div>
                )}
                {changes.length > 0 && (
                  <div className="changed">
                    <h4>{t('whatChanged')}</h4>
                    <ul>
                      {changes.map((c) => (
                        <li key={c.text}>
                          <span className={`sign sign-${c.sign === '+' ? 'add' : 'mod'}`}>{c.sign}</span>
                          {c.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(step.fields || step.raw) && (
                  <div className="details">
                    <button className="details-toggle" onClick={() => setOpenDetails(!openDetails)}>
                      {openDetails ? '▾' : '▸'} {t('details')}
                    </button>
                    {openDetails && (
                      <>
                        {step.fields && (
                          <table className="fields">
                            <tbody>
                              {step.fields.map((f) => (
                                <tr key={f.name}>
                                  <th>{f.name}</th>
                                  <td>
                                    <code>{f.value}</code>
                                    {f.note && <span className="field-note">{f.note}</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {step.raw && <CodeBlock code={step.raw} label={step.rawLabel} />}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="step-nav">
            <button className="btn" onClick={() => go(cur - 1)} disabled={cur < 0}>
              ← {t('back')}
            </button>
            <button className="btn btn-primary" onClick={() => go(cur + 1)} disabled={cur >= n - 1}>
              {cur >= n - 1 ? t('finish') : cur < 0 ? `${t('start')}: ${flow.steps[0].short}` : `${t('next')}: ${flow.steps[cur + 1].short}`} →
            </button>
          </div>
        </section>
        <LearnCard items={meta.learn} ticked={learnTicked} />
      </aside>
    </div>
  )
}

/* ---------- interactive lesson ---------- */

export function WidgetLessonView({ meta, children }: { meta: LessonMeta; children: ReactNode }) {
  const t = useT()
  flowForTry = undefined
  const done = useDone().includes(meta.id)
  return (
    <div className="lv">
      <section className="lv-center">
        <LessonHead meta={meta} />
        <div className="widget-body">{children}</div>
      </section>
      <aside className="lv-right">
        <section className="panel">
          <div className="step-head">
            <span>{t('about')}</span>
            <span className="tag tag-technique">Interactive</span>
          </div>
          <p>{meta.blurb}</p>
          {meta.tryIt && (
            <>
              <h4 className="panel-sub">{t('tryIt')}</h4>
              <ul className="tryit">
                {meta.tryIt.map((it) => (
                  <li key={it.cmd}>
                    <code>{it.cmd}</code>
                    {it.note && <span>{it.note}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <LearnCard items={meta.learn} ticked={done ? meta.learn.length : 0} />
      </aside>
    </div>
  )
}

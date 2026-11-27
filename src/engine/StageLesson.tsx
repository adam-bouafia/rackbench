import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import type { LessonMeta, Metric, StepTag } from './types'
import { LessonHead, LearnCard } from './LessonView'
import { markDone } from '../progress'
import { setAssistantContext } from '../assistant/Assistant'
import { useT } from '../i18n'

// A step-through lesson with its own animated stage (RAID arrays, connectors, power charts, pipelines),
// laid out like the flow lessons: stage and stepper in the middle, the step text on the right.

export interface StageStep {
  short: string
  title: string
  tag?: StepTag
  explain: string[]
  key?: string
  /** Metric values that change at this step. */
  m?: Record<string, string>
  /** Extra lines for "What changed". */
  note?: string[]
}

export interface StageProps<S extends StageStep = StageStep> {
  steps: S[]
  cur: number
  paused: boolean
  replayKey: number
}

export interface StageLesson<S extends StageStep = StageStep> {
  intro: string[]
  legend?: [string, string][]
  metrics?: Metric[]
  steps: S[]
  Stage: ComponentType<StageProps<S>>
}

const typing = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

const Glyph = ({ d }: { d: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StageLessonView({ meta, def }: { meta: LessonMeta; def: StageLesson<any> }) {
  const t = useT()
  const steps = def.steps as StageStep[]
  const n = steps.length
  const [cur, setCur] = useState(-1)
  const [paused, setPaused] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
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

  useEffect(() => {
    if (cur === n - 1) markDone(meta.id)
    panelRef.current?.scrollTo({ top: 0 })
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

  const step = cur >= 0 ? steps[cur] : null
  useEffect(() => {
    setAssistantContext({
      page: meta.title,
      text: step ? `Step ${cur + 1} of ${n}: ${step.title}\n${step.explain.join(' ')}` : def.intro.join(' '),
    })
  }, [cur, step, def.intro, meta.title, n])

  const metricVals = (upTo: number) => {
    const out: Record<string, string> = {}
    for (const m of def.metrics ?? []) out[m.id] = m.start ?? '-'
    for (let i = 0; i <= upTo && i < n; i++) Object.assign(out, steps[i].m ?? {})
    return out
  }
  const vals = metricVals(cur)
  const prevVals = metricVals(cur - 1)
  const changes: { sign: '+' | '~'; text: string }[] = []
  if (step) {
    for (const m of def.metrics ?? []) if (vals[m.id] !== prevVals[m.id]) changes.push({ sign: '~', text: `${m.label}: ${prevVals[m.id]} → ${vals[m.id]}` })
    for (const line of step.note ?? []) changes.push({ sign: '+', text: line })
  }
  const learnTicked = cur < 0 ? 0 : Math.min(meta.learn.length, Math.floor(((cur + 1) / n) * meta.learn.length + 0.0001))
  const Stage = def.Stage

  return (
    <div className="lv">
      <section className="lv-center">
        <LessonHead meta={meta} steps={n} />
        <div className="stage-card">
          <div className="stage-top">
            <div className="metrics">
              {(def.metrics ?? []).map((m) => (
                <div key={m.id} className={`metric${step && vals[m.id] !== prevVals[m.id] ? ' is-changed' : ''}`}>
                  <span>{m.label}</span>
                  <strong>{vals[m.id]}</strong>
                </div>
              ))}
            </div>
            <div className="stage-ctl">
              <button className="btn btn-sm" onClick={replay} title="Replay this step (R)">
                <Glyph d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" /> {t('replay')}
              </button>
              <button className={`btn btn-sm${paused || cur < 0 ? ' btn-go' : ''}`} onClick={playPause} title="Pause or play (space)">
                {paused || cur < 0 ? <Glyph d="M7 5l12 7-12 7z" /> : <Glyph d="M8 5v14M16 5v14" />} {paused || cur < 0 ? t('play') : t('pause')}
              </button>
            </div>
          </div>
          <div className={`stage-body sl-body${paused ? ' is-paused' : ''}`}>
            <Stage steps={def.steps} cur={cur} paused={paused} replayKey={replayKey} />
          </div>
        </div>
        <div className="stepper-card">
          <div className="stepper-head">
            <span>{t('inThisLesson')}</span>
            <span>{cur < 0 ? `${n} ${t('steps')}` : `${t('step')} ${cur + 1} ${t('of')} ${n}`}</span>
          </div>
          <ol className="stepper" ref={stepperRef}>
            {steps.map((s, i) => (
              <li key={i} className={i === cur ? 'is-current' : i < cur ? 'is-past' : ''}>
                <button onClick={() => go(i)} title={s.title}>
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
                {def.intro.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {def.legend && (
                  <dl className="legend-list">
                    {def.legend.map(([term, text]) => (
                      <div key={term}>
                        <dt>{term}</dt>
                        <dd>{text}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </>
            ) : (
              <>
                <h2 className="step-title">{step.title}</h2>
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
              </>
            )}
          </div>
          <div className="step-nav">
            <button className="btn" onClick={() => go(cur - 1)} disabled={cur < 0}>
              ← {t('back')}
            </button>
            <button className="btn btn-primary" onClick={() => go(cur + 1)} disabled={cur >= n - 1}>
              {cur >= n - 1 ? t('finish') : cur < 0 ? `${t('start')}: ${steps[0].short}` : `${t('next')}: ${steps[cur + 1].short}`} →
            </button>
          </div>
        </section>
        <LearnCard items={meta.learn} ticked={learnTicked} />
      </aside>
    </div>
  )
}

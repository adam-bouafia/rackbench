import { useMemo, useState } from 'react'
import { Verdict } from '../engine/ui'
import { markDone } from '../progress'
import { QUESTIONS, TOPICS, type Topic } from '../data/quiz'

const shuffle = <T,>(a: T[]) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

export function Quiz() {
  const [topic, setTopic] = useState<Topic | 'all' | null>(null)
  const [mixed, setMixed] = useState(true)
  const [seed, setSeed] = useState(0)
  const [i, setI] = useState(0)
  const [pick, setPick] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState<string[]>([])
  const [finished, setFinished] = useState(false)

  const set = useMemo(() => {
    if (!topic) return []
    const base = topic === 'all' ? QUESTIONS : QUESTIONS.filter((q) => q.topic === topic)
    return mixed ? shuffle(base) : base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, mixed, seed])
  const q = set[i]

  const start = (t: Topic | 'all') => {
    setTopic(t)
    setSeed((s) => s + 1)
    setI(0)
    setPick(null)
    setScore(0)
    setMisses([])
    setFinished(false)
  }
  const choose = (k: number) => {
    if (pick !== null) return
    setPick(k)
    if (k === q.answer) setScore((s) => s + 1)
    else setMisses((m) => [...m, q.lesson])
  }
  const next = () => {
    if (i + 1 >= set.length) {
      setFinished(true)
      markDone('quiz')
      return
    }
    setI(i + 1)
    setPick(null)
  }

  if (!topic)
    return (
      <div className="quiz">
        <h2>Quiz</h2>
        <p className="muted">
          {QUESTIONS.length} questions from rack work and from questions reported for rack engineer interviews. Pick a topic, or take them all.
        </p>
        <div className="quiz-topics">
          <button className="quiz-topic is-all" onClick={() => start('all')}>
            <strong>Everything</strong>
            <span>{QUESTIONS.length} questions</span>
          </button>
          {TOPICS.map((t) => (
            <button key={t.id} className="quiz-topic" onClick={() => start(t.id)}>
              <strong>{t.title}</strong>
              <span>{QUESTIONS.filter((x) => x.topic === t.id).length} questions</span>
            </button>
          ))}
        </div>
        <label className="quiz-mix">
          <input type="checkbox" checked={mixed} onChange={(e) => setMixed(e.target.checked)} /> Shuffle the questions
        </label>
      </div>
    )

  const title = topic === 'all' ? 'Everything' : TOPICS.find((t) => t.id === topic)?.title

  if (finished) {
    const lessons = [...new Set(misses)]
    return (
      <div className="quiz">
        <h2>
          {score} of {set.length} right
        </h2>
        <p className="muted">
          {score >= set.length * 0.8 ? 'Ready for the rack.' : score >= set.length * 0.5 ? 'Solid. Go back to the lessons behind the ones you missed.' : 'Take the lessons again, then come back.'}
        </p>
        {lessons.length > 0 && (
          <p className="quiz-review">
            Review:{' '}
            {lessons.map((l, k) => (
              <span key={l}>
                {k > 0 && ' · '}
                <a href={`#/lesson/${l}`}>{l}</a>
              </span>
            ))}
          </p>
        )}
        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => start(topic)}>
            Again
          </button>
          <button className="btn" onClick={() => setTopic(null)}>
            Other topic
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span>
          <button className="btn-text" onClick={() => setTopic(null)}>
            ← topics
          </button>{' '}
          {title} · question {i + 1} of {set.length}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="quiz-bar">
        <div style={{ width: `${(i / set.length) * 100}%` }} />
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
              {i + 1 >= set.length ? 'See the score' : 'Next question'} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

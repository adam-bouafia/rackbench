import { useCallback, useEffect, useMemo, useState } from 'react'
import { FLOOR_CARDS, INTERVIEW_CARDS, RAID_CARDS, type Card } from '../data/cards'
import { TERMS } from '../data/terms'
import { SHEETS } from './Cheatsheets'
import { markDone } from '../progress'

// Flashcards: flip a card, say whether you knew it. Known cards are remembered in this browser only.

interface Deck {
  id: string
  title: string
  group: string
  note: string
  cards: Card[]
}

const DECKS: Deck[] = [
  { id: 'interview', title: 'Interview questions', group: 'Topics', note: 'Questions reported for rack engineer interviews, with short answers', cards: INTERVIEW_CARDS },
  { id: 'raid', title: 'RAID and storage', group: 'Topics', note: 'Levels, parity, rebuilds, SATA and SAS', cards: RAID_CARDS },
  { id: 'floor', title: 'Data center floor', group: 'Topics', note: 'Fibre, copper, light levels, part swaps, tickets', cards: FLOOR_CARDS },
  {
    id: 'commands',
    title: 'Which command?',
    group: 'Topics',
    note: 'The task on the front, the command on the back',
    cards: SHEETS.flatMap((s) => s.entries.map((e) => ({ front: e.what, back: e.cmd }))),
  },
  ...TERMS.map((p) => ({
    id: `terms-${p.part}`,
    title: `${p.part}. ${p.title}`,
    group: 'Terms, part by part',
    note: `${p.terms.length} terms`,
    cards: p.terms.map((t) => ({ front: t.t, back: t.d })),
  })),
]

const keyOf = (deck: string) => `rackbench:cards:${deck}`
function readKnown(deck: string): number[] {
  try {
    return JSON.parse(localStorage.getItem(keyOf(deck)) ?? '[]') as number[]
  } catch {
    return []
  }
}
function writeKnown(deck: string, known: number[]) {
  try {
    localStorage.setItem(keyOf(deck), JSON.stringify(known))
  } catch {
    /* memory only */
  }
}
const shuffle = <T,>(a: T[]) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

export function Flashcards() {
  const [deckId, setDeckId] = useState<string | null>(null)
  const [known, setKnown] = useState<number[]>([])
  const [queue, setQueue] = useState<number[]>([])
  const [flipped, setFlipped] = useState(false)
  const [again, setAgain] = useState(0)
  const [mix, setMix] = useState(true)
  const [tick, setTick] = useState(0)
  const deck = DECKS.find((d) => d.id === deckId) ?? null

  const start = useCallback(
    (id: string, onlyNew: boolean) => {
      const d = DECKS.find((x) => x.id === id)!
      const k = readKnown(id)
      const all = d.cards.map((_, i) => i).filter((i) => !onlyNew || !k.includes(i))
      setDeckId(id)
      setKnown(k)
      setQueue(mix ? shuffle(all) : all)
      setFlipped(false)
      setAgain(0)
    },
    [mix],
  )

  const grade = useCallback(
    (ok: boolean) => {
      if (!deck || !queue.length) return
      const [c, ...rest] = queue
      if (ok) {
        const k = known.includes(c) ? known : [...known, c]
        setKnown(k)
        writeKnown(deck.id, k)
        setQueue(rest)
        if (!rest.length) markDone('flashcards')
      } else {
        const at = Math.min(rest.length, 3)
        setQueue([...rest.slice(0, at), c, ...rest.slice(at)])
        setAgain((a) => a + 1)
      }
      setFlipped(false)
    },
    [deck, queue, known],
  )

  useEffect(() => {
    if (!deck) return
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight' && flipped) grade(true)
      else if (e.key === 'ArrowLeft' && flipped) grade(false)
      else if (e.key === 'Escape') setDeckId(null)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [deck, flipped, grade])

  const groups = useMemo(() => [...new Set(DECKS.map((d) => d.group))], [])

  if (!deck)
    return (
      <div className="fc page-fit" key={tick}>
        <div className="fc-pick">
          <div className="fc-pick-head">
            <div>
              <h2>Flashcards</h2>
              <p className="muted">Read the front, say the answer out loud, flip, and be honest: Got it or Again. Known cards are remembered in this browser.</p>
            </div>
            <label className="quiz-mix">
              <input type="checkbox" checked={mix} onChange={(e) => setMix(e.target.checked)} /> Shuffle
            </label>
          </div>
          {groups.map((g) => (
            <section key={g} className="fc-group">
              <h3 className="panel-sub">{g}</h3>
              <div className="fc-decks">
                {DECKS.filter((d) => d.group === g).map((d) => {
                  const k = readKnown(d.id).length
                  return (
                    <div key={d.id} className="fc-deck">
                      <button className="fc-deck-main" onClick={() => start(d.id, false)}>
                        <strong>{d.title}</strong>
                        <span className="muted">{d.note}</span>
                        <span className="fc-deck-bar">
                          <i style={{ width: `${(k / d.cards.length) * 100}%` }} />
                        </span>
                        <span className="fc-deck-n">
                          {k} / {d.cards.length} known
                        </span>
                      </button>
                      {k > 0 && k < d.cards.length && (
                        <button className="btn-text fc-deck-new" onClick={() => start(d.id, true)}>
                          only the {d.cards.length - k} not known
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    )

  const c = queue[0]
  const card = c !== undefined ? deck.cards[c] : null
  const total = deck.cards.length

  return (
    <div className="fc page-fit">
      <div className="fc-session">
        <div className="fc-top">
          <button className="btn-text" onClick={() => setDeckId(null)}>
            ← decks
          </button>
          <strong>{deck.title}</strong>
          <span className="muted">
            {queue.length} left · {known.length}/{total} known
          </span>
        </div>
        <div className="fc-bar">
          <div style={{ width: `${(known.length / total) * 100}%` }} />
        </div>
        {card ? (
          <>
            <button className={`fc-card${flipped ? ' is-flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Answer, click to see the question' : 'Question, click to see the answer'}>
              <span className="fc-inner">
                <span className="fc-face fc-front">
                  <span className="fc-tag">{deck.id === 'commands' ? 'Task' : 'Front'}</span>
                  <span className={`fc-text${card.front.length > 90 ? ' is-long' : ''}`}>{card.front}</span>
                  <span className="fc-hint">click or Space to flip</span>
                </span>
                <span className="fc-face fc-back">
                  <span className="fc-tag">{deck.id === 'commands' ? 'Command' : 'Answer'}</span>
                  <span className={`fc-text${card.back.length > 160 ? ' is-long' : ''}${deck.id === 'commands' ? ' is-code' : ''}`}>{card.back}</span>
                </span>
              </span>
            </button>
            <div className="fc-actions">
              <button className="btn" onClick={() => grade(false)} disabled={!flipped}>
                ← Again
              </button>
              <button className="btn btn-primary" onClick={() => grade(true)} disabled={!flipped}>
                Got it →
              </button>
            </div>
          </>
        ) : (
          <div className="fc-done">
            <h2>Deck done</h2>
            <p>
              {known.length} of {total} known{again ? `, ${again} times "Again" on the way` : ''}.
            </p>
            <div className="toolbar">
              <button className="btn btn-primary" onClick={() => start(deck.id, false)}>
                Study the whole deck again
              </button>
              <button
                className="btn"
                onClick={() => {
                  writeKnown(deck.id, [])
                  setTick((t) => t + 1)
                  setDeckId(null)
                }}
              >
                Reset this deck
              </button>
              <button className="btn" onClick={() => setDeckId(null)}>
                Other decks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

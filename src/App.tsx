import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent } from 'react'
import { CHAPTERS, LESSONS, lessonById } from './lessons/index'
import { FLOWS } from './lessons/all'
import type { LessonMeta } from './engine/types'
import { FlowLessonView, WidgetLessonView } from './engine/LessonView'
import { RackTour } from './widgets/RackTour'
import { ServerAnatomy } from './widgets/ServerAnatomy'
import { BomCheck } from './widgets/BomCheck'
import { Outlier } from './widgets/Outlier'
import { Jumbo } from './widgets/Jumbo'
import { BondFailover } from './widgets/BondFailover'
import { TestTypes } from './widgets/TestTypes'
import { Home } from './pages/Home'
import { Labs } from './pages/Labs'
import { DataCenter } from './explore/DataCenter'
import { Practice } from './pages/Practice'
import { RackLab } from './pages/RackLab'
import { Cheatsheets, SHEETS } from './pages/Cheatsheets'
import { Assistant, setAssistantContext } from './assistant/Assistant'
import { useDone, useStored } from './progress'
import { LANGS, setLang, useLang, useT } from './i18n'
import { SITE } from './site'

const WIDGETS: Record<string, ComponentType<{ meta: LessonMeta }>> = {
  'rack-tour': RackTour,
  'server-anatomy': ServerAnatomy,
  'bom-check': BomCheck,
  outlier: Outlier,
  jumbo: Jumbo,
  bond: BondFailover,
  'test-types': TestTypes,
}

type Route =
  | { page: 'home' }
  | { page: 'lesson'; id: string }
  | { page: 'practice'; tab: 'shift' | 'hunt' | 'quiz' }
  | { page: 'lab' }
  | { page: 'sheets' }
  | { page: 'labs' }
  | { page: 'explore'; path: string[] }
  | { page: 'missing' }

function parse(hash: string): Route {
  const h = hash.replace(/^#/, '') || '/'
  if (h === '/' || h === '' || h === '/overview') return { page: 'home' }
  if (h === '/practice' || h === '/practice/shift' || h === '/shift') return { page: 'practice', tab: 'shift' }
  if (h === '/practice/hunt' || h === '/hunt') return { page: 'practice', tab: 'hunt' }
  if (h === '/practice/quiz') return { page: 'practice', tab: 'quiz' }
  if (h === '/lab') return { page: 'lab' }
  if (h === '/cheatsheets') return { page: 'sheets' }
  if (h === '/labs') return { page: 'labs' }
  if (h === '/explore' || h.startsWith('/explore/')) return { page: 'explore', path: h.split('/').slice(2).filter(Boolean) }
  const m = h.match(/^\/lesson\/([\w-]+)$/)
  if (m && lessonById(m[1])) return { page: 'lesson', id: m[1] }
  return { page: 'missing' }
}

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}


const Svg = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)
const ICON = {
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4',
  globe: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  sidebar: 'M4 5h16v14H4zM9 5v14',
  diagram: 'M4 5h16v14H4zM8 15l3-4 3 3 2-2',
  full: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  keys: 'M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5',
  target: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  rack: 'M6 3h12v18H6zM6 8h12M6 13h12M9 5.5h.01M9 10.5h.01M9 15.5h.01',
  sheet: 'M5 3h10l4 4v14H5zM8 11h8M8 15h8M8 7h4',
  github: 'M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.9-2.4c3-.3 6.1-1.5 6.1-6.6a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6s-1.1-.4-3.7 1.4a12.6 12.6 0 0 0-6.6 0C5.8 1.3 4.7 1.7 4.7 1.7a4.8 4.8 0 0 0-.1 3.6A5.2 5.2 0 0 0 3.2 8.9c0 5.1 3.1 6.3 6.1 6.6A3 3 0 0 0 8.4 18v3',
}

/* ---------- search in the top bar ---------- */

interface Hit {
  hash: string
  title: string
  sub: string
  kind: string
}

function Search({ go }: { go: (h: string) => void }) {
  const t = useT()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(0)
  const ref = useRef<HTMLInputElement>(null)

  const all = useMemo<(Hit & { hay: string })[]>(
    () => [
      ...LESSONS.map((l) => ({ hash: `#/lesson/${l.id}`, title: l.title, sub: l.blurb, kind: 'Lesson', hay: `${l.title} ${l.blurb} ${l.keywords.join(' ')}` })),
      { hash: '#/practice', title: 'Rack Shift', sub: 'Game: build, cable, test and ship three racks', kind: 'Practice', hay: 'rack shift game build cable burn-in report ship integration play' },
      { hash: '#/practice/hunt', title: 'Fault hunt', sub: 'One hidden fault, a terminal, the clock', kind: 'Practice', hay: 'fault hunt game practice terminal' },
      { hash: '#/practice/quiz', title: 'Quiz', sub: '15 questions from real rack work', kind: 'Practice', hay: 'quiz questions test interview' },
      { hash: '#/lab', title: 'Rack Lab', sub: 'Build a rack that passes integration', kind: 'Lab', hay: 'rack lab build pdu power blanking design' },
      { hash: '#/explore', title: 'Data center explorer', sub: 'Zoom from the data hall into a row, a rack and a server', kind: 'Explore', hay: 'data center hall row rack server aisle cooling power ups crah busway explore zoom' },
      { hash: '#/labs', title: 'Run it yourself', sub: 'Labs 0 to 11 on the real rack', kind: 'Lab', hay: 'labs install setup hands on scripts' },
      ...SHEETS.flatMap((s) => s.entries.map((e) => ({ hash: '#/cheatsheets', title: e.cmd, sub: `${s.title}: ${e.what}`, kind: 'Command', hay: `${e.cmd} ${e.what} ${s.title}` }))),
    ],
    [],
  )
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const hits = words.length ? all.filter((h) => words.every((w) => h.hay.toLowerCase().includes(w))).slice(0, 9) : []

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ref.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  const choose = (h: Hit) => {
    go(h.hash)
    setQ('')
    setOpen(false)
    ref.current?.blur()
  }

  return (
    <div className="search">
      <span className="search-icon">
        <Svg d={ICON.search} size={16} />
      </span>
      <input
        ref={ref}
        value={q}
        placeholder={t('search')}
        aria-label={t('search')}
        onChange={(e) => {
          setQ(e.target.value)
          setSel(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
            ref.current?.blur()
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSel((s) => Math.min(hits.length - 1, s + 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSel((s) => Math.max(0, s - 1))
          } else if (e.key === 'Enter' && hits[sel]) choose(hits[sel])
        }}
      />
      <kbd>Ctrl K</kbd>
      {open && words.length > 0 && (
        <ul className="search-hits">
          {hits.map((h, i) => (
            <li key={h.hash + h.title} className={i === sel ? 'is-sel' : ''}>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => choose(h)} onMouseEnter={() => setSel(i)}>
                <span className="hit-kind">{h.kind}</span>
                <strong>{h.title}</strong>
                <span className="hit-sub">{h.sub}</span>
              </button>
            </li>
          ))}
          {!hits.length && <li className="muted pad">{t('noResults')}</li>}
        </ul>
      )}
    </div>
  )
}

/* ---------- course tree and progress ---------- */

function Folder({ color, open }: { color: string; open: boolean }) {
  return (
    <svg width="18" height="15" viewBox="0 0 18 15" aria-hidden="true" className="folder">
      <path d={open ? 'M1 3.5c0-1 .7-1.5 1.5-1.5h4l1.5 1.7h7.5c.8 0 1.5.6 1.5 1.4V5H4.2L1 12.5V3.5z M4 6h13.4L15 13.5H1.3z' : 'M1 3c0-.8.7-1.5 1.5-1.5h4.2L8.3 3.3h7.2c.8 0 1.5.6 1.5 1.4v7.8c0 .8-.7 1.5-1.5 1.5h-13C1.7 14 1 13.3 1 12.5z'} fill={color} />
    </svg>
  )
}

function CourseNav({ route, link }: { route: Route; link: (h: string) => (e: MouseEvent) => void }) {
  const t = useT()
  const done = useDone()
  const activeChapter = route.page === 'lesson' ? lessonById(route.id)?.chapter : null
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set(['start', activeChapter ?? 'found']))
  const [progOpen, setProgOpen] = useState(false)

  useEffect(() => {
    if (activeChapter) setOpenSet((s) => (s.has(activeChapter) ? s : new Set([...s, activeChapter])))
  }, [activeChapter])
  useEffect(() => {
    const id = setTimeout(() => document.querySelector('.tree a.on')?.scrollIntoView({ block: 'nearest' }), 50)
    return () => clearTimeout(id)
  }, [route])

  const toggle = (id: string) =>
    setOpenSet((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const doneCount = LESSONS.filter((l) => done.includes(l.id)).length

  return (
    <>
      <div className="course-head">
        <span className="course-title">
          <Folder color="var(--text)" open={false} /> {t('course')}
        </span>
        <span className="muted">
          {LESSONS.length} {t('lessons')}
        </span>
      </div>
      <nav className="tree">
        <div className="tree-group">
          <button className="tree-folder" onClick={() => toggle('start')}>
            <span className="caret">{openSet.has('start') ? '▾' : '▸'}</span>
            <Folder color="var(--c-start)" open={openSet.has('start')} />
            <span className="tree-name">00. {t('startHere')}</span>
          </button>
          {openSet.has('start') && (
            <ul>
              <li>
                <a href="#/overview" onClick={link('#/overview')} className={route.page === 'home' ? 'on' : ''}>
                  {t('overview')}
                </a>
              </li>
              <li>
                <a href="#/explore" onClick={link('#/explore')} className={route.page === 'explore' ? 'on' : ''}>
                  Data center explorer
                </a>
              </li>
              <li>
                <a href="#/labs" onClick={link('#/labs')} className={route.page === 'labs' ? 'on' : ''}>
                  Run it yourself
                </a>
              </li>
            </ul>
          )}
        </div>
        {CHAPTERS.map((c, ci) => {
          const lessons = LESSONS.filter((l) => l.chapter === c.id)
          const n = lessons.filter((l) => done.includes(l.id)).length
          const open = openSet.has(c.id)
          return (
            <div key={c.id} className="tree-group">
              <button className="tree-folder" onClick={() => toggle(c.id)}>
                <span className="caret">{open ? '▾' : '▸'}</span>
                <Folder color={c.color} open={open} />
                <span className="tree-name">
                  {String(ci + 1).padStart(2, '0')}. {c.title}
                </span>
                <span className="tree-count">
                  {n}/{lessons.length}
                </span>
              </button>
              {open && (
                <ul>
                  {lessons.map((l) => (
                    <li key={l.id}>
                      <a href={`#/lesson/${l.id}`} onClick={link(`#/lesson/${l.id}`)} className={route.page === 'lesson' && route.id === l.id ? 'on' : ''}>
                        <span className={`doc${done.includes(l.id) ? ' is-done' : ''}`} aria-hidden="true" />
                        {l.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
      <div className={`progress-card${progOpen ? ' is-open' : ''}`}>
        <button className="progress-head" onClick={() => setProgOpen(!progOpen)}>
          <span>{t('progress')}</span>
          <span>
            {doneCount} / {LESSONS.length} <span className="caret">{progOpen ? '▾' : '▴'}</span>
          </span>
        </button>
        <div className="progress-bar">
          <div style={{ width: `${(doneCount / LESSONS.length) * 100}%` }} />
        </div>
        {progOpen && (
          <ul className="progress-list">
            {CHAPTERS.map((c) => {
              const lessons = LESSONS.filter((l) => l.chapter === c.id)
              const n = lessons.filter((l) => done.includes(l.id)).length
              return (
                <li key={c.id}>
                  <span className="dot" style={{ background: c.color }} />
                  <span className="pl-name">{c.title}</span>
                  <span className="pl-bar">
                    <i style={{ width: `${(n / lessons.length) * 100}%`, background: c.color }} />
                  </span>
                  <span className="pl-n">
                    {n}/{lessons.length}
                  </span>
                </li>
              )
            })}
            <li>
              <span className="dot" style={{ background: 'var(--c-practice)' }} />
              <span className="pl-name">Practice</span>
              <span className="pl-n">
                {['rack-shift', 'fault-hunt', 'quiz', 'rack-lab'].filter((id) => done.includes(id)).length}/4
              </span>
            </li>
          </ul>
        )}
      </div>
    </>
  )
}

/* ---------- app ---------- */

export function App() {
  const t = useT()
  const lang = useLang()
  const hash = useHash()
  const route = parse(hash)
  const [navOpen, setNavOpen] = useState(false)
  const [theme, setTheme] = useStored<'' | 'light' | 'dark'>('rackbench:theme', '')
  const [courseHidden, setCourseHidden] = useStored<'0' | '1'>('rackbench:course-hidden', '0')
  const [diagramOnly, setDiagramOnly] = useState(false)
  const [keysOpen, setKeysOpen] = useState(false)
  const [isFull, setIsFull] = useState(false)
  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined)
    else document.documentElement.requestFullscreen().catch(() => undefined)
  }, [])
  useEffect(() => {
    const on = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '[') setCourseHidden(courseHidden === '1' ? '0' : '1')
      else if (e.key === 'd') setDiagramOnly((v) => !v)
      else if (e.key === 'f') toggleFull()
      else if (e.key === '?') setKeysOpen((v) => !v)
      else if (e.key === 'Escape') {
        setKeysOpen(false)
        setDiagramOnly(false)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [courseHidden, setCourseHidden, toggleFull])

  const go = useCallback((h: string) => {
    if (window.location.hash !== h) window.location.hash = h
  }, [])
  const link = (h: string) => (e: MouseEvent) => {
    e.preventDefault()
    go(h)
    setNavOpen(false)
  }

  useEffect(() => {
    setNavOpen(false)
    document.querySelector('.main')?.scrollTo({ top: 0 })
    const lesson = route.page === 'lesson' ? lessonById(route.id) : null
    const titles: Record<string, string> = { practice: 'Practice', lab: 'Rack Lab', sheets: 'Cheatsheets', labs: 'Run it yourself', explore: 'Data center explorer' }
    document.title = lesson ? `${lesson.title} · ${SITE.title}` : titles[route.page] ? `${titles[route.page]} · ${SITE.title}` : SITE.title
    setAssistantContext(lesson ? { page: lesson.title, text: lesson.blurb } : { page: route.page, text: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash])

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
  }, [theme])

  const isDark = theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const tab = route.page === 'practice' ? 'practice' : route.page === 'lab' ? 'lab' : route.page === 'sheets' ? 'sheets' : 'learn'
  const firstLesson = `#/lesson/${LESSONS[0].id}`

  let main
  let full = false
  if (route.page === 'lesson') {
    const meta = lessonById(route.id)!
    const W = WIDGETS[meta.id]
    main =
      meta.kind === 'flow' && FLOWS[meta.id] ? (
        <FlowLessonView key={meta.id} meta={meta} flow={FLOWS[meta.id]} />
      ) : W ? (
        <WidgetLessonView key={meta.id} meta={meta}>
          <W meta={meta} />
        </WidgetLessonView>
      ) : null
  } else {
    full = true
    if (route.page === 'home') main = <Home go={go} />
    else if (route.page === 'practice') main = <Practice tab={route.tab} go={go} />
    else if (route.page === 'lab') main = <RackLab />
    else if (route.page === 'sheets') main = <Cheatsheets />
    else if (route.page === 'labs') main = <Labs go={go} />
    else if (route.page === 'explore') main = <DataCenter go={go} path={route.path} />
    else
      main = (
        <div className="page">
          <h1>Not found</h1>
          <a href="#/" onClick={link('#/')}>
            {t('overview')}
          </a>
        </div>
      )
  }

  return (
    <div className={`app${courseHidden === '1' ? ' no-course' : ''}${diagramOnly && route.page === 'lesson' ? ' diagram-only' : ''}`}>
      <header className="topbar">
        <div className="top-left">
        <button className="btn nav-toggle" onClick={() => setNavOpen(!navOpen)} aria-label={t('course')}>
          ☰
        </button>
        <a className="brand" href="#/" onClick={link('#/')}>
          <img src="./favicon.svg" alt="" width="24" height="24" />
          <span>
            rack<em>bench</em>
          </span>
        </a>
        </div>
        <nav className="tabs">
          <a href={firstLesson} onClick={link(route.page === 'lesson' ? hash : firstLesson)} className={tab === 'learn' ? 'on' : ''}>
            <Svg d={ICON.book} size={15} />
            {t('learn')}
          </a>
          <a href="#/practice" onClick={link('#/practice')} className={tab === 'practice' ? 'on' : ''}>
            <Svg d={ICON.target} size={15} />
            {t('practice')}
          </a>
          <a href="#/lab" onClick={link('#/lab')} className={tab === 'lab' ? 'on' : ''}>
            <Svg d={ICON.rack} size={15} />
            {t('lab')}
          </a>
          <a href="#/cheatsheets" onClick={link('#/cheatsheets')} className={tab === 'sheets' ? 'on' : ''}>
            <Svg d={ICON.sheet} size={15} />
            {t('cheatsheets')}
          </a>
        </nav>
        <div className="top-right">
        <Search go={go} />
        <div className="tools">
          <button className={`tool-btn${courseHidden === '1' ? '' : ' is-on'}`} onClick={() => setCourseHidden(courseHidden === '1' ? '0' : '1')} title={`${t('hideCourse')} ( [ )`} aria-label={t('hideCourse')}>
            <Svg d={ICON.sidebar} size={17} />
          </button>
          <button className={`tool-btn${diagramOnly ? ' is-on' : ''}`} onClick={() => setDiagramOnly(!diagramOnly)} title={`${t('diagramOnly')} (D)`} aria-label={t('diagramOnly')}>
            <Svg d={ICON.diagram} size={17} />
          </button>
          <button className={`tool-btn${isFull ? ' is-on' : ''}`} onClick={toggleFull} title={`${t('fullscreen')} (F)`} aria-label={t('fullscreen')}>
            <Svg d={ICON.full} size={17} />
          </button>
          <button className={`tool-btn${keysOpen ? ' is-on' : ''}`} onClick={() => setKeysOpen(!keysOpen)} title={`${t('shortcuts')} (?)`} aria-label={t('shortcuts')}>
            <Svg d={ICON.keys} size={17} />
          </button>
        </div>
        <label className="lang" title={lang === 'en' ? '' : t('englishOnly')}>
          <Svg d={ICON.globe} size={16} />
          <select value={lang} onChange={(e) => setLang(e.target.value as 'en')} aria-label="Language">
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <button className="btn icon-btn" onClick={toggleTheme} aria-label="Light or dark" title="Light or dark">
          <Svg d={isDark ? ICON.sun : ICON.moon} />
        </button>
        <a className="credit" href={SITE.authorUrl} target="_blank" rel="noreferrer">
          <span>{t('builtBy')}</span>
          <strong>{SITE.author}</strong>
        </a>
        </div>
        {keysOpen && (
          <div className="shortcuts" role="dialog" aria-label={t('shortcuts')}>
            <strong>{t('shortcuts')}</strong>
            <dl>
              <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>{t('back')} / {t('next')}</dd>
              <dt><kbd>Space</kbd></dt><dd>{t('pause')} / {t('play')}</dd>
              <dt><kbd>R</kbd></dt><dd>{t('replay')}</dd>
              <dt><kbd>[</kbd></dt><dd>{t('hideCourse')}</dd>
              <dt><kbd>D</kbd></dt><dd>{t('diagramOnly')}</dd>
              <dt><kbd>F</kbd></dt><dd>{t('fullscreen')}</dd>
              <dt><kbd>Ctrl</kbd> <kbd>K</kbd></dt><dd>{t('search')}</dd>
              <dt><kbd>Esc</kbd></dt><dd>{t('close')}</dd>
            </dl>
          </div>
        )}
      </header>

      <div className="shell">
        <aside className={`course${navOpen ? ' is-open' : ''}`}>
          <CourseNav route={route} link={link} />
        </aside>
        <main className={`main${full ? ' is-page' : ''}`}>{main}</main>
      </div>
      <Assistant />
    </div>
  )
}

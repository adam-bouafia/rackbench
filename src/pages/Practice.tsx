import { Suspense, lazy } from 'react'
import { useT } from '../i18n'
import type { PracticeTab } from '../App'

// Each game loads on first visit, so opening Practice does not fetch all of them.
const FaultHunt = lazy(() => import('../hunt/FaultHunt').then((m) => ({ default: m.FaultHunt })))
const RackShift = lazy(() => import('../game/RackShift').then((m) => ({ default: m.RackShift })))
const ServerBuild = lazy(() => import('../game/ServerBuild').then((m) => ({ default: m.ServerBuild })))
const RaidRescue = lazy(() => import('../game/RaidRescue').then((m) => ({ default: m.RaidRescue })))
const PipePuzzle = lazy(() => import('../game/PipePuzzle').then((m) => ({ default: m.PipePuzzle })))
const PatchIt = lazy(() => import('../game/PatchIt').then((m) => ({ default: m.PatchIt })))
const FloorWalk = lazy(() => import('../game/FloorWalk').then((m) => ({ default: m.FloorWalk })))
const Quiz = lazy(() => import('./Quiz').then((m) => ({ default: m.Quiz })))
const Flashcards = lazy(() => import('./Flashcards').then((m) => ({ default: m.Flashcards })))

export function Practice({ tab, go, deck, card }: { tab: PracticeTab; go: (h: string) => void; deck?: string; card?: number }) {
  const t = useT()
  const tabs: [PracticeTab, string, string][] = [
    ['shift', '#/practice', t('rackShift')],
    ['build', '#/practice/build', 'Build a server'],
    ['raid', '#/practice/raid', 'RAID Rescue'],
    ['patch', '#/practice/patch', 'Patch it'],
    ['walk', '#/practice/walk', 'Floor walk'],
    ['pipes', '#/practice/pipes', 'Pipe puzzle'],
    ['hunt', '#/practice/hunt', t('faultHunt')],
    ['quiz', '#/practice/quiz', t('quiz')],
    ['cards', '#/practice/cards', 'Flashcards'],
  ]
  return (
    <div className="practice">
      <div className="practice-tabs seg">
        {tabs.map(([id, hash, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(hash)}>
            {label}
          </button>
        ))}
      </div>
      <Suspense fallback={<div className="page-loading muted">Loading…</div>}>
        {tab === 'shift' ? (
          <RackShift />
        ) : tab === 'build' ? (
          <ServerBuild />
        ) : tab === 'raid' ? (
          <RaidRescue />
        ) : tab === 'patch' ? (
          <PatchIt />
        ) : tab === 'walk' ? (
          <FloorWalk />
        ) : tab === 'pipes' ? (
          <PipePuzzle />
        ) : tab === 'hunt' ? (
          <FaultHunt />
        ) : tab === 'quiz' ? (
          <Quiz />
        ) : (
          <Flashcards deck={deck} card={card} />
        )}
      </Suspense>
    </div>
  )
}

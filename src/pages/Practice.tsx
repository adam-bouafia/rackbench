import { FaultHunt } from '../hunt/FaultHunt'
import { RackShift } from '../game/RackShift'
import { ServerBuild } from '../game/ServerBuild'
import { RaidRescue } from '../game/RaidRescue'
import { PipePuzzle } from '../game/PipePuzzle'
import { PatchIt } from '../game/PatchIt'
import { Quiz } from './Quiz'
import { Flashcards } from './Flashcards'
import { useT } from '../i18n'
import type { PracticeTab } from '../App'

export function Practice({ tab, go }: { tab: PracticeTab; go: (h: string) => void }) {
  const t = useT()
  const tabs: [PracticeTab, string, string][] = [
    ['shift', '#/practice', t('rackShift')],
    ['build', '#/practice/build', 'Build a server'],
    ['raid', '#/practice/raid', 'RAID Rescue'],
    ['patch', '#/practice/patch', 'Patch it'],
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
      {tab === 'shift' ? (
        <RackShift />
      ) : tab === 'build' ? (
        <ServerBuild />
      ) : tab === 'raid' ? (
        <RaidRescue />
      ) : tab === 'patch' ? (
        <PatchIt />
      ) : tab === 'pipes' ? (
        <PipePuzzle />
      ) : tab === 'hunt' ? (
        <FaultHunt />
      ) : tab === 'quiz' ? (
        <Quiz />
      ) : (
        <Flashcards />
      )}
    </div>
  )
}

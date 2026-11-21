import { FaultHunt } from '../hunt/FaultHunt'
import { RackShift } from '../game/RackShift'
import { Quiz } from './Quiz'
import { useT } from '../i18n'

export function Practice({ tab, go }: { tab: 'shift' | 'hunt' | 'quiz'; go: (h: string) => void }) {
  const t = useT()
  return (
    <div className="practice">
      <div className="practice-tabs seg">
        <button className={tab === 'shift' ? 'on' : ''} onClick={() => go('#/practice')}>
          {t('rackShift')}
        </button>
        <button className={tab === 'hunt' ? 'on' : ''} onClick={() => go('#/practice/hunt')}>
          {t('faultHunt')}
        </button>
        <button className={tab === 'quiz' ? 'on' : ''} onClick={() => go('#/practice/quiz')}>
          {t('quiz')}
        </button>
      </div>
      {tab === 'shift' ? <RackShift /> : tab === 'hunt' ? <FaultHunt /> : <Quiz />}
    </div>
  )
}

import { FaultHunt } from '../hunt/FaultHunt'
import { Quiz } from './Quiz'
import { useT } from '../i18n'

export function Practice({ tab, go }: { tab: 'hunt' | 'quiz'; go: (h: string) => void }) {
  const t = useT()
  return (
    <div className="practice">
      <div className="practice-tabs seg">
        <button className={tab === 'hunt' ? 'on' : ''} onClick={() => go('#/practice')}>
          {t('faultHunt')}
        </button>
        <button className={tab === 'quiz' ? 'on' : ''} onClick={() => go('#/practice/quiz')}>
          {t('quiz')}
        </button>
      </div>
      {tab === 'hunt' ? <FaultHunt /> : <Quiz />}
    </div>
  )
}

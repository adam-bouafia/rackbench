import type { ComponentType } from 'react'
import { lessonById } from './lessons/index'
import { FLOWS } from './lessons/all'
import type { LessonMeta } from './engine/types'
import { FlowLessonView, WidgetLessonView } from './engine/LessonView'
import { StageLessonView } from './engine/StageLesson'
import { STAGES } from './lessons/stages'
import { RackTour } from './widgets/RackTour'
import { ServerAnatomy } from './widgets/ServerAnatomy'
import { BomCheck } from './widgets/BomCheck'
import { Outlier } from './widgets/Outlier'
import { Jumbo } from './widgets/Jumbo'
import { BondFailover } from './widgets/BondFailover'
import { TestTypes } from './widgets/TestTypes'
import { RaidDrives } from './widgets/RaidDrives'

// Everything a lesson page needs, in its own chunk: the flow texts, the stages and the widgets.
// App loads it on the first lesson visit (and in the background once the first page is up).

const WIDGETS: Record<string, ComponentType<{ meta: LessonMeta }>> = {
  'rack-tour': RackTour,
  'server-anatomy': ServerAnatomy,
  'bom-check': BomCheck,
  outlier: Outlier,
  jumbo: Jumbo,
  bond: BondFailover,
  'test-types': TestTypes,
  'raid-drives': RaidDrives,
}

export default function LessonRoute({ id }: { id: string }) {
  const meta = lessonById(id)!
  const W = WIDGETS[meta.id]
  if (meta.kind === 'flow' && FLOWS[meta.id]) return <FlowLessonView key={meta.id} meta={meta} flow={FLOWS[meta.id]} />
  if (meta.kind === 'stage' && STAGES[meta.id]) return <StageLessonView key={meta.id} meta={meta} def={STAGES[meta.id]} />
  if (W)
    return (
      <WidgetLessonView key={meta.id} meta={meta}>
        <W meta={meta} />
      </WidgetLessonView>
    )
  return null
}

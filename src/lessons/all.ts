import type { Proto, StepTag } from '../engine/types'
import { FLOWS as BASE } from './flows'
import { FLOWS2 } from './flows2'
import { FLOWS3 } from './flows3'
import { EXTRAS } from './extras'

// The step-through lessons with their presentation extras merged in. flows.ts stays free of runtime
// imports so that scripts/narrate.ts can load it directly with Node.
const defaultTag = (p: Proto): StepTag => (p === 'Board' || p === 'Event' ? 'event' : p === 'Tool' ? 'action' : p === 'Local' ? 'result' : 'message')

const ALL = { ...BASE, ...FLOWS2, ...FLOWS3 }

for (const [id, flow] of Object.entries(ALL)) {
  const x = EXTRAS[id]
  flow.metrics = x?.metrics
  flow.appear = x?.appear
  flow.steps.forEach((s, i) => {
    const e = x?.steps[i]
    s.short = e?.short ?? s.summary.split(':')[0].split(' ').slice(0, 2).join(' ')
    s.tag = e?.tag ?? defaultTag(s.proto)
    s.key = e?.key
    s.m = e?.m
  })
}

export const FLOWS = ALL

export type Proto = 'IPMI' | 'HTTPS' | 'HTTP' | 'DHCP' | 'SSH' | 'Board' | 'Local' | 'Tool' | 'Event' | 'Link'

export type ActorKind = 'laptop' | 'switch' | 'bmc' | 'server' | 'service' | 'chip' | 'disk' | 'person' | 'os' | 'nic'

export interface Actor {
  id: string
  label: string
  sub?: string
  /** Centre of the actor box in the 1000 x 440 map. */
  x: number
  y: number
  kind: ActorKind
}

export interface Field {
  name: string
  value: string
  note?: string
}

export type Tone = 'ok' | 'warn' | 'bad' | 'info'

export interface Badge {
  text: string
  tone?: Tone
}

export type StepTag = 'message' | 'action' | 'event' | 'result' | 'technique'

export interface Step {
  from: string
  to: string
  proto: Proto
  /** One line, shown in the message list. */
  summary: string
  /** Paragraphs, shown in the inspector. */
  explain: string[]
  fields?: Field[]
  raw?: string
  rawLabel?: string
  /** State shown under actors from this step on (later steps override). */
  state?: Record<string, Badge>
  /** Short label for the stepper (filled in from lessons/extras.ts). */
  short?: string
  tag?: StepTag
  /** One sentence worth remembering, shown as "Key idea". */
  key?: string
  /** Metric values that change at this step. */
  m?: Record<string, string>
}

export interface Metric {
  id: string
  label: string
  /** Value before the first step. */
  start?: string
}

export interface Flow {
  /** Metrics shown above the diagram, updated by the steps. */
  metrics?: Metric[]
  /** Step (1-based) at which each actor appears; actors not listed are there from the start. */
  appear?: Record<string, number>
  actors: Actor[]
  links: [string, string][]
  steps: Step[]
  intro: string[]
  keyPoints: string[]
  tryIt?: { cmd: string; note?: string }[]
}

export type LessonKind = 'flow' | 'widget' | 'stage'

export interface LessonMeta {
  id: string
  chapter: string
  title: string
  blurb: string
  kind: LessonKind
  keywords: string[]
  /** The hands-on lab on rackbench that goes with this lesson. */
  lab?: string
  minutes: number
  level: 'Beginner' | 'Intermediate'
  /** "You'll learn" checklist. */
  learn: string[]
  /** Commands for widget lessons (flows carry their own). */
  tryIt?: { cmd: string; note?: string }[]
}

export const PROTO_KEY: Record<Proto, string> = {
  IPMI: 'ipmi',
  HTTPS: 'https',
  HTTP: 'http',
  DHCP: 'dhcp',
  SSH: 'ssh',
  Board: 'board',
  Local: 'local',
  Tool: 'tool',
  Event: 'event',
  Link: 'link',
}

export const protoColor = (p: Proto) => `var(--p-${PROTO_KEY[p]})`

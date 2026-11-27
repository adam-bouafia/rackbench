import type { CSSProperties, ReactNode } from 'react'

// Small drawing parts shared by the floor, network, change and vendor-tool stages.
// Everything is plain SVG in the 1000 x 480 stage box, styled by the fb- and kit- classes.

export const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` })

/** A dark terminal box. Lines starting with ! are red, with + green, with # muted. */
export function Term({ x, y, w, lines, delay = 0.4 }: { x: number; y: number; w: number; lines: string[]; delay?: number }) {
  return (
    <g className="fb-in" style={d(delay)}>
      <rect x={x} y={y} width={w} height={20 + lines.length * 19} rx="10" className="fb-term" />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 25 + i * 19} className={`fb-term-text${l.startsWith('!') ? ' is-bad' : l.startsWith('+') ? ' is-ok' : l.startsWith('#') ? ' is-dim' : ''}`}>
          {l.replace(/^[!+#]/, '')}
        </text>
      ))}
    </g>
  )
}

export type BoxTone = 'plain' | 'ok' | 'bad' | 'warn' | 'info' | 'amber' | 'teal' | 'violet' | 'blue' | 'green' | 'slate'

/** A card with a bold title and short lines under it. */
export function Box({
  x,
  y,
  w,
  h,
  title,
  lines = [],
  tone = 'plain',
  delay,
  center = false,
  className = '',
}: {
  x: number
  y: number
  w: number
  h: number
  title?: string
  lines?: string[]
  tone?: BoxTone
  delay?: number
  center?: boolean
  className?: string
}) {
  const tx = center ? x + w / 2 : x + 14
  const anchor = center ? 'middle' : 'start'
  const top = title ? y + 26 : y + 22
  return (
    <g className={`${delay !== undefined ? 'fb-in ' : ''}${className}`} style={delay !== undefined ? d(delay) : undefined}>
      <rect x={x + 4} y={y + 4} width={w} height={h} rx="9" className="fb-shadow" />
      <rect x={x} y={y} width={w} height={h} rx="9" className={`kit-box is-${tone}`} />
      {title && (
        <text x={tx} y={y + 24} textAnchor={anchor} className="fb-strong">
          {title}
        </text>
      )}
      {lines.map((l, i) => (
        <text key={i} x={tx} y={top + 20 + i * 19} textAnchor={anchor} className="fb-small">
          {l}
        </text>
      ))}
    </g>
  )
}

/** A straight arrow with a head at (x2, y2). */
export function Arrow({ x1, y1, x2, y2, delay, dashed, tone }: { x1: number; y1: number; x2: number; y2: number; delay?: number; dashed?: boolean; tone?: 'ok' | 'bad' | 'info' }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const hx = x2 - Math.cos(a) * 2
  const hy = y2 - Math.sin(a) * 2
  const p = (r: number, s: number) => `${hx + Math.cos(a + s) * r},${hy + Math.sin(a + s) * r}`
  return (
    <g className={delay !== undefined ? 'fb-in' : ''} style={delay !== undefined ? d(delay) : undefined}>
      <line x1={x1} y1={y1} x2={x2 - Math.cos(a) * 8} y2={y2 - Math.sin(a) * 8} className={`kit-arrow${dashed ? ' is-dashed' : ''}${tone ? ` is-${tone}` : ''}`} />
      <polygon points={`${x2},${y2} ${p(11, Math.PI - 0.45)} ${p(11, Math.PI + 0.45)}`} className={`kit-head${tone ? ` is-${tone}` : ''}`} />
    </g>
  )
}

/** One centred line of text at the bottom of a scene. */
export function Caption({ y = 456, children, tone, delay = 0.8 }: { y?: number; children: ReactNode; tone?: 'ok' | 'bad'; delay?: number }) {
  return (
    <text x={500} y={y} textAnchor="middle" className={`fb-in ${tone === 'ok' ? 'fb-ok' : tone === 'bad' ? 'fb-bad' : 'fb-label'}`} style={d(delay)}>
      {children}
    </text>
  )
}

/** A tick or a cross in a circle, for checklists. */
export function Mark({ x, y, ok, delay }: { x: number; y: number; ok: boolean; delay?: number }) {
  return (
    <g className={delay !== undefined ? 'kit-pop' : ''} style={delay !== undefined ? d(delay) : undefined}>
      <circle cx={x} cy={y} r="10" className={ok ? 'kit-mark-ok' : 'kit-mark-bad'} />
      <path d={ok ? `M${x - 5} ${y} l3.5 4 l6.5 -8` : `M${x - 4} ${y - 4} l8 8 M${x + 4} ${y - 4} l-8 8`} className="kit-mark-line" />
    </g>
  )
}

/** A simple person: head and body, for security and safety scenes. */
export function Person({ x, y, tone = 'blue', badge, className = '', style }: { x: number; y: number; tone?: 'blue' | 'amber' | 'violet' | 'slate' | 'bad'; badge?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <g className={className} style={style}>
      <circle cx={x} cy={y - 34} r="11" className={`kit-person is-${tone}`} />
      <path d={`M${x - 15} ${y + 10} v-22 a15 13 0 0 1 30 0 v22 z`} className={`kit-person is-${tone}`} />
      {badge && <rect x={x + 2} y={y - 12} width={9} height={11} rx="1.5" className="kit-badge" />}
    </g>
  )
}

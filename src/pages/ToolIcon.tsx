import type { ReactElement } from 'react'
import type { Icon } from '../data/tools'

// Flat ink drawings of the tools, 48 x 48. Fills come from the paper palette, outlines from --iso-edge.

export function ToolIcon({ icon, size = 44 }: { icon: Icon; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="ti" aria-hidden="true">
      {DRAW[icon]}
    </svg>
  )
}

const DRAW: Record<Icon, ReactElement> = {
  strap: (
    <>
      <ellipse cx="17" cy="18" rx="11" ry="7" className="ti-blue" />
      <path d="M22 24 q4 6 10 4 t6 8 t4 6" className="ti-line" />
      <rect x="37" y="38" width="8" height="5" rx="1" className="ti-red" />
    </>
  ),
  bag: (
    <>
      <path d="M10 8 h28 v32 h-28 z" className="ti-slate" />
      <path d="M10 14 h28" className="ti-line" />
      <rect x="20" y="20" width="8" height="16" rx="1" className="ti-green" />
    </>
  ),
  screw: (
    <>
      <rect x="20" y="4" width="8" height="18" rx="3" className="ti-amber" />
      <path d="M24 22 v18" className="ti-thick" />
      <path d="M21 40 h6 l-3 5 z" className="ti-ink" />
    </>
  ),
  nut: (
    <>
      <rect x="14" y="14" width="20" height="20" rx="2" className="ti-slate" />
      <circle cx="24" cy="24" r="5" className="ti-paper" />
      <path d="M14 14 l-6 -4 M14 34 l-6 4 M34 14 l6 -4 M34 34 l6 4" className="ti-line" />
    </>
  ),
  torch: (
    <>
      <rect x="6" y="18" width="24" height="12" rx="3" className="ti-slate" />
      <path d="M30 16 h6 v16 h-6 z" className="ti-amber" />
      <path d="M38 14 l8 -4 M38 24 h9 M38 34 l8 4" className="ti-ray" />
    </>
  ),
  cutter: (
    <>
      <path d="M24 26 L12 44 M24 26 L36 44" className="ti-thick" />
      <path d="M24 26 L18 6 l4 0 z M24 26 L30 6 l-4 0 z" className="ti-red" />
      <circle cx="24" cy="26" r="2.5" className="ti-ink" />
    </>
  ),
  velcro: (
    <>
      <rect x="6" y="16" width="36" height="16" rx="4" className="ti-teal" />
      <path d="M10 20 v8 M15 20 v8 M20 20 v8 M25 20 v8 M30 20 v8 M35 20 v8" className="ti-thin" />
    </>
  ),
  label: (
    <>
      <rect x="6" y="12" width="36" height="26" rx="4" className="ti-slate" />
      <rect x="11" y="17" width="26" height="8" rx="1" className="ti-paper" />
      <rect x="14" y="34" width="20" height="8" rx="1" className="ti-yellow" />
    </>
  ),
  scope: (
    <>
      <rect x="8" y="16" width="22" height="16" rx="4" className="ti-slate" />
      <path d="M30 20 h10 v8 h-10 z" className="ti-ink-fill" />
      <circle cx="17" cy="24" r="4" className="ti-blue" />
    </>
  ),
  clicker: (
    <>
      <rect x="18" y="4" width="12" height="30" rx="5" className="ti-blue" />
      <path d="M22 34 h4 v10 h-4 z" className="ti-paper" />
      <path d="M18 14 h12" className="ti-line" />
    </>
  ),
  vfl: (
    <>
      <rect x="4" y="18" width="28" height="12" rx="5" className="ti-red" />
      <path d="M32 22 h6 v4 h-6 z" className="ti-ink-fill" />
      <path d="M40 24 h7" className="ti-laser" />
    </>
  ),
  meter: (
    <>
      <rect x="8" y="6" width="32" height="38" rx="5" className="ti-amber" />
      <rect x="13" y="11" width="22" height="12" rx="2" className="ti-screen" />
      <text x="24" y="20.5" textAnchor="middle" className="ti-txt">
        -2.1
      </text>
      <circle cx="18" cy="33" r="3" className="ti-paper" />
      <circle cx="30" cy="33" r="3" className="ti-paper" />
    </>
  ),
  loop: (
    <>
      <rect x="6" y="18" width="14" height="12" rx="2" className="ti-blue" />
      <path d="M20 21 h10 a7 7 0 0 1 0 14 h-10" className="ti-loop" />
    </>
  ),
  optic: (
    <>
      <rect x="4" y="18" width="30" height="12" rx="2" className="ti-slate" />
      <rect x="34" y="20" width="8" height="8" rx="1" className="ti-blue" />
      <path d="M8 22 h18" className="ti-thin" />
    </>
  ),
  tester: (
    <>
      <rect x="6" y="8" width="22" height="34" rx="4" className="ti-green" />
      <rect x="10" y="12" width="14" height="10" rx="1" className="ti-screen" />
      <rect x="32" y="22" width="12" height="16" rx="3" className="ti-green" />
      <path d="M17 42 v3 h21 v-7" className="ti-line" />
    </>
  ),
  toner: (
    <>
      <path d="M8 40 L26 8 l4 2 L14 42 z" className="ti-amber" />
      <path d="M32 14 q6 4 0 10 M36 10 q10 8 0 18" className="ti-ray" />
    </>
  ),
  console: (
    <>
      <rect x="4" y="18" width="12" height="12" rx="2" className="ti-blue" />
      <path d="M16 24 C 26 24 22 34 32 34" className="ti-cable" />
      <rect x="32" y="29" width="12" height="10" rx="2" className="ti-slate" />
    </>
  ),
  cart: (
    <>
      <rect x="10" y="6" width="28" height="18" rx="2" className="ti-slate" />
      <rect x="13" y="9" width="22" height="12" rx="1" className="ti-screen" />
      <path d="M24 24 v12 M10 36 h28" className="ti-thick" />
      <circle cx="14" cy="42" r="3" className="ti-ink" />
      <circle cx="34" cy="42" r="3" className="ti-ink" />
    </>
  ),
  laptop: (
    <>
      <rect x="10" y="10" width="28" height="20" rx="2" className="ti-slate" />
      <rect x="13" y="13" width="22" height="14" rx="1" className="ti-screen" />
      <path d="M4 36 h40 l-4 -6 h-32 z" className="ti-slate" />
    </>
  ),
  shoe: (
    <>
      <path d="M6 34 v-16 h12 l4 8 h12 q8 0 8 8 v4 h-36 z" className="ti-amber" />
      <path d="M30 26 q8 0 8 8" className="ti-line" />
    </>
  ),
  glove: (
    <>
      <path d="M14 44 v-16 l-4 -8 l3 -2 l5 6 v-16 h4 v14 v-16 h4 v16 v-14 h4 v16 v-10 h4 v18 q0 8 -8 8 z" className="ti-teal" />
    </>
  ),
  ear: (
    <>
      <path d="M10 28 a14 14 0 0 1 28 0" className="ti-thick" />
      <rect x="4" y="26" width="10" height="16" rx="4" className="ti-red" />
      <rect x="34" y="26" width="10" height="16" rx="4" className="ti-red" />
    </>
  ),
  lift: (
    <>
      <rect x="10" y="14" width="28" height="8" rx="1" className="ti-slate" />
      <path d="M14 22 L34 38 M34 22 L14 38" className="ti-thick" />
      <path d="M8 38 h32" className="ti-thick" />
      <circle cx="12" cy="43" r="3" className="ti-ink" />
      <circle cx="36" cy="43" r="3" className="ti-ink" />
    </>
  ),
  term: (
    <>
      <rect x="4" y="8" width="40" height="32" rx="5" className="ti-term" />
      <path d="M11 18 l6 5 l-6 5" className="ti-green-line" />
      <path d="M21 30 h12" className="ti-green-line" />
    </>
  ),
  web: (
    <>
      <rect x="4" y="8" width="40" height="32" rx="5" className="ti-paper" />
      <path d="M4 16 h40" className="ti-line" />
      <circle cx="9" cy="12" r="1.5" className="ti-ink" />
      <circle cx="14" cy="12" r="1.5" className="ti-ink" />
      <path d="M12 24 h24 M12 30 h16" className="ti-thin" />
    </>
  ),
  ticket: (
    <>
      <path d="M6 12 h36 v8 a4 4 0 0 0 0 8 v8 h-36 v-8 a4 4 0 0 0 0 -8 z" className="ti-yellow" />
      <path d="M14 20 h16 M14 28 h12" className="ti-thin" />
    </>
  ),
  db: (
    <>
      <ellipse cx="24" cy="11" rx="15" ry="5" className="ti-violet" />
      <path d="M9 11 v26 a15 5 0 0 0 30 0 v-26" className="ti-violet" />
      <path d="M9 20 a15 5 0 0 0 30 0 M9 29 a15 5 0 0 0 30 0" className="ti-line" />
    </>
  ),
  camera: (
    <>
      <rect x="14" y="4" width="20" height="40" rx="4" className="ti-slate" />
      <circle cx="24" cy="14" r="4" className="ti-ink-fill" />
      <rect x="18" y="22" width="12" height="16" rx="1" className="ti-screen" />
    </>
  ),
}

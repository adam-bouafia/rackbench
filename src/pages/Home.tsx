import { useEffect, useState, type MouseEvent } from 'react'
import type { Flow } from '../engine/types'
import { IsoStage } from '../engine/IsoStage'
import { CHAPTERS, LESSONS } from '../lessons/index'
import { useDone } from '../progress'
import { SITE } from '../site'

const LAB_MAP: Flow = {
  intro: [],
  keyPoints: [],
  steps: [
    { from: 'host', to: 'bmc', proto: 'IPMI', summary: 'power on rk-n1', short: 'ipmitool power on', explain: [] },
    { from: 'bmc', to: 'n1', proto: 'Board', summary: 'BMC closes the power switch', short: 'power button', explain: [] },
    { from: 'n1', to: 'pxe', proto: 'DHCP', summary: 'node asks for a boot file', short: 'DHCP + iPXE', explain: [] },
    { from: 'n1', to: 'n2', proto: 'Link', summary: 'back-end traffic at MTU 9000', short: 'iperf3 at 9000', explain: [] },
    { from: 'host', to: 'n3', proto: 'SSH', summary: 'run the burn-in', short: 'stress-ng --verify', explain: [] },
    { from: 'obmc', to: 'host', proto: 'HTTPS', summary: 'Redfish event from OpenBMC', short: 'Redfish event', explain: [] },
  ],
  actors: [
    { id: 'host', label: 'Your workstation', sub: 'Linux, KVM, libvirt', x: 140, y: 70, kind: 'laptop' },
    { id: 'bmc', label: 'Emulated BMCs', sub: 'IPMI and Redfish', x: 400, y: 70, kind: 'bmc' },
    { id: 'obmc', label: 'OpenBMC', sub: 'real firmware, QEMU', x: 660, y: 70, kind: 'chip' },
    { id: 'pxe', label: 'Boot server', sub: 'DHCP + HTTP', x: 900, y: 70, kind: 'service' },
    { id: 'data', label: 'rack-data', sub: '192.168.70.0/24', x: 400, y: 215, kind: 'switch' },
    { id: 'back', label: 'rack-backend', sub: 'MTU 9000', x: 660, y: 215, kind: 'switch' },
    { id: 'n1', label: 'rk-n1', sub: 'U10', x: 260, y: 360, kind: 'server' },
    { id: 'n2', label: 'rk-n2', sub: 'U11', x: 530, y: 360, kind: 'server' },
    { id: 'n3', label: 'rk-n3', sub: 'U12', x: 800, y: 360, kind: 'server' },
  ],
  links: [
    ['host', 'bmc'],
    ['host', 'data'],
    ['pxe', 'data'],
    ['bmc', 'n1'],
    ['data', 'n1'],
    ['data', 'n2'],
    ['data', 'n3'],
    ['back', 'n1'],
    ['back', 'n2'],
    ['back', 'n3'],
  ],
}

const REAL: [string, string, string][] = [
  ['Servers', 'KVM machines with an SMBIOS identity', 'boards, CPUs, DIMMs, disks, NICs'],
  ['BMC', 'virtualbmc, sushy-tools, OpenBMC in QEMU', "the vendor's BMC firmware"],
  ['Network', 'Linux bridges, MTU 9000 back end', 'switch pairs, real cabling'],
  ['Firmware', 'lab/fw.sh changes the SMBIOS BIOS version', 'vendor tools flash BIOS and BMC'],
  ['Faults', 'lab/faults.sh: 11 kinds', 'bad parts, cables, settings, firmware'],
]

export function Home({ go }: { go: (hash: string) => void }) {
  const done = useDone()
  const [tab, setTab] = useState<'map' | 'real'>('map')
  const [cur, setCur] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || tab !== 'map') return
    const id = window.setInterval(() => setCur((c) => (c + 1) % LAB_MAP.steps.length), 3200)
    return () => window.clearInterval(id)
  }, [paused, tab])
  const count = LESSONS.filter((l) => done.includes(l.id)).length
  const link = (hash: string) => (e: MouseEvent) => {
    e.preventDefault()
    go(hash)
  }
  const next = LESSONS.find((l) => !done.includes(l.id)) ?? LESSONS[0]

  return (
    <div className="ov page-fit">
      <section className="panel ov-hero">
        <p className="eyebrow">{SITE.name} · overview</p>
        <h1>{SITE.tagline}</h1>
        <p className="lead">How a server rack is tested before it ships, one animated lesson at a time, each with a real lab you can run on a laptop.</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href={`#/lesson/${next.id}`} onClick={link(`#/lesson/${next.id}`)}>
            {count ? 'Continue the course' : 'Start the course'} →
          </a>
          <a className="btn" href="#/practice" onClick={link('#/practice')}>
            Play Rack Shift
          </a>
          <a className="btn" href="#/labs" onClick={link('#/labs')}>
            Run the lab
          </a>
        </div>
        <div className="ov-progress">
          <span>
            {count} / {LESSONS.length} lessons
          </span>
          <div className="progress-bar">
            <div style={{ width: `${(count / LESSONS.length) * 100}%` }} />
          </div>
          <span className="ov-next">
            next: <a href={`#/lesson/${next.id}`} onClick={link(`#/lesson/${next.id}`)}>{next.title}</a>
          </span>
        </div>
      </section>

      <section className="panel ov-map">
        <div className="ov-map-head">
          <h2 className="panel-title">The lab behind the lessons</h2>
          <div className="seg" role="tablist">
            <button className={tab === 'map' ? 'on' : ''} onClick={() => setTab('map')}>
              Lab map
            </button>
            <button className={tab === 'real' ? 'on' : ''} onClick={() => setTab('real')}>
              Real vs emulated
            </button>
          </div>
          {tab === 'map' && (
            <button className="btn btn-sm" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play' : 'Pause'}>
              {paused ? 'Play' : 'Pause'}
            </button>
          )}
        </div>
        {tab === 'map' ? (
          <div className="ov-map-svg">
            <IsoStage flow={LAB_MAP} cur={cur} paused={paused} replayKey={0} />
          </div>
        ) : (
          <div className="ov-real">
            <table className="data">
              <thead>
                <tr>
                  <th />
                  <th>On rackbench</th>
                  <th>On a real rack</th>
                </tr>
              </thead>
              <tbody>
                {REAL.map(([a, b, c]) => (
                  <tr key={a}>
                    <th>{a}</th>
                    <td>{b}</td>
                    <td>{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small">The workflow is the real one; the numbers are not. Not affiliated with any hardware vendor.</p>
          </div>
        )}
      </section>

      <section className="ov-chapters">
        {CHAPTERS.map((c, i) => {
          const lessons = LESSONS.filter((l) => l.chapter === c.id)
          const n = lessons.filter((l) => done.includes(l.id)).length
          const first = lessons.find((l) => !done.includes(l.id)) ?? lessons[0]
          return (
            <a key={c.id} className="ov-chapter" href={`#/lesson/${first.id}`} onClick={link(`#/lesson/${first.id}`)} style={{ borderTopColor: c.color }}>
              <div className="ov-ch-head">
                <span className="ov-ch-n" style={{ background: c.color }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <strong>{c.title}</strong>
                <span className="ov-ch-foot">
                  {n}/{lessons.length}
                </span>
              </div>
              <ul>
                {lessons.map((l) => (
                  <li key={l.id} className={done.includes(l.id) ? 'is-done' : ''}>
                    {l.title}
                  </li>
                ))}
              </ul>
            </a>
          )
        })}
        <div className="ov-chapter ov-practice">
          <div className="ov-ch-head">
            <span className="ov-ch-n">GO</span>
            <strong>Practice</strong>
          </div>
          <ul>
            {[
              ['#/practice', 'Rack Shift: build, test and ship racks'],
              ['#/practice/hunt', 'Fault hunt: find the broken node'],
              ['#/practice/quiz', 'Quiz: 15 questions'],
              ['#/lab', 'Rack Lab: build and power a rack'],
              ['#/labs', 'Run it yourself: 13 labs'],
            ].map(([h, t]) => (
              <li key={h}>
                <a href={h} onClick={link(h)}>
                  {t}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </div>
  )
}

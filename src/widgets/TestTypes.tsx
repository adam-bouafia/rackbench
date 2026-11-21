import { useEffect, useState } from 'react'
import type { LessonMeta } from '../engine/types'
import { Card, KeyPoints, Verdict } from '../engine/ui'
import { markDone } from '../progress'

type Kind = 'functional' | 'compatibility' | 'performance' | 'stress' | 'reliability'

const KINDS: { id: Kind; title: string; question: string; how: string; pass: string; tools: string }[] = [
  { id: 'functional', title: 'Functional', question: 'Does it work at all?', how: 'Power on, POST, every part seen by the BMC and the OS, boots its operating system, every port links.', pass: 'Everything in the BOM is present and answers.', tools: 'ipmitool, dmidecode, lsblk, ip link' },
  { id: 'compatibility', title: 'Compatibility', question: 'Does this part work with that board, firmware and OS?', how: 'The exact combination the customer ordered: BIOS and BMC versions, NIC and drive firmware, the OS image, Secure Boot.', pass: 'The combination boots and behaves, with no errors in the logs.', tools: 'firmware matrix, OS install, dmesg' },
  { id: 'performance', title: 'Performance', question: 'Does it reach the expected numbers, and the same as its neighbours?', how: 'Fixed benchmarks with fixed parameters, compared with a baseline and with the rack median.', pass: 'Above the minimum and within 15% of the median.', tools: 'fio, iperf3, stress-ng metrics, STREAM, NCCL tests' },
  { id: 'stress', title: 'Stress', question: 'Does it keep working at full load?', how: 'Everything at maximum at once: CPU, memory with verification, storage, network, so heat and power peak.', pass: 'No errors, no throttling beyond spec, no resets.', tools: 'stress-ng --verify, memtester, fio, turbostat' },
  { id: 'reliability', title: 'Reliability', question: 'Does it keep working for hours or days?', how: 'Long burn-in and repeated cycles (power, reboot, BMC), with every log saved and compared.', pass: 'Nothing new in the SEL or the kernel log, counters unchanged.', tools: 'burn-in suite, SEL, power-cycle loops' },
]

const FINDINGS: { text: string; kind: Kind }[] = [
  { text: 'After boot, the OS lists one NIC; the BOM says two.', kind: 'functional' },
  { text: 'A new NIC firmware breaks network boot with the BIOS the customer ordered.', kind: 'compatibility' },
  { text: 'fio random read on one node is 20% under the rack median.', kind: 'performance' },
  { text: 'Memory errors appear only after 40 minutes at full load.', kind: 'stress' },
  { text: 'A power supply fails after 30 hours of burn-in.', kind: 'reliability' },
  { text: 'The OS image does not boot with Secure Boot enabled.', kind: 'compatibility' },
  { text: 'A 25G link reaches 9.4 Gbit/s in iperf3.', kind: 'performance' },
  { text: 'The CPU drops to 60% of its clock under full load.', kind: 'stress' },
  { text: 'The BMC stops answering after 200 power cycles.', kind: 'reliability' },
]

export function TestTypes({ meta }: { meta: LessonMeta }) {
  const [sel, setSel] = useState<Kind>('functional')
  const [answers, setAnswers] = useState<(Kind | '')[]>(() => FINDINGS.map(() => ''))
  const [checked, setChecked] = useState(false)
  const k = KINDS.find((x) => x.id === sel)!
  const right = answers.filter((a, i) => a === FINDINGS[i].kind).length
  const allRight = checked && right === FINDINGS.length
  useEffect(() => {
    if (allRight) markDone(meta.id)
  }, [allRight, meta.id])

  return (
    <div className="lesson">
      <div className="tt-kinds">
        {KINDS.map((x, i) => (
          <button key={x.id} className={`tt-kind${sel === x.id ? ' is-on' : ''}`} onClick={() => setSel(x.id)}>
            <span className="tt-n">{i + 1}</span>
            <strong>{x.title}</strong>
            <span>{x.question}</span>
          </button>
        ))}
      </div>
      <Card title={k.title}>
        <dl className="kv">
          <dt>Question</dt>
          <dd>{k.question}</dd>
          <dt>How</dt>
          <dd>{k.how}</dd>
          <dt>Pass when</dt>
          <dd>{k.pass}</dd>
          <dt>Tools</dt>
          <dd>
            <code>{k.tools}</code>
          </dd>
        </dl>
      </Card>

      <Card title="Which test catches it?">
        <p className="muted">Sort each finding to the kind of test that would catch it, then check.</p>
        <ol className="tt-list">
          {FINDINGS.map((f, i) => {
            const state = !checked || !answers[i] ? '' : answers[i] === f.kind ? ' is-right' : ' is-wrong'
            return (
              <li key={f.text} className={`tt-row${state}`}>
                <span>{f.text}</span>
                <select
                  value={answers[i]}
                  onChange={(e) => {
                    setAnswers(answers.map((a, j) => (j === i ? (e.target.value as Kind) : a)))
                    setChecked(false)
                  }}
                  aria-label={`Test kind for: ${f.text}`}
                >
                  <option value="">choose</option>
                  {KINDS.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.title}
                    </option>
                  ))}
                </select>
              </li>
            )
          })}
        </ol>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => setChecked(true)} disabled={answers.some((a) => !a)}>
            Check
          </button>
          {checked && (
            <Verdict ok={allRight}>
              {right} of {FINDINGS.length} right
            </Verdict>
          )}
        </div>
      </Card>

      <KeyPoints
        points={[
          'A test case is one check: steps, expected result, actual result. A test plan lists the cases, the setup and the pass criteria.',
          'Functional and compatibility come first: no point measuring a node that is missing a part or runs the wrong firmware.',
          'Performance is judged twice: against a fixed minimum and against the neighbours.',
          'Stress finds what breaks at the limit; reliability finds what breaks with time.',
        ]}
      />
    </div>
  )
}

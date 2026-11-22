import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { markDone } from '../progress'

// Server Build: assemble a 1U two-socket server from an order sheet, then power it on and see what
// POST and a BOM check would say. Parts are dragged (or clicked, then a slot clicked) into a top view.

type Kind = 'cpu' | 'heatsink' | 'dimm' | 'udimm' | 'nvme' | 'nic' | 'fan' | 'psu'
type Fixed = 'bmc' | 'bios' | 'riser' | 'backplane'

const TRAY: { kind: Kind; count: number; name: string }[] = [
  { kind: 'cpu', count: 2, name: 'CPU, 32 cores' },
  { kind: 'heatsink', count: 2, name: 'Heatsink' },
  { kind: 'dimm', count: 8, name: '64 GB RDIMM (ECC)' },
  { kind: 'udimm', count: 2, name: '32 GB desktop DIMM' },
  { kind: 'nvme', count: 4, name: '3.84 TB NVMe drive' },
  { kind: 'nic', count: 1, name: '2 × 100G network card' },
  { kind: 'fan', count: 7, name: 'Fan' },
  { kind: 'psu', count: 2, name: 'Power supply, 1600 W' },
]

const INFO: Record<Kind | Fixed | 'esd', { title: string; text: string }> = {
  esd: { title: 'ESD wrist strap', text: 'Clipped to the chassis, it keeps you at the same potential as the server, so a static spark from your hand cannot damage a component. It goes on before you touch any part.' },
  cpu: { title: 'CPU', text: 'The processor, in its socket. Two sockets make two NUMA nodes: each CPU has its own memory and PCIe lanes, and reaching the other CPU\'s memory crosses the link between them (UPI on Intel, Infinity Fabric on AMD).' },
  heatsink: { title: 'Heatsink', text: 'Sits on the CPU and carries its heat into the airflow. A CPU without its heatsink overheats within seconds and the board shuts it down. Tighten it in the order printed on it.' },
  dimm: { title: 'RDIMM (registered DIMM, ECC)', text: 'Server memory: a register buffers the signals, and ECC corrects single-bit errors and reports them. Fill the slots in the order of the board manual\'s population table, the same on both CPUs, so every channel is used evenly.' },
  udimm: { title: 'Desktop DIMM (unbuffered, no ECC)', text: 'Memory for a desktop PC. A server board that takes RDIMMs does not accept it, and it has no ECC. It is not on the order: a trap.' },
  nvme: { title: 'NVMe drive (U.2)', text: 'A solid-state drive that talks PCIe directly, the fastest kind. Hot-swap bays at the front; the order says which bays. A drive that is not pushed in all the way is not seen at all.' },
  nic: { title: 'Network card, 2 × 100G', text: 'Two 100G ports for the data network. It needs a full x16 PCIe 5.0 slot: in an x4 slot it trains at x4 (lspci shows LnkSta x4) and cannot reach its speed.' },
  fan: { title: 'Fan', text: 'Part of the fan wall that pulls cold air in at the front, across the CPUs and memory, and out at the back. The BMC sets the speed from the temperature sensors.' },
  psu: { title: 'Power supply (PSU)', text: 'Two of them, 1+1: either one alone can run the server. PSU 1 goes on PDU A, PSU 2 on PDU B, so a whole power feed can fail without stopping the server.' },
  bmc: { title: 'BMC (already on the board)', text: 'The always-on management computer, with its own network port at the back: power control, sensors, event log, remote console and firmware updates over IPMI and Redfish, even with the server off.' },
  bios: { title: 'BIOS flash (already on the board)', text: 'Holds the firmware that runs POST: memory training, finding every device, then the boot order. Its version must match the order\'s baseline.' },
  riser: { title: 'Riser slot 1: PCIe 5.0 x16', text: 'A riser turns the slot sideways so a full card fits in a 1U chassis. Sixteen lanes of PCIe 5.0: about 64 GB/s each way.' },
  backplane: { title: 'Drive backplane', text: 'The board behind the front bays that connects every drive to the system.' },
}

const BANKS = [
  { cpu: 0, y: 70, slots: ['A1', 'B1', 'C1', 'D1'] },
  { cpu: 0, y: 196, slots: ['E1', 'F1', 'G1', 'H1'] },
  { cpu: 1, y: 262, slots: ['A1', 'B1', 'C1', 'D1'] },
  { cpu: 1, y: 388, slots: ['E1', 'F1', 'G1', 'H1'] },
]
const POPULATION = ['A1', 'C1', 'E1', 'G1']
const ACCEPTS = (slot: string, kind: Kind) =>
  slot.startsWith('bay') ? kind === 'nvme'
  : slot.startsWith('fan') ? kind === 'fan'
  : slot.startsWith('cpu') ? kind === 'cpu' || kind === 'heatsink'
  : slot.startsWith('dimm') ? kind === 'dimm' || kind === 'udimm'
  : slot.startsWith('pcie') ? kind === 'nic'
  : slot.startsWith('psu') ? kind === 'psu' : false

type Check = { ok: boolean; title: string; detail: string }

export function ServerBuild() {
  const [placed, setPlaced] = useState<Record<string, Kind>>({})
  const [sinks, setSinks] = useState<string[]>([])
  const [esd, setEsd] = useState(false)
  const [esdMisses, setEsdMisses] = useState(0)
  const [sel, setSel] = useState<Kind | null>(null)
  const [info, setInfo] = useState<{ key: Kind | Fixed | 'esd'; slot?: string } | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ kind: Kind; x: number; y: number; moved: boolean } | null>(null)
  const [result, setResult] = useState<Check[] | null>(null)
  const dragRef = useRef(drag)
  dragRef.current = drag

  const used = (k: Kind) => (k === 'heatsink' ? sinks.length : Object.values(placed).filter((v) => v === k).length)
  const left = (k: Kind) => TRAY.find((t) => t.kind === k)!.count - used(k)

  const place = (kind: Kind, slot: string) => {
    setResult(null)
    if (left(kind) <= 0) return setNote('None of those left on the tray.')
    if (!ACCEPTS(slot, kind)) return setNote(`A ${INFO[kind].title.toLowerCase()} does not go there.`)
    if (!esd) {
      setEsdMisses((n) => n + 1)
      setNote('Careful: you touched a part without the wrist strap. Put it on first.')
    } else setNote(null)
    if (kind === 'heatsink') {
      if (placed[slot] !== 'cpu') return setNote('Install the CPU first: the heatsink sits on top of it.')
      if (sinks.includes(slot)) return setNote('That CPU already has its heatsink.')
      setSinks([...sinks, slot])
    } else {
      if (placed[slot]) return setNote('That slot is taken. Click the part to remove it first.')
      setPlaced({ ...placed, [slot]: kind })
    }
    setInfo({ key: kind, slot })
    if (left(kind) <= 1 && sel === kind) setSel(null)
  }
  const remove = (slot: string) => {
    if (slot.startsWith('cpu') && sinks.includes(slot)) setSinks(sinks.filter((s) => s !== slot))
    else {
      const next = { ...placed }
      delete next[slot]
      setPlaced(next)
    }
    setInfo(null)
    setResult(null)
  }

  // drag with the pointer; a short press without movement selects the part instead
  useEffect(() => {
    if (!drag) return
    const move = (e: PointerEvent) => setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY, moved: d.moved || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4 } : d))
    const up = (e: PointerEvent) => {
      const d = dragRef.current
      setDrag(null)
      if (!d) return
      if (!d.moved) {
        setSel(d.kind)
        setInfo({ key: d.kind })
        return
      }
      const slot = (document.elementFromPoint(e.clientX, e.clientY) as Element | null)?.closest('[data-slot]')?.getAttribute('data-slot')
      if (slot) place(d.kind, slot)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  })

  const clickSlot = (slot: string) => {
    if (sel) return place(sel, slot)
    const k = slot.startsWith('cpu') && sinks.includes(slot) ? 'heatsink' : placed[slot]
    if (k) setInfo({ key: k, slot })
  }

  const powerOn = () => {
    const dimmSlots = Object.entries(placed).filter(([, k]) => k === 'dimm' || k === 'udimm')
    const want = [0, 1].flatMap((c) => POPULATION.map((s) => `dimm-${c}-${s}`))
    const memOk = dimmSlots.length === 8 && dimmSlots.every(([s, k]) => k === 'dimm' && want.includes(s))
    const udimm = dimmSlots.some(([, k]) => k === 'udimm')
    const bays = Object.entries(placed).filter(([s, k]) => s.startsWith('bay') && k === 'nvme').map(([s]) => Number(s.slice(3)))
    const checks: Check[] = [
      { ok: esdMisses === 0, title: 'Wrist strap on before the first part', detail: esdMisses ? `${esdMisses} part(s) handled without it. A static spark can kill a DIMM or a CPU without a visible mark.` : 'Every part was handled safely.' },
      { ok: placed.cpu0 === 'cpu' && placed.cpu1 === 'cpu', title: 'Both CPUs in their sockets', detail: 'The order is a two-socket server: two CPUs, two NUMA nodes.' },
      { ok: sinks.length === 2 && sinks.includes('cpu0') && sinks.includes('cpu1'), title: 'A heatsink on every CPU', detail: 'Without it the CPU overheats in seconds and the board shuts it down before POST ends.' },
      { ok: !udimm, title: 'Server memory only (RDIMM with ECC)', detail: udimm ? 'A desktop DIMM is in: the board does not accept unbuffered memory and POST stops at memory training.' : 'Only RDIMMs.' },
      { ok: memOk, title: 'Memory per the population table: A1, C1, E1, G1 on both CPUs', detail: memOk ? '512 GB, one DIMM in every other channel, the same on both CPUs.' : 'Wrong slots or count: the BOM check fails, and uneven channels lower memory bandwidth.' },
      { ok: bays.length === 4 && [0, 1, 2, 3].every((b) => bays.includes(b)), title: 'Four NVMe drives in bays 0 to 3', detail: 'The order and the asset list say which bay holds which drive.' },
      { ok: placed.pcie1 === 'nic', title: 'Network card in the x16 slot', detail: placed.pcie2 === 'nic' ? 'It is in the x4 slot: LnkSta shows x4 and 2 × 100G cannot run at speed.' : placed.pcie1 === 'nic' ? 'LnkSta x16, full speed.' : 'The card is missing.' },
      { ok: Array.from({ length: 7 }, (_, i) => placed[`fan${i}`] === 'fan').every(Boolean), title: 'All seven fans', detail: 'A gap in the fan wall leaves a hot spot and the BMC logs a fan failure.' },
      { ok: placed.psu0 === 'psu' && placed.psu1 === 'psu', title: 'Two power supplies (1+1)', detail: 'With one, the server runs but has no redundancy: losing that feed stops it.' },
    ]
    setResult(checks)
    setInfo(null)
    if (checks.every((c) => c.ok)) markDone('server-build')
  }

  const reset = () => {
    setPlaced({})
    setSinks([])
    setEsd(false)
    setEsdMisses(0)
    setSel(null)
    setInfo(null)
    setNote(null)
    setResult(null)
  }

  const hot = (slot: string) => {
    const k = drag?.kind ?? sel
    return k && ACCEPTS(slot, k) ? ' is-target' : ''
  }
  const Slot = ({ id, x, y, w, h, rx = 3 }: { id: string; x: number; y: number; w: number; h: number; rx?: number }) => (
    <rect data-slot={id} x={x} y={y} width={w} height={h} rx={rx} className={`sb-slot${hot(id)}`} onClick={() => clickSlot(id)} />
  )
  const passed = result?.every((c) => c.ok)

  return (
    <div className="sb page-fit">
      <aside className="panel sb-tray">
        <h2 className="panel-title">Order R-2001</h2>
        <p className="small">A 1U two-socket compute node: 2 CPUs with heatsinks, 8 × 64 GB RDIMM, 4 NVMe drives in bays 0 to 3, one 2 × 100G network card, 7 fans, 2 power supplies.</p>
        <p className="small sb-manual">
          <b>Board manual, memory population:</b> with 4 DIMMs per CPU use A1, C1, E1, G1, the same on both CPUs.
        </p>
        <button className={`btn btn-sm sb-esd${esd ? ' is-on' : ''}`} onClick={() => { setEsd(!esd); setInfo({ key: 'esd' }) }}>
          {esd ? 'Wrist strap on ✓' : 'Put on the wrist strap'}
        </button>
        <h3 className="panel-sub">Parts tray</h3>
        <ul className="sb-parts">
          {TRAY.map((t) => (
            <li key={t.kind}>
              <button
                className={`sb-part kind-${t.kind}${sel === t.kind ? ' is-on' : ''}`}
                disabled={left(t.kind) === 0}
                onPointerDown={(e: RPointerEvent) => { e.preventDefault(); setDrag({ kind: t.kind, x: e.clientX, y: e.clientY, moved: false }) }}
              >
                <i />
                <span>{t.name}</span>
                <b>× {left(t.kind)}</b>
              </button>
            </li>
          ))}
        </ul>
        <p className="muted small">Drag a part onto the board, or click it and then click a slot. Click a placed part to see what it is.</p>
      </aside>

      <section className="panel sb-board">
        <div className="sb-head">
          <strong>Build a server</strong>
          <span className="muted small">top view, lid off, front on the left</span>
          <div className="toolbar">
            <button className="btn btn-sm" onClick={reset}>Start again</button>
            <button className="btn btn-primary btn-sm" onClick={powerOn}>Power on</button>
          </div>
        </div>
        <div className="sb-canvas">
          <svg viewBox="0 0 900 480" className="dcx-svg" role="img" aria-label="Top view of an empty 1U two-socket server">
            <rect x={70} y={40} width={760} height={410} rx={8} className="dcx-chassis" />
            <text x={110} y={30} textAnchor="middle" className="dcx-small">front</text>
            <text x={790} y={30} textAnchor="middle" className="dcx-small">back</text>
            {Array.from({ length: 8 }, (_, i) => {
              const id = `bay${i}`
              return (
                <g key={id}>
                  <Slot id={id} x={80} y={50 + i * 49} w={70} h={43} />
                  {placed[id] && <rect x={82} y={52 + i * 49} width={66} height={39} rx={3} data-slot={id} className="dcx-drive sb-placed" onClick={() => clickSlot(id)} />}
                  <text x={115} y={76 + i * 49} textAnchor="middle" className="dcx-tiny sb-label">bay {i}</text>
                </g>
              )
            })}
            <line x1={162} x2={162} y1={48} y2={442} className="dcx-backplane" onClick={() => setInfo({ key: 'backplane' })} />
            {Array.from({ length: 7 }, (_, i) => {
              const id = `fan${i}`
              return (
                <g key={id} transform={`translate(210 ${74 + i * 56})`}>
                  <circle data-slot={id} r={23} className={`sb-slot${hot(id)}`} onClick={() => clickSlot(id)} />
                  {placed[id] && (
                    <g data-slot={id} className="sb-placed" onClick={() => clickSlot(id)}>
                      <circle r={21} className="dcx-fan" />
                      <path d="M0 -17 Q8 -6 0 0 Q-8 6 0 17 M-17 0 Q-6 -8 0 0 Q6 8 17 0" className="dcx-blade" />
                    </g>
                  )}
                </g>
              )
            })}
            {BANKS.map((b) =>
              b.slots.map((s, i) => {
                const id = `dimm-${b.cpu}-${s}`
                const k = placed[id]
                return (
                  <g key={id}>
                    <rect data-slot={id} x={286} y={b.y + i * 11} width={186} height={8} rx={2} className={`sb-slot${hot(id)}`} onClick={() => clickSlot(id)} />
                    {k && <rect x={286} y={b.y + i * 11} width={186} height={8} rx={2} data-slot={id} className={`sb-placed ${k === 'udimm' ? 'sb-udimm' : 'dcx-dimm'}`} onClick={() => clickSlot(id)} />}
                    <text x={280} y={b.y + i * 11 + 7} textAnchor="end" className="dcx-tiny sb-label">{`P${b.cpu + 1}-${s}`}</text>
                  </g>
                )
              }),
            )}
            {[{ id: 'cpu0', y: 118 }, { id: 'cpu1', y: 310 }].map((c, n) => (
              <g key={c.id}>
                <Slot id={c.id} x={334} y={c.y} w={92} h={70} rx={4} />
                {placed[c.id] && <rect x={340} y={c.y + 6} width={80} height={58} rx={3} data-slot={c.id} className="dcx-cpu sb-placed" onClick={() => clickSlot(c.id)} />}
                {sinks.includes(c.id) &&
                  Array.from({ length: 6 }, (_, i) => <line key={i} x1={342} x2={418} y1={c.y + 12 + i * 9} y2={c.y + 12 + i * 9} data-slot={c.id} className="sb-fin" onClick={() => clickSlot(c.id)} />)}
                <text x={380} y={c.y + 40} textAnchor="middle" className="dcx-label-in sb-label">{`CPU ${n}`}</text>
              </g>
            ))}
            <g onClick={() => (sel ? clickSlot('pcie1') : placed.pcie1 ? clickSlot('pcie1') : setInfo({ key: 'riser' }))}>
              <Slot id="pcie1" x={560} y={58} w={220} h={46} />
              {placed.pcie1 && <rect data-slot="pcie1" x={564} y={62} width={212} height={38} rx={3} className="dcx-card sb-placed" />}
              <text x={670} y={86} textAnchor="middle" className="dcx-tiny sb-label">riser slot 1: PCIe 5.0 x16</text>
            </g>
            <g>
              <Slot id="pcie2" x={560} y={118} w={150} h={32} />
              {placed.pcie2 && <rect x={564} y={121} width={142} height={26} rx={3} data-slot="pcie2" className="dcx-card sb-placed" onClick={() => clickSlot('pcie2')} />}
              <text x={635} y={138} textAnchor="middle" className="dcx-tiny sb-label">slot 2: PCIe 4.0 x4</text>
            </g>
            <g className="sb-fixed" onClick={() => setInfo({ key: 'bios' })}>
              <rect x={515} y={236} width={40} height={26} rx={2} className="dcx-chip" />
              <text x={535} y={276} textAnchor="middle" className="dcx-tiny">BIOS</text>
            </g>
            <g className="sb-fixed" onClick={() => setInfo({ key: 'bmc' })}>
              <rect x={600} y={240} width={46} height={36} rx={2} className="dcx-chip is-bmc" />
              <text x={623} y={262} textAnchor="middle" className="dcx-label-in">BMC</text>
            </g>
            {[{ id: 'psu0', y: 320, t: 'PSU 1 · feed A', c: 'a' }, { id: 'psu1', y: 384, t: 'PSU 2 · feed B', c: 'b' }].map((p) => (
              <g key={p.id}>
                <Slot id={p.id} x={680} y={p.y} w={146} h={56} />
                {placed[p.id] && <rect x={683} y={p.y + 3} width={140} height={50} rx={3} data-slot={p.id} className={`dcx-psu is-${p.c} sb-placed`} onClick={() => clickSlot(p.id)} />}
                <text x={753} y={p.y + 32} textAnchor="middle" className="dcx-tiny sb-label">{p.t}</text>
              </g>
            ))}
          </svg>
          {drag?.moved && (
            <div className={`sb-ghost kind-${drag.kind}`} style={{ left: drag.x + 8, top: drag.y + 8 }}>
              {TRAY.find((t) => t.kind === drag.kind)!.name}
            </div>
          )}
        </div>
        {note && <p className="sb-note">{note}</p>}
      </section>

      <aside className="panel sb-side">
        {result ? (
          <>
            <h2 className="panel-title">{passed ? 'POST passed, BOM check matches' : 'Power on: what POST and the BOM check say'}</h2>
            <ul className="rs-rules">
              {result.map((c) => (
                <li key={c.title} className={c.ok ? 'ok' : 'bad'}>
                  <b>{c.ok ? 'OK' : 'Fix'}</b>
                  <span>
                    <strong>{c.title}.</strong> {c.detail}
                  </span>
                </li>
              ))}
            </ul>
            {passed && <p className="small">This is what L10 means: one complete server, built to the order and checked. Next it goes into the rack.</p>}
          </>
        ) : info ? (
          <>
            <h2 className="panel-title">{INFO[info.key].title}</h2>
            <p className="small">{INFO[info.key].text}</p>
            {info.slot && (placed[info.slot] || (info.slot.startsWith('cpu') && sinks.includes(info.slot))) && (
              <button className="btn btn-sm" onClick={() => remove(info.slot!)}>
                Take it out
              </button>
            )}
          </>
        ) : (
          <>
            <h2 className="panel-title">How to play</h2>
            <ol className="small sb-steps">
              <li>Put on the wrist strap.</li>
              <li>CPUs into the sockets, then a heatsink on each.</li>
              <li>Memory in the slots the manual names.</li>
              <li>Drives, the network card, fans and power supplies.</li>
              <li>Power on and read what the checks say.</li>
            </ol>
            <p className="muted small">Some parts on the tray are not on the order. Click the BMC, the BIOS chip or any slot to learn what it is.</p>
          </>
        )}
      </aside>
    </div>
  )
}

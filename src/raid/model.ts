// Where every block of a file lands on the disks of an array, for each RAID level, and which disk
// failures each level survives. Shared by the RAID lessons and the RAID Rescue game.

export type Level = 'single' | 'jbod' | 'raid0' | 'raid1' | 'raid5' | 'raid6' | 'raid10'
export type Kind = 'data' | 'copy' | 'p' | 'q'

export interface Slot {
  label: string
  kind: Kind
  /** Index of the data block in the file (data and copy slots). */
  src?: number
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const LEVEL_NAME: Record<Level, string> = {
  single: 'One disk',
  jbod: 'JBOD',
  raid0: 'RAID 0',
  raid1: 'RAID 1',
  raid5: 'RAID 5',
  raid6: 'RAID 6',
  raid10: 'RAID 10',
}

export const MIN_DISKS: Record<Level, number> = { single: 1, jbod: 1, raid0: 2, raid1: 2, raid5: 3, raid6: 4, raid10: 4 }

/** Data blocks per stripe (row). */
export function dataPerRow(level: Level, disks: number): number {
  switch (level) {
    case 'raid0':
      return disks
    case 'raid5':
      return disks - 1
    case 'raid6':
      return disks - 2
    case 'raid10':
      return disks / 2
    default:
      return 1
  }
}

export function rowCount(level: Level, disks: number, blocks: number): number {
  if (level === 'jbod') return Math.ceil(blocks / disks)
  return Math.ceil(blocks / dataPerRow(level, disks))
}

/** Parity disk of a stripe: one disk to the left per stripe, starting on the last disk. */
export const parityDisk = (disks: number, row: number) => (disks - 1 - (row % disks) + disks) % disks

/** The slot on disk `d` in row `r`, or null when the file has no block there. */
export function slotAt(level: Level, disks: number, blocks: number, d: number, r: number): Slot | null {
  const data = (i: number, kind: Kind = 'data'): Slot | null => (i < blocks ? { label: LETTERS[i] ?? `B${i}`, kind, src: i } : null)
  switch (level) {
    case 'single':
      return data(r)
    case 'jbod':
      return data(d * rowCount(level, disks, blocks) + r)
    case 'raid0':
      return data(r * disks + d)
    case 'raid1':
      return data(r, d === 0 ? 'data' : 'copy')
    case 'raid10':
      return data(r * (disks / 2) + Math.floor(d / 2), d % 2 === 0 ? 'data' : 'copy')
    case 'raid5':
    case 'raid6': {
      const p = parityDisk(disks, r)
      const q = (p + 1) % disks
      const two = level === 'raid6'
      if (d === p) return { label: `P${r + 1}`, kind: 'p' }
      if (two && d === q) return { label: `Q${r + 1}`, kind: 'q' }
      const order = Array.from({ length: disks }, (_, i) => i).filter((i) => i !== p && (!two || i !== q))
      return data(r * dataPerRow(level, disks) + order.indexOf(d))
    }
  }
}

export function grid(level: Level, disks: number, blocks: number): (Slot | null)[][] {
  const rows = rowCount(level, disks, blocks)
  return Array.from({ length: disks }, (_, d) => Array.from({ length: rows }, (_, r) => slotAt(level, disks, blocks, d, r)))
}

export type Health = 'optimal' | 'degraded' | 'failed' | 'partial'

/** Health of an array with these disks missing (failed, or replaced and not yet rebuilt). */
export function health(level: Level, disks: number, missing: number[]): Health {
  const m = new Set(missing)
  if (m.size === 0) return 'optimal'
  switch (level) {
    case 'single':
    case 'raid0':
      return 'failed'
    case 'jbod':
      return m.size >= disks ? 'failed' : 'partial'
    case 'raid1':
      return m.size >= disks ? 'failed' : 'degraded'
    case 'raid5':
      return m.size >= 2 ? 'failed' : 'degraded'
    case 'raid6':
      return m.size >= 3 ? 'failed' : 'degraded'
    case 'raid10':
      for (let p = 0; p < disks / 2; p++) if (m.has(2 * p) && m.has(2 * p + 1)) return 'failed'
      return 'degraded'
  }
}

/** Usable capacity in disks' worth. */
export function usableDisks(level: Level, disks: number): number {
  switch (level) {
    case 'raid1':
      return 1
    case 'raid5':
      return disks - 1
    case 'raid6':
      return disks - 2
    case 'raid10':
      return disks / 2
    default:
      return disks
  }
}

export const WRITE_PENALTY: Record<Level, number> = { single: 1, jbod: 1, raid0: 1, raid1: 2, raid5: 4, raid6: 6, raid10: 2 }

/** What a level survives, in words. */
export function survives(level: Level, disks: number): string {
  switch (level) {
    case 'raid1':
      return disks > 2 ? `${disks - 1} of ${disks} disks` : '1 disk'
    case 'raid5':
      return 'any 1 disk'
    case 'raid6':
      return 'any 2 disks'
    case 'raid10':
      return '1 per mirror pair'
    default:
      return 'no disk'
  }
}

/** XOR of 4-bit values, as used for parity. */
export const xor = (...v: number[]) => v.reduce((a, b) => a ^ b, 0)
export const bits = (v: number) => v.toString(2).padStart(4, '0')

import type { StageLesson } from '../engine/StageLesson'
import { RaidStage, type RaidStep } from './RaidStage'

// The RAID chapter, one level per lesson. Each step sets the array's state; RaidStage animates the change.

const M4 = [
  { id: 'disks', label: 'Disks', start: '-' },
  { id: 'usable', label: 'Usable', start: '-' },
  { id: 'survives', label: 'Survives', start: '-' },
  { id: 'status', label: 'Status', start: '-' },
]

export const RAID_WHY: StageLesson<RaidStep> = {
  Stage: RaidStage,
  metrics: M4,
  intro: [
    'A file is stored on disk as blocks. This lesson starts with one disk, shows what happens when it dies, then adds disks the simple way (JBOD) before the idea that the rest of the chapter is about: RAID.',
    'Every disk in this chapter holds 4 TB, so capacities are easy to compare.',
  ],
  legend: [
    ['Block', 'A piece of the file, shown as a letter'],
    ['Controller', 'The card or software that decides where each block goes'],
    ['Disk', 'A drive in a bay: an HDD or an SSD'],
  ],
  steps: [
    {
      short: 'One disk',
      title: 'A file on one disk',
      tag: 'action',
      explain: [
        'The operating system writes the file as blocks. With one disk, every block lives in exactly one place.',
        'That is fine until the disk fails, and every disk fails eventually: worn bearings and heads in an HDD, worn-out flash or a dead controller chip in an SSD.',
      ],
      key: 'One disk is one place to lose everything.',
      m: { disks: '1 × 4 TB', usable: '4 TB', survives: 'no disk', status: 'Optimal' },
      s: { level: 'single', disks: 1, blocks: 5 },
    },
    {
      short: 'It fails',
      title: 'The only disk dies',
      tag: 'event',
      explain: [
        'The disk stops answering. Every block of the file was on it, so the file is gone, and so is everything else on that disk.',
        'Only a backup brings it back: a copy somewhere else, made before the failure.',
      ],
      key: 'Every drive fails one day; the question is what you lose when it does.',
      m: { status: 'Data lost' },
      s: { level: 'single', disks: 1, blocks: 5, failed: [0] },
    },
    {
      short: 'JBOD',
      title: 'JBOD: just a bunch of disks',
      tag: 'action',
      explain: [
        'More disks, no RAID. Either each disk shows up on its own, or the disks are joined end to end into one big volume (spanning), as here: the file fills disk 1, then disk 2, then disk 3.',
        'All the capacity is usable: 3 × 4 TB = 12 TB. Nothing is spent on protection.',
        'JBOD is also the name for a disk shelf: an enclosure full of drives with no server inside.',
      ],
      key: 'JBOD adds capacity, never safety.',
      m: { disks: '3 × 4 TB', usable: '12 TB (100%)', survives: 'no disk', status: 'Optimal' },
      s: { level: 'jbod', disks: 3, blocks: 12 },
    },
    {
      short: 'A JBOD disk fails',
      title: 'One disk of the JBOD fails',
      tag: 'event',
      explain: [
        'Only the blocks on disk 2 are lost: E, F, G and H. Files that lived entirely on disk 1 or disk 3 still read.',
        'But this file spanned all three disks, so it is broken anyway. JBOD protects nothing.',
        'Where JBOD makes sense: behind an HBA that passes every disk straight through, so that software such as ZFS or Ceph does the redundancy itself.',
      ],
      key: 'A JBOD disk failure loses that disk. A spanned volume across it is broken.',
      m: { status: 'Disk 2 lost' },
      s: { level: 'jbod', disks: 3, blocks: 12, failed: [1] },
    },
    {
      short: 'The RAID idea',
      title: 'RAID: several disks that act as one',
      tag: 'technique',
      explain: [
        'RAID (redundant array of independent disks) puts a controller between the OS and the disks. The OS sees one disk; the controller spreads the blocks so the array is faster, safer, or both.',
        'Three tricks, used alone or mixed: striping (split the data across disks, for speed), mirroring (keep copies, for safety) and parity (a computed block that can rebuild a lost one, for safety at lower cost).',
        'The controller is a RAID card in a PCIe slot, the RAID mode of the motherboard, or software in the OS such as Linux mdadm.',
      ],
      key: 'RAID = striping, mirroring, parity, or a mix of them.',
      m: { disks: '4 × 4 TB', usable: '12 TB (75%)', survives: 'any 1 disk', status: 'Optimal' },
      s: { level: 'raid5', disks: 4, blocks: 12, ctrl: 'RAID controller' },
    },
    {
      short: 'Words to know',
      title: 'Array, stripe, chunk, degraded, rebuild',
      tag: 'result',
      explain: [
        'Array: the disks a controller combines. Stripe: one row across the disks, like the highlighted row. Chunk (or stripe unit): the piece of a stripe on one disk, often 64 KB to 1 MB.',
        'Degraded: the array works with a disk missing. Rebuild: the controller fills a new disk with what the dead one held. Hot spare: an idle disk the controller uses for a rebuild as soon as a disk fails.',
        'And the most important one: RAID is not a backup. A deleted or encrypted file is deleted or encrypted on every disk at the same moment.',
      ],
      key: 'RAID keeps a server running through a dead disk. Backups bring back lost data.',
      s: { level: 'raid5', disks: 4, blocks: 12, hot: 0, ctrl: 'RAID controller', note: 'The highlighted row is one stripe: three data chunks and one parity chunk.' },
    },
  ],
}

export const RAID_0: StageLesson<RaidStep> = {
  Stage: RaidStage,
  metrics: [
    { id: 'disks', label: 'Disks', start: '2 × 4 TB' },
    { id: 'usable', label: 'Usable', start: '-' },
    { id: 'survives', label: 'Survives', start: '-' },
    { id: 'speed', label: 'Throughput', start: '-' },
  ],
  intro: ['RAID 0 splits the data across the disks and keeps no copy and no parity. It is the fastest level and the only one with no protection at all.', 'Watch where each block lands, then what one dead disk does.'],
  legend: [
    ['Striping', 'Consecutive chunks go to different disks'],
    ['Minimum', '2 disks'],
  ],
  steps: [
    {
      short: 'The file',
      title: 'A file of 10 blocks arrives',
      explain: ['The controller receives a 10-block file. In RAID 0 it will split the file over two disks, and nothing else.'],
      s: { level: 'raid0', disks: 2, blocks: 10, rows: 0 },
    },
    {
      short: 'Stripe 1',
      title: 'A to disk 1, B to disk 2, at the same time',
      tag: 'action',
      explain: [
        'The first chunk goes to disk 1, the next to disk 2, and both disks write at once. That row is a stripe.',
        'The chunk size is set when the array is created; 64 KB to 256 KB is common.',
      ],
      key: 'Striping: the disks share the work.',
      s: { level: 'raid0', disks: 2, blocks: 10, rows: 1, hot: 0 },
    },
    {
      short: 'All stripes',
      title: 'Every other block on each disk',
      tag: 'result',
      explain: [
        'C and D, E and F, and so on: disk 1 holds A, C, E, G, I and disk 2 holds B, D, F, H, J.',
        'Reading the file, both disks deliver at the same time: about twice the throughput of one disk, and roughly N times with N disks.',
      ],
      key: 'More disks in RAID 0, more speed.',
      m: { speed: '~2× one disk' },
      s: { level: 'raid0', disks: 2, blocks: 10 },
    },
    {
      short: 'Capacity',
      title: 'Capacity: all of it',
      explain: [
        'Usable capacity is the sum of the disks: 2 × 4 TB = 8 TB. Nothing is spent on copies or parity.',
        'The array is limited by its smallest disk: mix a 4 TB and a 2 TB disk and you get 2 × 2 TB.',
      ],
      m: { usable: '8 TB (100%)', survives: 'no disk' },
      s: { level: 'raid0', disks: 2, blocks: 10 },
    },
    {
      short: 'Disk 2 fails',
      title: 'One disk dies, the array is gone',
      tag: 'event',
      explain: [
        'B, D, F, H and J are gone. Every file larger than one chunk has holes, so the whole array is lost, not half of it.',
        'With two disks, the array is about twice as likely to fail as one disk, and with eight disks about eight times. The R in RAID does not apply to RAID 0.',
      ],
      key: 'One disk lost = the whole RAID 0 lost.',
      s: { level: 'raid0', disks: 2, blocks: 10, failed: [1] },
    },
    {
      short: 'Where it fits',
      title: 'Only for data you can lose',
      tag: 'technique',
      explain: [
        'Scratch space, caches, render and build temp files: anything that can be recreated. On a test bench, a RAID 0 across NVMe drives shows the maximum throughput a server can reach.',
        'Never for data that exists nowhere else.',
      ],
      key: 'RAID 0: speed and full capacity, zero protection.',
      s: { level: 'raid0', disks: 2, blocks: 10 },
    },
  ],
}

export const RAID_1: StageLesson<RaidStep> = {
  Stage: RaidStage,
  metrics: [
    { id: 'disks', label: 'Disks', start: '2 × 4 TB' },
    { id: 'usable', label: 'Usable', start: '-' },
    { id: 'survives', label: 'Survives', start: '-' },
    { id: 'write', label: 'Write cost', start: '-' },
  ],
  intro: ['RAID 1 writes every block to every disk of the mirror. Simple, safe, and half the capacity is spent on the copy.'],
  legend: [
    ['Mirroring', 'The same data on every disk'],
    ['Minimum', '2 disks'],
  ],
  steps: [
    {
      short: 'The file',
      title: 'A file of 5 blocks arrives',
      explain: ['Two disks form a mirror. The controller will write the file twice.'],
      s: { level: 'raid1', disks: 2, blocks: 5, rows: 0 },
    },
    {
      short: 'Write twice',
      title: 'Block A goes to both disks',
      tag: 'action',
      explain: ['Every write goes to every disk in the mirror: two disk writes for one block. That is the write penalty of RAID 1: 2.'],
      key: 'Mirroring: the same block on every disk.',
      m: { write: '2 I/O per write' },
      s: { level: 'raid1', disks: 2, blocks: 5, rows: 1, hot: 0 },
    },
    {
      short: 'Full mirror',
      title: 'Both disks hold the same data',
      tag: 'result',
      explain: [
        'A to E on disk 1, and the same A to E on disk 2.',
        'Reads can come from either disk, so a busy server reads faster. Writes are no faster than one disk.',
        'Usable capacity is one disk: 4 TB of 8 TB. With three disks in the mirror, still 4 TB, and two disks can fail.',
      ],
      m: { usable: '4 TB (50%)', survives: '1 disk' },
      s: { level: 'raid1', disks: 2, blocks: 5 },
    },
    {
      short: 'Disk 2 fails',
      title: 'A disk dies, nothing is lost',
      tag: 'event',
      explain: [
        'Disk 1 still has every block. The array keeps running, degraded: it works, but one more failure loses everything.',
        'The controller logs the failure and lights the bay LED; the BMC event log and the RAID tool show it too.',
      ],
      key: 'Degraded still works, with no protection left. Replace the disk now.',
      s: { level: 'raid1', disks: 2, blocks: 5, failed: [1] },
    },
    {
      short: 'Resync',
      title: 'A new disk, copied block by block',
      tag: 'action',
      explain: [
        'A new disk goes into the bay, or a hot spare takes over by itself. The controller copies disk 1 onto it: a resync.',
        'No parity math, just a copy, so the rebuild is fast and simple. When it ends, the mirror is optimal again.',
      ],
      s: { level: 'raid1', disks: 2, blocks: 5, spare: 1, rebuilt: 5, note: 'The new disk 2 is copied from disk 1; when the copy is done, the mirror is optimal again.' },
    },
    {
      short: 'Where it fits',
      title: 'Boot drives and small, important data',
      tag: 'technique',
      explain: [
        'Most servers boot from two M.2 or SATA SSDs in RAID 1, so the operating system survives a dead drive.',
        'Duplexing is the same mirror with each disk on its own controller, so a controller can fail too.',
      ],
      key: 'RAID 1: simple, safe, half the space.',
      s: { level: 'raid1', disks: 2, blocks: 5 },
    },
  ],
}

export const RAID_5: StageLesson<RaidStep> = {
  Stage: RaidStage,
  metrics: [
    { id: 'disks', label: 'Disks', start: '4 × 4 TB' },
    { id: 'usable', label: 'Usable', start: '-' },
    { id: 'survives', label: 'Survives', start: '-' },
    { id: 'write', label: 'Write cost', start: '-' },
  ],
  intro: [
    'RAID 5 stripes the data like RAID 0 and adds one parity block per stripe. Parity is not a copy: it is computed with XOR, and from it any one lost block of the stripe can be computed back.',
    'Four disks and 12 blocks, A to L.',
  ],
  legend: [
    ['Parity', 'P = XOR of the data blocks of the stripe'],
    ['Minimum', '3 disks'],
  ],
  steps: [
    {
      short: 'The file',
      title: 'Four disks, 12 blocks',
      explain: ['Each stripe will hold three data blocks and one parity block.'],
      s: { level: 'raid5', disks: 4, blocks: 12, rows: 0 },
    },
    {
      short: 'Stripe 1',
      title: 'A, B, C, and the parity P1',
      tag: 'action',
      explain: [
        'A, B and C go to disks 1, 2 and 3. The controller computes P1 = A XOR B XOR C and writes it to disk 4.',
        'One parity block protects the whole stripe.',
      ],
      key: 'Parity is computed, not copied.',
      s: { level: 'raid5', disks: 4, blocks: 12, rows: 1, hot: 0, xor: 'parity' },
    },
    {
      short: 'XOR by hand',
      title: 'How XOR makes parity',
      tag: 'technique',
      explain: [
        'XOR works on bits, column by column: an odd number of 1s gives 1, an even number gives 0.',
        'A is 1011, B is 0110, C is 1100. First column: 1, 0, 1, two 1s, so 0. Last column: 1, 0, 0, one 1, so 1. P1 = 0001.',
        'The useful part: XOR any three of the four blocks of a stripe and you get the fourth.',
      ],
      key: 'Lose any one block of a stripe and the other blocks give it back.',
      s: { level: 'raid5', disks: 4, blocks: 12, rows: 1, hot: 0, xor: 'parity' },
    },
    {
      short: 'Parity rotates',
      title: 'Stripe 2 puts its parity on disk 3',
      tag: 'action',
      explain: [
        'Each stripe moves the parity one disk to the left, so every disk takes its share of parity writes.',
        'RAID 4 kept all parity on one disk, and that disk became the bottleneck: every write touches it.',
      ],
      s: { level: 'raid5', disks: 4, blocks: 12, rows: 2, hot: 1 },
    },
    {
      short: 'All stripes',
      title: 'Parity once on every disk',
      tag: 'result',
      explain: [
        'Four stripes, and the parity sits once on each disk. The equivalent of one whole disk holds parity.',
        'Usable capacity is N − 1 disks: 3 × 4 TB = 12 TB of 16 TB.',
      ],
      m: { usable: '12 TB (75%)', survives: 'any 1 disk' },
      s: { level: 'raid5', disks: 4, blocks: 12 },
    },
    {
      short: 'Disk 2 fails',
      title: 'Reading B without disk 2',
      tag: 'event',
      explain: [
        'Disk 2 held B, E, P3 and J. To return B now, the controller reads A, C and P1 and computes B = A ⊕ C ⊕ P1.',
        'Every block can still be read, but each read of a lost block costs a read on every other disk: degraded, slower, and one more failure loses the array.',
      ],
      key: 'Degraded RAID 5: still working, no protection left.',
      s: { level: 'raid5', disks: 4, blocks: 12, failed: [1], hot: 0, read: 'B', xor: 'recover' },
    },
    {
      short: 'Rebuild',
      title: 'A new disk, computed stripe by stripe',
      tag: 'action',
      explain: [
        'A new disk replaces disk 2, or a hot spare starts by itself. For every stripe the controller reads the other disks and computes the missing block.',
        'It must read every other disk from start to end: on large HDDs that takes hours or days, while the server keeps working.',
      ],
      s: { level: 'raid5', disks: 4, blocks: 12, spare: 1, rebuilt: 4, note: 'Every block of the new disk 2 is computed from the other blocks of its stripe.' },
    },
    {
      short: 'The costs',
      title: 'Write penalty and rebuild risk',
      tag: 'technique',
      explain: [
        'A small write costs 4 disk I/O: read the old data, read the old parity, write the new data, write the new parity.',
        'During a rebuild there is no protection. A second disk failure, or one unreadable sector (URE) on a surviving disk, and that data is lost. That is why large HDD arrays use RAID 6.',
      ],
      key: 'RAID 5 on large disks: the rebuild is the dangerous part.',
      m: { write: '4 I/O per write' },
      s: { level: 'raid5', disks: 4, blocks: 12 },
    },
  ],
}

export const RAID_6: StageLesson<RaidStep> = {
  Stage: RaidStage,
  metrics: [
    { id: 'disks', label: 'Disks', start: '5 × 4 TB' },
    { id: 'usable', label: 'Usable', start: '-' },
    { id: 'survives', label: 'Survives', start: '-' },
    { id: 'write', label: 'Write cost', start: '-' },
  ],
  intro: ['RAID 6 is RAID 5 with a second, independent parity block in every stripe. It survives any two disks, including a second failure during a long rebuild.'],
  legend: [
    ['P', 'XOR parity, as in RAID 5'],
    ['Q', 'A second parity with different math'],
    ['Minimum', '4 disks'],
  ],
  steps: [
    {
      short: 'The file',
      title: 'Five disks, 12 blocks',
      explain: ['Each stripe will hold three data blocks, P and Q.'],
      s: { level: 'raid6', disks: 5, blocks: 12, rows: 0 },
    },
    {
      short: 'P and Q',
      title: 'Stripe 1: two different parities',
      tag: 'action',
      explain: [
        'P1 = A ⊕ B ⊕ C, exactly as in RAID 5. Q1 is computed with Reed-Solomon coding over a Galois field: different math on the same blocks.',
        'P and Q are two independent equations. With two equations, two unknown blocks can be solved, so any two disks can be lost.',
      ],
      key: 'Two independent parities: any two lost blocks come back.',
      s: { level: 'raid6', disks: 5, blocks: 12, rows: 1, hot: 0, xor: 'pq' },
    },
    {
      short: 'Both rotate',
      title: 'P and Q move left every stripe',
      tag: 'result',
      explain: [
        'Like RAID 5, the parity rotates, now two blocks per stripe.',
        'Usable capacity is N − 2 disks: 3 × 4 TB = 12 TB of 20 TB. With four disks RAID 6 keeps 50%, the same as RAID 10, but survives any two.',
      ],
      m: { usable: '12 TB (60%)', survives: 'any 2 disks' },
      s: { level: 'raid6', disks: 5, blocks: 12 },
    },
    {
      short: 'One fails',
      title: 'One disk fails: still protected',
      tag: 'event',
      explain: ['Disk 2 is gone. Every block still reads, and the array can survive one more failure. A RAID 5 would already have no protection left.'],
      s: { level: 'raid6', disks: 5, blocks: 12, failed: [1] },
    },
    {
      short: 'A second fails',
      title: 'A second disk dies during the rebuild',
      tag: 'event',
      explain: [
        'A new disk 2 is rebuilding when disk 4 fails too. A RAID 5 would be lost here. RAID 6 keeps serving data from the remaining blocks plus P and Q.',
        'This is the case RAID 6 exists for: rebuilds of large disks take long, and the surviving disks are worked hard the whole time.',
      ],
      key: 'RAID 6 survives a failure during the rebuild, when RAID 5 is most exposed.',
      s: { level: 'raid6', disks: 5, blocks: 12, failed: [3], spare: 1, rebuilt: 2 },
    },
    {
      short: 'The costs',
      title: 'More math, more writes',
      tag: 'technique',
      explain: [
        'A small write updates the data, P and Q: read three, write three, 6 disk I/O. RAID cards have their own processor for the parity math.',
        'Used for large capacity arrays of HDDs (8 TB and up), backup and archive storage.',
      ],
      key: 'RAID 6: N − 2 capacity, 6 I/O per write, safety for big disks.',
      m: { write: '6 I/O per write' },
      s: { level: 'raid6', disks: 5, blocks: 12 },
    },
  ],
}

export const RAID_10: StageLesson<RaidStep> = {
  Stage: RaidStage,
  metrics: [
    { id: 'disks', label: 'Disks', start: '4 × 4 TB' },
    { id: 'usable', label: 'Usable', start: '-' },
    { id: 'survives', label: 'Survives', start: '-' },
    { id: 'write', label: 'Write cost', start: '-' },
  ],
  intro: ['RAID 10 (also written RAID 1+0) builds mirror pairs first, then stripes the data across the pairs: the safety of RAID 1 with the speed of RAID 0.', 'Be ready to draw it in an interview: this is the drawing.'],
  legend: [
    ['Mirror pair', 'Two disks with the same data (RAID 1)'],
    ['Stripe', 'Chunks alternate between the pairs (RAID 0)'],
    ['Minimum', '4 disks, always an even number'],
  ],
  steps: [
    {
      short: 'The file',
      title: 'Four disks, 8 blocks',
      explain: ['Disks 1 and 2 form mirror pair 1, disks 3 and 4 mirror pair 2. Each pair is a RAID 1; the controller stripes over the pairs.'],
      s: { level: 'raid10', disks: 4, blocks: 8, rows: 0 },
    },
    {
      short: 'Stripe 1',
      title: 'A to pair 1, B to pair 2',
      tag: 'action',
      explain: ['A goes to pair 1 and lands on both of its disks. B goes to pair 2 and lands on both of its disks. Striping across the pairs, mirroring inside each pair.'],
      key: 'RAID 10 = a stripe (RAID 0) of mirrors (RAID 1).',
      s: { level: 'raid10', disks: 4, blocks: 8, rows: 1, hot: 0 },
    },
    {
      short: 'All written',
      title: 'Pair 1: A C E G. Pair 2: B D F H',
      tag: 'result',
      explain: [
        'Disks 1 and 2 both hold A, C, E, G; disks 3 and 4 both hold B, D, F, H.',
        'Usable capacity is half: 8 TB of 16 TB. Reads and writes are fast, and a write costs 2 disk I/O, with no parity to compute.',
      ],
      m: { usable: '8 TB (50%)', survives: '1 per pair', write: '2 I/O per write' },
      s: { level: 'raid10', disks: 4, blocks: 8 },
    },
    {
      short: 'Disk 2 fails',
      title: 'A disk fails: its partner serves',
      tag: 'event',
      explain: ['Pair 1 still has disk 1, with every block of the pair. No data lost and no math needed: reads simply go to the partner.'],
      s: { level: 'raid10', disks: 4, blocks: 8, failed: [1] },
    },
    {
      short: 'Disk 3 too',
      title: 'A second failure, in the other pair',
      tag: 'event',
      explain: ['Disk 3 fails as well. It is in pair 2, whose disk 4 still holds B, D, F and H. Still online: RAID 10 can survive up to half of its disks, if no pair loses both.'],
      s: { level: 'raid10', disks: 4, blocks: 8, failed: [1, 2] },
    },
    {
      short: 'Same pair',
      title: 'The wrong second disk',
      tag: 'event',
      explain: [
        'If disk 1 fails after disk 2, pair 1 has no disk left: A, C, E and G exist nowhere, and the array is lost.',
        'So RAID 10 is guaranteed to survive one failure, and more only if the failures land in different pairs.',
      ],
      key: 'RAID 10 dies when one mirror pair loses both disks.',
      s: { level: 'raid10', disks: 4, blocks: 8, failed: [0, 1] },
    },
    {
      short: 'Rebuild',
      title: 'A rebuild is a copy from the partner',
      tag: 'action',
      explain: [
        'A new disk 2 is copied from disk 1: fast, no parity math, and only the partner is read, not the whole array.',
        'Common for databases and virtual machines, with heavy random writes. RAID 01 (stripes first, then mirrored) is weaker: one failure takes a whole stripe set offline.',
      ],
      key: 'RAID 10: speed and quick rebuilds, half the capacity.',
      s: { level: 'raid10', disks: 4, blocks: 8, spare: 1, rebuilt: 4, note: 'The new disk 2 is copied from its partner, disk 1: no parity, no other disk involved.' },
    },
  ],
}

import type { StageLesson } from '../engine/StageLesson'
import { RAID_0, RAID_1, RAID_10, RAID_5, RAID_6, RAID_WHY } from '../raid/lessons'
import { SATA_SAS } from '../stages/SasStage'
import { POWER_BUDGET } from '../stages/PowerStage'
import { LINUX_PIPES } from '../stages/PipeStage'
import { FIBER_BASICS, FIBER_CLEAN, FIBER_POLARITY } from '../stages/FiberStage'
import { COPPER } from '../stages/CopperStage'
import { FRU_SWAP } from '../stages/SwapStage'

// The step-through lessons with their own animated stage (kind 'stage' in lessons/index.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const STAGES: Record<string, StageLesson<any>> = {
  'raid-why': RAID_WHY,
  'raid-0': RAID_0,
  'raid-1': RAID_1,
  'raid-5': RAID_5,
  'raid-6': RAID_6,
  'raid-10': RAID_10,
  'sata-sas': SATA_SAS,
  'power-budget': POWER_BUDGET,
  'linux-pipes': LINUX_PIPES,
  'fiber-basics': FIBER_BASICS,
  'fiber-polarity': FIBER_POLARITY,
  'fiber-clean': FIBER_CLEAN,
  copper: COPPER,
  'fru-swap': FRU_SWAP,
}

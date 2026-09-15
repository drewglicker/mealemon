// Canonical US-imperial unit normalization shared by the ingestion script,
// Convex aggregation mutations, and the frontend formatter.

export type VolumeUnit = 'tsp' | 'tbsp' | 'fl oz' | 'cup' | 'pint' | 'quart'
export type WeightUnit = 'oz' | 'lb'
export type CountUnit = 'item' | 'clove' | 'can' | 'bunch'
export type NormalizedUnit = 'cup' | 'tbsp' | 'tsp' | 'fl oz' | 'oz' | 'lb' | CountUnit
export type UnitBucket = 'volume' | 'weight' | 'count'

const VOLUME_TO_FLOZ: Record<VolumeUnit, number> = {
  tsp: 1 / 6, // 1 tsp = 0.1667 fl oz
  tbsp: 0.5,
  'fl oz': 1,
  cup: 8,
  pint: 16,
  quart: 32,
}

const WEIGHT_TO_OZ: Record<WeightUnit, number> = {
  oz: 1,
  lb: 16,
}

const COUNT_UNITS = new Set<CountUnit>(['item', 'clove', 'can', 'bunch'])

export function bucketForUnit(unit: string): UnitBucket {
  if (unit in VOLUME_TO_FLOZ) return 'volume'
  if (unit in WEIGHT_TO_OZ) return 'weight'
  return 'count'
}

/** Converts a quantity+unit into its base unit for the bucket:
 * volume -> fl oz, weight -> oz, count -> unchanged. */
export function toBaseUnits(quantity: number, unit: string): { baseQuantity: number; bucket: UnitBucket; baseUnit: string } {
  if (unit in VOLUME_TO_FLOZ) {
    return { baseQuantity: quantity * VOLUME_TO_FLOZ[unit as VolumeUnit], bucket: 'volume', baseUnit: 'fl oz' }
  }
  if (unit in WEIGHT_TO_OZ) {
    return { baseQuantity: quantity * WEIGHT_TO_OZ[unit as WeightUnit], bucket: 'weight', baseUnit: 'oz' }
  }
  return { baseQuantity: quantity, bucket: 'count', baseUnit: unit }
}

export function isCountUnit(unit: string): unit is CountUnit {
  return COUNT_UNITS.has(unit as CountUnit)
}

export function scaledQuantity(baseQuantity: number, baseYield: number, targetServings: number): number {
  const scalingFactor = targetServings / baseYield
  return baseQuantity * scalingFactor
}

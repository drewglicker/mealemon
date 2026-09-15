import Fraction from 'fraction.js'
import type { UnitBucket } from '../../shared/units'

/** Rounds a decimal quantity to the nearest 1/8 fraction for friendly display. */
function toFraction(value: number): Fraction {
  return new Fraction(value).round(8) // round to nearest 1/8
}

function fractionToString(f: Fraction): string {
  return f.toFraction(true) // mixed-number string, e.g. "2 1/2"
}

const UNICODE_VULGAR: Record<string, string> = {
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
}

function prettifyFractionString(s: string): string {
  const parts = s.trim().split(' ')
  const fracPart = parts[parts.length - 1]
  if (UNICODE_VULGAR[fracPart]) {
    const unicode = UNICODE_VULGAR[fracPart]
    const whole = parts.length > 1 ? parts.slice(0, -1).join(' ') : ''
    return `${whole}${unicode}`
  }
  return s
}

/** Converts a base-unit total (fl oz for volume, oz for weight, raw for count)
 * into a human-readable US-imperial string, e.g. 20 fl oz -> "2½ cups". */
export function formatQuantity(baseQuantity: number, bucket: UnitBucket, unit: string): string {
  if (baseQuantity <= 0) return '0'

  if (bucket === 'volume') {
    if (baseQuantity >= 8) {
      return `${prettifyFractionString(fractionToString(toFraction(baseQuantity / 8)))} cups`
    }
    if (baseQuantity >= 0.5) {
      return `${prettifyFractionString(fractionToString(toFraction(baseQuantity / 0.5)))} tbsp`
    }
    return `${prettifyFractionString(fractionToString(toFraction(baseQuantity / (1 / 6))))} tsp`
  }

  if (bucket === 'weight') {
    if (baseQuantity >= 16) {
      return `${prettifyFractionString(fractionToString(toFraction(baseQuantity / 16)))} lbs`
    }
    return `${prettifyFractionString(fractionToString(toFraction(baseQuantity)))} oz`
  }

  // count: pluralize meaningful unit labels; the generic "item" placeholder
  // unit is dropped entirely since the ingredient name already follows it
  // in the UI (e.g. "1 avocado", not "1 item avocado").
  const rounded = Math.round(baseQuantity * 100) / 100
  const qtyStr = prettifyFractionString(fractionToString(toFraction(rounded)))
  if (unit === 'item') return qtyStr
  const label = rounded === 1 ? unit : `${unit}${unit.endsWith('s') ? '' : 's'}`
  return `${qtyStr} ${label}`
}

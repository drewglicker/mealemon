import { extractLeadingQuantity } from './quantity'
import type { NormalizedUnit } from '../../shared/units'

const UNIT_ALIASES: Record<string, NormalizedUnit> = {
  cup: 'cup',
  cups: 'cup',
  c: 'cup',
  tbsp: 'tbsp',
  tbsps: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tsp: 'tsp',
  tsps: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  'fl oz': 'fl oz',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
  oz: 'oz',
  ozs: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  clove: 'clove',
  cloves: 'clove',
  can: 'can',
  cans: 'can',
  bunch: 'bunch',
  bunches: 'bunch',
}

// Adjectives/descriptors that get stripped off the front or back of an
// ingredient phrase to compute a stable canonicalName across recipes.
const PREP_DESCRIPTORS = [
  'finely diced', 'finely chopped', 'roughly chopped', 'thinly sliced', 'thinly sliced',
  'diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded', 'crushed', 'melted',
  'softened', 'peeled', 'seeded', 'halved', 'quartered', 'cubed', 'julienned',
  'zested', 'juiced', 'trimmed', 'rinsed', 'drained', 'cooked', 'uncooked',
  'hard-cooked', 'freshly ground', 'ground', 'fresh', 'dried',
]

export interface ParsedIngredient {
  rawText: string
  quantity: number
  unit: NormalizedUnit
  canonicalName: string
  prepNote?: string
}

export function parseIngredientLine(rawText: string): ParsedIngredient {
  const [quantity, afterQty] = extractLeadingQuantity(rawText)

  let rest = afterQty.trim()
  let unit: NormalizedUnit = 'item'

  // Strip a leading size adjective (e.g. "small bunch cilantro") before
  // looking for the actual unit token.
  const sizeAdjMatch = rest.match(/^(small|medium|large|extra)\s+(.*)$/i)
  const unitSearchText = sizeAdjMatch ? sizeAdjMatch[2] : rest

  const unitMatch = unitSearchText.match(/^([a-zA-Z. ]+?)\s+(?=[a-zA-Z])/)
  if (unitMatch) {
    const candidate = unitMatch[1].trim().toLowerCase().replace(/\.$/, '')
    if (UNIT_ALIASES[candidate]) {
      unit = UNIT_ALIASES[candidate]
      rest = unitSearchText.slice(unitMatch[0].length).trim()
    }
  }

  // Split off trailing prep note after a comma, e.g. "eggs, peeled"
  let prepNote: string | undefined
  const commaIdx = rest.indexOf(',')
  if (commaIdx !== -1) {
    prepNote = rest.slice(commaIdx + 1).trim()
    rest = rest.slice(0, commaIdx).trim()
  }

  const canonicalName = canonicalizeName(rest, PREP_DESCRIPTORS)

  return { rawText, quantity, unit, canonicalName, prepNote }
}

function canonicalizeName(name: string, descriptors: string[]): string {
  let n = name.toLowerCase().trim()
  // Longest phrases first so e.g. "hard-cooked" is stripped whole instead of
  // partially matching the shorter "cooked" entry and leaving a stray "hard-".
  const sorted = [...descriptors].sort((a, b) => b.length - a.length)
  for (const d of sorted) {
    n = n.replace(new RegExp(`\\b${d}\\b`, 'g'), '')
  }
  // Drop package/container filler words and any leftover parenthetical size notes.
  n = n.replace(/\([^)]*\)/g, '')
  n = n.replace(/\b(pkg|package|small|medium|large|extra)\b/g, '')
  return n.replace(/\s+/g, ' ').trim().replace(/^-+|-+$/g, '').trim()
}

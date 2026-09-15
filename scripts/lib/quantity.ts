// Word-form numbers and unicode fraction handling for ingredient quantity parsing.

const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
}

/** Parses a leading quantity token (e.g. "1 1/2", "½", "2", "1¼") and returns
 * [quantity, remainingText]. Returns [1, text] if no quantity is found (implicit "1"). */
export function extractLeadingQuantity(text: string): [number, string] {
  const trimmed = text.trim()

  // "1 1/2 cups" or "1½ cups" (whole number followed by fraction, with or without space)
  const wholeFractionMatch = trimmed.match(
    /^(\d+)\s?([¼½¾⅓⅔⅛⅜⅝⅞]|\d+\/\d+)\s+(.*)$/,
  )
  if (wholeFractionMatch) {
    const whole = parseInt(wholeFractionMatch[1], 10)
    const fracToken = wholeFractionMatch[2]
    const frac = UNICODE_FRACTIONS[fracToken] ?? evalSimpleFraction(fracToken)
    return [whole + frac, wholeFractionMatch[3]]
  }

  // Simple unicode fraction alone: "¼ cup"
  const uniFractionMatch = trimmed.match(/^([¼½¾⅓⅔⅛⅜⅝⅞])\s*(.*)$/)
  if (uniFractionMatch) {
    return [UNICODE_FRACTIONS[uniFractionMatch[1]], uniFractionMatch[2]]
  }

  // Simple fraction "1/2 cup"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)\s+(.*)$/)
  if (fractionMatch) {
    return [parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10), fractionMatch[3]]
  }

  // Range "1-2 apples" -> average
  const rangeMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s?[-–to]+\s?(\d+(?:\.\d+)?)\s+(.*)$/)
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1])
    const hi = parseFloat(rangeMatch[2])
    return [(lo + hi) / 2, rangeMatch[3]]
  }

  // Plain decimal/int "2 cups"
  const plainMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s+(.*)$/)
  if (plainMatch) {
    return [parseFloat(plainMatch[1]), plainMatch[2]]
  }

  // No leading quantity found (e.g. "salt", "black pepper") -> implicit 1 item
  return [1, trimmed]
}

function evalSimpleFraction(token: string): number {
  const m = token.match(/^(\d+)\/(\d+)$/)
  if (!m) return 0
  return parseInt(m[1], 10) / parseInt(m[2], 10)
}

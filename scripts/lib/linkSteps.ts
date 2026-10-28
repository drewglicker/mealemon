interface IngredientForLinking {
  index: number
  canonicalName: string
}

/** For each instruction step, finds which parsed ingredients are referenced
 * in that step's text via simple substring/word-overlap matching on the
 * canonical name (and its significant words). Best-effort, not exact NLP.
 *
 * Each ingredient is only attached to the FIRST step that mentions it, so an
 * ingredient chip (and its quantity) appears exactly once, in the step where
 * it's first introduced, instead of repeating every time it's referenced.
 *
 * Matching runs in two passes so that an exact, unambiguous mention (e.g.
 * "chili-garlic sauce" in its own step) always wins over a looser partial
 * match (e.g. a different ingredient sharing one word, like "rice" in both
 * "jasmine rice" and "rice vinegar") that happens to appear earlier. */
export function linkIngredientsToSteps(
  instructions: string[],
  ingredients: IngredientForLinking[],
): number[][] {
  const STOPWORDS = new Set(['and', 'or', 'the', 'a', 'of', 'to', 'with', 'for'])
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const lowerTexts = instructions.map((t) => t.toLowerCase())
  const matchesByStep: number[][] = instructions.map(() => [])
  const introduced = new Set<number>()

  // Pass 1: exact full canonical-name phrase match, e.g. "chili-garlic sauce"
  // literally appearing in a step. Multi-word phrases are specific enough
  // that a plain substring check is safe here.
  for (const ing of ingredients) {
    if (!ing.canonicalName) continue
    const stepIdx = lowerTexts.findIndex((t) => t.includes(ing.canonicalName))
    if (stepIdx !== -1) {
      matchesByStep[stepIdx].push(ing.index)
      introduced.add(ing.index)
    }
  }

  // Pass 2: for ingredients with no exact phrase mention anywhere, fall back
  // to matching on any significant (non-stopword) word of the canonical
  // name, e.g. "jasmine rice" -> step just says "the rice". Word-boundary
  // matching avoids false positives like "sauce" inside "saucepan".
  for (const ing of ingredients) {
    if (!ing.canonicalName || introduced.has(ing.index)) continue
    const words = ing.canonicalName.split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w))
    if (words.length === 0) continue
    const wordRegexes = words.map((w) => new RegExp(`\\b${escapeRegExp(w)}\\b`))
    const stepIdx = lowerTexts.findIndex((t) => wordRegexes.some((r) => r.test(t)))
    if (stepIdx !== -1) {
      matchesByStep[stepIdx].push(ing.index)
      introduced.add(ing.index)
    }
  }

  return matchesByStep
}

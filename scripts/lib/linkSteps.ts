interface IngredientForLinking {
  index: number
  canonicalName: string
}

/** For each instruction step, finds which parsed ingredients are referenced
 * in that step's text via simple substring/word-overlap matching on the
 * canonical name (and its significant words). Best-effort, not exact NLP. */
export function linkIngredientsToSteps(
  instructions: string[],
  ingredients: IngredientForLinking[],
): number[][] {
  const STOPWORDS = new Set(['and', 'or', 'the', 'a', 'of', 'to', 'with', 'for'])

  return instructions.map((instructionText) => {
    const lowerText = instructionText.toLowerCase()
    const matches: number[] = []

    for (const ing of ingredients) {
      if (!ing.canonicalName) continue

      if (lowerText.includes(ing.canonicalName)) {
        matches.push(ing.index)
        continue
      }

      // Fall back to matching on the significant (non-stopword) words of the
      // canonical name, e.g. "greek yogurt" -> "yogurt" appears in text.
      const words = ing.canonicalName.split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w))
      if (words.some((w) => lowerText.includes(w))) {
        matches.push(ing.index)
      }
    }

    return matches
  })
}

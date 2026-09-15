const MEAT_KEYWORDS = ['chicken', 'beef', 'pork', 'turkey', 'salmon', 'shrimp', 'bacon', 'sausage', 'steak', 'fish', 'tilapia', 'cod', 'lamb', 'gelatin']
const DAIRY_KEYWORDS = ['milk', 'yogurt', 'cheese', 'butter', 'cream', 'parmesan', 'mozzarella', 'cheddar', 'feta']
const GLUTEN_KEYWORDS = ['flour', 'bread', 'muffin', 'bun', 'bagel', 'tortilla', 'pasta', 'noodle', 'baguette', 'roll', 'pita', 'soy sauce', 'crouton']
const HIGH_CARB_KEYWORDS = ['rice', 'pasta', 'bread', 'potato', 'tortilla', 'sugar', 'noodle', 'corn', 'bun', 'bagel']

/** Best-effort dietary flag inference from the flattened list of canonical
 * ingredient names in a recipe. Meant as a starting classification a human
 * can override later, not a certified allergen guarantee. */
export function inferDietaryFlags(canonicalIngredientNames: string[]): string[] {
  const names = canonicalIngredientNames.map((n) => n.toLowerCase())
  const hasAny = (keywords: string[]) => names.some((n) => keywords.some((kw) => n.includes(kw)))

  const flags: string[] = []
  if (!hasAny(MEAT_KEYWORDS)) flags.push('Vegetarian')
  if (!hasAny(DAIRY_KEYWORDS)) flags.push('Dairy-Free')
  if (!hasAny(GLUTEN_KEYWORDS)) flags.push('Gluten-Free')
  if (!hasAny(HIGH_CARB_KEYWORDS)) flags.push('Low Carb')
  return flags
}

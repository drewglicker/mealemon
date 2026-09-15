// Curated common-ingredient substitution reference, compiled from published
// substitution guides (Food Network's Ingredient Substitution Guide, NDSU
// Extension FN198). Not exhaustive by design — covers ingredients likely to
// show up in home-cooked recipes across dairy, eggs, baking, spices,
// produce aromatics, condiments, and canned goods.
//
// `match` = substrings tested against an ingredient's canonicalName
// (case-insensitive) to find which taxonomy entries this applies to.

export interface SubstituteEntry {
  match: string[]
  substitutes: { name: string; ratio?: string }[]
}

export const SUBSTITUTES: SubstituteEntry[] = [
  // ---- Dairy & eggs ----
  { match: ['butter'], substitutes: [
    { name: 'margarine', ratio: '1:1' },
    { name: 'vegetable oil', ratio: '7/8 cup per 1 cup butter' },
    { name: 'plain Greek yogurt or applesauce', ratio: 'for baking, 1:1' },
  ] },
  { match: ['buttermilk'], substitutes: [
    { name: 'milk + lemon juice or vinegar', ratio: '1 cup milk + 1 tbsp lemon juice/vinegar, rest 5-10 min' },
    { name: 'plain yogurt', ratio: '1:1' },
  ] },
  { match: ['sour cream'], substitutes: [
    { name: 'plain Greek yogurt', ratio: '1:1' },
    { name: 'creme fraiche', ratio: '1:1' },
    { name: 'cottage cheese, pureed', ratio: '1:1' },
  ] },
  { match: ['greek yogurt', 'plain yogurt', 'yogurt'], substitutes: [
    { name: 'sour cream', ratio: '1:1' },
    { name: 'creme fraiche', ratio: '1:1' },
  ] },
  { match: ['heavy cream', 'heavy whipping cream'], substitutes: [
    { name: 'milk + melted butter', ratio: '3/4 cup milk + 1/3 cup butter per 1 cup' },
    { name: 'half-and-half', ratio: '1:1 (not for whipping)' },
    { name: 'evaporated milk', ratio: '1:1 (not for whipping)' },
  ] },
  { match: ['half and half', 'half-and-half'], substitutes: [
    { name: 'whole milk + butter', ratio: '7/8 cup milk + 1/2 tbsp butter per 1 cup' },
    { name: 'evaporated milk', ratio: '1:1' },
  ] },
  { match: ['whole milk', 'milk'], substitutes: [
    { name: 'yogurt or sour cream thinned with water', ratio: 'thin to pourable consistency' },
    { name: 'evaporated milk + water', ratio: '1/2 cup evaporated milk + 1/2 cup water per 1 cup' },
  ] },
  { match: ['cream cheese'], substitutes: [
    { name: 'Neufchatel cheese', ratio: '1:1' },
    { name: 'pureed cottage cheese or ricotta + lemon juice', ratio: '1:1' },
  ] },
  { match: ['creme fraiche', 'crème fraîche'], substitutes: [
    { name: 'sour cream', ratio: '1:1' },
    { name: 'plain Greek yogurt', ratio: '1:1' },
  ] },
  { match: ['mascarpone'], substitutes: [
    { name: 'cream cheese loosened with a little cream', ratio: '1:1' },
  ] },
  { match: ['cheddar'], substitutes: [
    { name: 'Colby Jack cheese' },
    { name: 'Monterey Jack cheese' },
    { name: 'Gruyere or fontina' },
  ] },
  { match: ['parmesan'], substitutes: [{ name: 'Pecorino Romano', ratio: '1:1' }] },
  { match: ['feta'], substitutes: [
    { name: 'goat cheese' },
    { name: 'queso fresco' },
  ] },
  { match: ['mozzarella'], substitutes: [
    { name: 'provolone' },
    { name: 'fontina' },
  ] },
  { match: ['egg', 'eggs'], substitutes: [
    { name: 'aquafaba (chickpea liquid)', ratio: '3 tbsp per egg' },
    { name: 'vegetable oil + water', ratio: '3 tbsp oil + 1 tbsp water per egg (quick breads/cakes)' },
    { name: 'unsweetened applesauce', ratio: '1/4 cup per egg' },
  ] },

  // ---- Baking staples ----
  { match: ['all-purpose flour', 'flour'], substitutes: [
    { name: 'whole wheat flour', ratio: '3/4 cup per 1 cup (denser texture)' },
    { name: 'cornstarch (thickening only)', ratio: '1/2 tbsp per 1 tbsp flour' },
  ] },
  { match: ['granulated sugar', 'white sugar', 'sugar'], substitutes: [
    { name: 'honey', ratio: '3/4 cup per 1 cup, reduce other liquid by 1/4 cup' },
    { name: 'maple syrup', ratio: '3/4 cup per 1 cup, reduce other liquid by 3 tbsp' },
    { name: 'brown sugar', ratio: '1:1' },
  ] },
  { match: ['brown sugar'], substitutes: [
    { name: 'granulated sugar + molasses', ratio: '1 cup sugar + 2-3 tbsp molasses' },
    { name: 'turbinado or muscovado sugar', ratio: '1:1' },
  ] },
  { match: ['powdered sugar', "confectioners' sugar", 'confectioners sugar'], substitutes: [
    { name: 'granulated sugar, finely blended', ratio: '3/4 cup granulated per 1 cup powdered' },
  ] },
  { match: ['baking powder'], substitutes: [
    { name: 'cream of tartar + baking soda', ratio: '1/2 tsp cream of tartar + 1/4 tsp baking soda per 1 tsp' },
  ] },
  { match: ['baking soda'], substitutes: [
    { name: 'baking powder', ratio: '3 tsp per 1 tsp (result will be less strong-tasting)' },
  ] },
  { match: ['cornstarch'], substitutes: [
    { name: 'all-purpose flour', ratio: '2 tbsp per 1 tbsp cornstarch' },
    { name: 'arrowroot starch', ratio: '1:1' },
  ] },
  { match: ['honey'], substitutes: [
    { name: 'maple syrup', ratio: '1:1' },
    { name: 'light or dark corn syrup', ratio: '1:1' },
  ] },
  { match: ['maple syrup'], substitutes: [
    { name: 'honey', ratio: '1:1' },
    { name: 'corn syrup', ratio: '1:1' },
  ] },
  { match: ['vanilla extract', 'vanilla'], substitutes: [
    { name: 'maple syrup', ratio: '1:1' },
    { name: 'bourbon, brandy, or rum', ratio: '1:1' },
  ] },
  { match: ['cocoa powder', 'cocoa'], substitutes: [
    { name: 'unsweetened chocolate, melted', ratio: '1 oz chocolate + reduce fat by 1/2 tbsp per 3 tbsp cocoa' },
  ] },
  { match: ['yeast'], substitutes: [
    { name: 'baking powder (quick breads only, different texture)', ratio: 'not a direct swap for yeast breads' },
  ] },

  // ---- Spices & herbs ----
  { match: ['cinnamon'], substitutes: [{ name: 'allspice or nutmeg', ratio: 'half the amount' }] },
  { match: ['cumin'], substitutes: [
    { name: 'ground coriander' },
    { name: 'chili powder or taco seasoning' },
  ] },
  { match: ['paprika'], substitutes: [{ name: 'chili powder', ratio: '1:1' }] },
  { match: ['chili powder'], substitutes: [
    { name: 'paprika + cumin + onion powder + garlic powder', ratio: '1 tsp paprika + 1 tsp cumin + 1/2 tsp each onion/garlic powder per 1 tbsp' },
  ] },
  { match: ['cayenne'], substitutes: [{ name: 'crushed red pepper flakes', ratio: 'double the amount' }] },
  { match: ['crushed red pepper', 'red pepper flakes'], substitutes: [{ name: 'cayenne pepper', ratio: 'half the amount' }] },
  { match: ['garlic powder'], substitutes: [{ name: 'fresh minced garlic', ratio: '1/2 tsp fresh per 1/8 tsp powder' }] },
  { match: ['onion powder'], substitutes: [{ name: 'fresh minced onion', ratio: '1 tbsp fresh per 1 tsp powder' }] },
  { match: ['italian seasoning'], substitutes: [
    { name: 'oregano + basil + thyme', ratio: 'equal parts each' },
  ] },
  { match: ['oregano'], substitutes: [{ name: 'thyme or basil' }] },
  { match: ['basil'], substitutes: [{ name: 'tarragon, oregano, or thyme' }] },
  { match: ['thyme'], substitutes: [{ name: 'basil, marjoram, oregano, or rosemary' }] },
  { match: ['rosemary'], substitutes: [{ name: 'thyme' }] },
  { match: ['cilantro'], substitutes: [{ name: 'parsley, basil, or a mix of both' }] },
  { match: ['parsley'], substitutes: [{ name: 'basil, chervil, or celery leaf' }] },
  { match: ['dill'], substitutes: [{ name: 'tarragon or fennel fronds' }] },
  { match: ['mint'], substitutes: [{ name: 'basil (different but complementary)' }] },
  { match: ['ginger'], substitutes: [
    { name: 'ground ginger', ratio: '1/4 tsp ground per 1 tbsp fresh' },
  ] },
  { match: ['kosher salt'], substitutes: [{ name: 'table salt', ratio: '1/2 the amount (kosher is coarser)' }] },
  { match: ['salt'], substitutes: [{ name: 'kosher salt', ratio: '1.5x the amount of table salt' }] },
  { match: ['black pepper'], substitutes: [{ name: 'white pepper' }] },

  // ---- Condiments, sauces & vinegars ----
  { match: ['dijon mustard'], substitutes: [
    { name: 'spicy brown or stone-ground mustard', ratio: '1:1' },
    { name: 'dry mustard + mayonnaise + vinegar', ratio: '1 tbsp dry mustard + 1 tbsp mayo + 1 tsp vinegar per 2 tbsp' },
  ] },
  { match: ['mayonnaise'], substitutes: [
    { name: 'plain Greek yogurt', ratio: '1:1' },
    { name: 'sour cream', ratio: '1:1' },
  ] },
  { match: ['soy sauce'], substitutes: [
    { name: 'tamari or coconut aminos', ratio: '1:1' },
    { name: 'Worcestershire sauce (small amounts)' },
  ] },
  { match: ['worcestershire'], substitutes: [
    { name: 'soy sauce + lemon juice + sugar + hot sauce', ratio: '2 tsp soy + splashes of the rest per 1 tbsp' },
  ] },
  { match: ['balsamic vinegar'], substitutes: [
    { name: 'white wine vinegar + sugar or honey', ratio: '1 tbsp vinegar + 1/2 tsp sugar/honey' },
  ] },
  { match: ['white wine vinegar'], substitutes: [
    { name: 'red wine vinegar or apple cider vinegar', ratio: '1:1' },
  ] },
  { match: ['red wine vinegar'], substitutes: [
    { name: 'apple cider or white wine vinegar', ratio: '1:1' },
  ] },
  { match: ['apple cider vinegar'], substitutes: [
    { name: 'lemon juice or white wine vinegar', ratio: '1:1' },
  ] },
  { match: ['rice vinegar'], substitutes: [
    { name: 'apple cider or white wine vinegar + sugar', ratio: '1 tbsp vinegar + 1 tsp sugar' },
  ] },
  { match: ['hoisin sauce'], substitutes: [
    { name: 'soy sauce + honey or molasses', ratio: '1/4 cup soy + 1-2 tbsp honey/molasses' },
  ] },
  { match: ['fish sauce'], substitutes: [{ name: 'soy sauce or Worcestershire sauce', ratio: '1:1' }] },
  { match: ['oyster sauce'], substitutes: [{ name: 'soy sauce or hoisin sauce', ratio: '1:1' }] },
  { match: ['ketchup', 'catsup'], substitutes: [
    { name: 'tomato sauce + sugar + vinegar', ratio: '1 cup tomato sauce + 1/2 cup sugar + 2 tbsp vinegar' },
  ] },
  { match: ['tomato paste'], substitutes: [
    { name: 'tomato sauce, reduced', ratio: 'simmer 3x volume tomato sauce down' },
  ] },
  { match: ['tomato sauce'], substitutes: [
    { name: 'tomato paste + water', ratio: '1 part paste + 2-3 parts water' },
    { name: 'crushed or diced tomatoes, blended', ratio: '1:1' },
  ] },
  { match: ['diced tomatoes', 'canned tomatoes'], substitutes: [
    { name: 'fresh tomatoes, chopped', ratio: '~3 medium tomatoes per 16 oz can' },
  ] },

  // ---- Broths, wines & misc liquids ----
  { match: ['chicken broth', 'chicken stock'], substitutes: [
    { name: 'vegetable broth', ratio: '1:1' },
    { name: 'bouillon cube + water', ratio: '1 cube per 1 cup water' },
  ] },
  { match: ['beef broth', 'beef stock'], substitutes: [
    { name: 'chicken or vegetable broth', ratio: '1:1' },
    { name: 'bouillon cube + water', ratio: '1 cube per 1 cup water' },
  ] },
  { match: ['vegetable broth', 'vegetable stock'], substitutes: [
    { name: 'chicken broth (if not vegetarian)', ratio: '1:1' },
    { name: 'water + a splash of soy sauce', ratio: '1 cup water + splash soy sauce' },
  ] },
  { match: ['white wine'], substitutes: [
    { name: 'broth or stock', ratio: '1:1' },
    { name: 'water + splash of lemon juice or vinegar' },
  ] },
  { match: ['red wine'], substitutes: [
    { name: 'beef broth + splash of red wine vinegar', ratio: '1 cup broth + 1 tbsp vinegar' },
  ] },

  // ---- Produce aromatics ----
  { match: ['garlic', 'garlic clove', 'cloves'], substitutes: [
    { name: 'garlic powder', ratio: '1/8 tsp per small clove' },
    { name: 'jarred minced garlic', ratio: '1/2 tsp per clove' },
  ] },
  { match: ['shallot'], substitutes: [{ name: 'red onion or scallion whites' }] },
  { match: ['scallion', 'green onion'], substitutes: [{ name: 'chives or finely diced onion' }] },
  { match: ['onion'], substitutes: [
    { name: 'shallot' },
    { name: 'onion powder', ratio: '1 tsp per small onion' },
  ] },
  { match: ['lemon'], substitutes: [{ name: 'lime juice or vinegar', ratio: '1/2 tsp vinegar per 1 tsp lemon juice' }] },
  { match: ['lime'], substitutes: [{ name: 'lemon juice', ratio: '1:1' }] },
]

/** Finds substitute suggestions for a canonical ingredient name via simple
 * substring matching (case-insensitive). Returns [] if nothing matches.
 * Guards against false positives on compound products (e.g. "chili-garlic
 * sauce" incorrectly matching the plain "garlic" rule) by requiring that if
 * the name looks like a prepared product (contains "sauce", "dressing",
 * etc.), the matching entry must itself be specifically about that product. */
const COMPOUND_PRODUCT_WORDS = ['sauce', 'dressing', 'marinade', 'paste', 'seasoning', 'mix', 'glaze', 'broth', 'stock', 'soup']

export function findSubstitutes(canonicalName: string) {
  const name = canonicalName.toLowerCase()
  const looksLikeCompoundProduct = COMPOUND_PRODUCT_WORDS.some((w) => name.includes(w))

  for (const entry of SUBSTITUTES) {
    const matched = entry.match.some((m) => name.includes(m))
    if (!matched) continue

    if (looksLikeCompoundProduct) {
      // Only accept this entry if it's itself about a compound product
      // (its own match tokens mention one of the same product words).
      const entryIsCompoundAware = entry.match.some((m) => COMPOUND_PRODUCT_WORDS.some((w) => m.includes(w)))
      if (!entryIsCompoundAware) continue
    }

    return entry.substitutes
  }
  return []
}

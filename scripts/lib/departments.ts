import type { UnitBucket } from '../../shared/units'

export type Department =
  | 'Produce'
  | 'Meat & Seafood'
  | 'Dairy, Cheese & Eggs'
  | 'Bakery'
  | 'Baking & Spices'
  | 'Canned & Jarred Goods'
  | 'Oils, Sauces & Condiments'
  | 'Other'

interface Rule {
  department: Department
  unitType: UnitBucket
  keywords: string[]
}

// Ordered rule list; first keyword match wins. Keep specific rules before
// broad ones (e.g. "coconut oil" before generic "oil").
const RULES: Rule[] = [
  { department: 'Meat & Seafood', unitType: 'weight', keywords: [
    'chicken', 'beef', 'pork', 'turkey', 'salmon', 'shrimp', 'bacon', 'sausage',
    'steak', 'fish', 'tilapia', 'cod', 'ground beef', 'ground turkey', 'lamb',
  ] },
  { department: 'Dairy, Cheese & Eggs', unitType: 'count', keywords: [
    'egg', 'eggs', 'milk', 'yogurt', 'cheese', 'butter', 'cream', 'sour cream',
    'parmesan', 'mozzarella', 'cheddar', 'feta', 'cream cheese',
  ] },
  { department: 'Bakery', unitType: 'count', keywords: [
    'bread', 'muffin', 'bun', 'bagel', 'tortilla', 'baguette', 'roll', 'pita',
  ] },
  { department: 'Baking & Spices', unitType: 'volume', keywords: [
    'flour', 'sugar', 'baking soda', 'baking powder', 'salt', 'pepper', 'cinnamon',
    'vanilla', 'cocoa', 'yeast', 'paprika', 'cumin', 'oregano', 'basil', 'thyme',
    'chili powder', 'garlic powder', 'onion powder', 'spice',
  ] },
  { department: 'Canned & Jarred Goods', unitType: 'count', keywords: [
    'can of', 'canned', 'jarred', 'diced tomatoes', 'broth', 'stock', 'tomato paste',
    'beans', 'chickpeas', 'lentils',
  ] },
  { department: 'Oils, Sauces & Condiments', unitType: 'volume', keywords: [
    'oil', 'vinegar', 'soy sauce', 'mayonnaise', 'mustard', 'ketchup', 'sauce',
    'salsa', 'dressing', 'aioli', 'honey', 'syrup', 'chili-garlic',
  ] },
  { department: 'Produce', unitType: 'count', keywords: [
    'avocado', 'tomato', 'onion', 'garlic', 'lettuce', 'spinach', 'kale', 'pepper',
    'cucumber', 'carrot', 'potato', 'lemon', 'lime', 'corn', 'zucchini', 'broccoli',
    'mushroom', 'basil', 'cilantro', 'parsley', 'mint', 'apple', 'banana', 'berry',
    'strawberr', 'scallion', 'celery', 'ginger',
  ] },
]

export function classifyIngredient(canonicalName: string): { department: Department; defaultUnitType: UnitBucket } {
  const name = canonicalName.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => name.includes(kw))) {
      return { department: rule.department, defaultUnitType: rule.unitType }
    }
  }
  return { department: 'Other', defaultUnitType: 'count' }
}

import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  recipes: defineTable({
    slug: v.string(),
    name: v.string(),
    recipeCategory: v.string(),
    recipeCuisine: v.string(),
    cookTime: v.string(),
    totalTime: v.string(),
    baseYield: v.number(),
    images: v.array(v.string()),
    keywords: v.array(v.string()),
    dietaryFlags: v.array(v.string()),
    // Derived/denormalized fields (computed at seed time in convex/seed.ts)
    // so the Explore feed can use indexed range scans / search instead of
    // loading and shuffling every recipe on every request.
    shuffleKey: v.optional(v.number()),
    isVegetarian: v.optional(v.boolean()),
    isGlutenFree: v.optional(v.boolean()),
    isDairyFree: v.optional(v.boolean()),
    isLowCarb: v.optional(v.boolean()),
    searchBlob: v.optional(v.string()),
  })
    .index('by_slug', ['slug'])
    .index('by_shuffleKey', ['shuffleKey'])
    .index('by_isVegetarian_shuffleKey', ['isVegetarian', 'shuffleKey'])
    .index('by_isGlutenFree_shuffleKey', ['isGlutenFree', 'shuffleKey'])
    .index('by_isDairyFree_shuffleKey', ['isDairyFree', 'shuffleKey'])
    .index('by_isLowCarb_shuffleKey', ['isLowCarb', 'shuffleKey'])
    .searchIndex('search_recipes', {
      searchField: 'searchBlob',
      filterFields: ['isVegetarian', 'isGlutenFree', 'isDairyFree', 'isLowCarb'],
    }),

  ingredients: defineTable({
    canonicalName: v.string(),
    department: v.union(
      v.literal('Produce'),
      v.literal('Meat & Seafood'),
      v.literal('Dairy, Cheese & Eggs'),
      v.literal('Bakery'),
      v.literal('Baking & Spices'),
      v.literal('Canned & Jarred Goods'),
      v.literal('Oils, Sauces & Condiments'),
      v.literal('Other'),
    ),
    defaultUnitType: v.union(v.literal('volume'), v.literal('weight'), v.literal('count')),
  }).index('by_canonicalName', ['canonicalName']),

  recipeIngredients: defineTable({
    recipeId: v.id('recipes'),
    ingredientId: v.id('ingredients'),
    rawText: v.string(),
    baseQuantity: v.number(),
    unit: v.union(
      v.literal('cup'),
      v.literal('tbsp'),
      v.literal('tsp'),
      v.literal('fl oz'),
      v.literal('oz'),
      v.literal('lb'),
      v.literal('clove'),
      v.literal('can'),
      v.literal('bunch'),
      v.literal('item'),
    ),
    prepNote: v.optional(v.string()),
  }).index('by_recipeId', ['recipeId']),

  recipeSteps: defineTable({
    recipeId: v.id('recipes'),
    stepNumber: v.number(),
    instructionText: v.string(),
    linkedIngredientIds: v.array(v.id('recipeIngredients')),
  }).index('by_recipeId', ['recipeId']),

  mealPlans: defineTable({
    status: v.union(v.literal('active'), v.literal('archived')),
    createdAt: v.number(),
  }).index('by_status', ['status']),

  mealPlanRecipes: defineTable({
    mealPlanId: v.id('mealPlans'),
    recipeId: v.id('recipes'),
    targetServings: v.union(v.literal(2), v.literal(4), v.literal(6)),
  })
    .index('by_mealPlanId', ['mealPlanId'])
    .index('by_mealPlanId_recipeId', ['mealPlanId', 'recipeId']),

  groceryItems: defineTable({
    mealPlanId: v.id('mealPlans'),
    ingredientId: v.optional(v.id('ingredients')),
    customName: v.optional(v.string()),
    department: v.string(),
    aggregatedQuantity: v.number(),
    unit: v.string(),
    isChecked: v.boolean(),
    // Optional user-chosen substitute for this shopping-list line (e.g. "out
    // of buttermilk, using milk + lemon juice instead"). Purely a display
    // override; does not change the underlying ingredient/aggregation.
    substituteNote: v.optional(v.string()),
  })
    .index('by_mealPlanId', ['mealPlanId'])
    .index('by_mealPlanId_department', ['mealPlanId', 'department']),

  // Curated ingredient-substitution reference data (seeded from common
  // cooking substitution guides), keyed to the master ingredients taxonomy.
  ingredientSubstitutes: defineTable({
    ingredientId: v.id('ingredients'),
    substituteName: v.string(),
    ratio: v.optional(v.string()),
  }).index('by_ingredientId', ['ingredientId']),
})

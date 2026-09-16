import { mutation } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

const departmentValidator = v.union(
  v.literal('Produce'),
  v.literal('Meat & Seafood'),
  v.literal('Dairy, Cheese & Eggs'),
  v.literal('Bakery'),
  v.literal('Baking & Spices'),
  v.literal('Canned & Jarred Goods'),
  v.literal('Oils, Sauces & Condiments'),
  v.literal('Other'),
)

const unitValidator = v.union(
  v.literal('cup'), v.literal('tbsp'), v.literal('tsp'), v.literal('fl oz'),
  v.literal('oz'), v.literal('lb'), v.literal('clove'), v.literal('can'),
  v.literal('bunch'), v.literal('item'),
)

/** Idempotent upsert of a master ingredient taxonomy entry by canonicalName. */
export const upsertIngredient = mutation({
  args: {
    canonicalName: v.string(),
    department: departmentValidator,
    defaultUnitType: v.union(v.literal('volume'), v.literal('weight'), v.literal('count')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('ingredients')
      .withIndex('by_canonicalName', (q) => q.eq('canonicalName', args.canonicalName))
      .unique()
    if (existing) return existing._id
    return await ctx.db.insert('ingredients', args)
  },
})

/** Replaces a recipe (and its ingredients/steps) identified by slug, so the
 * seed script can be re-run safely against updated ./data/*.json files. */
export const upsertRecipeWithDetails = mutation({
  args: {
    recipe: v.object({
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
    }),
    ingredients: v.array(v.object({
      ingredientId: v.id('ingredients'),
      rawText: v.string(),
      baseQuantity: v.number(),
      unit: unitValidator,
      prepNote: v.optional(v.string()),
    })),
    steps: v.array(v.object({
      stepNumber: v.number(),
      instructionText: v.string(),
      linkedIngredientIndices: v.array(v.number()),
    })),
  },
  handler: async (ctx, { recipe, ingredients, steps }) => {
    const existing = await ctx.db
      .query('recipes')
      .withIndex('by_slug', (q) => q.eq('slug', recipe.slug))
      .unique()

    if (existing) {
      const oldIngredients = await ctx.db
        .query('recipeIngredients')
        .withIndex('by_recipeId', (q) => q.eq('recipeId', existing._id))
        .collect()
      for (const oi of oldIngredients) await ctx.db.delete(oi._id)

      const oldSteps = await ctx.db
        .query('recipeSteps')
        .withIndex('by_recipeId', (q) => q.eq('recipeId', existing._id))
        .collect()
      for (const os of oldSteps) await ctx.db.delete(os._id)

      await ctx.db.delete(existing._id)
    }

    const recipeId = await ctx.db.insert('recipes', {
      ...recipe,
      shuffleKey: Math.random(),
      isVegetarian: recipe.dietaryFlags.includes('Vegetarian'),
      isGlutenFree: recipe.dietaryFlags.includes('Gluten-Free'),
      isDairyFree: recipe.dietaryFlags.includes('Dairy-Free'),
      isLowCarb: recipe.dietaryFlags.includes('Low Carb'),
      searchBlob: [recipe.name, recipe.recipeCategory, recipe.recipeCuisine, ...recipe.keywords]
        .join(' ')
        .toLowerCase(),
    })

    const recipeIngredientIds: Id<'recipeIngredients'>[] = []
    for (const ing of ingredients) {
      const id = await ctx.db.insert('recipeIngredients', {
        recipeId,
        ingredientId: ing.ingredientId,
        rawText: ing.rawText,
        baseQuantity: ing.baseQuantity,
        unit: ing.unit,
        prepNote: ing.prepNote,
      })
      recipeIngredientIds.push(id)
    }

    for (const step of steps) {
      await ctx.db.insert('recipeSteps', {
        recipeId,
        stepNumber: step.stepNumber,
        instructionText: step.instructionText,
        linkedIngredientIds: step.linkedIngredientIndices.map((i) => recipeIngredientIds[i]),
      })
    }

    return recipeId
  },
})

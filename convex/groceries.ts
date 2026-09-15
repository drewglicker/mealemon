import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { toBaseUnits, scaledQuantity, isCountUnit } from '../shared/units'

export const listForPlan = query({
  args: { mealPlanId: v.id('mealPlans') },
  handler: async (ctx, { mealPlanId }) => {
    const items = await ctx.db
      .query('groceryItems')
      .withIndex('by_mealPlanId', (q) => q.eq('mealPlanId', mealPlanId))
      .collect()

    const withIngredient = await Promise.all(
      items.map(async (item) => ({
        ...item,
        ingredient: item.ingredientId ? await ctx.db.get(item.ingredientId) : null,
      })),
    )

    return withIngredient
  },
})

/** Recomputes the grocery list for a meal plan from scratch by re-running
 * the scaling + aggregation algorithm over all recipes currently in it. */
export const computeFromPlan = mutation({
  args: { mealPlanId: v.id('mealPlans') },
  handler: async (ctx, { mealPlanId }) => {
    const existingItems = await ctx.db
      .query('groceryItems')
      .withIndex('by_mealPlanId', (q) => q.eq('mealPlanId', mealPlanId))
      .collect()
    const checkedByIngredientId = new Map<string, boolean>()
    for (const item of existingItems) {
      if (item.ingredientId) checkedByIngredientId.set(item.ingredientId, item.isChecked)
    }
    for (const item of existingItems) await ctx.db.delete(item._id)

    const planRecipes = await ctx.db
      .query('mealPlanRecipes')
      .withIndex('by_mealPlanId', (q) => q.eq('mealPlanId', mealPlanId))
      .collect()

    // key: `${ingredientId}:${bucketUnit}` -> aggregated base quantity
    type Bucket = { ingredientId: string; department: string; unit: string; quantity: number }
    const buckets = new Map<string, Bucket>()

    for (const pr of planRecipes) {
      const recipe = await ctx.db.get(pr.recipeId)
      if (!recipe) continue

      const recipeIngredients = await ctx.db
        .query('recipeIngredients')
        .withIndex('by_recipeId', (q) => q.eq('recipeId', pr.recipeId))
        .collect()

      for (const ri of recipeIngredients) {
        const ingredient = await ctx.db.get(ri.ingredientId)
        if (!ingredient) continue

        const scaled = scaledQuantity(ri.baseQuantity, recipe.baseYield, pr.targetServings)
        const { baseQuantity, baseUnit } = toBaseUnits(scaled, ri.unit)

        // Count units (item/clove/can/bunch) only aggregate cleanly when the
        // unit label matches; different count units for the same ingredient
        // are kept as separate line items rather than force-summed.
        const bucketUnit = isCountUnit(ri.unit) ? ri.unit : baseUnit
        const key = `${ri.ingredientId}:${bucketUnit}`

        const existing = buckets.get(key)
        if (existing) {
          existing.quantity += baseQuantity
        } else {
          buckets.set(key, {
            ingredientId: ri.ingredientId,
            department: ingredient.department,
            unit: bucketUnit,
            quantity: baseQuantity,
          })
        }
      }
    }

    for (const bucket of buckets.values()) {
      await ctx.db.insert('groceryItems', {
        mealPlanId,
        ingredientId: bucket.ingredientId as never,
        department: bucket.department,
        aggregatedQuantity: bucket.quantity,
        unit: bucket.unit,
        isChecked: checkedByIngredientId.get(bucket.ingredientId) ?? false,
      })
    }
  },
})

export const addManualItem = mutation({
  args: {
    mealPlanId: v.id('mealPlans'),
    ingredientId: v.optional(v.id('ingredients')),
    customName: v.optional(v.string()),
    department: v.string(),
    quantity: v.number(),
    unit: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('groceryItems', {
      mealPlanId: args.mealPlanId,
      ingredientId: args.ingredientId,
      customName: args.customName,
      department: args.department,
      aggregatedQuantity: args.quantity,
      unit: args.unit,
      isChecked: false,
    })
  },
})

export const toggleChecked = mutation({
  args: { itemId: v.id('groceryItems') },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId)
    if (!item) return
    await ctx.db.patch(itemId, { isChecked: !item.isChecked })
  },
})

export const clearChecked = mutation({
  args: { mealPlanId: v.id('mealPlans') },
  handler: async (ctx, { mealPlanId }) => {
    const items = await ctx.db
      .query('groceryItems')
      .withIndex('by_mealPlanId', (q) => q.eq('mealPlanId', mealPlanId))
      .collect()
    for (const item of items) {
      if (item.isChecked) await ctx.db.delete(item._id)
    }
  },
})

/** For the line-item inspector: which active-plan recipes use this ingredient. */
export const recipesUsingIngredient = query({
  args: { mealPlanId: v.id('mealPlans'), ingredientId: v.id('ingredients') },
  handler: async (ctx, { mealPlanId, ingredientId }) => {
    const planRecipes = await ctx.db
      .query('mealPlanRecipes')
      .withIndex('by_mealPlanId', (q) => q.eq('mealPlanId', mealPlanId))
      .collect()

    const results = []
    for (const pr of planRecipes) {
      const recipeIngredients = await ctx.db
        .query('recipeIngredients')
        .withIndex('by_recipeId', (q) => q.eq('recipeId', pr.recipeId))
        .collect()
      if (recipeIngredients.some((ri) => ri.ingredientId === ingredientId)) {
        const recipe = await ctx.db.get(pr.recipeId)
        if (recipe) results.push(recipe)
      }
    }
    return results
  },
})

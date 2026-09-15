import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

async function getOrCreateActivePlan(ctx: any) {
  const existing = await ctx.db
    .query('mealPlans')
    .withIndex('by_status', (q: any) => q.eq('status', 'active'))
    .first()
  if (existing) return existing
  const id = await ctx.db.insert('mealPlans', { status: 'active', createdAt: Date.now() })
  return await ctx.db.get(id)
}

export const getActivePlan = query({
  args: {},
  handler: async (ctx) => {
    const plan = await ctx.db
      .query('mealPlans')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .first()
    if (!plan) return null

    const planRecipes = await ctx.db
      .query('mealPlanRecipes')
      .withIndex('by_mealPlanId', (q) => q.eq('mealPlanId', plan._id))
      .collect()

    const recipes = await Promise.all(
      planRecipes.map(async (pr) => {
        const recipe = await ctx.db.get(pr.recipeId)
        return { planRecipeId: pr._id, targetServings: pr.targetServings, recipe }
      }),
    )

    return { plan, recipes }
  },
})

export const addRecipeToPlan = mutation({
  args: { recipeId: v.id('recipes'), targetServings: v.optional(v.union(v.literal(2), v.literal(4), v.literal(6))) },
  handler: async (ctx, { recipeId, targetServings }) => {
    const plan = await getOrCreateActivePlan(ctx)
    const existing = await ctx.db
      .query('mealPlanRecipes')
      .withIndex('by_mealPlanId_recipeId', (q) => q.eq('mealPlanId', plan!._id).eq('recipeId', recipeId))
      .unique()
    if (existing) return existing._id

    const recipe = await ctx.db.get(recipeId)
    return await ctx.db.insert('mealPlanRecipes', {
      mealPlanId: plan!._id,
      recipeId,
      targetServings: targetServings ?? ((recipe?.baseYield as 2 | 4 | 6) ?? 4),
    })
  },
})

export const removeRecipeFromPlan = mutation({
  args: { planRecipeId: v.id('mealPlanRecipes') },
  handler: async (ctx, { planRecipeId }) => {
    await ctx.db.delete(planRecipeId)
  },
})

export const setServings = mutation({
  args: { planRecipeId: v.id('mealPlanRecipes'), targetServings: v.union(v.literal(2), v.literal(4), v.literal(6)) },
  handler: async (ctx, { planRecipeId, targetServings }) => {
    await ctx.db.patch(planRecipeId, { targetServings })
  },
})

export const clearPlan = mutation({
  args: {},
  handler: async (ctx) => {
    const plan = await ctx.db
      .query('mealPlans')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .first()
    if (!plan) return
    const planRecipes = await ctx.db
      .query('mealPlanRecipes')
      .withIndex('by_mealPlanId', (q) => q.eq('mealPlanId', plan._id))
      .collect()
    for (const pr of planRecipes) await ctx.db.delete(pr._id)
  },
})

export const archivePlan = mutation({
  args: {},
  handler: async (ctx) => {
    const plan = await ctx.db
      .query('mealPlans')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .first()
    if (!plan) return
    await ctx.db.patch(plan._id, { status: 'archived' })
  },
})

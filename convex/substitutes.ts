import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const forIngredient = query({
  args: { ingredientId: v.id('ingredients') },
  handler: async (ctx, { ingredientId }) => {
    return await ctx.db
      .query('ingredientSubstitutes')
      .withIndex('by_ingredientId', (q) => q.eq('ingredientId', ingredientId))
      .collect()
  },
})

/** Public so scripts/seedSubstitutes.ts can call it via ConvexHttpClient. */
export const upsertSubstitute = mutation({
  args: {
    ingredientId: v.id('ingredients'),
    substituteName: v.string(),
    ratio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('ingredientSubstitutes')
      .withIndex('by_ingredientId', (q) => q.eq('ingredientId', args.ingredientId))
      .collect()
    const dupe = existing.find((e) => e.substituteName === args.substituteName)
    if (dupe) return dupe._id
    return await ctx.db.insert('ingredientSubstitutes', args)
  },
})

export const clearAllForIngredient = mutation({
  args: { ingredientId: v.id('ingredients') },
  handler: async (ctx, { ingredientId }) => {
    const existing = await ctx.db
      .query('ingredientSubstitutes')
      .withIndex('by_ingredientId', (q) => q.eq('ingredientId', ingredientId))
      .collect()
    for (const e of existing) await ctx.db.delete(e._id)
  },
})

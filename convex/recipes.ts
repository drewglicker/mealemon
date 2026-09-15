import { query } from './_generated/server'
import { v } from 'convex/values'

/** All recipes for the Explore feed, optionally filtered by dietary flags
 * and a free-text search against name/keywords. */
export const list = query({
  args: {
    search: v.optional(v.string()),
    dietaryFlags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { search, dietaryFlags }) => {
    let recipes = await ctx.db.query('recipes').collect()

    if (dietaryFlags && dietaryFlags.length > 0) {
      recipes = recipes.filter((r) => dietaryFlags.every((f) => r.dietaryFlags.includes(f)))
    }

    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase()
      recipes = recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.keywords.some((k) => k.toLowerCase().includes(q)) ||
          r.recipeCategory.toLowerCase().includes(q) ||
          r.recipeCuisine.toLowerCase().includes(q),
      )
    }

    return recipes
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const recipe = await ctx.db
      .query('recipes')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!recipe) return null

    const ingredients = await ctx.db
      .query('recipeIngredients')
      .withIndex('by_recipeId', (q) => q.eq('recipeId', recipe._id))
      .collect()

    const ingredientDetails = await Promise.all(
      ingredients.map(async (ri) => {
        const ingredient = await ctx.db.get(ri.ingredientId)
        return { ...ri, ingredient }
      }),
    )

    const steps = await ctx.db
      .query('recipeSteps')
      .withIndex('by_recipeId', (q) => q.eq('recipeId', recipe._id))
      .collect()
    steps.sort((a, b) => a.stepNumber - b.stepNumber)

    return { recipe, ingredients: ingredientDetails, steps }
  },
})

import { query } from './_generated/server'
import { v } from 'convex/values'

/** Deterministic seeded PRNG (mulberry32) so a given seed always produces
 * the same shuffle order — lets the client page through a stable random
 * ordering instead of re-shuffling (and re-seeing recipes) on every page. */
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const rng = mulberry32(seed)
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Paginated Explore feed: filters by dietary flags / search, then returns
 * a random-but-stable page of `limit` recipes starting at `offset`. The
 * same `seed` always yields the same shuffled order, so the client can
 * page through 10-at-a-time (lazy load) without re-fetching everything or
 * seeing duplicates/skips across pages. */
export const list = query({
  args: {
    search: v.optional(v.string()),
    dietaryFlags: v.optional(v.array(v.string())),
    seed: v.number(),
    offset: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { search, dietaryFlags, seed, offset, limit }) => {
    const pageSize = limit ?? 10
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

    const shuffled = seededShuffle(recipes, seed)
    const page = shuffled.slice(offset, offset + pageSize)

    return {
      items: page,
      total: shuffled.length,
      hasMore: offset + pageSize < shuffled.length,
    }
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

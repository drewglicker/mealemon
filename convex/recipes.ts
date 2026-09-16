import { query } from './_generated/server'
import { v } from 'convex/values'

const FLAG_FIELD: Record<string, 'isVegetarian' | 'isGlutenFree' | 'isDairyFree' | 'isLowCarb'> = {
  Vegetarian: 'isVegetarian',
  'Gluten-Free': 'isGlutenFree',
  'Dairy-Free': 'isDairyFree',
  'Low Carb': 'isLowCarb',
}
const FLAG_INDEX: Record<string, 'by_isVegetarian_shuffleKey' | 'by_isGlutenFree_shuffleKey' | 'by_isDairyFree_shuffleKey' | 'by_isLowCarb_shuffleKey'> = {
  isVegetarian: 'by_isVegetarian_shuffleKey',
  isGlutenFree: 'by_isGlutenFree_shuffleKey',
  isDairyFree: 'by_isDairyFree_shuffleKey',
  isLowCarb: 'by_isLowCarb_shuffleKey',
}

/** Our own cursor: which underlying indexed stream we're reading from, plus
 * that stream's own opaque Convex pagination cursor. This lets the Explore
 * feed start at a random point in the shuffleKey-ordered index (stream 'A':
 * key >= seed) and, once that runs out, wrap around to the beginning
 * (stream 'B': key < seed) — a full randomized pass over the table using
 * only indexed range scans, never a full collect()/shuffle in memory. */
type Cursor = { stream: 'A' | 'B' | 'search'; inner: string | null }

function decodeCursor(raw: string | null | undefined, hasSearch: boolean): Cursor {
  if (!raw) return { stream: hasSearch ? 'search' : 'A', inner: null }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.stream === 'string') return parsed as Cursor
  } catch {
    // fall through to default
  }
  return { stream: hasSearch ? 'search' : 'A', inner: null }
}

/** Paginated Explore feed. No search/filter: indexed random-start circular
 * scan over `by_shuffleKey`. One dietary filter chip active: same circular
 * scan over the matching `by_<flag>_shuffleKey` compound index. Free-text
 * search: Convex search index over `searchBlob` (optionally narrowed by a
 * dietary flag), paginated by relevance. None of these paths ever load the
 * whole recipes table into the function. */
export const list = query({
  args: {
    search: v.optional(v.string()),
    dietaryFlags: v.optional(v.array(v.string())),
    seed: v.number(),
    cursor: v.optional(v.union(v.string(), v.null())),
    numItems: v.optional(v.number()),
  },
  handler: async (ctx, { search, dietaryFlags, seed, cursor, numItems }) => {
    const pageSize = numItems ?? 10
    const trimmedSearch = search?.trim().toLowerCase() ?? ''
    const flagName = dietaryFlags && dietaryFlags.length > 0 ? dietaryFlags[0] : undefined
    const flagField = flagName ? FLAG_FIELD[flagName] : undefined

    const state = decodeCursor(cursor, trimmedSearch.length > 0)
    const paginationOpts = { numItems: pageSize, cursor: state.inner }

    if (trimmedSearch.length > 0) {
      let searchQuery = ctx.db
        .query('recipes')
        .withSearchIndex('search_recipes', (q) => {
          const base = q.search('searchBlob', trimmedSearch)
          return flagField ? base.eq(flagField, true) : base
        })
      const page = await searchQuery.paginate(paginationOpts)
      return {
        items: page.page,
        hasMore: !page.isDone,
        cursor: JSON.stringify({ stream: 'search', inner: page.continueCursor } satisfies Cursor),
      }
    }

    if (flagField) {
      const indexName = FLAG_INDEX[flagField]
      if (state.stream === 'B') {
        const page = await ctx.db
          .query('recipes')
          .withIndex(indexName, (q) => q.eq(flagField, true).lt('shuffleKey', seed))
          .paginate(paginationOpts)
        return {
          items: page.page,
          hasMore: !page.isDone,
          cursor: JSON.stringify({ stream: 'B', inner: page.continueCursor } satisfies Cursor),
        }
      }
      const page = await ctx.db
        .query('recipes')
        .withIndex(indexName, (q) => q.eq(flagField, true).gte('shuffleKey', seed))
        .paginate(paginationOpts)
      return {
        items: page.page,
        hasMore: true, // even if this stream is done, stream B still remains
        cursor: JSON.stringify(
          page.isDone
            ? { stream: 'B', inner: null }
            : { stream: 'A', inner: page.continueCursor },
        ),
      }
    }

    // No search, no filter: circular scan over the full shuffleKey index.
    if (state.stream === 'B') {
      const page = await ctx.db
        .query('recipes')
        .withIndex('by_shuffleKey', (q) => q.lt('shuffleKey', seed))
        .paginate(paginationOpts)
      return {
        items: page.page,
        hasMore: !page.isDone,
        cursor: JSON.stringify({ stream: 'B', inner: page.continueCursor } satisfies Cursor),
      }
    }
    const page = await ctx.db
      .query('recipes')
      .withIndex('by_shuffleKey', (q) => q.gte('shuffleKey', seed))
      .paginate(paginationOpts)
    return {
      items: page.page,
      hasMore: true,
      cursor: JSON.stringify(
        page.isDone ? { stream: 'B', inner: null } : { stream: 'A', inner: page.continueCursor },
      ),
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

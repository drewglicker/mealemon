import { query } from './_generated/server'
import { v } from 'convex/values'

export const search = query({
  args: { term: v.string() },
  handler: async (ctx, { term }) => {
    const all = await ctx.db.query('ingredients').collect()
    const q = term.trim().toLowerCase()
    if (!q) return all.slice(0, 20)
    return all.filter((i) => i.canonicalName.toLowerCase().includes(q)).slice(0, 20)
  },
})

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('ingredients').collect()
  },
})

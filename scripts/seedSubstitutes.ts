/**
 * Seeds the ingredientSubstitutes table by matching the curated reference in
 * scripts/data/substitutes.ts against whatever ingredients already exist in
 * the ingredients taxonomy (populated by scripts/seed.ts). Re-runnable:
 * clears and re-inserts per matched ingredient.
 *
 * Usage: CONVEX_URL=... npx tsx scripts/seedSubstitutes.ts
 */
import { ConvexHttpClient } from 'convex/browser'
import { anyApi } from 'convex/server'
import { findSubstitutes } from './data/substitutes'

async function main() {
  const convexUrl = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL
  if (!convexUrl) {
    console.error('Missing CONVEX_URL (or VITE_CONVEX_URL) env var.')
    process.exit(1)
  }

  const client = new ConvexHttpClient(convexUrl)
  const ingredients: { _id: string; canonicalName: string }[] = await client.query(anyApi.ingredients.listAll, {})

  console.log(`Checking ${ingredients.length} ingredient(s) for substitute matches...`)

  let matchedCount = 0
  for (const ingredient of ingredients) {
    const substitutes = findSubstitutes(ingredient.canonicalName)
    if (substitutes.length === 0) continue

    await client.mutation(anyApi.substitutes.clearAllForIngredient, { ingredientId: ingredient._id as never })
    for (const sub of substitutes) {
      await client.mutation(anyApi.substitutes.upsertSubstitute, {
        ingredientId: ingredient._id as never,
        substituteName: sub.name,
        ratio: sub.ratio,
      })
    }
    matchedCount++
    console.log(`  ${ingredient.canonicalName} -> ${substitutes.map((s) => s.name).join(', ')}`)
  }

  console.log(`Done. ${matchedCount}/${ingredients.length} ingredients matched a substitute entry.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

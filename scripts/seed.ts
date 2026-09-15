/**
 * Ingestion entrypoint for Mealemon.
 *
 * Globs ./data/*.json (scraped recipe payloads), parses ingredients and
 * instructions into the normalized Convex schema, and seeds the deployment
 * via internal mutations in convex/seed.ts.
 *
 * Requires CONVEX_URL (or VITE_CONVEX_URL) in the environment, pointing at
 * a deployment that has already run `npx convex dev` at least once so the
 * schema + seed mutations are pushed.
 *
 * Usage: npx tsx scripts/seed.ts
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ConvexHttpClient } from 'convex/browser'
import { anyApi } from 'convex/server'
import { parseIngredientLine } from './lib/parseIngredient'
import { classifyIngredient } from './lib/departments'
import { inferDietaryFlags } from './lib/dietaryFlags'
import { linkIngredientsToSteps } from './lib/linkSteps'
import { toBaseUnits } from '../shared/units'

interface ScrapedRecipe {
  source_url: string
  recipe_id: string
  name: string
  recipe_category: string
  recipe_cuisine: string
  keywords: string[]
  cook_time: string
  total_time: string
  recipe_yield: string
  ingredients: string[]
  instructions: string[]
  images: string[]
  author: string
  slug: string
}

function parseYield(recipeYield: string): number {
  const match = recipeYield.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 4
}

async function main() {
  const convexUrl = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL
  if (!convexUrl) {
    console.error('Missing CONVEX_URL (or VITE_CONVEX_URL) env var. Set it to your Convex deployment URL.')
    process.exit(1)
  }

  const client = new ConvexHttpClient(convexUrl)

  const dataDir = join(process.cwd(), 'data')
  const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'))
  console.log(`Found ${files.length} recipe file(s) in ${dataDir}`)

  const ingredientIdCache = new Map<string, string>() // canonicalName -> Convex Id

  for (const file of files) {
    const raw: ScrapedRecipe = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'))
    console.log(`Ingesting ${raw.slug} ...`)

    const parsedIngredients = raw.ingredients.map((line) => parseIngredientLine(line))

    // Resolve/create master ingredient taxonomy entries.
    const ingredientIds: string[] = []
    for (const parsed of parsedIngredients) {
      let id = ingredientIdCache.get(parsed.canonicalName)
      if (!id) {
        const { department, defaultUnitType } = classifyIngredient(parsed.canonicalName)
        id = await client.mutation(anyApi.seed.upsertIngredient, {
          canonicalName: parsed.canonicalName,
          department,
          defaultUnitType,
        })
        ingredientIdCache.set(parsed.canonicalName, id!)
      }
      ingredientIds.push(id!)
    }

    const recipeIngredientsPayload = parsedIngredients.map((parsed, i) => {
      const { baseQuantity } = toBaseUnits(parsed.quantity, parsed.unit)
      // Store the normalized-but-not-yet-bucket-converted unit; aggregation
      // mutations do the fl oz / oz bucketing at plan-computation time using
      // shared/units.ts, so we persist the recipe's own stated unit + qty.
      void baseQuantity
      return {
        ingredientId: ingredientIds[i],
        rawText: parsed.rawText,
        baseQuantity: parsed.quantity,
        unit: parsed.unit,
        prepNote: parsed.prepNote,
      }
    })

    const linked = linkIngredientsToSteps(
      raw.instructions,
      parsedIngredients.map((p, i) => ({ index: i, canonicalName: p.canonicalName })),
    )

    const stepsPayload = raw.instructions.map((text, i) => ({
      stepNumber: i + 1,
      instructionText: text,
      linkedIngredientIndices: linked[i],
    }))

    const dietaryFlags = inferDietaryFlags(parsedIngredients.map((p) => p.canonicalName))

    await client.mutation(anyApi.seed.upsertRecipeWithDetails, {
      recipe: {
        slug: raw.slug,
        name: raw.name,
        recipeCategory: raw.recipe_category,
        recipeCuisine: raw.recipe_cuisine,
        cookTime: raw.cook_time,
        totalTime: raw.total_time,
        baseYield: parseYield(raw.recipe_yield),
        images: raw.images,
        keywords: raw.keywords,
        dietaryFlags,
      },
      ingredients: recipeIngredientsPayload as never,
      steps: stepsPayload,
    })

    console.log(`  -> ${raw.name}: ${parsedIngredients.length} ingredients, ${raw.instructions.length} steps, flags: ${dietaryFlags.join(', ') || 'none'}`)
  }

  console.log('Seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

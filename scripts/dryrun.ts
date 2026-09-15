// Standalone dry-run of the ingestion parsing pipeline (no Convex needed).
// Verifies parseIngredientLine / classifyIngredient / linkIngredientsToSteps
// against the real files in ./data before we have a live deployment.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseIngredientLine } from './lib/parseIngredient'
import { classifyIngredient } from './lib/departments'
import { inferDietaryFlags } from './lib/dietaryFlags'
import { linkIngredientsToSteps } from './lib/linkSteps'

const dataDir = join(process.cwd(), 'data')
const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'))

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'))
  console.log(`\n=== ${raw.name} (${raw.slug}) ===`)

  const parsed = raw.ingredients.map((line: string) => parseIngredientLine(line))
  for (const p of parsed) {
    const { department, defaultUnitType } = classifyIngredient(p.canonicalName)
    console.log(
      `  "${p.rawText}" -> qty=${p.quantity} unit=${p.unit} name="${p.canonicalName}" prep=${p.prepNote ?? '-'} dept=${department}/${defaultUnitType}`,
    )
  }

  const flags = inferDietaryFlags(parsed.map((p: { canonicalName: string }) => p.canonicalName))
  console.log(`  dietaryFlags: ${flags.join(', ') || 'none'}`)

  const linked = linkIngredientsToSteps(
    raw.instructions,
    parsed.map((p: { canonicalName: string }, i: number) => ({ index: i, canonicalName: p.canonicalName })),
  )
  raw.instructions.forEach((text: string, i: number) => {
    const names = linked[i].map((idx: number) => parsed[idx].canonicalName)
    console.log(`  step ${i + 1}: [${names.join(', ')}] :: ${text.slice(0, 60)}...`)
  })
}

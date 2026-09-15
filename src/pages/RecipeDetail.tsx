import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { scaledQuantity, toBaseUnits } from '../../shared/units'
import { formatQuantity } from '../lib/formatQuantity'

const SERVING_OPTIONS = [2, 4, 6] as const
type Tab = 'Cookware' | 'Ingredients' | 'Instructions'

export default function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const data = useQuery(api.recipes.getBySlug, slug ? { slug } : 'skip')
  const addToPlan = useMutation(api.mealPlans.addRecipeToPlan)

  const [servings, setServings] = useState<(typeof SERVING_OPTIONS)[number]>(4)
  const [tab, setTab] = useState<Tab>('Instructions')
  const [cooked, setCooked] = useState(false)
  const [added, setAdded] = useState(false)

  if (data === undefined) return <p className="p-6 text-center text-sm text-[#9a968a]">Loading…</p>
  if (data === null) return <p className="p-6 text-center text-sm text-[#9a968a]">Recipe not found.</p>

  const { recipe, ingredients, steps } = data

  function scaledLine(baseQuantity: number, unit: string) {
    const scaled = scaledQuantity(baseQuantity, recipe.baseYield, servings)
    const { baseQuantity: normalized, bucket } = toBaseUnits(scaled, unit)
    return formatQuantity(normalized, bucket, unit)
  }

  async function handleAddToPlan() {
    await addToPlan({ recipeId: recipe._id, targetServings: servings })
    setAdded(true)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none px-4 pb-3 pt-1 flex flex-col gap-2 border-b border-[#edeae1]">
        <div className="flex items-center justify-between gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="h-11 w-11 flex-none rounded-2xl bg-[#f4f2ec] text-[17px] text-[#1c1b18]"
          >
            ‹
          </button>
          <div className="flex flex-none gap-0.5 rounded-xl bg-[#f4f2ec] p-[3px]">
            {SERVING_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setServings(n)}
                className={`h-9 w-9 rounded-[10px] text-[15px] font-semibold ${
                  servings === n ? 'bg-[#1c1b18] text-[#fffefb]' : 'text-[#7a776d]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <h1 className="line-clamp-2 text-[17px] font-semibold leading-snug text-[#1c1b18]">{recipe.name}</h1>
        <div className="text-xs text-[#8b877c]">
          Cook {formatDuration(recipe.cookTime)} · Total {formatDuration(recipe.totalTime)}
        </div>
      </div>

      <div className="flex-none flex gap-6 border-b border-[#edeae1] px-4">
        {(['Cookware', 'Ingredients', 'Instructions'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-4 text-base font-semibold ${
              tab === t ? 'text-[#1c1b18] shadow-[inset_0_-3px_0_0_#edc23f]' : 'text-[#9a968a]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1.5">
        {tab === 'Cookware' && (
          <div className="flex flex-col">
            {recipe.keywords.length > 0 ? (
              recipe.keywords.map((k: string) => (
                <div key={k} className="border-b border-[#f0ede5] py-[17px] text-[17px] text-[#1c1b18]">
                  {k}
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-[#9a968a]">No cookware listed for this recipe.</p>
            )}
          </div>
        )}

        {tab === 'Ingredients' && (
          <div className="flex flex-col">
            {ingredients.map((ri: any) => (
              <div key={ri._id} className="flex items-center justify-between gap-4 border-b border-[#f0ede5] py-[17px]">
                <span className="text-[17px] text-[#1c1b18]">
                  {ri.ingredient?.canonicalName ?? ri.rawText}
                  {ri.prepNote && <span className="text-[#9a968a]">, {ri.prepNote}</span>}
                </span>
                <span className="whitespace-nowrap text-[17px] text-[#8b877c]">{scaledLine(ri.baseQuantity, ri.unit)}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'Instructions' && (
          <div className="flex flex-col">
            {steps.map((step: any) => {
              const stepIngredients = ingredients.filter((ri: any) => step.linkedIngredientIds.includes(ri._id))
              return (
                <div key={step._id} className="flex gap-3.5 border-b border-[#f0ede5] py-5">
                  <span className="w-[26px] flex-none text-xl font-semibold leading-[1.35] text-[#d9cfa8]">
                    {step.stepNumber}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <p className="text-[17px] leading-[1.45] text-[#1c1b18]">{step.instructionText}</p>
                    {stepIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {stepIngredients.map((ri: any) => (
                          <span
                            key={ri._id}
                            className="flex items-center gap-1.5 rounded-full border border-lemon-border bg-lemon-50 px-3 py-1.5 text-sm text-[#5a4a16]"
                          >
                            <span className="font-semibold">{scaledLine(ri.baseQuantity, ri.unit)}</span>
                            <span>{ri.ingredient?.canonicalName ?? ri.rawText}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex-none flex gap-2.5 border-t border-[#e9e6dd] bg-[rgba(255,254,251,0.96)] px-4 pb-7 pt-3.5 backdrop-blur-md">
        <button
          onClick={() => setCooked((c) => !c)}
          className={`h-[52px] flex-none rounded-2xl border px-5 text-base font-semibold ${
            cooked ? 'border-[#1c1b18] bg-[#1c1b18] text-[#fffefb]' : 'border-[#e4e1d8] bg-[#f4f2ec] text-[#7a776d]'
          }`}
        >
          {cooked ? '✓ Cooked' : 'Cooked?'}
        </button>
        <button
          onClick={handleAddToPlan}
          className="h-[52px] flex-1 rounded-2xl bg-lemon-500 text-[17px] font-semibold text-[#1c1b18]"
        >
          {added ? 'Added to Meal Plan ✓' : 'Add to Meal Plan'}
        </button>
      </div>
    </div>
  )
}

function formatDuration(iso8601: string): string {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso8601
  const hours = match[1] ? parseInt(match[1], 10) : 0
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes} min`
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { ChevronLeft, Clock, Plus } from 'lucide-react'
import { scaledQuantity, toBaseUnits } from '../../shared/units'
import { formatQuantity } from '../lib/formatQuantity'

const SERVING_OPTIONS = [2, 4, 6] as const
type Tab = 'cookware' | 'ingredients' | 'instructions'

export default function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const data = useQuery(api.recipes.getBySlug, slug ? { slug } : 'skip')
  const addToPlan = useMutation(api.mealPlans.addRecipeToPlan)

  const [servings, setServings] = useState<(typeof SERVING_OPTIONS)[number]>(4)
  const [tab, setTab] = useState<Tab>('ingredients')

  if (data === undefined) return <p className="p-6 text-center text-sm text-gray-400">Loading…</p>
  if (data === null) return <p className="p-6 text-center text-sm text-gray-400">Recipe not found.</p>

  const { recipe, ingredients, steps } = data

  function scaledLine(baseQuantity: number, unit: string) {
    const scaled = scaledQuantity(baseQuantity, recipe.baseYield, servings)
    const { baseQuantity: normalized, bucket } = toBaseUnits(scaled, unit)
    return formatQuantity(normalized, bucket, unit)
  }

  return (
    <div className="flex flex-col">
      <div className="relative">
        <img src={recipe.images[0]} alt={recipe.name} className="h-56 w-full object-cover" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <h1 className="text-xl font-bold text-gray-900">{recipe.name}</h1>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={14} /> Cook {formatDuration(recipe.cookTime)}
          </span>
          <span>Total {formatDuration(recipe.totalTime)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Servings</span>
          <div className="flex overflow-hidden rounded-full border border-gray-200">
            {SERVING_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setServings(n)}
                className={`px-3 py-1 text-xs font-semibold ${
                  servings === n ? 'bg-lemon-500 text-white' : 'text-gray-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => addToPlan({ recipeId: recipe._id, targetServings: servings })}
          className="flex items-center justify-center gap-2 rounded-xl bg-lemon-500 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={16} /> Add to Meal Plan
        </button>

        <div className="mt-2 flex border-b border-gray-200 text-sm">
          {(['cookware', 'ingredients', 'instructions'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 border-b-2 pb-2 text-center font-medium capitalize ${
                tab === t ? 'border-lemon-500 text-lemon-700' : 'border-transparent text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'cookware' && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            {recipe.keywords.length > 0 ? (
              recipe.keywords.map((k: string) => <li key={k}>{k}</li>)
            ) : (
              <p className="text-gray-400">No cookware listed for this recipe.</p>
            )}
          </ul>
        )}

        {tab === 'ingredients' && (
          <ul className="space-y-2 text-sm text-gray-700">
            {ingredients.map((ri: any) => (
              <li key={ri._id} className="flex items-start justify-between gap-2 border-b border-gray-50 pb-2">
                <span>
                  {ri.ingredient?.canonicalName ?? ri.rawText}
                  {ri.prepNote && <span className="text-gray-400">, {ri.prepNote}</span>}
                </span>
                <span className="shrink-0 font-medium text-gray-900">{scaledLine(ri.baseQuantity, ri.unit)}</span>
              </li>
            ))}
          </ul>
        )}

        {tab === 'instructions' && (
          <ol className="flex flex-col gap-4 text-sm text-gray-700">
            {steps.map((step: any) => {
              const stepIngredients = ingredients.filter((ri: any) => step.linkedIngredientIds.includes(ri._id))
              return (
                <li key={step._id} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lemon-100 text-xs font-bold text-lemon-700">
                    {step.stepNumber}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <p>{step.instructionText}</p>
                    {stepIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {stepIngredients.map((ri: any) => (
                          <span
                            key={ri._id}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                          >
                            {ri.ingredient?.canonicalName ?? ri.rawText} · {scaledLine(ri.baseQuantity, ri.unit)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
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

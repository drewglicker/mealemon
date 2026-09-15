import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Archive, ShoppingCart } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'

const SERVING_OPTIONS = [2, 4, 6] as const

export default function MealPlan() {
  const navigate = useNavigate()
  const data = useQuery(api.mealPlans.getActivePlan)
  const setServings = useMutation(api.mealPlans.setServings)
  const removeRecipe = useMutation(api.mealPlans.removeRecipeFromPlan)
  const clearPlan = useMutation(api.mealPlans.clearPlan)
  const archivePlan = useMutation(api.mealPlans.archivePlan)
  const computeGroceries = useMutation(api.groceries.computeFromPlan)

  if (data === undefined) return <p className="p-6 text-center text-sm text-gray-400">Loading…</p>

  const recipes = data?.recipes ?? []

  async function handleAddToGroceries() {
    if (!data?.plan) return
    await computeGroceries({ mealPlanId: data.plan._id })
    navigate('/groceries')
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meal Plan</h1>
        {recipes.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => clearPlan()}
              className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500"
            >
              <Trash2 size={13} /> Clear
            </button>
            <button
              onClick={() => archivePlan()}
              className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500"
            >
              <Archive size={13} /> Archive
            </button>
          </div>
        )}
      </div>

      {recipes.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm text-gray-400">No recipes in your plan yet.</p>
          <Link to="/" className="text-sm font-semibold text-lemon-600">
            Browse recipes
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {recipes.map(({ planRecipeId, targetServings, recipe }) => {
          if (!recipe) return null
          return (
            <div key={planRecipeId} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 shadow-sm">
              <img src={recipe.images[0]} alt={recipe.name} className="h-16 w-16 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Link to={`/recipe/${recipe.slug}`} className="line-clamp-1 text-sm font-semibold text-gray-900">
                  {recipe.name}
                </Link>
                <div className="flex overflow-hidden rounded-full border border-gray-200 self-start">
                  {SERVING_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setServings({ planRecipeId, targetServings: n })}
                      className={`px-2.5 py-1 text-[11px] font-semibold ${
                        targetServings === n ? 'bg-lemon-500 text-white' : 'text-gray-500'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => removeRecipe({ planRecipeId: planRecipeId as Id<'mealPlanRecipes'> })}
                className="text-gray-300"
                aria-label="Remove from plan"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}
      </div>

      {recipes.length > 0 && (
        <button
          onClick={handleAddToGroceries}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-lemon-500 py-3 text-sm font-semibold text-white"
        >
          <ShoppingCart size={16} /> Add to Groceries
        </button>
      )}
    </div>
  )
}

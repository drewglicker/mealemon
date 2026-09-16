import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Link, useNavigate } from 'react-router-dom'
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

  if (data === undefined) return <p className="p-6 text-center text-sm text-[#9a968a]">Loading…</p>

  const recipes = data?.recipes ?? []

  async function handleAddToGroceries() {
    if (!data?.plan) return
    await computeGroceries({ mealPlanId: data.plan._id })
    navigate('/groceries')
  }

  return (
    <div className="flex flex-col gap-4 px-5 pb-28 pt-2">
      <div className="flex items-end justify-between gap-3 border-b border-[#edeae1] pb-3.5">
        <h1 className="font-serif text-[32px] leading-[1.05] text-[#1c1b18]">Meal Plan</h1>
        {recipes.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => clearPlan()}
              className="h-[34px] rounded-xl border border-[#e4e1d8] bg-[#fffefb] px-3 text-[13px] font-semibold text-[#5c584e]"
            >
              Clear
            </button>
            <button
              onClick={() => archivePlan()}
              className="h-[34px] rounded-xl border border-[#e4e1d8] bg-[#fffefb] px-3 text-[13px] font-semibold text-[#5c584e]"
            >
              Archive
            </button>
          </div>
        )}
      </div>

      {recipes.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm text-[#9a968a]">No recipes in your plan yet.</p>
          <Link to="/" className="text-sm font-semibold text-link">
            Browse recipes
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {recipes.map(({ planRecipeId, targetServings, recipe }) => {
          if (!recipe) return null
          return (
            <div key={planRecipeId} className="flex items-center gap-3 rounded-2xl border border-[#eae7de] p-3">
              <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl bg-[#efece4]">
                {recipe.images[0] && (
                  <img
                    src={recipe.images[0]}
                    alt={recipe.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Link to={`/recipe/${recipe.slug}`} className="line-clamp-1 text-[15px] font-semibold text-[#1c1b18]">
                  {recipe.name}
                </Link>
                <div className="flex self-start gap-0.5 rounded-xl bg-[#f4f2ec] p-[3px]">
                  {SERVING_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setServings({ planRecipeId, targetServings: n })}
                      className={`h-7 w-8 rounded-[8px] text-[12px] font-semibold ${
                        targetServings === n ? 'bg-[#1c1b18] text-[#fffefb]' : 'text-[#7a776d]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => removeRecipe({ planRecipeId: planRecipeId as Id<'mealPlanRecipes'> })}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#c6c2b7]"
                aria-label="Remove from plan"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      {recipes.length > 0 && (
        <button
          onClick={handleAddToGroceries}
          className="mt-2 h-[52px] rounded-2xl bg-lemon-500 text-[17px] font-semibold text-[#1c1b18]"
        >
          Add to Groceries
        </button>
      )}
    </div>
  )
}

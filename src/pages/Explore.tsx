import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Link } from 'react-router-dom'
import { Search, Plus, Clock } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'

const DIETARY_TAGS = ['Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Low Carb']

export default function Explore() {
  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])

  const recipes = useQuery(api.recipes.list, { search, dietaryFlags: activeTags })
  const addToPlan = useMutation(api.mealPlans.addRecipeToPlan)

  function toggleTag(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <h1 className="text-2xl font-bold text-gray-900">Explore</h1>

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-lemon-400 focus:ring-2 focus:ring-lemon-100"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {DIETARY_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              activeTags.includes(tag)
                ? 'border-lemon-500 bg-lemon-100 text-lemon-700'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {recipes === undefined && <p className="py-8 text-center text-sm text-gray-400">Loading recipes…</p>}
      {recipes && recipes.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">No recipes match your filters.</p>
      )}

      <div className="flex flex-col gap-3">
        {recipes?.map((recipe) => (
          <div key={recipe._id} className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
            <Link to={`/recipe/${recipe.slug}`} className="flex gap-3 p-3">
              <img
                src={recipe.images[0]}
                alt={recipe.name}
                className="h-20 w-20 shrink-0 rounded-xl bg-gray-100 object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <h2 className="line-clamp-2 text-sm font-semibold text-gray-900">{recipe.name}</h2>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {formatDuration(recipe.totalTime)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {recipe.dietaryFlags.slice(0, 2).map((f: string) => (
                    <span key={f} className="rounded-full bg-lemon-50 px-2 py-0.5 text-[10px] font-medium text-lemon-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
            <button
              onClick={() => addToPlan({ recipeId: recipe._id as Id<'recipes'> })}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-lemon-500 text-white shadow"
              aria-label="Add to meal plan"
            >
              <Plus size={18} />
            </button>
          </div>
        ))}
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

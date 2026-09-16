import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Link } from 'react-router-dom'
import type { Id } from '../../convex/_generated/dataModel'
import { dietaryTagTone } from '../lib/departmentTheme'

const FILTERS = ['All', 'Vegetarian', 'Gluten-Free', 'Low Carb', 'Dairy-Free']
const PAGE_SIZE = 10

export default function Explore() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const activeTags = useMemo(() => (filter === 'All' ? [] : [filter]), [filter])

  // A fresh random seed + reset cursor whenever the search/filter changes,
  // so each new query gets its own random order starting from the top.
  // Must be in the same domain as `shuffleKey` (Math.random(), i.e. [0,1)).
  const [seed, setSeed] = useState(() => Math.random())
  const [cursor, setCursor] = useState<string | null>(null)
  const [pendingCursor, setPendingCursor] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const seenIds = useRef(new Set<string>())

  const lastProcessedCursorRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    setSeed(Math.random())
    setCursor(null)
    setPendingCursor(null)
    setItems([])
    seenIds.current = new Set()
    inFlightRef.current = false
    lastProcessedCursorRef.current = undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter])

  const page = useQuery(api.recipes.list, {
    search,
    dietaryFlags: activeTags,
    seed,
    cursor,
    numItems: PAGE_SIZE,
  })

  // Refs mirroring the latest state so the IntersectionObserver's callback
  // (created once, not on every render — see setSentinelRef below) always
  // reads fresh values without needing to be torn down and recreated.
  const hasMoreRef = useRef(false)
  const pendingCursorRef = useRef<string | null>(null)
  const cursorRef = useRef<string | null>(null)
  const inFlightRef = useRef(false)
  hasMoreRef.current = page?.hasMore ?? false
  pendingCursorRef.current = pendingCursor
  cursorRef.current = cursor

  useEffect(() => {
    if (!page) return
    if (lastProcessedCursorRef.current === cursor) return
    lastProcessedCursorRef.current = cursor
    let addedAny = false
    setItems((prev) => {
      const next = [...prev]
      for (const r of page.items) {
        if (!seenIds.current.has(r._id)) {
          seenIds.current.add(r._id)
          next.push(r)
          addedAny = true
        }
      }
      return next
    })
    setPendingCursor(page.cursor)
    inFlightRef.current = false
    // A page can legitimately come back empty (e.g. right at the seam
    // between the two shuffleKey streams) while more data remains — chase
    // straight to the next cursor instead of stalling on an empty screen.
    if (!addedAny && page.hasMore && page.cursor !== cursor) {
      inFlightRef.current = true
      setCursor(page.cursor)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const hasMore = page?.hasMore ?? false
  const isLoadingFirstPage = page === undefined && items.length === 0

  const observerRef = useRef<IntersectionObserver | null>(null)
  // A callback ref: fires only when the sentinel div actually mounts/unmounts
  // (not on every re-render), so we create exactly one observer per sentinel
  // lifetime instead of recreating it — and re-firing its initial check — on
  // every page load.
  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (!node) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !inFlightRef.current &&
          pendingCursorRef.current !== cursorRef.current
        ) {
          inFlightRef.current = true
          setCursor(pendingCursorRef.current)
        }
      },
      { rootMargin: '200px' },
    )
    observerRef.current.observe(node)
  }, [])

  const recipes = items
  const addToPlan = useMutation(api.mealPlans.addRecipeToPlan)
  const [added, setAdded] = useState<Record<string, boolean>>({})

  const handleAdd = useCallback(
    async (recipeId: Id<'recipes'>) => {
      await addToPlan({ recipeId })
      setAdded((prev) => ({ ...prev, [recipeId]: !prev[recipeId] }))
    },
    [addToPlan],
  )

  return (
    <div className="flex flex-col gap-3.5 pb-28">
      <div className="flex flex-col gap-3.5 border-b border-[#edeae1] px-5 pb-3 pt-2">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-[30px] leading-none text-[#1c1b18]">Mealemon</h1>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lemon-100 text-[15px] font-semibold text-link">
            D
          </div>
        </div>

        <div className="flex h-11 items-center gap-2.5 rounded-2xl border border-[#e8e5dc] bg-[#f4f2ec] px-3.5">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#9a968a]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes, ingredients"
            className="w-full bg-transparent text-[15px] text-[#1c1b18] placeholder:text-[#9a968a] outline-none"
          />
        </div>

        <div className="-mb-0.5 flex gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-[38px] shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
                filter === f
                  ? 'border border-[#1c1b18] bg-[#1c1b18] text-[#fffefb]'
                  : 'border border-[#e4e1d8] bg-[#fffefb] text-[#5c584e]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoadingFirstPage && <p className="px-5 py-8 text-center text-sm text-[#9a968a]">Loading recipes…</p>}
      {!isLoadingFirstPage && recipes.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-[#9a968a]">No recipes match your filters.</p>
      )}

      <div className="flex flex-col gap-[22px] px-5">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe._id} recipe={recipe} isAdded={!!added[recipe._id]} onAdd={handleAdd} />
        ))}
      </div>

      {recipes.length > 0 && (
        <div ref={setSentinelRef} className="flex h-10 items-center justify-center">
          {hasMore && <span className="text-xs text-[#9a968a]">Loading more…</span>}
        </div>
      )}
    </div>
  )
}

const RecipeCard = memo(function RecipeCard({
  recipe,
  isAdded,
  onAdd,
}: {
  recipe: any
  isAdded: boolean
  onAdd: (recipeId: Id<'recipes'>) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Link to={`/recipe/${recipe.slug}`} className="block">
        <div className="relative h-[196px] overflow-hidden rounded-[20px] bg-[#efece4]">
          {recipe.images[0] && (
            <img
              src={recipe.images[0]}
              alt={recipe.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-[rgba(28,27,24,0.82)] px-2.5 py-1.5 text-xs font-semibold text-[#fffefb]">
            {formatDuration(recipe.totalTime)}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault()
              onAdd(recipe._id)
            }}
            className={`absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full text-[22px] shadow-[0_8px_18px_-6px_rgba(28,27,24,0.4)] ${
              isAdded ? 'bg-[#1c1b18] text-lemon-500' : 'bg-lemon-500 text-[#1c1b18]'
            }`}
            aria-label="Add to meal plan"
          >
            {isAdded ? '✓' : '+'}
          </button>
        </div>
      </Link>
      <div className="flex flex-col gap-2">
        <Link to={`/recipe/${recipe.slug}`} className="text-[19px] font-semibold leading-[1.25] text-[#1c1b18]">
          {recipe.name}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          {recipe.dietaryFlags.slice(0, 3).map((flag: string) => {
            const tone = dietaryTagTone(flag)
            return (
              <span key={flag} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text}`}>
                {flag}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
})

function formatDuration(iso8601: string): string {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso8601
  const hours = match[1] ? parseInt(match[1], 10) : 0
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes} min`
}

import { useMemo, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { formatQuantity } from '../lib/formatQuantity'
import { bucketForUnit } from '../../shared/units'
import { departmentTone } from '../lib/departmentTheme'

const DEPARTMENT_ORDER = [
  'Produce',
  'Meat & Seafood',
  'Dairy, Cheese & Eggs',
  'Bakery',
  'Baking & Spices',
  'Canned & Jarred Goods',
  'Oils, Sauces & Condiments',
  'Other',
]

export default function Groceries() {
  const planData = useQuery(api.mealPlans.getActivePlan)
  const mealPlanId = planData?.plan?._id

  const items = useQuery(api.groceries.listForPlan, mealPlanId ? { mealPlanId } : 'skip')
  const toggleChecked = useMutation(api.groceries.toggleChecked)
  const clearChecked = useMutation(api.groceries.clearChecked)

  const [inspecting, setInspecting] = useState<any>(null)
  const [addingItem, setAddingItem] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const item of items ?? []) {
      const list = map.get(item.department) ?? []
      list.push(item)
      map.set(item.department, list)
    }
    return DEPARTMENT_ORDER.map((dept) => ({ dept, items: map.get(dept) ?? [] })).filter((g) => g.items.length > 0)
  }, [items])

  const total = items?.length ?? 0
  const remaining = items?.filter((i) => !i.isChecked).length ?? 0

  if (planData === undefined) {
    return <p className="p-6 text-center text-sm text-[#9a968a]">Loading…</p>
  }

  // No active plan yet, or one exists but its items query is still loading.
  if (!mealPlanId) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 py-16 text-center">
        <p className="text-sm text-[#9a968a]">
          No grocery items yet. Add recipes to your meal plan, then tap "Add to Groceries".
        </p>
      </div>
    )
  }

  if (items === undefined) {
    return <p className="p-6 text-center text-sm text-[#9a968a]">Loading…</p>
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 py-16 text-center">
        <p className="text-sm text-[#9a968a]">
          No grocery items yet. Add recipes to your meal plan, then tap "Add to Groceries".
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-full flex-col pb-32">
      <div className="flex flex-none items-end justify-between gap-3 border-b border-[#edeae1] px-5 pb-3.5 pt-1.5">
        <div>
          <h1 className="font-serif text-[32px] leading-[1.05] text-[#1c1b18]">Groceries</h1>
          <p className="mt-1.5 text-sm text-[#8b877c]">
            {remaining} of {total} items remaining
          </p>
        </div>
        <button
          onClick={() => mealPlanId && clearChecked({ mealPlanId })}
          className="h-[38px] shrink-0 rounded-xl border border-[#e4e1d8] bg-[#fffefb] px-3.5 text-[13px] font-semibold text-[#5c584e]"
        >
          Clear checked
        </button>
      </div>

      <div className="flex-1">
        {grouped.map(({ dept, items: deptItems }) => {
          const tone = departmentTone(dept)
          return (
            <div key={dept}>
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#edeae1] bg-[rgba(255,254,251,0.96)] px-5 py-3 backdrop-blur-sm">
                <span className={`h-2.5 w-2.5 rounded-[3px] ${tone.bg}`} />
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#6d6a61]">{dept}</span>
              </div>
              {deptItems.map((item) => {
                const label = item.ingredient?.canonicalName ?? item.customName ?? 'Item'
                const bucket = bucketForUnit(item.unit)
                const qtyLabel = formatQuantity(item.aggregatedQuantity, bucket, item.unit)
                return (
                  <div
                    key={item._id}
                    onClick={() => setInspecting(item)}
                    className={`flex min-h-14 cursor-pointer items-center gap-3.5 border-b border-[#f0ede5] px-5 py-3 ${
                      item.isChecked ? 'opacity-45' : ''
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleChecked({ itemId: item._id })
                      }}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                        item.isChecked ? 'border-[#1c1b18] bg-[#1c1b18] text-lemon-500' : 'border-[#d5d1c6] text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[17px] capitalize text-[#1c1b18] ${item.isChecked ? 'line-through' : ''}`}>
                        {label}
                      </div>
                      {item.substituteNote && (
                        <div className="truncate text-xs font-medium text-[#8a6a12]">using {item.substituteNote}</div>
                      )}
                    </div>
                    <div className={`shrink-0 whitespace-nowrap text-base text-[#9a968a] ${item.isChecked ? 'line-through' : ''}`}>
                      {qtyLabel}
                    </div>
                    <span className="shrink-0 text-[15px] text-[#c6c2b7]">›</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setAddingItem(true)}
        className="fixed bottom-[112px] right-5 z-[5] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-lemon-500 text-[28px] font-normal text-[#1c1b18] shadow-[0_12px_24px_-8px_rgba(151,116,13,0.6)]"
        aria-label="Add item"
      >
        +
      </button>

      {inspecting && mealPlanId && (
        <ItemInspector item={inspecting} mealPlanId={mealPlanId} onClose={() => setInspecting(null)} />
      )}

      {addingItem && mealPlanId && <ManualAddSheet mealPlanId={mealPlanId} onClose={() => setAddingItem(false)} />}
    </div>
  )
}

function ItemInspector({ item, mealPlanId, onClose }: { item: any; mealPlanId: Id<'mealPlans'>; onClose: () => void }) {
  const recipes = useQuery(
    api.groceries.recipesUsingIngredient,
    item.ingredientId ? { mealPlanId, ingredientId: item.ingredientId } : 'skip',
  )
  const substitutes = useQuery(
    api.substitutes.forIngredient,
    item.ingredientId ? { ingredientId: item.ingredientId } : 'skip',
  )
  const setSubstituteNote = useMutation(api.groceries.setSubstituteNote)

  const label = item.ingredient?.canonicalName ?? item.customName ?? 'Item'
  const tone = departmentTone(item.department)
  const bucket = bucketForUnit(item.unit)
  const qtyLabel = formatQuantity(item.aggregatedQuantity, bucket, item.unit)

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-[rgba(28,27,24,0.42)]" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full flex-col gap-4.5 overflow-y-auto rounded-t-[26px] bg-[#fffefb] px-5 pb-8 pt-3 shadow-[0_-20px_40px_-20px_rgba(28,27,24,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-[5px] w-10 shrink-0 rounded-full bg-[#e0dcd2]" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-semibold capitalize text-[#1c1b18]">{label}</h3>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${tone.bg} ${tone.text}`}>
                {item.department}
              </span>
              <span className="text-sm text-[#8b877c]">{qtyLabel} total</span>
            </div>
            {item.substituteNote && (
              <span className="text-xs font-medium text-[#8a6a12]">Currently using: {item.substituteNote}</span>
            )}
          </div>
          <button onClick={onClose} className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f4f2ec] text-[15px] text-[#5c584e]">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8b877c]">You'll use this in…</div>
          {recipes === undefined && <p className="text-sm text-[#9a968a]">Loading…</p>}
          {recipes && recipes.length === 0 && <p className="text-sm text-[#9a968a]">Manually added item.</p>}
          {recipes?.map((r: any) => (
            <div key={r._id} className="flex items-center gap-3 rounded-2xl border border-[#eae7de] bg-[#fdfcf8] p-2.5">
              <div className="relative h-[52px] w-[52px] flex-none overflow-hidden rounded-xl bg-[#efece4]">
                {r.images[0] && (
                  <img
                    src={r.images[0]}
                    alt={r.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#1c1b18]">{r.name}</div>
              <span className="text-[15px] text-[#c6c2b7]">›</span>
            </div>
          ))}
        </div>

        {substitutes && substitutes.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8b877c]">Need a substitute?</div>
            <div className="flex flex-col gap-2">
              {substitutes.map((s: any) => {
                const active = item.substituteNote === s.substituteName
                return (
                  <div
                    key={s._id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#eae7de] px-3.5 py-2.5"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[15px] text-[#1c1b18]">{s.substituteName}</span>
                      {s.ratio && <span className="truncate text-xs text-[#9a968a]">{s.ratio}</span>}
                    </div>
                    <button
                      onClick={() => setSubstituteNote({ itemId: item._id, substituteName: active ? null : s.substituteName })}
                      className={`h-9 flex-none rounded-xl px-3.5 text-[13px] font-semibold ${
                        active ? 'bg-[#1c1b18] text-[#fffefb]' : 'bg-lemon-100 text-[#5a4a16]'
                      }`}
                    >
                      {active ? 'Using' : 'Use this'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ManualAddSheet({ mealPlanId, onClose }: { mealPlanId: Id<'mealPlans'>; onClose: () => void }) {
  const [term, setTerm] = useState('')
  const [customName, setCustomName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('item')
  const [department, setDepartment] = useState('Other')

  const matches = useQuery(api.ingredients.search, { term })
  const addItem = useMutation(api.groceries.addManualItem)

  async function handleAddCustom() {
    if (!customName.trim()) return
    await addItem({
      mealPlanId,
      customName: customName.trim(),
      department,
      quantity: parseFloat(quantity) || 1,
      unit,
    })
    onClose()
  }

  async function handleAddMatch(ingredientId: Id<'ingredients'>, dept: string) {
    await addItem({ mealPlanId, ingredientId, department: dept, quantity: parseFloat(quantity) || 1, unit })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-[rgba(28,27,24,0.42)]" onClick={onClose}>
      <div className="flex w-full flex-col gap-3 rounded-t-[26px] bg-[#fffefb] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1c1b18]">Add Item</h3>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f2ec] text-[15px] text-[#5c584e]">
            ✕
          </button>
        </div>

        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setCustomName(e.target.value)
          }}
          placeholder="Search or type an item…"
          className="rounded-xl border border-[#e4e1d8] px-3.5 py-2.5 text-[15px] outline-none focus:border-lemon-500"
        />

        <div className="flex gap-2">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            className="w-16 rounded-xl border border-[#e4e1d8] px-2 py-2 text-[15px]"
          />
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit"
            className="flex-1 rounded-xl border border-[#e4e1d8] px-2 py-2 text-[15px]"
          />
        </div>

        {term.length > 0 && matches && matches.length > 0 && (
          <ul className="flex max-h-40 flex-col divide-y divide-[#f0ede5] overflow-y-auto rounded-xl border border-[#eae7de]">
            {matches.map((m) => (
              <li key={m._id}>
                <button
                  onClick={() => handleAddMatch(m._id, m.department)}
                  className="w-full px-3.5 py-2.5 text-left text-[15px] capitalize text-[#1c1b18]"
                >
                  {m.canonicalName} <span className="text-[#9a968a]">· {m.department}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-xl border border-[#e4e1d8] px-3.5 py-2.5 text-[15px]"
        >
          {DEPARTMENT_ORDER.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <button onClick={handleAddCustom} className="rounded-xl bg-lemon-500 py-3 text-[15px] font-semibold text-[#1c1b18]">
          Add "{customName || term || 'item'}"
        </button>
      </div>
    </div>
  )
}

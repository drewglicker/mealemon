import { useMemo, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Plus, X, Check } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'
import { formatQuantity } from '../lib/formatQuantity'
import { bucketForUnit } from '../../shared/units'

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

  if (planData === undefined || items === undefined) {
    return <p className="p-6 text-center text-sm text-gray-400">Loading…</p>
  }

  if (!mealPlanId || items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 py-16 text-center">
        <p className="text-sm text-gray-400">
          No grocery items yet. Add recipes to your meal plan, then tap "Add to Groceries".
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-full flex-col gap-5 p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-900">Groceries</h1>

      {grouped.map(({ dept, items: deptItems }) => (
        <div key={dept} className="flex flex-col gap-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400">{dept}</h2>
          <div className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {deptItems.map((item) => {
              const label = item.ingredient?.canonicalName ?? item.customName ?? 'Item'
              const bucket = bucketForUnit(item.unit)
              const qtyLabel = formatQuantity(item.aggregatedQuantity, bucket, item.unit)
              return (
                <div key={item._id} className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    onClick={() => toggleChecked({ itemId: item._id })}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      item.isChecked ? 'border-lemon-500 bg-lemon-500' : 'border-gray-300'
                    }`}
                  >
                    {item.isChecked && <Check size={12} className="text-white" />}
                  </button>
                  <button
                    onClick={() => setInspecting(item)}
                    className={`flex flex-1 items-center justify-between text-left text-sm ${
                      item.isChecked ? 'text-gray-300 line-through' : 'text-gray-800'
                    }`}
                  >
                    <span className="capitalize">{label}</span>
                    <span className="font-medium">{qtyLabel}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <button
        onClick={() => setAddingItem(true)}
        className="fixed bottom-24 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-lemon-500 text-white shadow-lg"
        aria-label="Add item"
      >
        <Plus size={24} />
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
  const label = item.ingredient?.canonicalName ?? item.customName ?? 'Item'

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/40" onClick={onClose}>
      <div className="w-full rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold capitalize text-gray-900">{label}</h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <span className="mb-3 inline-block rounded-full bg-lemon-50 px-2.5 py-1 text-xs font-medium text-lemon-700">
          {item.department}
        </span>
        <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Used in</p>
        {recipes === undefined && <p className="text-sm text-gray-400">Loading…</p>}
        {recipes && recipes.length === 0 && <p className="text-sm text-gray-400">Manually added item.</p>}
        <ul className="flex flex-col gap-1">
          {recipes?.map((r: any) => (
            <li key={r._id} className="text-sm text-gray-700">
              {r.name}
            </li>
          ))}
        </ul>
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
    <div className="fixed inset-0 z-20 flex items-end bg-black/40" onClick={onClose}>
      <div className="flex w-full flex-col gap-3 rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Add Item</h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setCustomName(e.target.value)
          }}
          placeholder="Search or type an item…"
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-lemon-400"
        />

        <div className="flex gap-2">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            className="w-16 rounded-xl border border-gray-200 px-2 py-2 text-sm"
          />
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit"
            className="flex-1 rounded-xl border border-gray-200 px-2 py-2 text-sm"
          />
        </div>

        {term.length > 0 && matches && matches.length > 0 && (
          <ul className="flex max-h-40 flex-col divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100">
            {matches.map((m) => (
              <li key={m._id}>
                <button
                  onClick={() => handleAddMatch(m._id, m.department)}
                  className="w-full px-3 py-2 text-left text-sm capitalize text-gray-700"
                >
                  {m.canonicalName} <span className="text-gray-400">· {m.department}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          {DEPARTMENT_ORDER.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <button onClick={handleAddCustom} className="rounded-xl bg-lemon-500 py-2.5 text-sm font-semibold text-white">
          Add "{customName || term || 'item'}"
        </button>
      </div>
    </div>
  )
}

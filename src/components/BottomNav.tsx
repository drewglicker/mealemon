import { NavLink } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

const NAV_ITEMS = [
  { to: '/', label: 'Explore', shape: 'soft', end: true },
  { to: '/meal-plan', label: 'Meal Plan', shape: 'sq', end: false },
  { to: '/groceries', label: 'Groceries', shape: 'round', end: false },
] as const

function navDotClasses(shape: string, active: boolean) {
  const radius = shape === 'round' ? 'rounded-full' : shape === 'soft' ? 'rounded-lg' : 'rounded'
  const border = active ? 'border-[#1c1b18]' : 'border-[#b3afa4]'
  const fill = active ? 'bg-lemon-500' : 'bg-transparent'
  return `h-[22px] w-[22px] border-2 ${radius} ${border} ${fill}`
}

export default function BottomNav() {
  const activePlan = useQuery(api.mealPlans.getActivePlan)
  const groceryItems = useQuery(
    api.groceries.listForPlan,
    activePlan?.plan ? { mealPlanId: activePlan.plan._id } : 'skip',
  )
  const remaining = groceryItems?.filter((i) => !i.isChecked).length ?? 0

  return (
    <nav className="flex shrink-0 border-t border-[#e9e6dd] bg-[rgba(255,254,251,0.94)] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur-md">
      {NAV_ITEMS.map(({ to, label, shape, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1.5 py-1.5 text-[11px] font-semibold tracking-[0.03em] ${
              isActive ? 'text-[#1c1b18]' : 'text-[#9a968a]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={navDotClasses(shape, isActive)} />
              {label === 'Groceries' && remaining > 0 ? `Groceries · ${remaining}` : label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

import { NavLink } from 'react-router-dom'
import { Compass, CalendarDays, ShoppingCart } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

const NAV_ITEMS = [
  { to: '/', label: 'Explore', icon: Compass, end: true },
  { to: '/meal-plan', label: 'Meal Plan', icon: CalendarDays, end: false },
  { to: '/groceries', label: 'Groceries', icon: ShoppingCart, end: false },
] as const

export default function BottomNav() {
  const activePlan = useQuery(api.mealPlans.getActivePlan)
  const groceryItems = useQuery(
    api.groceries.listForPlan,
    activePlan?.plan ? { mealPlanId: activePlan.plan._id } : 'skip',
  )
  const uncheckedCount = groceryItems?.filter((i) => !i.isChecked).length ?? 0

  return (
    <nav className="flex shrink-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
              isActive ? 'text-lemon-600' : 'text-gray-400'
            }`
          }
        >
          <span className="relative">
            <Icon size={22} strokeWidth={2.25} />
            {label === 'Groceries' && uncheckedCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-lemon-500 px-1 text-[10px] font-bold text-white">
                {uncheckedCount}
              </span>
            )}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

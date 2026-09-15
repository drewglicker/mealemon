import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useLocation } from 'react-router-dom'

export default function AppShell() {
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/recipe/')

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-white">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}

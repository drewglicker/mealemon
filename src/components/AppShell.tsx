import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell() {
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/recipe/')

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-[#fffefb] font-sans text-[#1c1b18]">
      <main className="relative flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import Logo from '../components/Logo'
import Icon from '../components/Icon'

const TABS = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: 'event' },
  { to: '/admin/expenses', label: 'Expenses', icon: 'receipt_long' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <header className="border-b border-outline-variant/20 bg-surface-container-high sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="font-label-mono text-label-mono text-primary-fixed uppercase">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body-md text-sm text-on-surface-variant hidden sm:inline">
              {session?.user?.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="border border-outline-variant/40 text-on-surface-variant px-3 py-2 rounded-lg font-bold hover:border-primary-fixed/50 hover:text-on-surface transition-all flex items-center gap-2 text-sm"
            >
              <Icon name="logout" className="!text-base" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        <nav className="max-w-6xl mx-auto flex gap-1 px-6 overflow-x-auto">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 font-headline-sm text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary-fixed text-primary-fixed'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`
              }
            >
              <Icon name={t.icon} className="!text-base" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

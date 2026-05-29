import { Link, NavLink, Outlet } from 'react-router-dom'
import Logo from '../components/Logo'
import Icon from '../components/Icon'
import { CartProvider, useCart } from './CartContext'
import { useSettings, useShopEnabled } from '../SettingsContext'

export default function ApparelsLayout() {
  const { loading } = useSettings()
  const shopEnabled = useShopEnabled()

  if (!loading && !shopEnabled) {
    return <ShopUnavailable />
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <ApparelsHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <ApparelsFooter />
      </div>
    </CartProvider>
  )
}

function ShopUnavailable() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <header className="border-b border-outline-variant/20">
        <div className="max-w-container-max mx-auto flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <div className="flex flex-col leading-none">
              <span className="font-display-lg text-base sm:text-headline-sm font-extrabold text-primary-fixed uppercase tracking-tight">
                Dhanshri&apos;s
              </span>
              <span className="font-label-mono text-[10px] sm:text-label-mono font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">
                Store
              </span>
            </div>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-margin-mobile md:px-margin-desktop py-16">
        <div className="max-w-md w-full bg-surface-container-high rounded-3xl border border-outline-variant/20 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-fixed/15 text-primary-fixed mx-auto flex items-center justify-center mb-4">
            <Icon name="storefront" className="!text-3xl" />
          </div>
          <h1 className="font-display-lg text-headline-lg text-on-surface mb-2">Store is coming soon</h1>
          <p className="font-body-md text-on-surface-variant mb-6">
            Dhanshri's Store isn't open yet. We're putting the final touches on the catalog — please check back shortly.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold hover:scale-95 transition-all neon-glow"
          >
            <Icon name="arrow_back" className="!text-base" /> Back to Gaming Vault
          </Link>
        </div>
      </main>
    </div>
  )
}

function ApparelsHeader() {
  const { count } = useCart()
  return (
    <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/20 shadow-lg shadow-primary-fixed/5">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <Link to="/apparels" className="flex items-center gap-3">
          <Logo />
          <div className="flex flex-col leading-none">
            <span className="font-display-lg text-base sm:text-headline-sm font-extrabold text-primary-fixed uppercase tracking-tight">
              Dhanshri&apos;s
            </span>
            <span className="font-label-mono text-[10px] sm:text-label-mono font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">
              Store
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <NavLink
            to="/apparels"
            end
            className={({ isActive }) =>
              `hidden sm:inline font-body-md text-body-md transition-colors ${
                isActive ? 'text-primary-fixed font-bold' : 'text-on-surface-variant hover:text-primary-fixed'
              }`
            }
          >
            Shop
          </NavLink>
          <Link
            to="/"
            className="hidden sm:inline font-body-md text-body-md text-on-surface-variant hover:text-primary-fixed transition-colors"
          >
            Gaming Vault
          </Link>
          <Link
            to="/apparels/cart"
            className="relative bg-primary-fixed text-on-primary-fixed px-4 py-2 rounded-lg font-bold hover:scale-95 transition-all flex items-center gap-2 neon-glow"
            aria-label={`Cart (${count})`}
          >
            <Icon name="shopping_bag" className="!text-base" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="bg-on-primary-fixed text-primary-fixed text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  )
}

function ApparelsFooter() {
  return (
    <footer className="border-t border-outline-variant/20 mt-12 py-8">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-body-md text-sm text-on-surface-variant">
          © {new Date().getFullYear()} Dhanshri's Store — Nagpur
        </p>
        <Link to="/" className="font-body-md text-sm text-on-surface-variant hover:text-primary-fixed transition-colors">
          ← Back to Gaming Vault
        </Link>
      </div>
    </footer>
  )
}

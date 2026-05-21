import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import Logo from '../components/Logo'
import Icon from '../components/Icon'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && session) navigate('/admin', { replace: true })
  }, [loading, session, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: err } = await signIn(email.trim(), password)
    setSubmitting(false)
    if (err) {
      setError(err.message || 'Login failed')
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo />
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mt-4">
            Admin Console
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-surface-container-high rounded-3xl border border-primary-fixed/20 shadow-2xl p-8 space-y-5"
        >
          <h1 className="font-display-lg text-headline-md text-on-surface mb-2">Sign in</h1>

          {error && (
            <div className="bg-error-container/20 border border-error/40 rounded-xl p-4 flex gap-3 items-start">
              <Icon name="error" className="text-error flex-shrink-0 !text-2xl" filled />
              <p className="font-body-md text-sm text-error">{error}</p>
            </div>
          )}

          <div>
            <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-fixed text-on-primary-fixed px-6 py-4 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Icon
              name={submitting ? 'progress_activity' : 'login'}
              className={`!text-xl ${submitting ? 'animate-spin' : ''}`}
            />
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <a
            href="/"
            className="block text-center font-body-md text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            ← Back to site
          </a>
        </form>
      </div>
    </div>
  )
}

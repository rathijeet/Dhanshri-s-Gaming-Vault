import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase">
          Loading…
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />

  return children
}

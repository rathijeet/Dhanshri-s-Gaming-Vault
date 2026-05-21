import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicSite from './PublicSite'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminBookings from './admin/AdminBookings'
import AdminExpenses from './admin/AdminExpenses'
import ProtectedRoute from './admin/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="expenses" element={<AdminExpenses />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

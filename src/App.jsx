import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicSite from './PublicSite'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminBookings from './admin/AdminBookings'
import AdminExpenses from './admin/AdminExpenses'
import AdminApparels from './admin/AdminApparels'
import AdminOrders from './admin/AdminOrders'
import AdminOrderDetail from './admin/AdminOrderDetail'
import ProtectedRoute from './admin/ProtectedRoute'
import ApparelsLayout from './apparels/ApparelsLayout'
import ApparelsListing from './apparels/ApparelsListing'
import ApparelDetail from './apparels/ApparelDetail'
import ApparelsCart from './apparels/ApparelsCart'
import ApparelsCheckout from './apparels/ApparelsCheckout'
import ApparelsOrderSuccess from './apparels/ApparelsOrderSuccess'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path="/apparels" element={<ApparelsLayout />}>
          <Route index element={<ApparelsListing />} />
          <Route path="cart" element={<ApparelsCart />} />
          <Route path="checkout" element={<ApparelsCheckout />} />
          <Route path="order-success/:orderNumber" element={<ApparelsOrderSuccess />} />
          <Route path=":slug" element={<ApparelDetail />} />
        </Route>
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
          <Route path="apparels" element={<AdminApparels />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="expenses" element={<AdminExpenses />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

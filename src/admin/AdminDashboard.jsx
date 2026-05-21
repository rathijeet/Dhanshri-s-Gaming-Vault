import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatRupees } from './bookingHelpers'
import { CATEGORY_LABEL } from './expenseHelpers'
import Icon from '../components/Icon'

const ACCENT_CLASSES = {
  yellow: 'bg-yellow-500/15 text-yellow-400',
  blue: 'bg-blue-500/15 text-blue-400',
  green: 'bg-green-500/15 text-green-400',
  red: 'bg-red-500/15 text-red-400',
  gray: 'bg-gray-500/15 text-gray-400',
  primary: 'bg-primary-fixed/15 text-primary-fixed',
}

function StatCard({ icon, label, value, hint, accent = 'primary' }) {
  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ACCENT_CLASSES[accent]}`}>
          <Icon name={icon} className="!text-xl" />
        </div>
        <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">{label}</p>
      </div>
      <p className="font-display-lg text-headline-md text-on-surface">{value}</p>
      {hint && <p className="font-body-md text-sm text-on-surface-variant mt-1">{hint}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
    revenue: 0,
    weekCount: 0,
  })
  const [investment, setInvestment] = useState({
    total: 0,
    byCategory: {},
    inventoryCounts: {},
  })

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const [bookingsRes, expensesRes] = await Promise.all([
        supabase.from('bookings').select('status, total, created_at'),
        supabase.from('expenses').select('category, total_cost, quantity'),
      ])

      if (!mounted) return

      if (bookingsRes.error) console.error('[dashboard] bookings load failed', bookingsRes.error)
      if (expensesRes.error) console.error('[dashboard] expenses load failed', expensesRes.error)

      const bNext = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        rejected: 0,
        cancelled: 0,
        revenue: 0,
        weekCount: 0,
      }
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      for (const r of bookingsRes.data || []) {
        bNext[r.status] = (bNext[r.status] ?? 0) + 1
        if (r.status === 'completed' || r.status === 'confirmed') {
          bNext.revenue += r.total || 0
        }
        if (new Date(r.created_at).getTime() >= weekAgo && r.status !== 'rejected') {
          bNext.weekCount += 1
        }
      }
      setBookings(bNext)

      const eByCat = {}
      const eCounts = {}
      let eTotal = 0
      for (const r of expensesRes.data || []) {
        eTotal += r.total_cost || 0
        eByCat[r.category] = (eByCat[r.category] ?? 0) + (r.total_cost || 0)
        eCounts[r.category] = (eCounts[r.category] ?? 0) + (r.quantity || 0)
      }
      setInvestment({ total: eTotal, byCategory: eByCat, inventoryCounts: eCounts })

      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const netPnl = bookings.revenue - investment.total
  const breakEvenPct =
    investment.total > 0 ? Math.round((bookings.revenue / investment.total) * 100) : 0
  const pnlPositive = netPnl >= 0

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display-lg text-headline-lg text-on-surface mb-1">Dashboard</h1>
          <p className="font-body-md text-on-surface-variant">
            Investment, revenue, and break-even progress.
          </p>
        </div>
        {bookings.pending > 0 && (
          <Link
            to="/admin/bookings?status=pending"
            className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-500/25 transition-colors"
          >
            <Icon name="notifications_active" className="!text-base" />
            {bookings.pending} pending — review
          </Link>
        )}
      </div>

      {loading ? (
        <p className="font-body-md text-on-surface-variant">Loading…</p>
      ) : (
        <>
          {/* Financial overview */}
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-3">
            Financial overview
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon="payments"
              label="Revenue"
              value={formatRupees(bookings.revenue)}
              hint="Confirmed + completed"
              accent="green"
            />
            <StatCard
              icon="account_balance_wallet"
              label="Investment"
              value={formatRupees(investment.total)}
              hint="Total spent on inventory"
              accent="red"
            />
            <StatCard
              icon={pnlPositive ? 'trending_up' : 'trending_down'}
              label="Net P&L"
              value={`${pnlPositive ? '+' : ''}${formatRupees(netPnl)}`}
              hint={pnlPositive ? 'In profit' : 'Below break-even'}
              accent={pnlPositive ? 'green' : 'red'}
            />
            <StatCard
              icon="flag"
              label="Break-even"
              value={`${breakEvenPct}%`}
              hint={
                investment.total === 0
                  ? 'No investment logged'
                  : breakEvenPct >= 100
                  ? 'Reached — every ₹ is now profit'
                  : `${formatRupees(investment.total - bookings.revenue)} to go`
              }
              accent={breakEvenPct >= 100 ? 'green' : breakEvenPct >= 50 ? 'yellow' : 'red'}
            />
          </div>

          {/* Booking activity */}
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-3">
            Booking activity
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon="schedule"
              label="Pending"
              value={bookings.pending}
              hint="Awaiting your review"
              accent="yellow"
            />
            <StatCard
              icon="check_circle"
              label="Confirmed"
              value={bookings.confirmed}
              hint="Approved & live"
              accent="blue"
            />
            <StatCard
              icon="task_alt"
              label="Completed"
              value={bookings.completed}
              hint="Successfully delivered"
              accent="green"
            />
            <StatCard
              icon="trending_up"
              label="This week"
              value={bookings.weekCount}
              hint="Bookings in last 7 days"
              accent="primary"
            />
          </div>

          {/* Investment breakdown */}
          {investment.total > 0 && (
            <>
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-3">
                Investment by category
              </p>
              <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 mb-8">
                <div className="space-y-3">
                  {Object.entries(investment.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amt]) => {
                      const pct = Math.round((amt / investment.total) * 100)
                      return (
                        <div key={cat}>
                          <div className="flex justify-between font-body-md text-sm mb-1">
                            <span className="text-on-surface">
                              {CATEGORY_LABEL[cat]}
                              {investment.inventoryCounts[cat] && (
                                <span className="text-on-surface-variant ml-2">
                                  · {investment.inventoryCounts[cat]} unit
                                  {investment.inventoryCounts[cat] > 1 ? 's' : ''}
                                </span>
                              )}
                            </span>
                            <span className="text-primary-fixed font-bold">
                              {formatRupees(amt)} <span className="text-on-surface-variant font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-fixed"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

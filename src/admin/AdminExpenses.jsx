import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  CATEGORIES,
  CATEGORY_ICON,
  CATEGORY_LABEL,
  formatDate,
  formatRupees,
} from './expenseHelpers'
import Icon from '../components/Icon'
import AdminExpenseFormModal from './AdminExpenseFormModal'

const FILTERS = [{ id: 'all', label: 'All' }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.label }))]

export default function AdminExpenses() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingId, setDeletingId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('purchase_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[expenses] load failed', error)
      setRows([])
    } else {
      setRows(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.category === filter)),
    [rows, filter]
  )

  const totals = useMemo(() => {
    const total = filtered.reduce((sum, r) => sum + (r.total_cost || 0), 0)
    return { total, count: filtered.length }
  }, [filtered])

  const onAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const onEdit = (expense) => {
    setEditing(expense)
    setFormOpen(true)
  }

  const onDelete = async (expense) => {
    if (!confirm(`Delete "${expense.item_name}"? This can't be undone.`)) return
    setDeletingId(expense.id)
    const { error } = await supabase.from('expenses').delete().eq('id', expense.id)
    setDeletingId('')
    if (error) {
      alert(`Failed: ${error.message}`)
      return
    }
    load()
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display-lg text-headline-lg text-on-surface mb-1">Expenses</h1>
          <p className="font-body-md text-on-surface-variant">
            Track every purchase — consoles, controllers, games, maintenance.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="bg-primary-fixed text-on-primary-fixed px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:scale-95 transition-all"
        >
          <Icon name="add" className="!text-base" />
          Add Expense
        </button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto border-b border-outline-variant/20">
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-4 py-3 font-headline-sm text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-primary-fixed text-primary-fixed'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4 mb-6 flex justify-between items-center">
        <div>
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
            {filter === 'all' ? 'Total invested' : `Spent on ${CATEGORY_LABEL[filter]}`}
          </p>
          <p className="font-display-lg text-headline-md text-primary-fixed">
            {formatRupees(totals.total)}
          </p>
        </div>
        <p className="font-body-md text-sm text-on-surface-variant">
          {totals.count} {totals.count === 1 ? 'expense' : 'expenses'}
        </p>
      </div>

      {loading ? (
        <p className="font-body-md text-on-surface-variant">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-10 text-center">
          <Icon name="receipt_long" className="!text-4xl text-on-surface-variant mb-2" />
          <p className="font-body-md text-on-surface-variant">No expenses yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              busy={deletingId === e.id}
              onEdit={() => onEdit(e)}
              onDelete={() => onDelete(e)}
            />
          ))}
        </div>
      )}

      <AdminExpenseFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          load()
        }}
      />
    </div>
  )
}

function ExpenseRow({ expense, busy, onEdit, onDelete }) {
  const linkedLabel = expense.linked_console
    ? { ps5: 'PS5', ps4: 'PS4', xbox: 'Xbox' }[expense.linked_console]
    : null

  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4 flex gap-4 items-start">
      <div className="w-10 h-10 rounded-lg bg-primary-fixed/15 text-primary-fixed flex items-center justify-center flex-shrink-0">
        <Icon name={CATEGORY_ICON[expense.category]} className="!text-xl" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-headline-sm text-body-lg font-bold text-on-surface">
            {expense.item_name}
          </p>
          <span className="font-label-mono text-xs text-on-surface-variant uppercase bg-surface-container px-2 py-0.5 rounded">
            {CATEGORY_LABEL[expense.category]}
          </span>
          {linkedLabel && (
            <span className="font-label-mono text-xs text-primary-fixed uppercase bg-primary-fixed/10 border border-primary-fixed/30 px-2 py-0.5 rounded">
              {linkedLabel}
            </span>
          )}
        </div>
        <p className="font-body-md text-sm text-on-surface-variant">
          {expense.quantity} × ₹{expense.unit_cost.toLocaleString('en-IN')}
          {expense.vendor ? ` · ${expense.vendor}` : ''}
          {' · '}
          {formatDate(expense.purchase_date)}
        </p>
        {expense.notes && (
          <p className="font-body-md text-sm text-on-surface-variant/80 mt-1 italic">
            {expense.notes}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
        <p className="font-display-lg text-headline-sm text-primary-fixed">
          {formatRupees(expense.total_cost)}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            className="w-9 h-9 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface transition-all flex items-center justify-center disabled:opacity-50"
            aria-label="Edit"
          >
            <Icon name="edit" className="!text-base" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="w-9 h-9 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center disabled:opacity-50"
            aria-label="Delete"
          >
            <Icon name={busy ? 'progress_activity' : 'delete'} className={`!text-base ${busy ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

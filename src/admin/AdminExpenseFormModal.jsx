import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES, LINKED_CONSOLES } from './expenseHelpers'
import Icon from '../components/Icon'

function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const EMPTY = {
  category: '',
  item_name: '',
  quantity: 1,
  unit_cost: '',
  purchase_date: todayISO(),
  linked_console: '',
  vendor: '',
  notes: '',
}

export default function AdminExpenseFormModal({ open, onClose, onSaved, editing }) {
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        category: editing.category || '',
        item_name: editing.item_name || '',
        quantity: editing.quantity || 1,
        unit_cost: editing.unit_cost ?? '',
        purchase_date: editing.purchase_date || todayISO(),
        linked_console: editing.linked_console || '',
        vendor: editing.vendor || '',
        notes: editing.notes || '',
      })
    } else {
      setForm({ ...EMPTY, purchase_date: todayISO() })
    }
    setError('')
  }, [open, editing])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const qty = Number(form.quantity) || 0
  const unit = Number(form.unit_cost) || 0
  const total = qty * unit

  const isValid = useMemo(
    () =>
      !!form.category &&
      form.item_name.trim().length >= 2 &&
      qty >= 1 &&
      unit >= 0 &&
      !!form.purchase_date,
    [form.category, form.item_name, qty, unit, form.purchase_date]
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e?.preventDefault?.()
    if (!isValid || submitting) return

    setError('')
    setSubmitting(true)

    const payload = {
      category: form.category,
      item_name: form.item_name.trim(),
      quantity: qty,
      unit_cost: unit,
      total_cost: total,
      purchase_date: form.purchase_date,
      linked_console: form.linked_console || null,
      vendor: form.vendor.trim() || null,
      notes: form.notes.trim() || null,
    }

    const op = editing
      ? supabase.from('expenses').update(payload).eq('id', editing.id)
      : supabase.from('expenses').insert(payload)

    const { error: err } = await op
    setSubmitting(false)
    if (err) {
      setError(err.message || 'Failed to save')
      return
    }
    onSaved?.()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start md:items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl my-8 bg-surface-container-high rounded-3xl border border-primary-fixed/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-start justify-between p-6 border-b border-outline-variant/20 bg-surface-container-high rounded-t-3xl">
            <div>
              <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-1">
                {editing ? 'Edit' : 'New'} expense
              </p>
              <h2 className="font-display-lg text-headline-sm text-on-surface">
                {editing ? 'Edit Expense' : 'Add Expense'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-primary-fixed/60 transition-colors flex items-center justify-center"
            >
              <Icon name="close" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-5" noValidate>
            {error && (
              <div className="bg-error-container/20 border border-error/40 rounded-xl p-4 flex gap-3 items-start">
                <Icon name="error" className="text-error flex-shrink-0 !text-2xl" filled />
                <p className="font-body-md text-sm text-error">{error}</p>
              </div>
            )}

            <div>
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((c) => {
                  const active = form.category === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: c.id }))}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                        active
                          ? 'border-primary-fixed bg-primary-fixed/10 text-primary-fixed'
                          : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50'
                      }`}
                    >
                      <Icon name={c.icon} className="!text-xl" />
                      <span className="font-body-md text-xs font-bold">{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                Item Name
              </label>
              <input
                type="text"
                value={form.item_name}
                onChange={set('item_name')}
                placeholder="e.g. Sony DualSense Wireless Controller (White)"
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={set('quantity')}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none"
                />
              </div>
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Unit Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.unit_cost}
                  onChange={set('unit_cost')}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none"
                />
              </div>
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Total (auto)
                </label>
                <div className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 font-body-md text-primary-fixed font-bold">
                  ₹{total.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={form.purchase_date}
                  onChange={set('purchase_date')}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Linked Console (optional)
                </label>
                <select
                  value={form.linked_console}
                  onChange={set('linked_console')}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
                >
                  <option value="">— not linked —</option>
                  {LINKED_CONSOLES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Vendor (optional)
                </label>
                <input
                  type="text"
                  value={form.vendor}
                  onChange={set('vendor')}
                  placeholder="Croma, Amazon, local shop…"
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none"
                />
              </div>
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Warranty, serial, etc."
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border-2 border-outline-variant/40 text-on-surface-variant px-6 py-3 rounded-xl font-bold hover:border-primary-fixed/50 hover:text-on-surface transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="flex-1 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Icon
                  name={submitting ? 'progress_activity' : 'save'}
                  className={`!text-xl ${submitting ? 'animate-spin' : ''}`}
                />
                {submitting ? 'Saving…' : editing ? 'Update' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

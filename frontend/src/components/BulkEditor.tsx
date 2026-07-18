import { useState } from 'react'
import type { ExtractionResult, ResultField } from '../types'

export function BulkEditor({ result, onClose, onApply }: { result: ExtractionResult; onClose: () => void; onApply: (overrides: Record<string, unknown>) => Promise<void> }) {
  const [local, setLocal] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const f of result.fields) map[f.name] = typeof f.value === 'string' ? f.value : (Array.isArray(f.value) ? f.value.join(', ') : String(f.value ?? ''))
    return map
  })

  const handleChange = (name: string, value: string) => setLocal(prev => ({ ...prev, [name]: value }))
  const apply = async () => {
    const overrides: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(local)) {
      const field = result.fields.find(f => f.name === k)
      if (!field) continue
      if (field.type === 'number') {
        const n = Number(v.replace(/[^0-9.eE+-]/g, ''))
        overrides[k] = Number.isFinite(n) ? (v.includes('.') ? parseFloat(String(n)) : parseInt(String(n), 10)) : null
      } else if (field.type === 'list[string]') {
        overrides[k] = v.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
      } else {
        overrides[k] = v
      }
    }
    await onApply(overrides)
    onClose()
  }

  return (
    <div className="bulk-editor-backdrop" role="dialog" aria-modal="true">
      <div className="bulk-editor">
        <header className="bulk-editor-header"><h2>Bulk edit fields</h2><button onClick={onClose} aria-label="Close">✕</button></header>
        <div className="bulk-editor-body">
          {result.fields.map((f: ResultField) => (
            <label key={f.name} className="bulk-editor-row">
              <div className="bulk-label"><span>{f.name}</span><small>{f.type}</small></div>
              <input value={local[f.name] ?? ''} onChange={e => handleChange(f.name, e.target.value)} />
            </label>
          ))}
        </div>
        <footer className="bulk-editor-footer">
          <button className="text-button" type="button" onClick={onClose}>Cancel</button>
          <button className="extract-button" type="button" onClick={apply}>Apply all</button>
        </footer>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { ResultField } from '../types'
import { Stamp } from './Stamp'

function formatValue(field: ResultField) {
  const { value } = field
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'number') {
    const currency = /(?:amount|total|price|cost)/i.test(field.name)
    return new Intl.NumberFormat('en-US', currency
      ? { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { maximumFractionDigits: 2 }).format(value)
  }
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export function FieldRow({ field, onChange }: { field: ResultField; onChange?: (name: string, value: unknown) => void }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState<string>(() => typeof field.value === 'string' ? field.value : (Array.isArray(field.value) ? (field.value as unknown[]).join(', ') : String(field.value)))

  const save = () => {
    let parsed: unknown = local
    if (field.type === 'number') {
      const n = Number(local.toString().replace(/[^0-9.eE+-]/g, ''))
      parsed = Number.isFinite(n) ? (local.includes('.') ? parseFloat(String(n)) : parseInt(String(n), 10)) : null
    }
    if (field.type === 'list[string]') {
      parsed = local.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
    }
    if (onChange) onChange(field.name, parsed)
    setEditing(false)
  }

  return (
    <article className={`field-row field-row-${field.status}`}>
      <div className="field-identity">
        <div className="field-name-line"><span className="field-marker" aria-hidden="true" /><h3>{field.name}</h3></div>
        <div className="field-spec"><span>{field.type}</span><span>{field.required ? 'required' : 'optional'}</span></div>
      </div>
      {editing ? (
        <div className="field-editor">
          <input value={local} onChange={e => setLocal(e.target.value)} />
          <div className="field-editor-actions">
            <button onClick={() => setEditing(false)} type="button">Cancel</button>
            <button onClick={save} type="button">Save</button>
          </div>
        </div>
      ) : (
        <p className={`field-value ${field.value == null ? 'field-value-null' : ''} ${typeof field.value === 'number' ? 'field-value-number' : ''}`}>{formatValue(field)}</p>
      )}
      <div className="field-meta">
        <Stamp status={field.status} />
        {typeof field.confidence === 'number' && <span className="confidence">{Math.round(field.confidence * 100)}%</span>}
        <button className="edit-button" type="button" onClick={() => setEditing(true)}>Edit</button>
      </div>
    </article>
  )
}

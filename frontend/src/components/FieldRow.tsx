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

export function FieldRow({ field }: { field: ResultField }) {
  return (
    <article className={`field-row field-row-${field.status}`}>
      <div className="field-identity">
        <div className="field-name-line"><span className="field-marker" aria-hidden="true" /><h3>{field.name}</h3></div>
        <div className="field-spec"><span>{field.type}</span><span>{field.required ? 'required' : 'optional'}</span></div>
      </div>
      <p className={`field-value ${field.value == null ? 'field-value-null' : ''} ${typeof field.value === 'number' ? 'field-value-number' : ''}`}>{formatValue(field)}</p>
      <Stamp status={field.status} />
    </article>
  )
}

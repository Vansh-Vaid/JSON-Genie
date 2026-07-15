import type { CustomField, FieldType } from '../types'
import { Icon } from './Icon'

const types: FieldType[] = ['string', 'number', 'boolean', 'date', 'list[string]']

export function SchemaBuilder({ fields, onChange }: { fields: CustomField[]; onChange: (fields: CustomField[]) => void }) {
  const update = (index: number, patch: Partial<CustomField>) => onChange(fields.map((field, i) => i === index ? { ...field, ...patch } : field))
  const remove = (index: number) => onChange(fields.filter((_, i) => i !== index))

  return (
    <section aria-labelledby="custom-fields-heading" className="schema-builder">
      <div className="schema-builder-header"><h2 id="custom-fields-heading" className="section-label">Custom fields</h2><button type="button" className="text-button" onClick={() => onChange([...fields, { name: '', type: 'string', required: true }])}><Icon name="plus" size={14} /> Add field</button></div>
      {fields.length === 0 ? <p className="custom-empty">Add the fields you want JSON Genie to resolve.</p> : <div className="custom-field-list">{fields.map((field, index) => <div className="custom-field-row" key={index}>
        <input aria-label={`Field ${index + 1} name`} className="field-input custom-name" placeholder="field_name" value={field.name} onChange={(event) => update(index, { name: event.target.value })} />
        <select aria-label={`Field ${index + 1} type`} className="field-input custom-type" value={field.type} onChange={(event) => update(index, { type: event.target.value as FieldType })}>{types.map(type => <option key={type}>{type}</option>)}</select>
        <label className="custom-required"><input type="checkbox" checked={field.required} onChange={(event) => update(index, { required: event.target.checked })} />Required</label>
        <button type="button" aria-label={`Remove ${field.name || 'field'}`} className="remove-button" onClick={() => remove(index)}><Icon name="trash" size={14} /></button>
      </div>)}</div>}
    </section>
  )
}

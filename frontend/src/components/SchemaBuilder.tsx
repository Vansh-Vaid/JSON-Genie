import type { CustomField, FieldType } from '../types'

const types: FieldType[] = ['string', 'number', 'boolean', 'date', 'list[string]']

export function SchemaBuilder({ fields, onChange }: { fields: CustomField[]; onChange: (fields: CustomField[]) => void }) {
  const update = (index: number, patch: Partial<CustomField>) => onChange(fields.map((field, i) => i === index ? { ...field, ...patch } : field))
  const remove = (index: number) => onChange(fields.filter((_, i) => i !== index))
  return (
    <section aria-labelledby="custom-fields-heading" className="border-t border-line pt-4">
      <div className="mb-3 flex items-center justify-between"><h2 id="custom-fields-heading" className="section-label">Custom fields</h2><button type="button" className="text-button" onClick={() => onChange([...fields, { name: '', type: 'string', required: true }])}>+ Add field</button></div>
      {fields.length === 0 ? <p className="text-sm text-ink/60">Add fields to define this inspection schema.</p> : <div className="space-y-2">{fields.map((field, index) => <div className="grid grid-cols-[minmax(0,1fr)_112px_auto_auto] items-center gap-2" key={index}>
        <input aria-label={`Field ${index + 1} name`} className="field-input font-mono" placeholder="field_name" value={field.name} onChange={(event) => update(index, { name: event.target.value })} />
        <select aria-label={`Field ${index + 1} type`} className="field-input font-mono" value={field.type} onChange={(event) => update(index, { type: event.target.value as FieldType })}>{types.map(type => <option key={type}>{type}</option>)}</select>
        <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink/70"><input type="checkbox" checked={field.required} onChange={(event) => update(index, { required: event.target.checked })} />Req.</label>
        <button type="button" aria-label={`Remove ${field.name || 'field'}`} className="remove-button" onClick={() => remove(index)}>×</button>
      </div>)}</div>}
    </section>
  )
}

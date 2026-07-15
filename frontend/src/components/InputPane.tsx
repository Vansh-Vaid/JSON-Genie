import type { CustomField, SchemaName } from '../types'
import { SchemaBuilder } from './SchemaBuilder'

const options: { value: SchemaName; label: string }[] = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'job_posting', label: 'Job Posting' },
  { value: 'email', label: 'Email' },
  { value: 'custom', label: '+ Custom' },
]

type InputPaneProps = {
  text: string
  onTextChange: (text: string) => void
  schemaName: SchemaName
  onSchemaChange: (schema: SchemaName) => void
  customFields: CustomField[]
  onCustomFieldsChange: (fields: CustomField[]) => void
  isLoading: boolean
  onExtract: () => void
  onLoadSample: () => void
}

export function InputPane({
  text,
  onTextChange,
  schemaName,
  onSchemaChange,
  customFields,
  onCustomFieldsChange,
  isLoading,
  onExtract,
  onLoadSample,
}: InputPaneProps) {
  return (
    <section className="input-pane" aria-label="Document input">
      <div className="pane-heading">
        <span className="pane-index">01</span>
        <div>
          <h1>Source document</h1>
        <p>Paste any text and turn the useful details into dependable data.</p>
        </div>
        <span className="pane-state">INPUT</span>
      </div>

      <div className="input-tip">
        <span className="tip-icon" aria-hidden="true">✦</span>
        <p>No special format needed. <button type="button" onClick={onLoadSample}>Try a natural-text invoice</button> to see the full flow.</p>
      </div>

      <div className="control-group">
        <div className="control-label-row">
          <label htmlFor="schema" className="section-label">Inspection schema</label>
          <span className="control-note">Required</span>
        </div>
        <select id="schema" className="field-input w-full font-mono" value={schemaName} onChange={(event) => onSchemaChange(event.target.value as SchemaName)}>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      {schemaName === 'custom' && <SchemaBuilder fields={customFields} onChange={onCustomFieldsChange} />}

      <div className="source-section">
        <div className="control-label-row">
          <label htmlFor="source-text" className="section-label">Raw text</label>
          <span className="control-note">Paste or type</span>
        </div>
        <textarea
          id="source-text"
          className="source-text"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Paste an invoice, a job posting, an email, or any unstructured document here."
        />
      </div>

      <div className="extract-row">
        <div>
          <p className="character-count">{text.length.toLocaleString()} characters</p>
          <p className="extract-hint">Your source stays in this browser session.</p>
        </div>
        <button className="extract-button" type="button" onClick={onExtract} disabled={isLoading || !text.trim()}>
          <span>{isLoading ? 'Inspecting…' : 'Extract fields'}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

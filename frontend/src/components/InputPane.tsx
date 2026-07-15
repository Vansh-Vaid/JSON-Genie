import type { CustomField, ResultField, SchemaName } from '../types'
import { SchemaBuilder } from './SchemaBuilder'
import { Icon } from './Icon'

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
  isResolving: boolean
  resolveCycle: number
  resolvedFields: ResultField[]
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
  isResolving,
  resolveCycle,
  resolvedFields,
  onExtract,
  onLoadSample,
}: InputPaneProps) {
  return (
    <section className="input-pane" aria-label="Text to resolve">
      <div className="pane-heading">
        <span className="pane-index">01</span>
        <div>
          <h1>Paste your text</h1>
          <p>Bring the noise. JSON Genie resolves the details that matter.</p>
        </div>
        <span className="pane-state"><Icon name="file" size={12} /> TEXT</span>
      </div>

      <div className="input-tip">
        <span className="tip-icon"><Icon name="file" size={15} /></span>
        <p>No special format needed. <button type="button" onClick={onLoadSample}>Try a natural-text invoice</button> to see the full flow.</p>
      </div>

      <div className="control-group">
        <div className="control-label-row">
          <label htmlFor="schema" className="section-label">Choose a schema</label>
          <span className="control-note">Required</span>
        </div>
        <select id="schema" className="field-input w-full font-mono" value={schemaName} onChange={(event) => onSchemaChange(event.target.value as SchemaName)}>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      {schemaName === 'custom' && <SchemaBuilder fields={customFields} onChange={onCustomFieldsChange} />}

      <div className="source-section">
        <div className="control-label-row">
          <label htmlFor="source-text" className="section-label">Your text</label>
          <span className="control-note">Any format</span>
        </div>
        <div className="editor-frame">
          <textarea
            id="source-text"
            className={`source-text ${isResolving ? 'is-resolving' : ''}`}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Paste an invoice, a job posting, an email, or any unstructured document here."
          />
          {isResolving && <div key={resolveCycle} className="resolve-overlay" aria-hidden="true">{highlightResolvedText(text, resolvedFields)}</div>}
        </div>
      </div>

      <div className="extract-row">
        <div>
          <p className="character-count">{text.length.toLocaleString()} characters</p>
          <p className="extract-hint">Your source stays in this browser session.</p>
        </div>
        <button className="extract-button" type="button" onClick={onExtract} disabled={isLoading || !text.trim()}>
          <span>{isLoading ? 'Resolving…' : 'Resolve fields'}</span>
          <Icon name="arrow-up-right" size={16} />
        </button>
      </div>
    </section>
  )
}

function highlightResolvedText(text: string, fields: ResultField[]) {
  const values = fields
    .flatMap(field => Array.isArray(field.value) ? field.value : [field.value])
    .filter((value): value is string => typeof value === 'string' && value.length > 2)
    .sort((a, b) => b.length - a.length)
  const candidates = values
    .map(value => ({ value, index: text.toLocaleLowerCase().indexOf(value.toLocaleLowerCase()) }))
    .filter(item => item.index >= 0)
    .sort((a, b) => a.index - b.index)
  const matches = candidates.reduce<{ value: string; index: number }[]>((accepted, candidate) => {
    const overlaps = accepted.some(match => candidate.index < match.index + match.value.length && match.index < candidate.index + candidate.value.length)
    return overlaps || accepted.length >= 4 ? accepted : [...accepted, candidate]
  }, [])

  if (!matches.length) return text
  let cursor = 0
  return <>{matches.map((match, index) => {
    const before = text.slice(cursor, match.index)
    cursor = match.index + match.value.length
    return <span key={`${match.value}-${match.index}`}>{before}<span className="resolve-match">{text.slice(match.index, cursor)}</span></span>
  })}{text.slice(cursor)}</>
}

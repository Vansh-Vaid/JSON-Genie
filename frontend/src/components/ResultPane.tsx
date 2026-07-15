import { useEffect, useMemo, useState } from 'react'
import type { CustomField, ExtractionResult, HistoryEntry, SchemaName } from '../types'
import { FieldRow } from './FieldRow'
import { Icon } from './Icon'

const presetFields: Record<Exclude<SchemaName, 'custom'>, { name: string; type: string }[]> = {
  invoice: [
    { name: 'vendor_name', type: 'string' }, { name: 'invoice_number', type: 'string' },
    { name: 'total_amount', type: 'number' }, { name: 'due_date', type: 'string' },
    { name: 'line_items', type: 'list' },
  ],
  job_posting: [
    { name: 'title', type: 'string' }, { name: 'company', type: 'string' },
    { name: 'location', type: 'string' }, { name: 'salary_range', type: 'string' },
    { name: 'required_skills', type: 'list' },
  ],
  email: [
    { name: 'sender', type: 'string' }, { name: 'subject', type: 'string' },
    { name: 'intent', type: 'string' }, { name: 'action_items', type: 'list' },
  ],
}

type ResultPaneProps = {
  result: ExtractionResult | null
  isLoading: boolean
  phase: string
  error: string | null
  history: HistoryEntry[]
  schemaName: SchemaName
  customFields: CustomField[]
  isResolving: boolean
  onSelectHistory: (entry: HistoryEntry) => void
}

export function ResultPane({ result, isLoading, phase, error, history, schemaName, customFields, isResolving, onSelectHistory }: ResultPaneProps) {
  const [raw, setRaw] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const preview = useMemo(() => schemaName === 'custom'
    ? customFields.map(field => ({ name: field.name || 'unnamed_field', type: field.type }))
    : presetFields[schemaName], [schemaName, customFields])

  useEffect(() => { setRaw(false); setCopied(false) }, [result])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const copy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.result, null, 2))
      setCopied(true)
      setNotice('Copied JSON to clipboard')
    } catch {
      setNotice('Copy is unavailable in this browser')
    }
  }

  const download = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result.result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${result.schema_name}-extraction.json`
    link.click()
    URL.revokeObjectURL(url)
    setNotice('Downloaded JSON file')
  }

  return <section className={`result-pane ${isResolving ? 'is-resolving' : ''}`} aria-live="polite" aria-label="Resolved fields">
    <div className="pane-heading">
      <span className="pane-index">02</span>
      <div><h1>Resolved fields</h1><p>Every value is checked against the selected schema.</p></div>
      <span className="pane-state"><Icon name={result ? 'check' : 'code'} size={12} /> {result ? 'RESOLVED' : 'OUTPUT'}</span>
    </div>

    <SchemaPreview fields={preview} />

    {!result && !isLoading && !error && <div className="empty-state"><span className="empty-state-index">READY WHEN YOU ARE</span><h2>Start with the text.</h2><p>Paste anything on the left, choose the shape you need, and the resolved fields will settle here.</p><div className="empty-schema-lines" aria-hidden="true"><span /><span /><span /></div></div>}
    {isLoading && <div className="loading-state"><div className="loading-rule" /><span className="empty-state-index">RESOLVING TEXT</span><p>{phase}</p><span>Finding values and checking field types.</span></div>}
    {error && <div className="error-state"><span className="empty-state-index">RESOLUTION PAUSED</span><strong>Couldn’t resolve this text.</strong><p>{error}</p><span className="error-recovery">Check the text and connection, then resolve it again.</span></div>}
    {result && !isLoading && <>
      <div className="result-toolbar">
        <div className="result-summary"><span className={result.missing_count || result.mismatch_count ? 'summary-number summary-number-flag' : 'summary-number'}>{String(result.matched_count).padStart(2, '0')}<i>/</i>{String(result.fields.length).padStart(2, '0')}</span><p><strong>fields matched</strong><span>{result.missing_count || result.mismatch_count ? `${result.missing_count + result.mismatch_count} needs review` : 'all fields validated'}</span></p></div>
        <div className="result-actions"><button className="view-toggle" type="button" aria-pressed={raw} onClick={() => setRaw(!raw)}><Icon name={raw ? 'list' : 'code'} size={14} /> {raw ? 'Field view' : 'Raw JSON'}</button><button className="icon-button" type="button" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'Copied' : 'Copy'}</button><button className="icon-button" type="button" onClick={download}><Icon name="download" size={14} /> Download</button></div>
      </div>
      {raw ? <pre className="raw-json">{JSON.stringify(result.result, null, 2)}</pre> : <div className="field-list">{result.fields.map(field => <FieldRow key={field.name} field={field} />)}</div>}
    </>}
    {history.length > 0 && <nav className="history" aria-label="Recent runs"><h2 className="section-label">Recent runs</h2><div className="history-list">{history.map(entry => <button key={entry.id} type="button" onClick={() => onSelectHistory(entry)}><span>{entry.schemaName.replace('_', ' ')}</span><time>{entry.createdAt}</time></button>)}</div></nav>}
    {notice && <div className="toast" role="status"><Icon name="check" size={15} /> {notice}</div>}
  </section>
}

function SchemaPreview({ fields }: { fields: { name: string; type: string }[] }) {
  return <div className="schema-preview" aria-label="Selected schema fields">
    {fields.slice(0, 4).map(field => <div className="schema-preview-item" key={field.name}><span>{field.name}</span><code>{field.type}</code></div>)}
  </div>
}

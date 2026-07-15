import { useEffect, useState } from 'react'
import type { ExtractionResult, HistoryEntry } from '../types'
import { FieldRow } from './FieldRow'

export function ResultPane({ result, isLoading, phase, error, history, onSelectHistory }: {
  result: ExtractionResult | null; isLoading: boolean; phase: string; error: string | null; history: HistoryEntry[]; onSelectHistory: (entry: HistoryEntry) => void
}) {
  const [raw, setRaw] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => { setRaw(false); setCopied(false) }, [result])
  const copy = async () => { if (result) { await navigator.clipboard.writeText(JSON.stringify(result.result, null, 2)); setCopied(true) } }
  const download = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result.result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${result.schema_name}-extraction.json`; link.click(); URL.revokeObjectURL(url)
  }
  return <section className="result-pane" aria-live="polite" aria-label="Inspection result">
    <div className="pane-heading"><span className="pane-index">02</span><div><h1>Inspection result</h1><p>Fields are resolved against the selected schema.</p></div><span className="pane-state">{result ? 'RESOLVED' : 'OUTPUT'}</span></div>
    {!result && !isLoading && !error && <div className="empty-state"><span className="empty-state-index">AWAITING DOCUMENT</span><h2>Nothing inspected yet.</h2><p>Paste a document on the left, select a schema, and every available field will be stamped here.</p><div className="empty-schema-lines" aria-hidden="true"><span /><span /><span /></div></div>}
    {isLoading && <div className="loading-state"><div className="loading-rule" /><span className="empty-state-index">INSPECTION IN PROGRESS</span><p>{phase}</p><span>Reading source text and checking field types.</span></div>}
    {error && <div className="error-state"><span className="empty-state-index">INSPECTION INTERRUPTED</span><strong>Extraction failed</strong><p>{error}</p><span className="error-recovery">Check the source text or your Gemini connection, then inspect again.</span></div>}
    {result && !isLoading && <>
      <div className="result-toolbar">
        <div className="result-summary"><span className={result.missing_count || result.mismatch_count ? 'summary-number summary-number-flag' : 'summary-number'}>{String(result.matched_count).padStart(2, '0')}<i>/</i>{String(result.fields.length).padStart(2, '0')}</span><p><strong>fields matched</strong><span>{result.missing_count ? `${result.missing_count} not found` : result.mismatch_count ? `${result.mismatch_count} mismatch flagged` : 'all fields validated'}</span></p></div>
        <div className="result-actions"><button className="view-toggle" type="button" aria-pressed={raw} onClick={() => setRaw(!raw)}>{raw ? 'Field view' : 'Raw JSON'}</button><button className="icon-button" type="button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button><button className="icon-button" type="button" onClick={download}>Download</button></div>
      </div>
      {raw ? <pre className="raw-json">{JSON.stringify(result.result, null, 2)}</pre> : <div className="field-list">{result.fields.map(field => <FieldRow key={field.name} field={field} />)}</div>}
    </>}
    {history.length > 0 && <nav className="history" aria-label="Session history"><h2 className="section-label">This session</h2><div className="history-list">{history.map(entry => <button key={entry.id} type="button" onClick={() => onSelectHistory(entry)}><span>{entry.schemaName.replace('_', ' ')}</span><time>{entry.createdAt}</time></button>)}</div></nav>}
  </section>
}

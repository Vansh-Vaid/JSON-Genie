import { useEffect, useMemo, useState } from 'react'
import { InputPane } from './components/InputPane'
import { ResultPane } from './components/ResultPane'
import type { CustomField, ExtractionResult, HistoryEntry, SchemaName } from './types'

const schemaLabels: Record<SchemaName, string> = {
  invoice: 'Invoice',
  job_posting: 'Job Posting',
  email: 'Email',
  custom: 'Custom schema',
}
const phases = ['Reading input', 'Matching schema', 'Validating fields']
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const invoiceSample = `Invoice #INV-2048
Northstar Office Supplies

Invoice date: August 1, 2026
Due date: August 31, 2026

Ergonomic chairs — $1,249.00
Delivery — $100.50

Total due: $1,349.50`

function errorDetail(payload: unknown) {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail?: unknown }).detail
    if (typeof detail === 'string') return detail
  }
  return 'The service could not complete this inspection. Try again.'
}

export default function App() {
  const [text, setText] = useState('')
  const [schemaName, setSchemaName] = useState<SchemaName>('invoice')
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const phase = useMemo(() => phases[phaseIndex], [phaseIndex])

  useEffect(() => {
    if (!isLoading) return
    const timer = window.setInterval(() => setPhaseIndex(current => Math.min(current + 1, phases.length - 1)), 700)
    return () => window.clearInterval(timer)
  }, [isLoading])

  const loadSample = () => {
    setText(invoiceSample)
    setSchemaName('invoice')
    setResult(null)
    setError(null)
  }

  const extract = async () => {
    if (!text.trim()) return
    if (schemaName === 'custom' && (!customFields.length || customFields.some(field => !field.name.trim()))) {
      setError('Add a name for every custom field before inspecting the text.')
      return
    }

    setError(null)
    setIsLoading(true)
    setPhaseIndex(0)

    try {
      const response = await fetch(`${API_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          schema_name: schemaName,
          custom_fields: schemaName === 'custom' ? customFields : undefined,
        }),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) throw new Error(errorDetail(payload))
      if (!payload || typeof payload !== 'object') throw new Error('The service returned an unreadable result. Try again.')

      const extraction = payload as ExtractionResult
      setResult(extraction)
      setHistory(current => [
        {
          id: crypto.randomUUID(),
          schemaName,
          result: extraction,
          createdAt: new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date()),
        },
        ...current,
      ].slice(0, 5))
    } catch (caught) {
      setError(caught instanceof TypeError
        ? 'The extraction service could not be reached. Check the deployed API URL and allowed origin settings.'
        : caught instanceof Error
          ? caught.message
          : 'The service could not complete this inspection. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectHistory = (entry: HistoryEntry) => {
    setResult(entry.result)
    setSchemaName(entry.schemaName)
    setError(null)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="wordmark">JSON GENIE</span>
          <span className="topbar-divider" />
          <span className="schema-readout">{schemaLabels[schemaName]}</span>
        </div>
        <div className="topbar-meta">
          <span className="connection-status"><i aria-hidden="true" />Schema-ready</span>
          <span className="app-mode">Structured extraction</span>
        </div>
      </header>
      <section className="workbench" aria-label="JSON Genie workspace">
        <InputPane
          text={text}
          onTextChange={setText}
          schemaName={schemaName}
          onSchemaChange={setSchemaName}
          customFields={customFields}
          onCustomFieldsChange={setCustomFields}
          isLoading={isLoading}
          onExtract={extract}
          onLoadSample={loadSample}
        />
        <ResultPane
          result={result}
          isLoading={isLoading}
          phase={phase}
          error={error}
          history={history}
          onSelectHistory={selectHistory}
        />
      </section>
    </main>
  )
}

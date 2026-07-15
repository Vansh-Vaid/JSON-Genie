import { useEffect, useMemo, useState } from 'react'
import { InputPane } from './components/InputPane'
import { ResultPane } from './components/ResultPane'
import { Icon } from './components/Icon'
import type { CustomField, ExtractionResult, HistoryEntry, SchemaName } from './types'

const schemaLabels: Record<SchemaName, string> = {
  invoice: 'Invoice',
  job_posting: 'Job Posting',
  email: 'Email',
  custom: 'Custom schema',
}
const phases = ['Reading input', 'Matching schema', 'Validating fields']
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const invoiceSample = `Hi Maya — Northstar Office Supplies sent invoice INV-2048 for the ergonomic chairs and delivery. The total comes to $1,349.50, and they need payment by August 31, 2026. Please add it to this month's expenses.`

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
  const [isResolving, setIsResolving] = useState(false)
  const [resolveCycle, setResolveCycle] = useState(0)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = window.localStorage.getItem('json-genie-theme')
    return stored === 'light' ? 'light' : 'dark'
  })
  const phase = useMemo(() => phases[phaseIndex], [phaseIndex])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('json-genie-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!isLoading) return
    const timer = window.setInterval(() => setPhaseIndex(current => Math.min(current + 1, phases.length - 1)), 700)
    return () => window.clearInterval(timer)
  }, [isLoading])

  useEffect(() => {
    if (!isResolving) return
    const timer = window.setTimeout(() => setIsResolving(false), 720)
    return () => window.clearTimeout(timer)
  }, [isResolving, resolveCycle])

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
      setResolveCycle(current => current + 1)
      setIsResolving(true)
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
        <div className="brand-cluster">
          <a className="brand-lockup" href="/" aria-label="JSON Genie home">
            <span className="brand-mark"><Icon name="code" size={15} /></span>
            <span className="wordmark">JSON Genie</span>
            <span className="topbar-divider" />
            <span className="schema-readout">Precision workspace</span>
          </a>
          <span className="connection-status"><i aria-hidden="true" />Ready</span>
        </div>
        <div className="topbar-actions">
          <a className="nav-icon-button" href="https://github.com/Vansh-Vaid/JSON-Genie" target="_blank" rel="noreferrer" aria-label="Open JSON Genie on GitHub" title="GitHub"><Icon name="github" size={16} /></a>
          <button className="nav-icon-button" type="button" aria-label="Settings" title="Settings coming soon" disabled><Icon name="settings" size={16} /></button>
          <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
          </button>
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
          isResolving={isResolving}
          resolveCycle={resolveCycle}
          resolvedFields={result?.fields ?? []}
          onExtract={extract}
          onLoadSample={loadSample}
        />
        <ResultPane
          result={result}
          isLoading={isLoading}
          phase={phase}
          error={error}
          history={history}
          schemaName={schemaName}
          customFields={customFields}
          isResolving={isResolving}
          onSelectHistory={selectHistory}
        />
      </section>
      <footer className="app-footer"><span><Icon name="code" size={13} /> JSON Genie</span><span>Private, schema-first extraction in your browser session.</span><a href="https://github.com/Vansh-Vaid/JSON-Genie" target="_blank" rel="noreferrer">View source <Icon name="arrow-up-right" size={13} /></a></footer>
    </main>
  )
}

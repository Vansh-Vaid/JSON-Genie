import type { FieldStatus } from '../types'

const labels: Record<FieldStatus, string> = { validated: 'VALIDATED', missing: 'MISSING', mismatch: 'MISMATCH' }

export function Stamp({ status }: { status: FieldStatus }) {
  return <span className={`stamp stamp-${status}`}>{labels[status]}</span>
}

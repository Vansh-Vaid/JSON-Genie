import type { FieldStatus } from '../types'

const labels: Record<FieldStatus, string> = { validated: 'VALIDATED', missing: 'NEEDS REVIEW', mismatch: 'NEEDS REVIEW' }
const reasons: Record<FieldStatus, string> = {
  validated: 'Matches the selected field type.',
  missing: 'No matching value was found in the pasted text.',
  mismatch: 'A value was found, but it does not match the selected field type.',
}

export function Stamp({ status }: { status: FieldStatus }) {
  return <span className={`stamp stamp-${status}`} data-reason={reasons[status]} tabIndex={0}>{labels[status]}</span>
}

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'list[string]'
export type SchemaName = 'invoice' | 'job_posting' | 'email' | 'custom'
export type FieldStatus = 'validated' | 'missing' | 'mismatch'

export interface CustomField { name: string; type: FieldType; required: boolean }
export interface ResultField extends CustomField { value: unknown; status: FieldStatus; confidence?: number }
export interface ExtractionResult {
  schema_name: SchemaName
  result: Record<string, unknown>
  fields: ResultField[]
  matched_count: number
  missing_count: number
  mismatch_count: number
}

export interface HistoryEntry { id: string; schemaName: SchemaName; result: ExtractionResult; createdAt: string }

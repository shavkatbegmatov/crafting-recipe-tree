import client from './client'

export type ConflictMode = 'SKIP' | 'UPDATE' | 'REPLACE'
export type PortageAction = 'CREATE' | 'UPDATE' | 'REPLACE' | 'SKIP' | 'UNCHANGED' | 'FAIL'

export interface ExportSelectionParams {
  ids?: number[]
  category?: string
  tag?: string
  all?: boolean
  withDependencies?: boolean
}

export interface ExportPreviewItem {
  name: string
  nameUz?: string | null
  nameEn?: string | null
  nameUzCyr?: string | null
  categoryCode: string
  craftTimeSeconds?: number | null
  imageFilename?: string | null
  tagCodes?: string[]
  recipe?: { ingredientName: string; quantity: number }[]
}

export interface ExportPreview {
  manifest: {
    formatVersion: string
    generator: string
    exportedAt: string
    selection: string
    categoriesCount: number
    tagsCount: number
    itemsCount: number
    recipeRowsCount: number
    images?: { filename: string; sizeBytes: number; sha256: string }[]
  }
  categories: { code: string; nameRu: string; nameUz: string; color?: string; icon?: string; sortOrder?: number }[]
  tags: { code: string; nameRu: string; nameUz?: string; color?: string; sortOrder?: number }[]
  items: ExportPreviewItem[]
}

export interface ImportOptions {
  conflictMode: ConflictMode
  importImages: boolean
  overwriteImages: boolean
  dryRun: boolean
}

export interface SectionSummary {
  total: number
  created: number
  updated: number
  unchanged: number
  skipped: number
  failed: number
}

export interface ImportRow {
  identifier: string
  action: PortageAction
  detail?: string | null
}

export interface ImportReport {
  dryRun: boolean
  manifest?: {
    formatVersion?: string
    generator?: string
    exportedAt?: string
    selection?: string
    categoriesCount: number
    tagsCount: number
    itemsCount: number
    recipeRowsCount: number
    imagesCount: number
  }
  categories: SectionSummary
  tags: SectionSummary
  items: SectionSummary
  recipes: SectionSummary
  images: SectionSummary
  categoryRows: ImportRow[]
  tagRows: ImportRow[]
  itemRows: ImportRow[]
  imageRows: ImportRow[]
  warnings: string[]
  errors: string[]
}

function buildSelectionParams(s: ExportSelectionParams): URLSearchParams {
  const p = new URLSearchParams()
  if (s.all) p.set('all', 'true')
  if (s.ids?.length) s.ids.forEach((id) => p.append('ids', String(id)))
  if (s.category) p.set('category', s.category)
  if (s.tag) p.set('tag', s.tag)
  if (s.withDependencies !== undefined) p.set('withDependencies', String(s.withDependencies))
  return p
}

export async function fetchExportPreview(s: ExportSelectionParams): Promise<ExportPreview> {
  const { data } = await client.get(`/admin/portage/preview?${buildSelectionParams(s).toString()}`)
  return data
}

export async function downloadExport(s: ExportSelectionParams): Promise<void> {
  const params = buildSelectionParams(s)
  const response = await client.get(`/admin/portage/export?${params.toString()}`, {
    responseType: 'blob',
  })
  const disposition = response.headers['content-disposition'] as string | undefined
  const match = disposition?.match(/filename="?([^"]+)"?/i)
  const filename = match?.[1] || 'crafttree-export.craftpkg'

  const blob = new Blob([response.data], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function runImport(file: File, options: ImportOptions): Promise<ImportReport> {
  const form = new FormData()
  form.append('file', file)
  form.append(
    'options',
    new Blob([JSON.stringify(options)], { type: 'application/json' }),
  )
  const { data } = await client.post('/admin/portage/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Database,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  Check,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGoBack } from '../hooks/useGoBack'
import { useContentWidth } from '../hooks/useContentWidth'
import { useBackupStatus, useDownloadBackup, useRestoreBackup } from '../hooks/useBackup'
import type { RestoreReport } from '../api/backup'
import Spinner from '../components/ui/Spinner'

/**
 * Butun bazani zaxiralash va tiklash.
 *
 * Faqat SUPER_ADMIN uchun: zaxira faylida parol xeshlari va yozishmalar bo'ladi,
 * tiklash esa bazani butunlay almashtiradi.
 */
export default function AdminBackupPage() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const goBack = useGoBack('/')
  const contentWidth = useContentWidth('max-w-3xl')

  const { data: status, isLoading } = useBackupStatus(isSuperAdmin)
  const downloadMutation = useDownloadBackup()
  const restoreMutation = useRestoreBackup()

  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [confirm, setConfirm] = useState('')
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState<RestoreReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState<string | null>(null)

  if (!isSuperAdmin) return <Navigate to="/" />

  const errText = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    return err?.response?.data?.message ?? err?.message ?? String(e)
  }

  const handleDownload = async () => {
    setError(null)
    setDownloaded(null)
    try {
      const name = await downloadMutation.mutateAsync(undefined)
      setDownloaded(name)
    } catch (e) {
      setError(errText(e))
    }
  }

  const handleRestore = async () => {
    if (!file || !status) return
    setError(null)
    setReport(null)
    setProgress(0)
    try {
      const res = await restoreMutation.mutateAsync({ file, confirm, onProgress: setProgress })
      setReport(res)
      setFile(null)
      setConfirm('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setError(errText(e))
    }
  }

  const canRestore =
    !!file && !!status?.available && confirm === status?.database && !restoreMutation.isPending

  return (
    <div className={`${contentWidth} space-y-5`}>
      <header>
        <button
          type="button"
          onClick={goBack}
          className="text-xs text-skin-muted hover:text-dark-gold inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={12} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-display tracking-wide text-skin-base flex items-center gap-2">
          <Database size={18} className="text-dark-gold" />
          {t('backup.pageTitle')}
        </h1>
        <p className="text-xs text-skin-muted mt-1">{t('backup.pageHint')}</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Muhit holati */}
          <section className="panel p-5 space-y-3">
            <h2 className="text-sm font-semibold text-skin-base">{t('backup.status')}</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Stat label={t('backup.database')} value={status?.database} mono />
              <Stat label={t('backup.size')} value={status?.size} mono />
              <Stat label={t('backup.serverVersion')} value={status?.serverVersion} mono />
              <Stat label={t('backup.tool')} value={status?.available ? status.toolVersion : '—'} mono />
            </dl>
            {!status?.available && (
              <div className="flex items-start gap-2 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span className="break-words">
                  {t('backup.toolMissing')}
                  {status?.error ? ` — ${status.error}` : ''}
                </span>
              </div>
            )}
          </section>

          {/* Zaxira olish */}
          <section className="panel p-5 space-y-3">
            <h2 className="text-sm font-semibold text-skin-base flex items-center gap-2">
              <Download size={15} className="text-dark-gold" />
              {t('backup.downloadTitle')}
            </h2>
            <p className="text-xs text-skin-muted">{t('backup.downloadHint')}</p>
            <button
              onClick={handleDownload}
              disabled={!status?.available || downloadMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {downloadMutation.isPending ? t('backup.preparing') : t('backup.downloadButton')}
            </button>
            {downloaded && (
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <Check size={13} />
                <span className="font-mono break-all">{downloaded}</span>
              </div>
            )}
          </section>

          {/* Tiklash */}
          <section className="panel p-5 space-y-3 border-red-500/25">
            <h2 className="text-sm font-semibold text-skin-base flex items-center gap-2">
              <Upload size={15} className="text-red-400" />
              {t('backup.restoreTitle')}
            </h2>

            <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-200">
              <ShieldAlert size={13} className="mt-0.5 shrink-0" />
              <span>{t('backup.restoreWarning')}</span>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".dump,.backup,application/octet-stream"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setReport(null)
                setError(null)
              }}
              disabled={!status?.available || restoreMutation.isPending}
              className="block w-full text-xs text-skin-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-dark-border file:bg-dark-bg file:text-skin-base file:text-xs hover:file:border-dark-gold/40 disabled:opacity-50"
            />

            {file && (
              <div className="space-y-2">
                <label className="block text-xs text-skin-muted">
                  {t('backup.confirmLabel', { database: status?.database })}
                </label>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={status?.database}
                  disabled={restoreMutation.isPending}
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-skin-base focus:outline-none focus:border-red-400/50 font-mono disabled:opacity-50"
                />
              </div>
            )}

            {restoreMutation.isPending && (
              <div className="space-y-1">
                <div className="h-1.5 rounded bg-dark-bg overflow-hidden">
                  <div
                    className="h-full bg-red-400/70 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-skin-muted flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" />
                  {progress < 100 ? t('backup.uploading') : t('backup.restoring')}
                </p>
              </div>
            )}

            <button
              onClick={handleRestore}
              disabled={!canRestore}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {restoreMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {t('backup.restoreButton')}
            </button>

            {report && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                  <Check size={15} />
                  {t('backup.restoreDone')}
                </div>
                <p className="text-xs text-skin-muted">
                  {t('backup.safetyBackup')}{' '}
                  <span className="font-mono text-skin-base break-all">{report.safetyBackupFile}</span>
                </p>
                <div className="flex items-start gap-2 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span>{t('backup.restartNeeded')}</span>
                </div>
                {report.warnings.length > 0 && (
                  <ul className="space-y-1">
                    {report.warnings.map((w, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-200/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1 whitespace-pre-wrap break-words"
                      >
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/30 text-sm text-red-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span className="break-words whitespace-pre-wrap">{error}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-skin-muted">{label}</dt>
      <dd className={`text-skin-base mt-0.5 break-all ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</dd>
    </div>
  )
}

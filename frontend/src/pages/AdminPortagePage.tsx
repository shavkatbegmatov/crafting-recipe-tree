import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, Upload } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ExportPanel from '../components/portage/ExportPanel'
import ImportPanel from '../components/portage/ImportPanel'

type Tab = 'export' | 'import'

export default function AdminPortagePage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState<Tab>('export')

  if (!isAdmin) return <Navigate to="/" />

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <Link
            to="/"
            className="text-xs text-[#8a7a60] hover:text-dark-gold inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={12} /> {t('detail.back')}
          </Link>
          <h1 className="text-xl font-semibold text-[#d4c4a0]">{t('portage.pageTitle')}</h1>
          <p className="text-xs text-[#8a7a60] mt-1 max-w-2xl">{t('portage.pageHint')}</p>
        </div>
      </header>

      <nav className="flex border-b border-dark-border">
        <TabButton active={tab === 'export'} onClick={() => setTab('export')} icon={<Download size={14} />}
          label={t('portage.tab.export')} />
        <TabButton active={tab === 'import'} onClick={() => setTab('import')} icon={<Upload size={14} />}
          label={t('portage.tab.import')} />
      </nav>

      {tab === 'export' ? <ExportPanel /> : <ImportPanel />}
    </div>
  )
}

function TabButton({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 -mb-px flex items-center gap-2 text-sm font-medium border-b-2 transition-colors
        ${active
          ? 'border-dark-gold text-dark-gold'
          : 'border-transparent text-[#8a7a60] hover:text-[#d4c4a0]'}`}
    >
      {icon}
      {label}
    </button>
  )
}

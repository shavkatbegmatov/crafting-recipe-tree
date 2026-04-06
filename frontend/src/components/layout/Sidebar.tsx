import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useItems, useCategories } from '../../hooks/useItems'
import { useLocalizedField } from '../../hooks/useLanguage'
import { useState, useCallback } from 'react'
import SearchBar from '../items/SearchBar'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const { getField } = useLocalizedField()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: items, isLoading } = useItems(filter || undefined)
  const { data: categories } = useCategories()

  const handleSearch = useCallback((val: string) => setSearch(val), [])

  const filteredItems = items?.filter(
    (item) => !search || getField(item, 'name').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-full w-[280px] bg-dark-card border-r border-dark-border flex flex-col shrink-0 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-3 border-b border-dark-border">
          <div className="flex items-center justify-between mb-3 lg:hidden">
            <span className="text-sm font-medium text-[#d4c4a0]">{t('sidebar.elements')}</span>
            <button onClick={onClose} className="text-[#8a7a60] hover:text-[#d4c4a0]">
              <X size={18} />
            </button>
          </div>
          <SearchBar value={search} onChange={handleSearch} />
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => setFilter('')}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors border ${
                filter === ''
                  ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
                  : 'bg-dark-bg text-[#8a7a60] hover:text-[#d4c4a0] border-dark-border hover:border-[#4a4238]'
              }`}
            >
              {t('sidebar.all')}
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.code}
                onClick={() => setFilter(cat.code)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors border ${
                  filter === cat.code
                    ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
                    : 'bg-dark-bg text-[#8a7a60] hover:text-[#d4c4a0] border-dark-border hover:border-[#4a4238]'
                }`}
              >
                {getField(cat, 'name')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-center text-[#8a7a60] text-xs py-4">{t('sidebar.loading')}</div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems?.map((item) => {
                const cat = categories?.find((c) => c.code === item.categoryCode)
                const dotColor = cat?.color || DEFAULT_CATEGORY_COLOR

                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate(`/items/${item.id}`); onClose() }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                      String(item.id) === id
                        ? 'bg-dark-hover text-[#d4c4a0] border-l-2 border-dark-gold'
                        : 'text-[#8a7a60] hover:text-[#d4c4a0] hover:bg-dark-bg'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="truncate">{getField(item, 'name')}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

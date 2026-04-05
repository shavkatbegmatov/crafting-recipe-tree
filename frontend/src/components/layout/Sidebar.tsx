import { useNavigate, useParams } from 'react-router-dom'
import { useItems } from '../../hooks/useItems'
import { useState, useCallback } from 'react'
import SearchBar from '../items/SearchBar'
import { CATEGORY_DOT } from '../../utils/constants'
import type { CategoryCode } from '../../api/types'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const FILTERS: { code: string; label: string }[] = [
  { code: '', label: 'Barchasi' },
  { code: 'RAW', label: 'Xomashyo' },
  { code: 'MATERIAL', label: 'Material' },
  { code: 'ITEM', label: 'Predmet' },
  { code: 'MODULE', label: 'Modul' },
]

export default function Sidebar({ isOpen, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: items, isLoading } = useItems(filter || undefined)

  const handleSearch = useCallback((val: string) => setSearch(val), [])

  const filteredItems = items?.filter(
    (item) => !search || item.name.toLowerCase().includes(search.toLowerCase())
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
            <span className="text-sm font-medium text-[#d4c4a0]">Elementlar</span>
            <button onClick={onClose} className="text-[#8a7a60] hover:text-[#d4c4a0]">
              <X size={18} />
            </button>
          </div>
          <SearchBar value={search} onChange={handleSearch} />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {FILTERS.map((f) => (
              <button
                key={f.code}
                onClick={() => setFilter(f.code)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors border ${
                  filter === f.code
                    ? 'bg-dark-gold/20 text-dark-gold border-dark-gold/40'
                    : 'bg-dark-bg text-[#8a7a60] hover:text-[#d4c4a0] border-dark-border hover:border-[#4a4238]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-center text-[#8a7a60] text-xs py-4">Yuklanmoqda...</div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems?.map((item) => (
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
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      CATEGORY_DOT[item.categoryCode as CategoryCode] || 'bg-[#8a7a60]'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

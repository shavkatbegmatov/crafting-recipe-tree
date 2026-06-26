import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { RecipeTreeNode } from '../../api/types'
import { useCategories } from '../../hooks/useItems'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'
import { useLocalizedField } from '../../hooks/useLanguage'
import ItemImageIcon from '../ui/ItemImageIcon'
import CraftTimeBadge from './CraftTimeBadge'

interface Props {
  node: RecipeTreeNode
  depth?: number
  isLast?: boolean
  defaultOpenDepth?: number
  multiplier?: number
  /** Berilsa, har node inventarga solishtiriladi (itemId -> bor miqdor). */
  inventory?: Map<number, number>
}

// Inventar holati ranglari (game HUD uslubi)
const STATUS_COLOR = { enough: '#4a9a5a', partial: '#c8a050', none: '#c2554a' } as const

const fmtQty = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(2))

export default function TreeNode({
  node,
  depth = 0,
  isLast = false,
  defaultOpenDepth = 2,
  multiplier = 1,
  inventory,
}: Props) {
  const [isOpen, setIsOpen] = useState(depth < defaultOpenDepth)
  const { getField } = useLocalizedField()
  const { t } = useTranslation()
  const { data: categories } = useCategories()
  const hasChildren = node.children && node.children.length > 0
  const color = categories?.find((c) => c.code === node.category)?.color || DEFAULT_CATEGORY_COLOR
  const name = getField(node, 'name')
  const displayQuantity = node.quantity * multiplier

  // Inventar holati — faqat "inventar bilan solishtirish" yoqilganda (inventory berilganda)
  const have = inventory?.get(node.id) ?? 0
  const invStatus: keyof typeof STATUS_COLOR | null = !inventory
    ? null
    : have >= displayQuantity
      ? 'enough'
      : have > 0
        ? 'partial'
        : 'none'
  const statusColor = invStatus ? STATUS_COLOR[invStatus] : undefined

  return (
    <div className={depth > 0 ? 'ml-5' : ''}>
      <div className={`relative ${depth > 0 ? 'tree-line pl-4' : ''}`}>
        {depth > 0 && (
          <>
            <span
              className="absolute left-0 top-3.5 w-3 border-t border-dashed"
              style={{ borderColor: '#2A2D37' }}
            />
            {isLast && (
              <span
                className="absolute left-0 top-3.5 bottom-0 bg-dark-card"
                style={{ width: '1px' }}
              />
            )}
          </>
        )}

        <div
          className="flex items-center gap-1.5 py-1 px-1.5 -mx-1.5 rounded-md group hover:bg-dark-hover/40 transition-colors"
          style={invStatus ? { boxShadow: `inset 2px 0 0 ${statusColor}` } : undefined}
        >
          {hasChildren ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-dark-hover transition-colors"
              style={{ color }}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="shrink-0 w-5 h-5" />
          )}

          <ItemImageIcon
            imageUrl={node.imageUrl}
            alt={name}
            size={20}
            fallbackColor={color}
          />

          <Link
            to={`/items/${node.id}`}
            className="text-sm transition-all group-hover:[text-shadow:0_0_8px_currentColor]"
            style={{ color }}
          >
            {name}
          </Link>

          {displayQuantity !== 1 && (
            <span className="text-xs font-mono text-skin-muted">
              x{fmtQty(displayQuantity)}
            </span>
          )}

          <CraftTimeBadge seconds={node.craftTimeSeconds} />

          {/* Inventar holati: nuqta + bor/kerak (inventar rejimida) */}
          {invStatus && (
            <span
              className="ml-auto pl-2 flex items-center gap-1 text-[11px] font-mono shrink-0"
              title={t('tree.invStatus', { have: fmtQty(have), need: fmtQty(displayQuantity) })}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <span style={{ color: statusColor }}>
                {fmtQty(have)}/{fmtQty(displayQuantity)}
              </span>
            </span>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {node.children.map((child, index) => (
              <TreeNode
                key={`${child.id}-${index}`}
                node={child}
                depth={depth + 1}
                isLast={index === node.children.length - 1}
                defaultOpenDepth={defaultOpenDepth}
                multiplier={multiplier}
                inventory={inventory}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

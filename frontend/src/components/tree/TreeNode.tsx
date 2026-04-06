import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown, Dot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RecipeTreeNode } from '../../api/types'
import { useCategories } from '../../hooks/useItems'
import { DEFAULT_CATEGORY_COLOR } from '../../utils/constants'
import { useLocalizedField } from '../../hooks/useLanguage'
import CraftTimeBadge from './CraftTimeBadge'

interface Props {
  node: RecipeTreeNode
  depth?: number
  isLast?: boolean
}

export default function TreeNode({ node, depth = 0, isLast = false }: Props) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const { getField } = useLocalizedField()
  const { data: categories } = useCategories()
  const hasChildren = node.children && node.children.length > 0
  const color = categories?.find((c) => c.code === node.category)?.color || DEFAULT_CATEGORY_COLOR
  const name = getField(node, 'name')

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

        <div className="flex items-center gap-1.5 py-1 group">
          {hasChildren ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-dark-hover transition-colors"
              style={{ color }}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="shrink-0 w-5 h-5 flex items-center justify-center">
              <Dot size={14} style={{ color }} />
            </span>
          )}

          <Link
            to={`/items/${node.id}`}
            className="text-sm hover:underline transition-colors"
            style={{ color }}
          >
            {name}
          </Link>

          {node.quantity !== 1 && (
            <span className="text-xs font-mono text-[#8a7a60]">
              x{node.quantity % 1 === 0 ? node.quantity : node.quantity.toFixed(2)}
            </span>
          )}

          <CraftTimeBadge seconds={node.craftTimeSeconds} />
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
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

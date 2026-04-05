import { useRecipeTree } from '../../hooks/useRecipeTree'
import TreeNode from './TreeNode'
import Spinner from '../ui/Spinner'
import { GitBranch } from 'lucide-react'

interface Props {
  itemId: number
}

export default function RecipeTree({ itemId }: Props) {
  const { data: tree, isLoading, error } = useRecipeTree(itemId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-[#8a7a60]">
        <Spinner />
        <span className="text-sm">Daraxт yuklanmoqda...</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 text-sm py-4">Xatolik yuz berdi</div>
  }

  if (!tree) return null

  const isRaw = tree.category === 'RAW'

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-5">
      <h2 className="text-sm font-semibold text-[#d4c4a0] mb-4 flex items-center gap-2">
        <GitBranch size={16} className="text-[#8a7a60]" />
        Kraft shajara
      </h2>

      {isRaw ? (
        <p className="text-sm text-[#8a7a60]">Bu xomashyo — retsepti yo'q</p>
      ) : (
        <div className="font-mono text-sm">
          <TreeNode node={tree} />
        </div>
      )}
    </div>
  )
}

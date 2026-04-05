import { Boxes, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: Props) {
  return (
    <header className="h-14 bg-dark-card border-b border-dark-border flex items-center px-4 gap-3 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden text-gray-400 hover:text-gray-200 transition-colors"
      >
        <Menu size={20} />
      </button>
      <Link to="/" className="flex items-center gap-2 text-gray-100 hover:text-white transition-colors">
        <Boxes size={22} className="text-amber-500" />
        <span className="font-semibold text-lg">Craft Tree</span>
      </Link>
      <span className="text-xs text-gray-500 ml-2 hidden sm:inline">Recipe Manager</span>
    </header>
  )
}

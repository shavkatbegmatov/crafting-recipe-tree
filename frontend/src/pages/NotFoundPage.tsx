import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold text-gray-700 mb-4">404</h1>
      <p className="text-gray-400 mb-6">Sahifa topilmadi</p>
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        <ArrowLeft size={14} />
        Bosh sahifaga qaytish
      </Link>
    </div>
  )
}

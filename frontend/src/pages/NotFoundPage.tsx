import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold text-[#3a3228] mb-4">404</h1>
      <p className="text-[#8a7a60] mb-6">Sahifa topilmadi</p>
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-dark-gold hover:text-[#e8d8b0] transition-colors"
      >
        <ArrowLeft size={14} />
        Bosh sahifaga qaytish
      </Link>
    </div>
  )
}

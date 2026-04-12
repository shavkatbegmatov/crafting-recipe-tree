import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import ChatButton from '../chat/ChatButton'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../ui/Spinner'
import WelcomePage from '../../pages/WelcomePage'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (!isLoading && !user && location.pathname !== '/') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-dark-bg">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : user ? (
        <>
          <div className="flex flex-1 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
          <ChatButton />
        </>
      ) : (
        <main className="flex-1 overflow-y-auto xl:overflow-hidden">
          <WelcomePage />
        </main>
      )}
    </div>
  )
}

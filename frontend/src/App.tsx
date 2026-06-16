import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GameVersionProvider } from './contexts/GameVersionContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import ItemDetailPage from './pages/ItemDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import AdminPortagePage from './pages/AdminPortagePage'
import AdminGameVersionsPage from './pages/AdminGameVersionsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminAccessRequestsPage from './pages/AdminAccessRequestsPage'

export default function App() {
  return (
    <AuthProvider>
      <GameVersionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="items/:id" element={<ItemDetailPage />} />
            <Route path="admin/categories" element={<AdminCategoriesPage />} />
            <Route path="admin/portage" element={<AdminPortagePage />} />
            <Route path="admin/game-versions" element={<AdminGameVersionsPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/access-requests" element={<AdminAccessRequestsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </GameVersionProvider>
    </AuthProvider>
  )
}

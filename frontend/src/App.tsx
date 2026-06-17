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
import AdminAuditPage from './pages/AdminAuditPage'
import AdminChatPage from './pages/AdminChatPage'
import AdminStatsPage from './pages/AdminStatsPage'
import CalculatorPage from './pages/CalculatorPage'
import CraftableSearchPage from './pages/CraftableSearchPage'
import FavoritesPage from './pages/FavoritesPage'
import InventoryPage from './pages/InventoryPage'
import ComparePage from './pages/ComparePage'

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
            <Route path="admin/audit" element={<AdminAuditPage />} />
            <Route path="admin/chat" element={<AdminChatPage />} />
            <Route path="admin/stats" element={<AdminStatsPage />} />
            <Route path="calculator" element={<CalculatorPage />} />
            <Route path="craftable" element={<CraftableSearchPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </GameVersionProvider>
    </AuthProvider>
  )
}

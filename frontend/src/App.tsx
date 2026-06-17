import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GameVersionProvider } from './contexts/GameVersionContext'
import Layout from './components/layout/Layout'
import Spinner from './components/ui/Spinner'

// Route-based code splitting — har sahifa alohida chunk sifatida yuklanadi.
// Bu boshlang'ich bundle'ni keskin kichraytiradi (admin sahifalar ko'pchilikka kerak emas).
const HomePage = lazy(() => import('./pages/HomePage'))
const ItemDetailPage = lazy(() => import('./pages/ItemDetailPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'))
const AdminPortagePage = lazy(() => import('./pages/AdminPortagePage'))
const AdminGameVersionsPage = lazy(() => import('./pages/AdminGameVersionsPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const AdminAccessRequestsPage = lazy(() => import('./pages/AdminAccessRequestsPage'))
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage'))
const AdminChatPage = lazy(() => import('./pages/AdminChatPage'))
const AdminStatsPage = lazy(() => import('./pages/AdminStatsPage'))
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'))
const CraftableSearchPage = lazy(() => import('./pages/CraftableSearchPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))

export default function App() {
  return (
    <AuthProvider>
      <GameVersionProvider>
        <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
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
        </Suspense>
      </GameVersionProvider>
    </AuthProvider>
  )
}

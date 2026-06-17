import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer from './components/ui/ToastContainer'
import { toast } from './utils/toast'
import { getErrorMessage } from './utils/errorMessage'
import './i18n'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
  // Global zaxira xato boshqaruvi — har bir sahifa o'zi ham inline xatoni ko'rsatishi mumkin,
  // lekin hech narsa "jimgina" yo'qolmaydi.
  queryCache: new QueryCache({
    onError: (error) => toast.error(getErrorMessage(error)),
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(getErrorMessage(error)),
  }),
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

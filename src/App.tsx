import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { InventoryProvider } from '@/stores/useInventoryStore'
import { AuthProvider, useAuth } from '@/hooks/use-auth'

import Layout from './components/Layout'
import Login from './pages/Login'
import Index from './pages/Index'
import Items from './pages/Items'
import Movements from './pages/Movements'
import History from './pages/History'
import NotFound from './pages/NotFound'
import { Loader2 } from 'lucide-react'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <InventoryProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/itens" element={<Items />} />
              <Route path="/movimentacoes" element={<Movements />} />
              <Route path="/historico" element={<History />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </InventoryProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App

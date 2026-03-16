import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { InventoryProvider } from '@/stores/useInventoryStore'

import Layout from './components/Layout'
import Index from './pages/Index'
import Items from './pages/Items'
import Movements from './pages/Movements'
import History from './pages/History'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <InventoryProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/itens" element={<Items />} />
            <Route path="/movimentacoes" element={<Movements />} />
            <Route path="/historico" element={<History />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </InventoryProvider>
  </BrowserRouter>
)

export default App

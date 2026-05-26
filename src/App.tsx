import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import StoreLayout from './components/StoreLayout';
import StoreFront from './pages/StoreFront';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import POS from './pages/POS';
import Admin from './pages/Admin';
import StoreScreen from './pages/StoreScreen';
import VoiceAssistant from './components/VoiceAssistant';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import { Store, Monitor, LayoutDashboard, TerminalSquare } from 'lucide-react';
import { useStore } from './store';

function EnvironmentSwitcher() {
  const location = useLocation();
  if (location.pathname === '/screen') return null; // Don't show switcher on digital signage
  
  return (
    <div className="fixed bottom-6 left-6 z-50 bg-white shadow-xl border border-ink/10 rounded-full flex p-1.5 gap-1 glass">
      <Link 
        to="/" 
        className={`p-2.5 flex items-center justify-center rounded-full transition-all ${location.pathname === '/' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'}`}
        title="Client Store"
      >
        <Store className="w-5 h-5" />
      </Link>
      <Link 
        to="/pos" 
        className={`p-2.5 flex items-center justify-center rounded-full transition-all ${location.pathname === '/pos' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'}`}
        title="Cash Register (POS)"
      >
        <TerminalSquare className="w-5 h-5" />
      </Link>
      <Link 
        to="/admin" 
        className={`p-2.5 flex items-center justify-center rounded-full transition-all ${location.pathname === '/admin' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'}`}
        title="Admin Dashboard"
      >
        <LayoutDashboard className="w-5 h-5" />
      </Link>
      <Link 
        to="/screen" 
        className={`p-2.5 flex items-center justify-center rounded-full transition-all ${location.pathname === '/screen' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'}`}
        title="In-Store Screen"
      >
        <Monitor className="w-5 h-5" />
      </Link>
    </div>
  );
}

export default function App() {
  const initSession = useStore((state) => state.initSession);
  const fetchProducts = useStore((state) => state.fetchProducts);

  useEffect(() => {
    initSession();
    fetchProducts();
  }, [initSession, fetchProducts]);

  return (
    <BrowserRouter>
      <div className="bg-bg min-h-screen font-sans text-ink selection:bg-accent/20">
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<StoreFront />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Route>
          
          <Route path="/pos" element={<POS />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute role="admin">
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="/screen" element={<StoreScreen />} />
        </Routes>
        
        {/* Environment Tools & Modals */}
        <EnvironmentSwitcher />
        <VoiceAssistant />
        <AuthModal />
      </div>
    </BrowserRouter>
  );
}

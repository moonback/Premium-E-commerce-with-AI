import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import StoreLayout from './components/StoreLayout';
import { AnimatePresence } from 'motion/react';
import PageTransition from './components/PageTransition';
import VoiceAssistant from './components/VoiceAssistant';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import { Store, Monitor, LayoutDashboard, TerminalSquare } from 'lucide-react';
import { useStore } from './store';

const StoreFront = lazy(() => import('./pages/StoreFront'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const POS = lazy(() => import('./pages/POS'));
const Admin = lazy(() => import('./pages/Admin'));
const StoreScreen = lazy(() => import('./pages/StoreScreen'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-bg text-ink" role="status" aria-live="polite">
      <span className="text-xs uppercase tracking-[0.35em] text-ink/50">Chargement Véridian...</span>
    </div>
  );
}

function EnvironmentSwitcher() {
  const { user } = useStore();
  const location = useLocation();
  if (!user || user.role !== 'admin') return null;
  if (location.pathname === '/screen') return null;

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

function AppContent() {
  const location = useLocation();
  const initSession = useStore(state => state.initSession);
  const fetchProducts = useStore(state => state.fetchProducts);
  const fetchCategories = useStore(state => state.fetchCategories);

  useEffect(() => {
    initSession();
    fetchProducts();
    fetchCategories();
  }, [initSession, fetchProducts, fetchCategories]);

  return (
    <div className="bg-bg min-h-screen font-sans text-ink selection:bg-accent/20">
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            <Route element={<StoreLayout />}>
              <Route path="/" element={<PageTransition><StoreFront /></PageTransition>} />
              <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
              <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
              <Route path="/order-confirmation" element={<PageTransition><OrderConfirmation /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><ProtectedRoute><Profile /></ProtectedRoute></PageTransition>} />
            </Route>
            <Route path="/pos" element={<PageTransition><ProtectedRoute role={["staff", "admin"]}><POS /></ProtectedRoute></PageTransition>} />
            <Route path="/admin" element={<PageTransition><ProtectedRoute role="admin"><Admin /></ProtectedRoute></PageTransition>} />
            <Route path="/screen" element={<PageTransition><ProtectedRoute role={["kiosk", "admin"]}><StoreScreen /></ProtectedRoute></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      <EnvironmentSwitcher />
      <VoiceAssistant />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}

import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import StoreLayout from './components/StoreLayout';
import { AnimatePresence } from 'motion/react';
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';
import SkipLinks from './components/SkipLinks';
import ScrollProgress from './components/ScrollProgress';
import { useServiceWorker } from './hooks/usePWA';
import { ToastProvider } from './components/ui/Toast';
import { useStore } from './store';
// OfflineIndicator is a tiny status banner — eager import is acceptable
import { OfflineIndicator } from './components/PWAInstallPrompt';

// ── Page routes (lazy-loaded) ─────────────────────────────────────────────────
const StoreFront = lazy(() => import('./pages/StoreFront'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const POS = lazy(() => import('./pages/POS'));
const Admin = lazy(() => import('./pages/Admin'));
const StoreScreen = lazy(() => import('./pages/StoreScreen'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Contact = lazy(() => import('./pages/Contact'));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'));
const CGV = lazy(() => import('./pages/CGV'));
const Livraison = lazy(() => import('./pages/Livraison'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));

// ── UI overlays — deferred until after first paint ────────────────────────────
// VoiceAssistant embeds WebSocket + AudioContext; no need to load until user interacts.
// AuthModal and PWAInstallPrompt are shown on demand, never blocking initial render.
const VoiceAssistant = lazy(() => import('./components/VoiceAssistant'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const PWAInstallPrompt = lazy(() => import('./components/PWAInstallPrompt'));

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-bg text-ink" role="status" aria-live="polite">
      <span className="text-xs uppercase tracking-[0.35em] text-ink/50">Chargement Véridian...</span>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const initSession = useStore(state => state.initSession);
  const fetchProducts = useStore(state => state.fetchProducts);
  const fetchCategories = useStore(state => state.fetchCategories);
  
  // Enregistrer le Service Worker
  useServiceWorker();

  useEffect(() => {
    initSession();
    fetchProducts();
    fetchCategories();
  }, [initSession, fetchProducts, fetchCategories]);

  // Fetch wishlist when user logs in
  const user = useStore(state => state.user);
  const fetchWishlist = useStore(state => state.fetchWishlist);
  
  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user, fetchWishlist]);

  return (
    <div className="bg-bg min-h-screen font-sans text-ink selection:bg-accent/20">
      <SkipLinks />
      <ScrollProgress />
      <OfflineIndicator />

      {/* Page routing — each route chunk is lazy-loaded */}
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            <Route element={<StoreLayout />}>
              <Route path="/" element={<PageTransition><StoreFront /></PageTransition>} />
              <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
              <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
              <Route path="/order-confirmation" element={<PageTransition><OrderConfirmation /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><ProtectedRoute><Profile /></ProtectedRoute></PageTransition>} />
              <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
              <Route path="/mentions-legales" element={<PageTransition><MentionsLegales /></PageTransition>} />
              <Route path="/cgv" element={<PageTransition><CGV /></PageTransition>} />
              <Route path="/livraison" element={<PageTransition><Livraison /></PageTransition>} />
              <Route path="/category/:slug" element={<PageTransition><CategoryPage /></PageTransition>} />
            </Route>
            <Route path="/pos" element={<PageTransition><ProtectedRoute role={["staff", "admin"]}><POS /></ProtectedRoute></PageTransition>} />
            <Route path="/admin" element={<PageTransition><ProtectedRoute role="admin"><Admin /></ProtectedRoute></PageTransition>} />
            <Route path="/screen" element={<PageTransition><ProtectedRoute role={["kiosk", "admin"]}><StoreScreen /></ProtectedRoute></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      {/* Global overlays — loaded after routes, no fallback needed */}
      <Suspense fallback={null}>
        <VoiceAssistant />
        <AuthModal />
        <PWAInstallPrompt />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <ToastProvider />
    </>
  );
}

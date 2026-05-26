import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

import { Toaster } from 'react-hot-toast';

export default function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#1A1A1A',
          color: '#FAF9F6',
          borderRadius: '0',
          padding: '16px',
          textTransform: 'uppercase',
          fontSize: '10px',
          fontWeight: 'bold',
          letterSpacing: '0.1em'
        }
      }} />
      <Header />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

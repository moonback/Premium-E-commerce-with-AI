import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store';

export default function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'admin' | 'customer' }) {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    // Dans le monde réel, renvoyer peut-être vers une page 403 "Accès Refusé"
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

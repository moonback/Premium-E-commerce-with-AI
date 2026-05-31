import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { UserRole } from '../types';

type ProtectedRouteProps = {
  children: React.ReactNode;
  role?: UserRole | UserRole[];
};

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, isSessionLoading } = useStore();
  const location = useLocation();

  if (isSessionLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-bg text-sm font-bold uppercase tracking-widest text-ink/50">
        Vérification de l'accès…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  const allowedRoles = role ? (Array.isArray(role) ? role : [role]) : null;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace state={{ from: location.pathname, denied: true }} />;
  }

  return <>{children}</>;
}

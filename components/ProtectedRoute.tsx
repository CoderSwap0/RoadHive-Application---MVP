import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  // 1. Check Authentication
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Check Role Authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard if unauthorized for this specific page
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
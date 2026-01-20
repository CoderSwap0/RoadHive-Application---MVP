import React, { createContext, useContext, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PostLoad } from './pages/PostLoad';
import { MyLoads } from './pages/MyLoads';
import { Auth } from './pages/Auth';
import { UserManagement } from './pages/UserManagement';
import { ActiveTrip } from './pages/ActiveTrip';
import { DriverDashboard } from './pages/DriverDashboard';
import { User } from './types';
import { authService } from './services/authService';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {}, isLoading: true });

export const useAuth = () => useContext(AuthContext);

// --- Main Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getSession();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading RoadHive...</div>;

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      <ToastProvider>
        <HashRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/" element={!user ? <Auth /> : <Navigate to="/dashboard" replace />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/loads" element={
              <ProtectedRoute allowedRoles={['SHIPPER', 'TRANSPORTER', 'SUPER_ADMIN', 'ADMIN']}>
                <Layout><MyLoads /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/post-load" element={
              <ProtectedRoute allowedRoles={['SHIPPER', 'SUPER_ADMIN', 'ADMIN']}>
                 <Layout><PostLoad /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <Layout><UserManagement /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/trips" element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                 <Layout><DriverDashboard /></Layout>
              </ProtectedRoute>
            } />

            {/* Shared trip route - Drivers own it, Shippers view it */}
            <Route path="/trip/:id" element={
              <ProtectedRoute>
                 <Layout><ActiveTrip /></Layout>
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
};

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { DebugStorage } from './components/DebugStorage';
import { AuthCallback } from './components/AuthCallback';
import { Toaster } from './components/ui/sonner';
import { BucketsProvider } from './components/BucketsContext';
import { UsageProvider } from './components/UsageContext';
import LandingV2 from './pages/LandingV2';
import FileManager from './components/FileManager';
import AuthPage from './pages/Auth';
import Header from './components/Header';
import Buckets from './pages/Buckets';
import ShareLinks from './pages/ShareLinks';
import Usage from './pages/Usage';
import Account from './pages/Account';
import Settings from './pages/Settings';

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}

function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }
  if (user) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

function AppLayout() {
  const { activeBucket } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Header showShareLinks showSettings />
      <main className="flex justify-center items-start min-h-[80vh] py-12">
        <div className="w-full max-w-7xl px-4">
          <FileManager activeBucket={activeBucket} />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BucketsProvider>
        <UsageProvider>
          <Router>
            <Routes>
              {/* Landing page: always public, but redirect if logged in */}
              <Route path="/" element={<AuthRedirect><LandingV2 /></AuthRedirect>} />
              {/* OAuth callback */}
              <Route path="/auth/callback" element={<AuthCallback />} />
              {/* Auth page */}
              <Route path="/auth" element={<AuthRedirect><AuthPage /></AuthRedirect>} />
              {/* Main app: protected */}
              <Route path="/app/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
              {/* Top-level protected routes for header navigation */}
              <Route path="/buckets" element={<ProtectedRoute><Buckets /></ProtectedRoute>} />
              <Route path="/shared-links" element={<ProtectedRoute><ShareLinks /></ProtectedRoute>} />
              <Route path="/usage" element={<ProtectedRoute><Usage /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              {/* Fallback: 404 or redirect */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
          <DebugStorage />
          <Toaster />
        </UsageProvider>
      </BucketsProvider>
    </AuthProvider>
  );
}
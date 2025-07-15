import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Settings from './pages/Settings';
import ShareLinks from './pages/ShareLinks';
import Account from './pages/Account';
import Buckets from './pages/Buckets';
import { AuthProvider, useAuth } from './components/AuthContext';
import { DebugStorage } from './components/DebugStorage';
import { OAuthLogin } from './components/OAuthLogin';
import { AuthCallback } from './components/AuthCallback';
import { AuthError } from './components/AuthError';
import { Toaster } from './components/ui/sonner';
import { BucketsProvider } from './components/BucketsContext';

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Public Route component (redirects authenticated users away)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />
        <Route
          path="/auth/error"
          element={<AuthError />}
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shared-links"
          element={
            <ProtectedRoute>
              <ShareLinks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buckets"
          element={
            <ProtectedRoute>
              <Buckets />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BucketsProvider>
        <AppRoutes />
        <DebugStorage />
        <Toaster />
      </BucketsProvider>
    </AuthProvider>
  );
}
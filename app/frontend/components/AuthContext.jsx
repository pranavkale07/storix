import React, { createContext, useContext, useState, useEffect } from 'react';
import { BucketService } from '../lib/bucketService';
import { StorageManager } from '../lib/storage';
import { showToast } from './utils/toast';
import { apiFetch } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState(null);
  const [bucketLoading, setBucketLoading] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const session = StorageManager.getSession();

    async function fetchProfileAndSetUser(token) {
      try {
        const response = await apiFetch('/api/auth/profile');
        if (response.ok) {
          const profile = await response.json();
          setUser(profile);
          StorageManager.setUser(profile);
        } else {
          setUser(session.user); // fallback
        }
      } catch {
        setUser(session.user); // fallback
      }
    }

    if (session.user && session.token) {
      setToken(session.token);
      setActiveBucket(session.activeBucket);
      fetchProfileAndSetUser(session.token);
    }
    setLoading(false);
  }, []);

  const login = async (user, token) => {
    setToken(token);
    StorageManager.setToken(token);
    // Fetch full profile after login
    try {
      const response = await apiFetch('/api/auth/profile');
      if (response.ok) {
        const profile = await response.json();
        setUser(profile);
        StorageManager.setUser(profile);
      } else {
        setUser(user);
        StorageManager.setUser(user);
      }
    } catch {
      setUser(user);
      StorageManager.setUser(user);
    }
    // Don't automatically load active bucket on login to prevent infinite loops
    // The bucket will be loaded when needed by the components
  };

  const logout = () => {
    // Clear React state
    setUser(null);
    setToken(null);
    setActiveBucket(null);

    // Clear all localStorage data
    StorageManager.clearSession();

    // Show logout toast
    showToast.success('Logged out successfully');

    // Clear any potential browser state
    // Note: We don't use sessionStorage, cookies, or IndexedDB in this app
    // But this is where you'd clear them if needed

    // Force a page reload to clear any cached API responses
    // This ensures no stale data remains in memory
    window.location.href = '/';
  };

  const updateActiveBucket = (bucket) => {
    setActiveBucket(bucket);
    StorageManager.setActiveBucket(bucket);
  };

  const refreshActiveBucket = async () => {
    setBucketLoading(true);
    try {
      const bucket = await BucketService.loadActiveBucket();
      setActiveBucket(bucket);
      return bucket;
    } catch (error) {
      console.error('Failed to refresh active bucket:', error);
      return null;
    } finally {
      setBucketLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      loading,
      activeBucket,
      bucketLoading,
      updateActiveBucket,
      refreshActiveBucket,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
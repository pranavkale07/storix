import React, { createContext, useContext, useState, useEffect } from 'react';
import { BucketService } from '../lib/bucketService';
import { StorageManager } from '../lib/storage';

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

    if (session.user && session.token) {
      setUser(session.user);
      setToken(session.token);
      setActiveBucket(session.activeBucket);
    }
    setLoading(false);
  }, []);

  const login = async (user, token) => {
    setUser(user);
    setToken(token);
    StorageManager.setSession(user, token);

    // Automatically load active bucket after login
    setBucketLoading(true);
    try {
      const bucket = await BucketService.loadActiveBucket();
      setActiveBucket(bucket);
    } catch (error) {
      console.error('Failed to load active bucket:', error);
    } finally {
      setBucketLoading(false);
    }
  };

  const logout = () => {
    // Clear React state
    setUser(null);
    setToken(null);
    setActiveBucket(null);

    // Clear all localStorage data
    StorageManager.clearSession();

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
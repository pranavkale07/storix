import React, { createContext, useContext, useState, useEffect } from 'react';
import { BucketService } from '../lib/bucketService';
import { StorageManager } from '../lib/storage';
import { showToast } from './utils/toast';
import { apiFetch, setGlobalLogout } from '../lib/api';

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
      // Only make API call if we have a valid token
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await apiFetch('/api/auth/profile');
        if (response.ok) {
          const profile = await response.json();
          setUser(profile);
          StorageManager.setUser(profile);
        } else {
          // If profile fetch fails, clear the invalid session
          setUser(null);
          StorageManager.clearSession();
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // If there's an error, clear the invalid session
        setUser(null);
        StorageManager.clearSession();
      }
      setLoading(false); // Only set loading to false after async work is done
    }
    
    async function ensureActiveBucket(token) {
      try {
        const buckets = await BucketService.fetchBuckets();
        if (buckets && buckets.length > 0) {
          const firstBucket = buckets[0];
          const bucketInfo = {
            id: firstBucket.id,
            bucket: firstBucket.bucket,
            provider: firstBucket.provider,
            region: firstBucket.region,
            endpoint: firstBucket.endpoint,
          };
          updateActiveBucket(bucketInfo);
          // Also set active credential in backend and get new token
          try {
            const res = await apiFetch('/api/auth/active_credential', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential_id: firstBucket.id }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.token) {
                setToken(data.token);
                StorageManager.setToken(data.token);
              }
            }
          } catch (err) {
            // Ignore backend errors for now
          }
        } else {
          setActiveBucket(null);
          StorageManager.removeActiveBucket();
        }
      } catch (err) {
        // Ignore bucket errors
      }
    }    

    if (session.user && session.token) {
      setToken(session.token);
      setActiveBucket(session.activeBucket);
      fetchProfileAndSetUser(session.token);
      // If user is authenticated but no activeBucket, try to auto-select one
      if (!session.activeBucket) {
        ensureActiveBucket(session.token);
      }
    } else {
      // No session data, just set loading to false
      setUser(null);
      setToken(null);
      setLoading(false);
    }
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
    // Automatically load and set the first bucket as active after login
    setBucketLoading(true);
    try {
      const buckets = await BucketService.fetchBuckets();
      if (buckets && buckets.length > 0) {
        const firstBucket = buckets[0];
        // Also set active credential in backend and get new token
        try {
          const res = await apiFetch('/api/auth/active_credential', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential_id: firstBucket.id }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              setToken(data.token);
              StorageManager.setToken(data.token);
            }
            const bucketInfo = {
              id: firstBucket.id,
              bucket: firstBucket.bucket,
              provider: firstBucket.provider,
              region: firstBucket.region,
              endpoint: firstBucket.endpoint,
            };
            setActiveBucket(bucketInfo);
            StorageManager.setActiveBucket(bucketInfo);
          } else {
            setActiveBucket(null);
            StorageManager.removeActiveBucket();
          }
        } catch (err) {
          // Ignore backend errors for now
          setActiveBucket(null);
          StorageManager.removeActiveBucket();
        }
      }
    } catch (err) {
      // Ignore bucket errors on login
      setActiveBucket(null);
      StorageManager.removeActiveBucket();
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

    // Show logout toast
    showToast.success('Logged out successfully');

    // Clear any potential browser state
    // Note: We don't use sessionStorage, cookies, or IndexedDB in this app
    // But this is where you'd clear them if needed

    // Force a page reload to clear any cached API responses
    // This ensures no stale data remains in memory
    window.location.href = '/';
  };

  // Register logout function with API module for automatic logout on 401
  useEffect(() => {
    setGlobalLogout(logout);
  }, []);

  const updateActiveBucket = (bucket) => {
    setActiveBucket(bucket);
    StorageManager.setActiveBucket(bucket);
  };

  const refreshActiveBucket = async () => {
    // Only make API calls if we have a valid token
    if (!token) {
      // console.log('No token available, skipping bucket refresh'); // Debug - commented for production
      return null;
    }

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

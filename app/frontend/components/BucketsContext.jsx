import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './AuthContext';

const BucketsContext = createContext();

export function BucketsProvider({ children }) {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef(null);
  const { user } = useAuth();

  const fetchBuckets = useCallback((force = false) => {
    if (cacheRef.current && !force) {
      setBuckets(cacheRef.current);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch('/api/storage/credentials')
      .then(res => res.json())
      .then(data => {
        setBuckets(data.credentials || []);
        cacheRef.current = data.credentials || [];
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      fetchBuckets();
    } else {
      setBuckets([]);
      setLoading(false);
    }
  }, [user, fetchBuckets]);

  return (
    <BucketsContext.Provider value={{ buckets, loading, fetchBuckets }}>
      {children}
    </BucketsContext.Provider>
  );
}

export function useBuckets() {
  return useContext(BucketsContext);
}
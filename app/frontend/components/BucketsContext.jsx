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
    console.log('BucketsContext: fetchBuckets called', { force, hasCache: !!cacheRef.current });
    
    if (cacheRef.current && !force) {
      console.log('BucketsContext: Using cached data');
      setBuckets(cacheRef.current);
      setLoading(false);
      return;
    }
    
    console.log('BucketsContext: Fetching from API');
    setLoading(true);
    apiFetch('/api/storage/credentials')
      .then(res => res.json())
      .then(data => {
        console.log('BucketsContext: API response received', { count: data.credentials?.length || 0 });
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
  }, [user]); // Remove fetchBuckets dependency since it's stable

  return (
    <BucketsContext.Provider value={{ buckets, loading, fetchBuckets }}>
      {children}
    </BucketsContext.Provider>
  );
}

export function useBuckets() {
  return useContext(BucketsContext);
}
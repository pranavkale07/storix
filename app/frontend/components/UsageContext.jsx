import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { UsageApi } from '../lib/usageApi';

const UsageContext = createContext();

export function UsageProvider({ children }) {
  const [usageData, setUsageData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});
  const cacheTimeoutRef = useRef({});

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchUsageForBucket = useCallback(async (credentialId, force = false) => {
    const cacheKey = `credential_${credentialId}`;
    const now = Date.now();
    const cached = cacheRef.current[cacheKey];
    
    // Return cached data if it's still valid and not forced refresh
    if (!force && cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await UsageApi.getBucketUsageStats(credentialId);
      
      // Cache the result
      cacheRef.current[cacheKey] = {
        data,
        timestamp: now
      };
      
      // Set timeout to clear cache
      if (cacheTimeoutRef.current[cacheKey]) {
        clearTimeout(cacheTimeoutRef.current[cacheKey]);
      }
      cacheTimeoutRef.current[cacheKey] = setTimeout(() => {
        delete cacheRef.current[cacheKey];
        delete cacheTimeoutRef.current[cacheKey];
      }, CACHE_DURATION);

      setUsageData(prev => ({
        ...prev,
        [credentialId]: data
      }));

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllBucketsUsage = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await UsageApi.getAllBucketsUsage();
      
      // Cache each bucket's data
      data.forEach(bucket => {
        if (bucket.usage) {
          const cacheKey = `bucket_${bucket.bucket}`;
          cacheRef.current[cacheKey] = {
            data: { stats: bucket.usage },
            timestamp: Date.now()
          };
        }
      });

      // Convert to the same format as individual bucket data
      const usageDataMap = {};
      data.forEach(bucket => {
        if (bucket.usage) {
          usageDataMap[bucket.bucket] = { stats: bucket.usage };
        }
      });

      setUsageData(usageDataMap);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBucketLimits = useCallback(async (credentialId, limits) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await UsageApi.updateBucketLimits(credentialId, limits);
      
      // Invalidate cache for this credential
      const cacheKey = `credential_${credentialId}`;
      delete cacheRef.current[cacheKey];
      if (cacheTimeoutRef.current[cacheKey]) {
        clearTimeout(cacheTimeoutRef.current[cacheKey]);
        delete cacheTimeoutRef.current[cacheKey];
      }
      
      // Refresh usage data for this credential
      await fetchUsageForBucket(credentialId, true);
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsageForBucket]);

  const invalidateCache = useCallback((credentialId = null) => {
    if (credentialId) {
      // Invalidate specific credential cache
      const cacheKey = `credential_${credentialId}`;
      delete cacheRef.current[cacheKey];
      if (cacheTimeoutRef.current[cacheKey]) {
        clearTimeout(cacheTimeoutRef.current[cacheKey]);
        delete cacheTimeoutRef.current[cacheKey];
      }
    } else {
      // Invalidate all cache
      cacheRef.current = {};
      Object.values(cacheTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
      cacheTimeoutRef.current = {};
    }
  }, []);

  const getUsageForBucket = useCallback((credentialId) => {
    return usageData[credentialId] || null;
  }, [usageData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(cacheTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <UsageContext.Provider value={{
      usageData,
      loading,
      error,
      fetchUsageForBucket,
      fetchAllBucketsUsage,
      updateBucketLimits,
      getUsageForBucket,
      invalidateCache,
      clearError
    }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
} 
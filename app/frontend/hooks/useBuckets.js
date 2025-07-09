import { useState, useEffect, useCallback } from 'react';

export default function useBuckets(refreshActiveBucket) {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [switching, setSwitching] = useState(false);

  const fetchBuckets = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/storage/credentials', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(data => setBuckets(data.credentials || []))
      .catch(() => setError('Failed to fetch buckets'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const switchBucket = async (bucketId) => {
    setSwitching(true);
    try {
      const res = await fetch('/api/auth/active_credential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ credential_id: bucketId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          await refreshActiveBucket();
        }
      }
    } finally {
      setSwitching(false);
    }
  };

  return {
    buckets,
    loading,
    error,
    refreshBuckets: fetchBuckets,
    switchBucket,
    switching,
    setBuckets,
  };
}
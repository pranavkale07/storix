import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import ConnectBucketForm from '../components/ConnectBucketForm';
import { apiFetch } from '../lib/api';
import { StorageManager } from '../lib/storage';


export default function ConnectBucket() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateActiveBucket } = useAuth();

  const handleSubmit = async (formData) => {
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/storage/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage_credential: {
            provider: formData.provider,
            access_key_id: formData.access_key_id,
            secret_access_key: formData.secret_access_key,
            region: formData.region,
            bucket: formData.bucket,
            endpoint: formData.endpoint || undefined,
            write_requests_per_month: formData.write_requests_per_month || undefined,
            read_requests_per_month: formData.read_requests_per_month || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(Array.isArray(data.errors) ? data.errors.join(', ') : data.error || 'Failed to connect bucket');
        setLoading(false);
        return;
      }

      // Update token if provided
      if (data.token) {
        StorageManager.setToken(data.token);
      }

      // Store clean bucket info (no duplicates)
      const bucketInfo = {
        id: data.id,
        bucket: formData.bucket,
        provider: formData.provider,
        region: formData.region,
        endpoint: formData.endpoint,
      };

      updateActiveBucket(bucketInfo);
      navigate('/');
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect a Bucket</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectBucketForm
            onSubmit={handleSubmit}
            loading={loading}
            errors={{ error }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
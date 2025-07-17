import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { apiFetch } from '../lib/api';
import { StorageManager } from '../lib/storage';


export default function ConnectBucket() {
  const [provider, setProvider] = useState('s3');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('');
  const [bucket, setBucket] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateActiveBucket } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/storage/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage_credential: {
            provider,
            access_key_id: accessKey,
            secret_access_key: secretKey,
            region,
            bucket,
            endpoint: endpoint || undefined,
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
        bucket,
        provider,
        region,
        endpoint,
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
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="provider">Provider</Label>
              <select
                id="provider"
                className="w-full border rounded px-2 py-1 mt-1 bg-background"
                value={provider}
                onChange={e => setProvider(e.target.value)}
              >
                <option value="s3">AWS S3</option>
                <option value="do_spaces">DigitalOcean Spaces</option>
              </select>
            </div>
            <div>
              <Label htmlFor="accessKey">Access Key</Label>
              <Input id="accessKey" value={accessKey} onChange={e => setAccessKey(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input id="secretKey" value={secretKey} onChange={e => setSecretKey(e.target.value)} required type="password" />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" value={region} onChange={e => setRegion(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="bucket">Bucket Name</Label>
              <Input id="bucket" value={bucket} onChange={e => setBucket(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="endpoint">Endpoint (optional)</Label>
              <Input id="endpoint" value={endpoint} onChange={e => setEndpoint(e.target.value)} />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
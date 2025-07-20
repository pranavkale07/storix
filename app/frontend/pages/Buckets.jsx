import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useBuckets } from '../components/BucketsContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { apiFetch } from '../lib/api';
import { Trash2, Edit, Plus, BarChart3, CheckCircle } from 'lucide-react';
import ConnectBucketForm from '../components/ConnectBucketForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { BucketService } from '../lib/bucketService';
import { validateBucketFields } from '../lib/validateBucketFields';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../components/utils/toast';
import Header from '../components/Header';
import { Skeleton } from '../components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function Buckets() {
  const { activeBucket, refreshActiveBucket } = useAuth();
  const { buckets, loading: bucketsLoading, fetchBuckets } = useBuckets();
  const navigate = useNavigate();
  
  const [editingBucket, setEditingBucket] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    access_key_id: '',
    secret_access_key: '',
    region: '',
    endpoint: '',
    bucket: '',
    provider: 's3',
  });
  const [formErrors, setFormErrors] = useState({});
  const [pendingDisconnectId, setPendingDisconnectId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      await fetchBuckets(true);
    } catch (error) {
      console.error('Error fetching buckets:', error);
      showToast.error('Failed to fetch buckets', error.message);
    }
  };

  const handleDisconnect = async (bucketId) => {
    setPendingDisconnectId(bucketId);
  };

  const confirmDisconnect = async () => {
    if (!pendingDisconnectId) return;
    try {
      const response = await apiFetch(`/api/storage/credentials/${pendingDisconnectId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchBuckets(true);
        if (activeBucket && activeBucket.id === pendingDisconnectId) {
          await refreshActiveBucket();
        }
        showToast.success('Bucket disconnected successfully');
      } else {
        const errorData = await response.json();
        let errorMessage = 'Failed to disconnect bucket';
        const errorText = errorData.errors ? errorData.errors.join(', ') : errorData.error || '';
        if (errorText) {
          const errorLower = errorText.toLowerCase();
          if (errorLower.includes('credentials') || errorLower.includes('access') ||
              errorLower.includes('invalid') || errorLower.includes('auth') ||
              errorLower.includes('unauthorized') || errorLower.includes('forbidden') ||
              errorLower.includes('signature') || errorLower.includes('key') ||
              errorLower.includes('credential validation failed')) {
            errorMessage = 'Invalid credentials. Please check your access key and secret key.';
          } else if (errorLower.includes('bucket') || errorLower.includes('not found') ||
                     errorLower.includes('no such bucket') || errorLower.includes('does not exist') ||
                     errorLower.includes('specified bucket does not exist')) {
            errorMessage = 'Bucket not found. Please check the bucket name and region.';
          } else if (errorLower.includes('permission') || errorLower.includes('denied') ||
                     errorLower.includes('forbidden') || errorLower.includes('unauthorized')) {
            errorMessage = 'Permission denied. Please check your credentials and bucket permissions.';
          } else if (errorLower.includes('region') || errorLower.includes('endpoint')) {
            errorMessage = 'Invalid region or endpoint. Please check your configuration.';
          } else {
            errorMessage = errorText;
          }
        }
        showToast.error('Failed to disconnect bucket', errorMessage);
      }
    } catch (error) {
      console.error('Error disconnecting bucket:', error);
      showToast.error('Failed to disconnect bucket', 'Network error');
    } finally {
      setPendingDisconnectId(null);
    }
  };

  const handleEdit = (bucket) => {
    setEditingBucket(bucket);
    setFormData({
      access_key_id: bucket.access_key_id || '',
      secret_access_key: bucket.secret_access_key || '',
      region: bucket.region || '',
      endpoint: bucket.endpoint || '',
      bucket: bucket.bucket || '',
      provider: bucket.provider || 's3',
    });
    setShowAddForm(true);
  };



  const resetForm = () => {
    setFormData({
      access_key_id: '',
      secret_access_key: '',
      region: '',
      endpoint: '',
      bucket: '',
      provider: 's3',
    });
    setFormErrors({});
    setEditingBucket(null);
    setShowAddForm(false);
  };

  const isActiveBucket = (bucket) => {
    return activeBucket && activeBucket.id === bucket.id;
  };



  if (bucketsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Manage Buckets</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Buckets</CardTitle>
              <Dialog open={showAddForm} onOpenChange={open => { if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    disabled={showAddForm}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Bucket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingBucket ? 'Edit Bucket' : 'Connect New Bucket'}</DialogTitle>
                  </DialogHeader>
                  <ConnectBucketForm
                    initialValues={formData}
                    onSubmit={async (data) => {
                      const submitData = { ...data };
                      if (submitData.provider === 'digitalocean') {
                        submitData.provider = 'do_spaces';
                        if (!submitData.endpoint) {
                          submitData.endpoint = `https://${submitData.region}.digitaloceanspaces.com`;
                        }
                      }
                      const url = editingBucket
                        ? `/api/storage/credentials/${editingBucket.id}`
                        : '/api/storage/credentials';
                      const method = editingBucket ? 'PUT' : 'POST';
                      setLoading(true);
                      try {
                        const response = await apiFetch(url, {
                          method,
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ storage_credential: submitData }),
                        });
                        if (response.ok) {
                          await fetchBuckets(true);
                          resetForm();
                          if (!editingBucket) {
                            const data = await response.json();
                            if (data.credential && data.credential.id) {
                              await BucketService.setActiveBucket(data.credential.id);
                              await refreshActiveBucket();
                            } else if (data.id) {
                              await BucketService.setActiveBucket(data.id);
                              await refreshActiveBucket();
                            } else {
                              await refreshActiveBucket();
                            }
                          }
                          setFormErrors({});
                          showToast.success(editingBucket ? 'Bucket updated successfully' : 'Bucket connected successfully');
                        } else {
                          const errorData = await response.json();
                          let errorMessage = 'Failed to save bucket';
                          const errorText = errorData.errors ? errorData.errors.join(', ') : errorData.error || '';
                          if (errorText) {
                            const errorLower = errorText.toLowerCase();
                            if (errorLower.includes('credentials') || errorLower.includes('access') ||
                                errorLower.includes('invalid') || errorLower.includes('auth') ||
                                errorLower.includes('unauthorized') || errorLower.includes('forbidden') ||
                                errorLower.includes('signature') || errorLower.includes('key') ||
                                errorLower.includes('credential validation failed')) {
                              errorMessage = 'Invalid credentials. Please check your access key and secret key.';
                            } else if (errorLower.includes('bucket') || errorLower.includes('not found') ||
                                       errorLower.includes('no such bucket') || errorLower.includes('does not exist') ||
                                       errorLower.includes('specified bucket does not exist')) {
                              errorMessage = 'Bucket not found. Please check the bucket name and region.';
                            } else if (errorLower.includes('permission') || errorLower.includes('denied') ||
                                       errorLower.includes('forbidden') || errorLower.includes('unauthorized')) {
                              errorMessage = 'Permission denied. Please check your credentials and bucket permissions.';
                            } else if (errorLower.includes('region') || errorLower.includes('endpoint')) {
                              errorMessage = 'Invalid region or endpoint. Please check your configuration.';
                            } else {
                              errorMessage = errorText;
                            }
                          }
                          setFormErrors({ error: errorMessage });
                          showToast.error('Failed to save bucket', errorMessage);
                        }
                      } catch (error) {
                        console.error('Error saving bucket:', error);
                        const errorMessage = 'Network error. Please check your connection.';
                        setFormErrors({ error: errorMessage });
                        showToast.error('Failed to save bucket', errorMessage);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onCancel={resetForm}
                    loading={loading}
                    errors={formErrors}
                    editing={!!editingBucket}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-6 w-32 rounded" />
                      <Skeleton className="h-5 w-16 rounded" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-4 w-48 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : buckets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No buckets connected.</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Your First Bucket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {buckets.map((bucket) => (
                  <div
                    key={bucket.id}
                    className={`p-4 border rounded-lg ${
                      isActiveBucket(bucket)
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold">{bucket.bucket}</h3>
                          {isActiveBucket(bucket) && (
                            <Badge variant="default">
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Provider: {bucket.provider}</p>
                          <p>Region: {bucket.region}</p>
                          {bucket.endpoint && <p>Endpoint: {bucket.endpoint}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            // Set this bucket as active and navigate to usage
                            await BucketService.setActiveBucket(bucket.id);
                            await refreshActiveBucket(); // Ensure active bucket is refreshed
                            navigate('/usage');
                          }}
                          title="View Usage Analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(bucket)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(bucket.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>



        {/* Disconnect Confirmation Dialog */}
        <ConfirmDialog
          open={!!pendingDisconnectId}
          onOpenChange={(open) => !open && setPendingDisconnectId(null)}
          title="Disconnect Bucket"
          description="Are you sure you want to disconnect this bucket? This action cannot be undone."
          onConfirm={confirmDisconnect}
          confirmText="Disconnect"
          variant="destructive"
        />
      </main>
    </div>
  );
}
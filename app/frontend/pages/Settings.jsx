import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';

import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { apiFetch } from '../lib/api';
import { Settings as SettingsIcon, Trash2, Edit, Plus } from 'lucide-react';
import ConnectBucketForm from '../components/ConnectBucketForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { BucketService } from '../lib/bucketService';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { validateBucketFields } from '../lib/validateBucketFields';
import ConfirmDialog from '../components/ConfirmDialog';
import { Badge } from '../components/ui/badge';
import { showToast } from '../components/utils/toast';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';

function formatMemberSince(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function ProviderLogo({ provider }) {
  if (provider === 'google_oauth2') {
    return (
      <svg className="inline h-5 w-5 mr-1 align-text-bottom" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    );
  } else if (provider === 'github') {
    return (
      <svg className="inline h-5 w-5 mr-1 align-text-bottom" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    );
  }
  return null;
}

export default function Settings() {
  const { user, logout, activeBucket, refreshActiveBucket } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        logout();
      } else {
        alert('Failed to delete account.');
      }
    } catch (e) {
      alert('Network error.');
    }
    setDeleting(false);
  };

  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch buckets on component mount
  useEffect(() => {
    fetchBuckets();
  }, []);

  const fetchBuckets = async () => {
    try {
      const response = await apiFetch('/api/storage/credentials');
      if (response.ok) {
        const data = await response.json();
        setBuckets(data.credentials || []);
      } else {
        console.error('Failed to fetch buckets');
      }
    } catch (error) {
      console.error('Error fetching buckets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = validateBucketFields(formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const submitData = { ...formData };
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
      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storage_credential: submitData }),
      });
      if (response.ok) {
        await fetchBuckets();
        resetForm();
        if (!editingBucket) {
          const data = await response.json();
          if (data.credential) {
            await refreshActiveBucket();
          }
        }
        showToast.success(editingBucket ? 'Bucket updated successfully' : 'Bucket added successfully');
      } else {
        const errorData = await response.json();
        let errorMessage = 'Failed to save bucket';
        
        // Backend returns errors in an array, not a single error field
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
        showToast.error('Failed to save bucket', errorMessage);
      }
    } catch (error) {
      console.error('Error saving bucket:', error);
      showToast.error('Failed to save bucket', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (bucketId) => {
    setPendingDisconnectId(bucketId);
  };

  const confirmDisconnect = async () => {
    if (!pendingDisconnectId) return;
    setLoading(true);
    try {
      const response = await apiFetch(`/api/storage/credentials/${pendingDisconnectId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchBuckets();
        if (activeBucket && activeBucket.id === pendingDisconnectId) {
          await refreshActiveBucket();
        }
        showToast.success('Bucket disconnected successfully');
      } else {
        const errorData = await response.json();
        let errorMessage = 'Failed to disconnect bucket';
        
        // Backend returns errors in an array, not a single error field
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
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <Header showBackToFiles />

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-8 px-6">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Buckets Section */}
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
                          await fetchBuckets();
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
              <div className="text-center py-8">
                <LoadingSpinner message="Loading buckets..." />
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
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{bucket.bucket}</h3>
                          {isActiveBucket(bucket) && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Provider: {bucket.provider}</p>
                          <p>Region: {bucket.region}</p>
                          {bucket.endpoint && <p>Endpoint: {bucket.endpoint}</p>}
                          <p>Access Key: {bucket.access_key_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
      </main>
      {/* ConfirmDialog for Disconnect Bucket */}
      <ConfirmDialog
        open={!!pendingDisconnectId}
        onOpenChange={open => { if (!open) setPendingDisconnectId(null); }}
        title="Disconnect Bucket"
        description="Are you sure you want to disconnect this bucket? This action cannot be undone."
        confirmLabel="Disconnect"
        onConfirm={confirmDisconnect}
        loading={loading}
      />
    </div>
  );
}
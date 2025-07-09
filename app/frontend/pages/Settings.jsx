import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { apiFetch } from '../lib/api';
import { Settings as SettingsIcon, Trash2, Edit, Plus, Save, X } from 'lucide-react';
import ConnectBucketForm from '../components/ConnectBucketForm';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { BucketService } from '../lib/bucketService';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import useBuckets from '../hooks/useBuckets';
import { validateBucketFields } from '../lib/validateBucketFields';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/ui/alert-dialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { Badge } from '../components/ui/badge';

export default function Settings() {
  const { user, logout, activeBucket, refreshActiveBucket } = useAuth();
  const navigate = useNavigate();

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
      let submitData = { ...formData };
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
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save bucket');
      }
    } catch (error) {
      console.error('Error saving bucket:', error);
      alert('Failed to save bucket');
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
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to disconnect bucket');
      }
    } catch (error) {
      console.error('Error disconnecting bucket:', error);
      alert('Failed to disconnect bucket');
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
                      let submitData = { ...data };
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
                        } else {
                          const errorData = await response.json();
                          setFormErrors({ error: errorData.error || 'Failed to save bucket' });
                        }
                      } catch (error) {
                        console.error('Error saving bucket:', error);
                        setFormErrors({ error: 'Failed to save bucket' });
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

        {/* User Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Email address cannot be changed
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </div>
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
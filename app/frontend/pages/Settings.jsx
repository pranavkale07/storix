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

export default function Settings() {
  const { user, logout, activeBucket, refreshActiveBucket } = useAuth();
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCredential, setEditingCredential] = useState(null);
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

  // Fetch credentials on component mount
  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await apiFetch('/api/storage/credentials');
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials || []);
      } else {
        console.error('Failed to fetch credentials');
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.access_key_id.trim()) errors.access_key_id = 'Access Key ID is required';
    if (!formData.secret_access_key.trim()) errors.secret_access_key = 'Secret Access Key is required';
    if (!formData.bucket.trim()) errors.bucket = 'Bucket name is required';
    if (!formData.region.trim()) errors.region = 'Region is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = editingCredential
        ? `/api/storage/credentials/${editingCredential.id}`
        : '/api/storage/credentials';

      const method = editingCredential ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCredentials();
        resetForm();
        if (!editingCredential) {
          // If this is a new credential, set it as active
          const data = await response.json();
          if (data.credential) {
            await refreshActiveBucket();
          }
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save credential');
      }
    } catch (error) {
      console.error('Error saving credential:', error);
      alert('Failed to save credential');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (credentialId) => {
    if (!confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`/api/storage/credentials/${credentialId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCredentials();
        // If we deleted the active bucket, refresh it
        if (activeBucket && activeBucket.id === credentialId) {
          await refreshActiveBucket();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete credential');
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
      alert('Failed to delete credential');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (credential) => {
    setEditingCredential(credential);
    setFormData({
      access_key_id: credential.access_key_id || '',
      secret_access_key: credential.secret_access_key || '',
      region: credential.region || '',
      endpoint: credential.endpoint || '',
      bucket: credential.bucket || '',
      provider: credential.provider || 's3',
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
    setEditingCredential(null);
    setShowAddForm(false);
  };

  const isActiveBucket = (credential) => {
    return activeBucket && activeBucket.id === credential.id;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="text-xl font-bold tracking-tight">Storix</div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            ← Back to Files
          </Button>
          {user && <span className="text-sm text-muted-foreground">{user.email}</span>}
          {user && <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-8 px-6">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Storage Credentials Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Storage Credentials</CardTitle>
              <Button
                onClick={() => setShowAddForm(true)}
                disabled={showAddForm}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading credentials...</p>
              </div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No storage credentials found.</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Credential
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className={`p-4 border rounded-lg ${
                      isActiveBucket(credential)
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{credential.bucket}</h3>
                          {isActiveBucket(credential) && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Provider: {credential.provider}</p>
                          <p>Region: {credential.region}</p>
                          {credential.endpoint && <p>Endpoint: {credential.endpoint}</p>}
                          <p>Access Key: {credential.access_key_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(credential)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(credential.id)}
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

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingCredential ? 'Edit Credential' : 'Add New Credential'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Select
                      value={formData.provider}
                      onValueChange={(value) => handleInputChange('provider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s3">AWS S3</SelectItem>
                        <SelectItem value="digitalocean">DigitalOcean Spaces</SelectItem>
                        <SelectItem value="custom">Custom S3-Compatible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bucket">Bucket Name</Label>
                    <Input
                      id="bucket"
                      value={formData.bucket}
                      onChange={(e) => handleInputChange('bucket', e.target.value)}
                      placeholder="my-bucket-name"
                      className={formErrors.bucket ? 'border-destructive' : ''}
                    />
                    {formErrors.bucket && (
                      <p className="text-sm text-destructive mt-1">{formErrors.bucket}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="access_key_id">Access Key ID</Label>
                    <Input
                      id="access_key_id"
                      value={formData.access_key_id}
                      onChange={(e) => handleInputChange('access_key_id', e.target.value)}
                      placeholder="AKIA..."
                      className={formErrors.access_key_id ? 'border-destructive' : ''}
                    />
                    {formErrors.access_key_id && (
                      <p className="text-sm text-destructive mt-1">{formErrors.access_key_id}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="secret_access_key">Secret Access Key</Label>
                    <Input
                      id="secret_access_key"
                      type="password"
                      value={formData.secret_access_key}
                      onChange={(e) => handleInputChange('secret_access_key', e.target.value)}
                      placeholder="••••••••"
                      className={formErrors.secret_access_key ? 'border-destructive' : ''}
                    />
                    {formErrors.secret_access_key && (
                      <p className="text-sm text-destructive mt-1">{formErrors.secret_access_key}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      placeholder="e.g., us-east-1, eu-west-1, ap-southeast-1"
                      className={formErrors.region ? 'border-destructive' : ''}
                    />
                    {formErrors.region && (
                      <p className="text-sm text-destructive mt-1">{formErrors.region}</p>
                    )}
                  </div>

                  {(formData.provider === 'digitalocean' || formData.provider === 'custom') && (
                    <div>
                      <Label htmlFor="endpoint">Endpoint (Optional)</Label>
                      <Input
                        id="endpoint"
                        value={formData.endpoint}
                        onChange={(e) => handleInputChange('endpoint', e.target.value)}
                        placeholder="https://nyc3.digitaloceanspaces.com"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingCredential ? 'Update' : 'Save'} Credential
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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
    </div>
  );
}
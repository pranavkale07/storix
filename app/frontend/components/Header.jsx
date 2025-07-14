import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import ConnectBucketForm from './ConnectBucketForm';
import { BucketService } from '../lib/bucketService';
import { Share2, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import useBuckets from '../hooks/useBuckets';
import { showToast } from '../lib/toast';

export default function Header({ showShareLinks, showSettings, showBackToFiles }) {
  const { user, logout, activeBucket, refreshActiveBucket } = useAuth();
  const navigate = useNavigate();

  const {
    buckets,
    loading: bucketsLoading,
    error: bucketsError,
    refreshBuckets,
    switchBucket,
    switching,
    setBuckets,
  } = useBuckets(refreshActiveBucket);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectErrors, setConnectErrors] = useState({});
  const [connectInitialValues, setConnectInitialValues] = useState({});
  const [editing, setEditing] = useState(false);

  const handleSwitchBucket = (bucketId) => {
    if (bucketId === 'add_new') {
      setShowConnectDialog(true);
      setConnectInitialValues({});
      setEditing(false);
      return;
    }
    switchBucket(bucketId);
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
      <div className="text-xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>Storix</div>
      <div className="flex items-center gap-4">
        {/* Bucket Switcher */}
        {activeBucket ? (
          <Select
            value={activeBucket.id}
            onValueChange={handleSwitchBucket}
            disabled={switching}
          >
            <SelectTrigger className="w-48">
              <SelectValue>{`Bucket: ${activeBucket.bucket}`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {buckets.map(bucket => (
                <SelectItem key={bucket.id} value={bucket.id}>
                  {bucket.bucket} ({bucket.provider})
                </SelectItem>
              ))}
              <SelectItem value="add_new" className="text-primary font-semibold">+ Connect new bucket</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <button className="btn btn-outline btn-sm" onClick={() => setShowConnectDialog(true)}>Connect Bucket</button>
        )}
        {/* Navigation Buttons */}
        {showBackToFiles && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}> <ArrowLeft className="h-4 w-4 mr-1" /> Back to Files </Button>
        )}
        {showShareLinks && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/share-links')} title="Share Links">
            <Share2 className="h-4 w-4" />
          </Button>
        )}
        {showSettings && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} title="Settings">
            <SettingsIcon className="h-4 w-4" />
          </Button>
        )}
        {/* User Info & Logout */}
        {user && <span className="text-sm text-muted-foreground">{user.email}</span>}
        {user && <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>}
      </div>
      {/* Connect Bucket Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={open => { if (!open) setShowConnectDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect a Bucket</DialogTitle>
          </DialogHeader>
          <ConnectBucketForm
            initialValues={connectInitialValues}
            onSubmit={async (data) => {
              setConnectLoading(true);
              setConnectErrors({});
              const submitData = { ...data };
              if (submitData.provider === 'digitalocean') {
                submitData.provider = 'do_spaces';
                if (!submitData.endpoint) {
                  submitData.endpoint = `https://${submitData.region}.digitaloceanspaces.com`;
                }
              }
              try {
                const res = await fetch('/api/storage/credentials', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  },
                  body: JSON.stringify({ storage_credential: submitData }),
                });
                const result = await res.json();
                if (!res.ok) {
                  // Handle specific error cases
                  let errorMessage = 'Failed to connect bucket';
                  
                  // Backend returns errors in an array, not a single error field
                  const errorText = result.errors ? result.errors.join(', ') : result.error || '';
                  
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
                  setConnectErrors({ error: errorMessage });
                  showToast.error('Failed to connect bucket', errorMessage);
                  return;
                }
                // Set the new bucket as active and wait for state update before closing dialog
                const newBucketId = result.credential?.id || result.id;
                if (newBucketId) {
                  await BucketService.setActiveBucket(newBucketId);
                  await refreshActiveBucket();
                } else {
                  await refreshActiveBucket();
                }
                // Refresh buckets list
                refreshBuckets();
                setShowConnectDialog(false);
                showToast.success('Bucket connected successfully');
              } catch (err) {
                const errorMessage = 'Network error. Please check your connection.';
                setConnectErrors({ error: errorMessage });
                showToast.error('Failed to connect bucket', errorMessage);
              } finally {
                setConnectLoading(false);
              }
            }}
            onCancel={() => setShowConnectDialog(false)}
            loading={connectLoading}
            errors={connectErrors}
            editing={editing}
          />
        </DialogContent>
      </Dialog>
    </header>
  );
}
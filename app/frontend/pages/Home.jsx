import React from 'react';
import { useAuth } from '../components/AuthContext';
import FileManager from '../components/FileManager';
import AuthLanding from '../components/AuthLanding';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import ConnectBucketForm from '../components/ConnectBucketForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { BucketService } from '../lib/bucketService';
import Header from '../components/Header';
import { useBuckets } from '../components/BucketsContext';
import { showToast } from '../components/utils/toast';
import { Skeleton } from '../components/ui/skeleton';
import { apiFetch } from '../lib/api';
import { useState } from 'react';

export default function Home() {
  const { user, loading, activeBucket, bucketLoading, refreshActiveBucket } = useAuth();

  // Use BucketsContext for bucket data
  const { buckets, loading: bucketsLoading, fetchBuckets } = useBuckets();
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectErrors, setConnectErrors] = useState({});
  const [connectInitialValues] = React.useState({});
  const [editing] = React.useState(false);

  // Debug logging
  console.log('Home component state:', {
    user: !!user,
    loading,
    bucketLoading,
    bucketsLoading,
    bucketsCount: buckets?.length || 0,
    activeBucket: !!activeBucket
  });

  const handleDialogOpenChange = (open) => {
    if (!open) {
      setShowConnectDialog(false);
      setConnectErrors({}); // clear errors only on close
      setConnectLoading(false);
    }
  };

  // Show loading spinner while checking authentication, bucket loading, or buckets loading
  // But only if we don't already know there are no buckets
  if ((loading || bucketLoading || bucketsLoading) && (!buckets || buckets.length > 0)) {
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

  // Show auth landing page for unauthenticated users
  if (!user) {
    return <AuthLanding />;
  }

  // Show 'No buckets connected' message if user has no buckets
  if (buckets && buckets.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header showShareLinks showSettings />
        <main className="flex justify-center items-start min-h-[80vh] py-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No Buckets Connected</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground text-center">No buckets connected. Connect a bucket to get started.</div>
              <Button onClick={() => setShowConnectDialog(true)}>Connect Bucket</Button>
            </CardContent>
          </Card>
        </main>
        {/* The connect bucket dialog and form are rendered below, shared with the main render */}
        {/* ... existing dialog and form code ... */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <Header showShareLinks showSettings />
      {/* Main content */}
      <main className="flex justify-center items-start min-h-[80vh] py-12">
        {activeBucket ? (
          <div className="w-full max-w-7xl px-4">
            <FileManager activeBucket={activeBucket} />
          </div>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No Bucket Connected</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground text-center">You need to connect a storage bucket to view and manage your files.</div>
              <Button onClick={() => setShowConnectDialog(true)}>Connect Bucket</Button>
            </CardContent>
          </Card>
        )}
      </main>
      {/* The connect bucket dialog and form are rendered below, shared with the 'no buckets' case */}
      <Dialog open={showConnectDialog} onOpenChange={handleDialogOpenChange}>
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
                const res = await apiFetch('/api/storage/credentials', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ storage_credential: submitData }),
                });
                const result = await res.json();
                if (!res.ok) {
                  // Handle specific error cases
                  let errorMessage = 'Failed to connect bucket';
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
                const newBucketId = result.credential?.id || result.id;
                if (newBucketId) {
                  await BucketService.setActiveBucket(newBucketId);
                  await refreshActiveBucket();
                } else {
                  await refreshActiveBucket();
                }
                fetchBuckets(); // Use fetchBuckets from context
                setShowConnectDialog(false);
                setConnectErrors({}); // clear errors on success
                showToast.success('Bucket connected successfully');
              } catch {
                const errorMessage = 'Network error. Please check your connection.';
                setConnectErrors({ error: errorMessage });
                showToast.error('Failed to connect bucket', errorMessage);
              } finally {
                setConnectLoading(false);
              }
            }}
            onCancel={() => {
              setShowConnectDialog(false);
              setConnectErrors({});
              setConnectLoading(false);
            }}
            loading={connectLoading}
            errors={connectErrors}
            editing={editing}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
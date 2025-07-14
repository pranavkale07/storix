import React from 'react';
import { useAuth } from '../components/AuthContext';
import FileManager from '../components/FileManager';
import AuthLanding from '../components/AuthLanding';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import ConnectBucketForm from '../components/ConnectBucketForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { BucketService } from '../lib/bucketService';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import useBuckets from '../hooks/useBuckets';
import { showToast } from '../lib/toast';

export default function Home() {
  const { user, loading, activeBucket, bucketLoading, refreshActiveBucket } = useAuth();

  const {
    refreshBuckets,
    switchBucket,
  } = useBuckets(refreshActiveBucket);
  const [showConnectDialog, setShowConnectDialog] = React.useState(false);
  const [connectLoading, setConnectLoading] = React.useState(false);
  const [connectErrors, setConnectErrors] = React.useState({});
  const [connectInitialValues, setConnectInitialValues] = React.useState({});
  const [editing, setEditing] = React.useState(false);

  const handleDialogOpenChange = (open) => {
    if (!open) {
      setShowConnectDialog(false);
      setConnectErrors({}); // clear errors only on close
      setConnectLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  // Show auth landing page for unauthenticated users
  if (!user) {
    return <AuthLanding />;
  }

  // Show loading spinner while loading bucket (but only if user is authenticated)
  if (bucketLoading && user) {
    return (
      <div className="min-h-screen bg-background">
        <Header showShareLinks showSettings />
        <main className="flex justify-center items-center min-h-[80vh]">
          <LoadingSpinner message="Loading your storage..." />
        </main>
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
          <FileManager activeBucket={activeBucket} />
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
                const newBucketId = result.credential?.id || result.id;
                if (newBucketId) {
                  await BucketService.setActiveBucket(newBucketId);
                  await refreshActiveBucket();
                } else {
                  await refreshActiveBucket();
                }
                refreshBuckets();
                setShowConnectDialog(false);
                setConnectErrors({}); // clear errors on success
                showToast.success('Bucket connected successfully');
              } catch (err) {
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
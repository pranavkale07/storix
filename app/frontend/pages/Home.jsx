import React from 'react';
import { useAuth } from '../components/AuthContext';
import FileManager from '../components/FileManager';
import AuthLanding from '../components/AuthLanding';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, Share2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import ConnectBucketForm from '../components/ConnectBucketForm';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { BucketService } from '../lib/bucketService';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import useBuckets from '../hooks/useBuckets';

export default function Home() {
  const { user, logout, loading, activeBucket, bucketLoading, refreshActiveBucket } = useAuth();
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
  const [showConnectDialog, setShowConnectDialog] = React.useState(false);
  const [connectLoading, setConnectLoading] = React.useState(false);
  const [connectErrors, setConnectErrors] = React.useState({});
  const [connectInitialValues, setConnectInitialValues] = React.useState({});
  const [editing, setEditing] = React.useState(false);

  // Handle bucket switch or add new bucket
  const handleSwitchBucket = async (bucketId) => {
    if (bucketId === 'add_new') {
      setShowConnectDialog(true);
      setConnectInitialValues({});
      setEditing(false);
      return;
    }
    switchBucket(bucketId);
  };

  const handleRefreshBucket = async () => {
    await refreshActiveBucket();
  };

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

  // Show loading spinner while loading bucket
  if (bucketLoading) {
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
              let submitData = { ...data };
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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify({ storage_credential: submitData })
                });
                const result = await res.json();
                if (!res.ok) {
                  setConnectErrors(result.errors || { error: result.error || 'Failed to connect bucket' });
                  return;
                }
                let newBucketId = result.credential?.id || result.id;
                if (newBucketId) {
                  await BucketService.setActiveBucket(newBucketId);
                  await refreshActiveBucket();
                } else {
                  await refreshActiveBucket();
                }
                refreshBuckets();
                setShowConnectDialog(false);
                setConnectErrors({}); // clear errors on success
              } catch (err) {
                setConnectErrors({ error: 'Network error' });
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
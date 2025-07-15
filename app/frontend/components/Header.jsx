import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import ConnectBucketForm from './ConnectBucketForm';
import { BucketService } from '../lib/bucketService';
import { Share2, Settings as SettingsIcon, ArrowLeft, User2, FolderCog, Link2, LogOut } from 'lucide-react';
import useBuckets from '../hooks/useBuckets';
import { showToast } from './utils/toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from './ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSwitchBucket = (bucketId) => {
    if (bucketId === 'add_new') {
      setShowConnectDialog(true);
      setConnectInitialValues({});
      setEditing(false);
      return;
    }
    switchBucket(bucketId);
  };

  function formatMemberSince(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  function ProviderLogo({ provider }) {
    if (provider === 'google_oauth2') {
      return (
        <svg className="inline h-4 w-4 mr-1 align-text-bottom" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      );
    } else if (provider === 'github') {
      return (
        <svg className="inline h-4 w-4 mr-1 align-text-bottom" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      );
    }
    return null;
  }

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
              <SelectValue>{`${activeBucket.bucket}`}</SelectValue>
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate('/buckets')}>
                <FolderCog className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage Buckets</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate('/shared-links')}>
                <Link2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage Shared Links</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate('/account')}>
                <User2 className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Account</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
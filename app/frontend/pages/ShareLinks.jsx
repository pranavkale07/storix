import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { apiFetch } from '../lib/api';
import {
  Share2,
  Copy,
  Trash2,
  Calendar,
  Clock,
  ExternalLink,
  Edit,
  Folder,
  Link2,
} from 'lucide-react';
import ConnectBucketForm from '../components/ConnectBucketForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { BucketService } from '../lib/bucketService';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { Badge } from '../components/ui/badge';
import useBuckets from '../hooks/useBuckets';
import { showToast } from '../components/utils/toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

export default function ShareLinks() {
  const { activeBucket, refreshActiveBucket } = useAuth();

  const {
    switchBucket,
    refreshBuckets,
  } = useBuckets(refreshActiveBucket);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectErrors, setConnectErrors] = useState({});
  const [connectInitialValues, setConnectInitialValues] = useState({});
  const [editing, setEditing] = useState(false);
  const [shareLinks, setShareLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(null);
  const [pendingRevokeId, setPendingRevokeId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  
  // Edit modal state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [editDuration, setEditDuration] = useState(1);
  const [editUnit, setEditUnit] = useState('hour');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch share links on component mount and whenever activeBucket changes
  useEffect(() => {
    if (activeBucket) {
      fetchShareLinks();
    }
  }, [activeBucket]);

  const fetchShareLinks = async () => {
    try {
      const response = await apiFetch('/api/storage/share_links');
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.share_links || []);
      } else {
        console.error('Failed to fetch share links');
      }
    } catch (error) {
      console.error('Error fetching share links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchBucket = async (bucketId) => {
    if (bucketId === 'add_new') {
      setShowConnectDialog(true);
      setConnectInitialValues({});
      setEditing(false);
      return;
    }
    switchBucket(bucketId);
  };


  const handleRevokeLink = async (linkId) => {
    setPendingRevokeId(linkId);
  };

  const confirmRevokeLink = async () => {
    if (!pendingRevokeId) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/storage/revoke_share_link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: pendingRevokeId }),
      });
      if (response.ok) {
        await fetchShareLinks();
        showToast.success('Share link revoked successfully');
      } else {
        const errorData = await response.json();
        showToast.error('Failed to revoke share link', errorData.error);
      }
    } catch (error) {
      console.error('Error revoking share link:', error);
      showToast.error('Failed to revoke share link', 'Network error');
    } finally {
      setLoading(false);
      setPendingRevokeId(null);
    }
  };

  const handleDeleteLink = async (linkId) => {
    setPendingDeleteId(linkId);
  };

  const confirmDeleteLink = async () => {
    if (!pendingDeleteId) return;
    setLoading(true);
    try {
      const response = await apiFetch(`/api/storage/share_links/${pendingDeleteId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchShareLinks();
        showToast.success('Share link deleted successfully');
      } else {
        const errorData = await response.json();
        showToast.error('Failed to delete share link', errorData.error);
      }
    } catch (error) {
      console.error('Error deleting share link:', error);
      showToast.error('Failed to delete share link', 'Network error');
    } finally {
      setLoading(false);
      setPendingDeleteId(null);
    }
  };

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/share_links/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(token);
    showToast.success('Link copied to clipboard');
    setTimeout(() => setCopiedLink(null), 1500);
  };

  const handleEditLink = (link) => {
    setEditingLink(link);
    setEditDuration(1);
    setEditUnit('hour');
    setEditError('');
    setShowEditDialog(true);
  };

  const handleUpdateLink = async () => {
    if (!editingLink) return;
    
    setEditLoading(true);
    setEditError('');
    
    try {
      // Convert duration/unit to seconds
      let expiresInSeconds = 0;
      if (editUnit === 'minute') expiresInSeconds = editDuration * 60;
      else if (editUnit === 'hour') expiresInSeconds = editDuration * 3600;
      
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + expiresInSeconds);
      
      const response = await apiFetch(`/api/storage/share_links/${editingLink.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expires_at: newExpiresAt.toISOString() }),
      });
      
      if (response.ok) {
        await fetchShareLinks();
        showToast.success('Share link updated successfully');
        setShowEditDialog(false);
      } else {
        const errorData = await response.json();
        setEditError(errorData.error || 'Failed to update share link');
        showToast.error('Failed to update share link', errorData.error);
      }
    } catch (error) {
      console.error('Error updating share link:', error);
      setEditError('Network error');
      showToast.error('Failed to update share link', 'Network error');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusBadge = (link) => {
    if (link.revoked) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const formatExpiration = (expiresAt) => {
    if (!expiresAt) return 'Never';
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date - now;

    if (diffMs <= 0) return 'Expired';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
    } else {
      return 'Less than 1 hour remaining';
    }
  };

  const getFileIcon = (key) => {
    const extension = key.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return '🖼️';
    } else if (['pdf'].includes(extension)) {
      return '📄';
    } else if (['mp4', 'avi', 'mov', 'webm'].includes(extension)) {
      return '🎥';
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return '🎵';
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return '📦';
    } else {
      return <Folder className="inline w-4 h-4 align-text-bottom" />;
    }
  };

  const handleDialogOpenChange = (open) => {
    if (!open) {
      setShowConnectDialog(false);
      setConnectErrors({}); // clear errors only on close
      setConnectLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <Header showBackToFiles />
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
                  setConnectErrors(result.errors || { error: result.error || 'Failed to connect bucket' });
                  return;
                }
                const newBucketId = result.credential?.id || result.id;
                if (newBucketId) {
                  await BucketService.setActiveBucket(newBucketId);
                  await refreshActiveBucket();
                } else {
                  await refreshActiveBucket();
                }
                setShowConnectDialog(false);
                setConnectErrors({}); // clear errors on success
                refreshBuckets();
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

      {/* Main content */}
      <main className="max-w-6xl mx-auto py-8 px-6 min-w-0 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Share2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Manage Shared Links</h1>
        </div>

        {/* Share Links List */}
        <div className="overflow-x-auto box-border w-full max-w-full min-w-0">
          <Card className="overflow-x-hidden w-full max-w-[calc(100vw-48px)] min-w-0 box-border">
            <CardHeader>
              <CardTitle>Your Share Links</CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage all your file sharing links. To create new share links, go to your files and use the share button (<Link2 className="inline w-4 h-4 align-text-bottom" />) on any file.
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center min-h-[40vh]">
                  <LoadingSpinner message="Loading share links..." />
                </div>
              ) : shareLinks.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">No share links found for this bucket.</div>
              ) : (
                <div className="grid gap-6 min-w-0 w-full box-border max-w-full">
                  {shareLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-4 border rounded-lg border-border hover:border-primary/50 transition-colors w-full box-border max-w-full min-w-0"
                    >
                      <div className="flex items-start justify-between w-full min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 min-w-0">
                            <span className="text-lg flex-shrink-0">{getFileIcon(link.key)}</span>
                            <div className="flex-1 min-w-0 max-w-full">
                              <h3 className="font-semibold truncate overflow-hidden whitespace-nowrap max-w-full">{link.key.split('/').pop()}</h3>
                            </div>
                            <div className="flex-shrink-0">{getStatusBadge(link)}</div>
                          </div>

                          <div className="text-sm text-muted-foreground space-y-1 mb-3">
                            <p className="truncate">Path: {link.key}</p>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Created: {new Date(link.created_at).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatExpiration(link.expires_at)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-md">
                              <Input
                                type="text"
                                value={link.token ? `${window.location.origin}/share_links/${link.token}` : 'Link unavailable'}
                                readOnly
                                className={`pr-20 font-mono text-sm truncate border-border ${(!link.token || link.revoked || (link.expires_at && new Date(link.expires_at) < new Date())) ? 'bg-muted-foreground/10 text-muted-foreground' : 'bg-muted'}`}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => link.token && handleCopyLink(link.token)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                title={link.token ? 'Copy link' : 'Link unavailable'}
                                disabled={!link.token || link.revoked || (link.expires_at && new Date(link.expires_at) < new Date())}
                              >
                                {copiedLink === link.token ? (
                                  <span className="text-xs text-green-600">Copied!</span>
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => link.token && window.open(`/share_links/${link.token}`, '_blank')}
                              title={link.token ? 'Open link' : 'Link unavailable'}
                              disabled={!link.token || link.revoked || (link.expires_at && new Date(link.expires_at) < new Date())}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-2 flex-shrink-0 max-w-xs">
                          {/* Edit button: only show if not revoked or expired */}
                          {!(link.revoked || (link.expires_at && new Date(link.expires_at) < new Date())) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLink(link)}
                              title="Edit link"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Revoke button: only show if not revoked or expired, and place before Delete */}
                          {!(link.revoked || (link.expires_at && new Date(link.expires_at) < new Date())) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeLink(link.id)}
                              title="Revoke link"
                            >
                              Revoke
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLink(link.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete link"
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
        </div>
      </main>
      {/* ConfirmDialog for Revoke */}
      <ConfirmDialog
        open={!!pendingRevokeId}
        onOpenChange={open => { if (!open) setPendingRevokeId(null); }}
        title="Revoke Share Link"
        description="Are you sure you want to revoke this share link? This action cannot be undone."
        confirmLabel="Revoke"
        onConfirm={confirmRevokeLink}
        loading={loading}
      />
      {/* ConfirmDialog for Delete */}
      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={open => { if (!open) setPendingDeleteId(null); }}
        title="Delete Share Link"
        description="Are you sure you want to permanently delete this share link? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteLink}
        loading={loading}
      />

      {/* Edit Share Link Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg w-full p-6">
          <DialogHeader>
            <DialogTitle>Edit Share Link</DialogTitle>
          </DialogHeader>
          {editingLink && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p><strong>File:</strong> {editingLink.key.split('/').pop()}</p>
                <p><strong>Path:</strong> {editingLink.key}</p>
                <p><strong>Current expiration:</strong> {editingLink.expires_at ? new Date(editingLink.expires_at).toLocaleString() : 'Never'}</p>
              </div>
              
              <div>
                <label className="block text-sm mb-1">New expiration (from now)</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    value={editDuration}
                    onChange={e => setEditDuration(Number(e.target.value))}
                    className="w-20"
                  />
                  <Select value={editUnit} onValueChange={setEditUnit}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">Minutes</SelectItem>
                      <SelectItem value="hour">Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setEditDuration(30); setEditUnit('minute'); }}>30 mins</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setEditDuration(1); setEditUnit('hour'); }}>1 hour</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setEditDuration(24); setEditUnit('hour'); }}>1 day</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setEditDuration(168); setEditUnit('hour'); }}>1 week</Button>
                </div>
              </div>
              
              {editError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={editLoading}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateLink} disabled={editLoading || !editDuration}>
                  {editLoading ? 'Updating...' : 'Update Link'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
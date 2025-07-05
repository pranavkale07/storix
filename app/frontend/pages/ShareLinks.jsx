import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

export default function ShareLinks() {
  const { user, logout, activeBucket } = useAuth();
  const navigate = useNavigate();

  const [shareLinks, setShareLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(null);

  // Fetch share links on component mount
  useEffect(() => {
    fetchShareLinks();
  }, []);

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


  const handleRevokeLink = async (linkId) => {
    if (!confirm('Are you sure you want to revoke this share link? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/api/storage/revoke_share_link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: linkId }),
      });

      if (response.ok) {
        await fetchShareLinks();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to revoke share link');
      }
    } catch (error) {
      console.error('Error revoking share link:', error);
      alert('Failed to revoke share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/share_links/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 1500);
  };


  const getStatusBadge = (link) => {
    if (link.revoked) {
      return <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">Revoked</span>;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <span className="text-xs bg-yellow-500 text-yellow-foreground px-2 py-1 rounded">Expired</span>;
    }
    return <span className="text-xs bg-green-500 text-green-foreground px-2 py-1 rounded">Active</span>;
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
      return '📁';
    }
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
      <main className="max-w-6xl mx-auto py-8 px-6">
        <div className="flex items-center gap-3 mb-8">
          <Share2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Manage Share Links</h1>
        </div>

        {/* Share Links List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Share Links</CardTitle>
            <p className="text-sm text-muted-foreground">
              View and manage all your file sharing links. To create new share links, go to your files and use the share button (🔗) on any file.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading share links...</p>
              </div>
            ) : shareLinks.length === 0 ? (
              <div className="text-center py-8">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No share links found.</p>
                <p className="text-sm text-muted-foreground mb-4">
                   To create a share link, go to your files and use the share button (🔗) on any file.
                </p>
                <Button onClick={() => navigate('/')}>
                   Go to Files
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {shareLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-4 border rounded-lg border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getFileIcon(link.key)}</span>
                          <h3 className="font-semibold truncate">{link.key.split('/').pop()}</h3>
                          {getStatusBadge(link)}
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
                              value={`${window.location.origin}/share_links/${link.token}`}
                              readOnly
                              className="pr-20 font-mono text-sm truncate bg-muted border-border"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyLink(link.token)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              title="Copy link"
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
                            onClick={() => window.open(`/share_links/${link.token}`, '_blank')}
                            title="Open link"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeLink(link.id)}
                          disabled={link.revoked || (link.expires_at && new Date(link.expires_at) < new Date())}
                          className="text-destructive hover:text-destructive"
                          title="Revoke link"
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
    </div>
  );
}
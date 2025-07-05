import React from 'react';
import { useAuth } from '../components/AuthContext';
import FileManager from '../components/FileManager';
import AuthLanding from '../components/AuthLanding';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, Share2 } from 'lucide-react';

export default function Home() {
  const { user, logout, loading, activeBucket, bucketLoading, refreshActiveBucket } = useAuth();
  const navigate = useNavigate();

  const handleRefreshBucket = async () => {
    await refreshActiveBucket();
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
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
        <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
          <div className="text-xl font-bold tracking-tight">Storix</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
          </div>
        </header>
        <main className="flex justify-center items-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your storage...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="text-xl font-bold tracking-tight">Storix</div>
        <div className="flex items-center gap-4">
          {activeBucket ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary-foreground bg-primary rounded px-2 py-1">Bucket: {activeBucket.bucket}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefreshBucket}
                disabled={bucketLoading}
                title="Refresh bucket connection"
              >
                🔄
              </Button>
            </div>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/connect-bucket')}>Connect Bucket</button>
          )}
          {user && <span className="text-sm text-muted-foreground">{user.email}</span>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/share-links')}
            title="Share Links"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          {user && <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>}
        </div>
      </header>
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
              <Button onClick={() => navigate('/connect-bucket')}>Connect Bucket</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useUsage } from '../components/UsageContext';
import { UsageLimitsEditor } from '../components/usage/UsageLimitsEditor';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { 
  BarChart3, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  TrendingUp,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { showToast } from '../components/utils/toast';
import { useNavigate } from 'react-router-dom';

export default function Usage() {
  const { activeBucket } = useAuth();
  const { 
    loading, 
    error, 
    fetchUsageForBucket, 
    getUsageForBucket,
    clearError 
  } = useUsage();
  const navigate = useNavigate();

  // Fetch usage for active bucket
  useEffect(() => {
    if (activeBucket) {
      fetchUsageForBucket(activeBucket.id, true); // Force refresh when bucket changes
    }
  }, [activeBucket?.id, fetchUsageForBucket]);

  const handleRefresh = async () => {
    if (activeBucket) {
      try {
        await fetchUsageForBucket(activeBucket.id, true);
        showToast.success('Usage data refreshed');
      } catch (error) {
        showToast.error('Failed to refresh usage data', error.message);
      }
    }
  };

  const handleLimitsSave = (limits) => {
    showToast.success('Limits updated successfully');
    // Refresh usage data after limits update
    if (activeBucket) {
      fetchUsageForBucket(activeBucket.id, true);
    }
  };

  const getUsageStatus = (usage) => {
    if (!usage || !usage.stats) return { status: 'no-data', icon: Info, color: 'muted' };
    
    const { write, read } = usage.stats;
    const writePercentage = write.percentage_used;
    const readPercentage = read.percentage_used;
    
    // If both limits are unlimited, show good status
    if (!write.limit && !read.limit) {
      return { status: 'unlimited', icon: CheckCircle, color: 'success' };
    }
    
    // Check if any limited tier is critical
    if ((write.limit && writePercentage >= 90) || (read.limit && readPercentage >= 90)) {
      return { status: 'critical', icon: AlertTriangle, color: 'destructive' };
    } else if ((write.limit && writePercentage >= 75) || (read.limit && readPercentage >= 75)) {
      return { status: 'warning', icon: AlertTriangle, color: 'warning' };
    } else {
      return { status: 'good', icon: CheckCircle, color: 'success' };
    }
  };

  if (!activeBucket) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Bucket</h3>
              <p className="text-muted-foreground mb-4">
                Please select a bucket from the header or connect a new bucket to view usage analytics.
              </p>
              <Button onClick={() => navigate('/buckets')}>
                Manage Buckets
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const usage = getUsageForBucket(activeBucket.id);
  const statusInfo = getUsageStatus(usage);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background" key={activeBucket?.id}>
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>
            {loading ? (
              <Skeleton className="h-4 w-64 mt-2" />
            ) : (
              <p className="text-muted-foreground mt-2">
                Detailed usage statistics for {activeBucket.bucket}
              </p>
            )}
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="link" 
                size="sm" 
                onClick={clearError}
                className="p-0 h-auto ml-2"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Limit Warning */}
        {usage && usage.stats && (
          <>
            {(usage.stats.write.percentage_used >= 90 || usage.stats.read.percentage_used >= 90) && (
              <Alert variant="warning" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Usage Limit Warning:</strong> You are approaching your monthly usage limits. 
                  {usage.stats.write.percentage_used >= 90 && (
                    <span className="block mt-1">Write requests: {usage.stats.write.percentage_used.toFixed(1)}% used</span>
                  )}
                  {usage.stats.read.percentage_used >= 90 && (
                    <span className="block mt-1">Read requests: {usage.stats.read.percentage_used.toFixed(1)}% used</span>
                  )}
                  <span className="block mt-2 text-sm">
                    Once limits are exceeded, operations will be blocked until the next month.
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}



        {/* Usage Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Write Requests</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </>
              ) : usage && usage.stats ? (
                <>
                  <div className="text-2xl font-bold">
                    {usage.stats.write.used.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {usage.stats.write.limit 
                      ? `of ${usage.stats.write.limit.toLocaleString()} limit (${usage.stats.write.percentage_used.toFixed(1)}%)`
                      : 'Unlimited usage'
                    }
                  </p>
                  {usage.stats.write.limit ? (
                    <Progress 
                      value={usage.stats.write.percentage_used} 
                      className={`h-2 ${usage.stats.write.percentage_used >= 90 ? 'bg-destructive/20' : usage.stats.write.percentage_used >= 75 ? 'bg-warning/20' : ''}`}
                    />
                  ) : (
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-primary rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">No data available</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read Requests</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </>
              ) : usage && usage.stats ? (
                <>
                  <div className="text-2xl font-bold">
                    {usage.stats.read.used.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {usage.stats.read.limit 
                      ? `of ${usage.stats.read.limit.toLocaleString()} limit (${usage.stats.read.percentage_used.toFixed(1)}%)`
                      : 'Unlimited usage'
                    }
                  </p>
                  {usage.stats.read.limit ? (
                    <Progress 
                      value={usage.stats.read.percentage_used} 
                      className={`h-2 ${usage.stats.read.percentage_used >= 90 ? 'bg-destructive/20' : usage.stats.read.percentage_used >= 75 ? 'bg-warning/20' : ''}`}
                    />
                  ) : (
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-primary rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">No data available</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              {loading ? (
                <Skeleton className="h-4 w-4" />
              ) : (
                <StatusIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {statusInfo.status === 'critical' ? 'Critical' : 
                     statusInfo.status === 'warning' ? 'Warning' : 
                     statusInfo.status === 'good' ? 'Good' : 
                     statusInfo.status === 'unlimited' ? 'Unlimited' : 'No Data'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statusInfo.status === 'critical' ? 'Usage is very high' :
                     statusInfo.status === 'warning' ? 'Usage is elevated' :
                     statusInfo.status === 'good' ? 'Usage is normal' :
                     statusInfo.status === 'unlimited' ? 'No limits set' : 'No usage data'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Limits */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Usage Limits</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Monthly limits
            </div>
          </div>
          
          <UsageLimitsEditor
            credentialId={activeBucket?.id}
            onSave={handleLimitsSave}
          />
        </div>

        {/* Info Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About Usage Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Write Requests (Tier 1)</h4>
                  <p className="text-sm text-muted-foreground">
                    PUT, COPY, POST, LIST operations. Limited to 2,000 requests per month on free tier.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Read Requests (Tier 2)</h4>
                  <p className="text-sm text-muted-foreground">
                    GET and other operations. Limited to 20,000 requests per month on free tier.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Usage is tracked in real-time. 
                  Limits reset at the beginning of each month.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
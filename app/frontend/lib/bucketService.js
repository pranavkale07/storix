import { apiFetch } from './api';
import { StorageManager } from './storage';

export class BucketService {
  // Fetch all user's buckets
  static async fetchBuckets() {
    try {
      console.log('Fetching buckets from /api/storage/credentials...');
      const response = await apiFetch('/api/storage/credentials');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch buckets: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return data.credentials || [];
    } catch (error) {
      console.error('Error fetching buckets:', error);
      return [];
    }
  }

  // Get the active bucket from the list
  static getActiveBucket(buckets) {
    const active = buckets.find(bucket => bucket.active);
    return active || null;
  }

  // Set a bucket as active using the dedicated endpoint
  static async setActiveBucket(bucketId) {
    try {
      const response = await apiFetch('/api/auth/active_credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_id: bucketId,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to set active bucket: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      if (data.token) {
        StorageManager.setToken(data.token);
      }
      return data;
    } catch (error) {
      console.error('Error setting active bucket:', error);
      throw error;
    }
  }

  // Load and set the active bucket automatically
  static async loadActiveBucket() {
    try {
      const buckets = await this.fetchBuckets();
      if (buckets.length === 0) {
        StorageManager.removeActiveBucket();
        return null;
      }
      const activeBucket = this.getActiveBucket(buckets);
      if (!activeBucket) {
        const firstBucket = buckets[0];
        await this.setActiveBucket(firstBucket.id);
        const bucketInfo = {
          id: firstBucket.id,
          bucket: firstBucket.bucket,
          provider: firstBucket.provider,
          region: firstBucket.region,
          endpoint: firstBucket.endpoint,
        };
        StorageManager.setActiveBucket(bucketInfo);
        return bucketInfo;
      }
      const bucketInfo = {
        id: activeBucket.id,
        bucket: activeBucket.bucket,
        provider: activeBucket.provider,
        region: activeBucket.region,
        endpoint: activeBucket.endpoint,
      };
      StorageManager.setActiveBucket(bucketInfo);
      return bucketInfo;
    } catch (error) {
      console.error('Error loading active bucket:', error);
      return null;
    }
  }

  // Get stored bucket info from localStorage
  static getStoredBucket() {
    return StorageManager.getActiveBucket();
  }

  // Clear stored bucket info
  static clearStoredBucket() {
    StorageManager.removeActiveBucket();
    console.log('Cleared stored bucket');
  }
}
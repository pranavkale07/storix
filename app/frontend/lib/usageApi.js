import { apiFetch, apiFetchWithToast } from './api';

export class UsageApi {
  // Get usage statistics for a specific credential
  static async getBucketUsageStats(credentialId) {
    try {
      const { response, data } = await apiFetchWithToast(`/api/bucket_usage/${encodeURIComponent(credentialId)}/stats`);
      return data;
    } catch (error) {
      console.error('Failed to fetch bucket usage stats:', error);
      throw error;
    }
  }

  // Get usage statistics for all buckets of the current user
  static async getAllBucketsUsage() {
    try {
      const { response, data } = await apiFetchWithToast('/api/storage/credentials');
      if (!response.ok) throw new Error('Failed to fetch credentials');

      const usagePromises = data.credentials.map(async (credential) => {
        try {
          const usageData = await this.getBucketUsageStats(credential.id);
          return {
            ...credential,
            usage: usageData.stats,
          };
        } catch (error) {
          console.error(`Failed to fetch usage for credential ${credential.id}:`, error);
          return {
            ...credential,
            usage: null,
            error: error.message,
          };
        }
      });

      const bucketsWithUsage = await Promise.all(usagePromises);
      return bucketsWithUsage;
    } catch (error) {
      console.error('Failed to fetch all buckets usage:', error);
      throw error;
    }
  }

  // Update bucket limits
  static async updateBucketLimits(credentialId, limits) {
    try {
      const { response, data } = await apiFetchWithToast(`/api/bucket_usage/${encodeURIComponent(credentialId)}/limits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(limits),
      });
      return data;
    } catch (error) {
      console.error('Failed to update bucket limits:', error);
      throw error;
    }
  }

  // Get bucket limits
  static async getBucketLimits(credentialId) {
    try {
      const { response, data } = await apiFetchWithToast(`/api/bucket_usage/${encodeURIComponent(credentialId)}/limits`);
      return data;
    } catch (error) {
      console.error('Failed to fetch bucket limits:', error);
      throw error;
    }
  }
}
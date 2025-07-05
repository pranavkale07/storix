import { apiFetch } from './api';
import { StorageManager } from './storage';

export class BucketService {
  // Fetch all user's storage credentials
  static async fetchCredentials() {
    try {
      console.log('Fetching credentials from /api/storage/credentials...');
      const response = await apiFetch('/api/storage/credentials');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch credentials: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Credentials data:', data);
      return data.credentials || [];
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return [];
    }
  }

  // Get the active credential from the list
  static getActiveCredential(credentials) {
    const active = credentials.find(cred => cred.active);
    console.log('Active credential found:', active);
    return active || null;
  }

  // Set a credential as active using the dedicated endpoint
  static async setActiveCredential(credentialId) {
    try {
      console.log('Setting active credential:', credentialId);
      const response = await apiFetch('/api/auth/active_credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_id: credentialId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error setting active credential:', errorText);
        throw new Error(`Failed to set active credential: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Set active credential response:', data);

      // Update token in localStorage
      if (data.token) {
        StorageManager.setToken(data.token);
        console.log('Updated token in localStorage');
      }

      return data;
    } catch (error) {
      console.error('Error setting active credential:', error);
      throw error;
    }
  }

  // Load and set the active bucket automatically
  static async loadActiveBucket() {
    try {
      console.log('Loading active bucket...');
      const credentials = await this.fetchCredentials();
      console.log('Fetched credentials:', credentials);

      if (credentials.length === 0) {
        console.log('No credentials found, clearing stored bucket');
        StorageManager.removeActiveBucket();
        return null;
      }

      const activeCredential = this.getActiveCredential(credentials);
      console.log('Active credential:', activeCredential);

      if (!activeCredential) {
        console.log('No active credential, using first one');
        // No active credential, use the first one
        const firstCredential = credentials[0];
        console.log('First credential:', firstCredential);
        const updatedCredential = await this.setActiveCredential(firstCredential.id);

        const bucketInfo = {
          id: firstCredential.id,
          bucket: firstCredential.bucket,
          provider: firstCredential.provider,
          region: firstCredential.region,
          endpoint: firstCredential.endpoint,
        };

        console.log('Created bucket info:', bucketInfo);
        StorageManager.setActiveBucket(bucketInfo);
        return bucketInfo;
      }

      // Active credential found, create bucket info
      const bucketInfo = {
        id: activeCredential.id,
        bucket: activeCredential.bucket,
        provider: activeCredential.provider,
        region: activeCredential.region,
        endpoint: activeCredential.endpoint,
      };

      console.log('Using existing active credential:', bucketInfo);
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
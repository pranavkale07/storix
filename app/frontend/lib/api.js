import { StorageManager } from './storage';
import { showToast, handleApiError } from './toast';

export function apiFetch(url, options = {}) {
  const token = StorageManager.getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
}

// Enhanced API fetch with automatic error handling
export async function apiFetchWithToast(url, options = {}) {
  try {
    const response = await apiFetch(url, options);
    
    // Handle non-JSON responses (like file downloads)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        handleApiError('Request failed', response.status);
      }
      return response;
    }

    const data = await response.json();
    
    if (!response.ok) {
      // Handle API errors with toast
      const errorMessage = data.error || data.message || 'An error occurred';
      handleApiError(errorMessage, response.status);
      throw new Error(errorMessage);
    }
    
    return { response, data };
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      handleApiError('Network error. Please check your connection.', 'network');
    } else if (!error.message.includes('API Error:')) {
      // Only show toast if it's not already handled
      handleApiError(error.message);
    }
    throw error;
  }
}
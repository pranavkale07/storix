import { StorageManager } from './storage';
import { handleApiError, showToast } from '../components/utils/toast';
import { debugLog, logError } from './debug';

// Global logout function - will be set by AuthContext
let globalLogout = null;

export function setGlobalLogout(logoutFunction) {
  globalLogout = logoutFunction;
}

// Wrapper for apiFetch to handle 401 errors
async function apiFetchWithAuthCheck(url, options = {}) {
  const token = StorageManager.getToken();
  console.log('apiFetchWithAuthCheck token:', token, 'url:', url);
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers }).then(response => {
    // Only check for 401 errors if we actually have a token
    // This prevents logout when user is not logged in
    if (response.status === 401 && token) {
      handleTokenExpiration();
    }
    return response;
  });
}

export function apiFetch(url, options = {}) {
  return apiFetchWithAuthCheck(url, options);
}

// Enhanced API fetch with automatic error handling
export async function apiFetchWithToast(url, options = {}) {
  try {
    const response = await apiFetchWithAuthCheck(url, options);

    // Handle non-JSON responses (like file downloads)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        // Only handle 401 if we have a token
        const token = StorageManager.getToken();
        if (response.status === 401 && token) {
          handleTokenExpiration();
        } else {
          handleApiError('Request failed', response.status);
        }
      }
      return response;
    }

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 (Unauthorized) - token expired
      // Only trigger logout if we actually have a token
      const token = StorageManager.getToken();
      if (response.status === 401 && token) {
        handleTokenExpiration();
        throw new Error('Session expired. Please log in again.');
      }

      // Handle specific error types
      let errorMessage = data.error || data.message || 'An error occurred';

      // Handle rate limit errors specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          errorMessage = `Rate limit exceeded. Please try again in ${retryAfter} seconds.`;
        } else {
          errorMessage = 'Rate limit exceeded. Please slow down your requests and try again.';
        }
      }

      // Handle bucket usage limit errors
      if (data.type === 'bucket_usage_limit_exceeded') {
        errorMessage = data.message || 'Usage limit exceeded for this bucket.';
        // Use warning toast for usage limit errors
        showToast.warning(errorMessage, 'You have reached your monthly usage limit for this bucket.');
      }

      handleApiError(errorMessage, response.status);
      throw new Error(errorMessage);
    }

    return { response, data };
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      handleApiError('Network error. Please check your connection.', 'network');
    } else if (!error.message.includes('API Error:') && !error.message.includes('Session expired')) {
      // Only show toast if it's not already handled
      handleApiError(error.message);
    }
    throw error;
  }
}

// Handle token expiration
function handleTokenExpiration() {
  debugLog('Token expired, triggering automatic logout'); // Debug - commented for production

  // Show user-friendly message
  showToast.error('Session expired', 'Please log in again to continue.');

  // Trigger global logout if available
  if (globalLogout) {
    // Use setTimeout to ensure the toast is shown before logout
    setTimeout(() => {
      globalLogout();
    }, 1000);
  } else {
    // Fallback: clear storage and redirect
    StorageManager.clearSession();
    window.location.href = '/';
  }
}

/**
 * Automatic Logout on Token Expiration
 *
 * This module automatically handles JWT token expiration by:
 * 1. Detecting 401 (Unauthorized) responses from the API
 * 2. Showing a user-friendly "Session expired" message
 * 3. Automatically logging out the user and redirecting to login
 * 4. Clearing all stored session data
 *
 * This prevents users from getting stuck with expired tokens and
 * provides a smooth authentication experience.
 */

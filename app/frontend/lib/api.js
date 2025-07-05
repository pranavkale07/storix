import { StorageManager } from './storage';

export function apiFetch(url, options = {}) {
  const token = StorageManager.getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
} 
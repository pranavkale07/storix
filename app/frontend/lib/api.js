export function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token") || (JSON.parse(localStorage.getItem("activeBucket") || "null")?.token);
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
} 
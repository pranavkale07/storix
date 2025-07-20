import React from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// Track recent toasts to prevent duplicates
const recentToasts = new Set();
const TOAST_DUPLICATE_TIMEOUT = 2000; // 2 seconds

function makeToastKey(type, message) {
  return `${type}:${message}`;
}

function showUniqueToast(type, message, options = {}) {
  const key = makeToastKey(type, message);
  if (recentToasts.has(key)) return;
  recentToasts.add(key);
  setTimeout(() => recentToasts.delete(key), TOAST_DUPLICATE_TIMEOUT);
  toast[type](message, options);
}

export const showToast = {
  // Error toasts
  error: (message, description = null) => {
    showUniqueToast('error', message, {
      description,
      duration: 5000,
      icon: <XCircle className="w-5 h-5 text-destructive" />,
      action: {
        label: <X className="w-3 h-3 text-muted-foreground opacity-70 hover:opacity-100 transition-all" strokeWidth={1.5} />, onClick: () => toast.dismiss(),
      },
    });
  },

  // Success toasts
  success: (message, description = null) => {
    showUniqueToast('success', message, {
      description,
      duration: 3000,
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      action: {
        label: <X className="w-3 h-3 text-muted-foreground opacity-70 hover:opacity-100 transition-all" strokeWidth={1.5} />, onClick: () => toast.dismiss(),
      },
    });
  },

  // Info toasts
  info: (message, description = null) => {
    showUniqueToast('info', message, {
      description,
      duration: 4000,
      icon: <Info className="w-5 h-5 text-blue-400" />,
      action: {
        label: <X className="w-3 h-3 text-muted-foreground opacity-70 hover:opacity-100 transition-all" strokeWidth={1.5} />, onClick: () => toast.dismiss(),
      },
    });
  },

  // Warning toasts
  warning: (message, description = null) => {
    showUniqueToast('warning', message, {
      description,
      duration: 4000,
      icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      action: {
        label: <X className="w-3 h-3 text-muted-foreground opacity-70 hover:opacity-100 transition-all" strokeWidth={1.5} />, onClick: () => toast.dismiss(),
      },
    });
  },

  // Rate limit toasts (special warning style)
  rateLimit: (message, description = null) => {
    showUniqueToast('warning', message, {
      description,
      duration: 6000,
      icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
      action: {
        label: <X className="w-3 h-3 text-muted-foreground opacity-70 hover:opacity-100 transition-all" strokeWidth={1.5} />, onClick: () => toast.dismiss(),
      },
    });
  },

  // Custom toast with action
  action: (message, action) => {
    showUniqueToast('default', message, {
      action,
      duration: 6000,
      icon: <Info className="w-5 h-5 text-blue-400" />,
    });
  },
};

// Helper function to categorize API errors
export const getErrorType = (statusCode) => {
  if (statusCode >= 500) return 'server';
  if (statusCode === 401) return 'auth';
  if (statusCode === 403) return 'permission';
  if (statusCode === 404) return 'not_found';
  if (statusCode === 422) return 'validation';
  if (statusCode === 429) return 'rate_limit';
  return 'unknown';
};

// Helper function to get user-friendly error messages
export const getErrorMessage = (error, statusCode = null) => {
  const errorType = getErrorType(statusCode);

  switch (errorType) {
  case 'server':
    return 'Server error. Please try again later.';
  case 'auth':
    return 'Your session has expired. Please log in again.';
  case 'permission':
    return 'You don\'t have permission to perform this action.';
  case 'not_found':
    return 'The requested resource was not found.';
  case 'validation':
    return error || 'Please check your input and try again.';
  case 'rate_limit':
    return 'Rate limit exceeded. Please slow down your requests and try again in a moment.';
  case 'network':
    return 'Network error. Please check your connection.';
  default:
    return error || 'An unexpected error occurred.';
  }
};

// Enhanced API error handler
export const handleApiError = (error, statusCode = null) => {
  const message = getErrorMessage(error, statusCode);

  // Use special rate limit toast for rate limit errors
  if (statusCode === 429) {
    showToast.rateLimit(message);
  } else {
    showToast.error(message);
  }

  console.error('API Error:', { error, statusCode });
};
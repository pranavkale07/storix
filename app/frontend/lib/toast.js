import { toast } from 'sonner';

// Toast utility functions
export const showToast = {
  // Error toasts
  error: (message, description = null) => {
    toast.error(message, {
      description,
      duration: 5000, // 5 seconds for errors
    });
  },

  // Success toasts
  success: (message, description = null) => {
    toast.success(message, {
      description,
      duration: 3000, // 3 seconds for success
    });
  },

  // Info toasts
  info: (message, description = null) => {
    toast.info(message, {
      description,
      duration: 4000, // 4 seconds for info
    });
  },

  // Warning toasts
  warning: (message, description = null) => {
    toast.warning(message, {
      description,
      duration: 4000, // 4 seconds for warnings
    });
  },

  // Custom toast with action
  action: (message, action) => {
    toast(message, {
      action,
      duration: 6000, // 6 seconds for action toasts
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
  return 'unknown';
};

// Helper function to get user-friendly error messages
export const getErrorMessage = (error, statusCode = null) => {
  const errorType = getErrorType(statusCode);
  
  switch (errorType) {
    case 'server':
      return 'Server error. Please try again later.';
    case 'auth':
      return 'Authentication failed. Please log in again.';
    case 'permission':
      return 'You don\'t have permission to perform this action.';
    case 'not_found':
      return 'The requested resource was not found.';
    case 'validation':
      return error || 'Please check your input and try again.';
    case 'network':
      return 'Network error. Please check your connection.';
    default:
      return error || 'An unexpected error occurred.';
  }
};

// Enhanced API error handler
export const handleApiError = (error, statusCode = null) => {
  const message = getErrorMessage(error, statusCode);
  showToast.error(message);
  console.error('API Error:', { error, statusCode });
}; 
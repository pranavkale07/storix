// Debug utility for development vs production logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

export const debugLog = (...args) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

export const debugError = (...args) => {
  if (DEBUG_MODE) {
    console.error(...args);
  }
};

export const debugWarn = (...args) => {
  if (DEBUG_MODE) {
    console.warn(...args);
  }
};

// Always log errors in production for debugging
export const logError = (...args) => {
  console.error(...args);
};

// Always log warnings in production
export const logWarn = (...args) => {
  console.warn(...args);
}; 
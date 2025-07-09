import React from 'react';

export default function LoadingSpinner({ size = 8, className = '', message = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-primary mb-2`}
        style={{ minWidth: `${size * 0.25}rem`, minHeight: `${size * 0.25}rem` }}
      ></div>
      {message && <p className="text-muted-foreground text-center text-sm">{message}</p>}
    </div>
  );
}
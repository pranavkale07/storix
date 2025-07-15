import React from 'react';

function ProgressBar({ value, error }) {
  return (
    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-3 transition-all ${error ? 'bg-destructive' : 'bg-primary'} rounded-full`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default ProgressBar; 
import React from 'react';

function Breadcrumbs({ path, onNavigate, className }) {
  const parts = path ? path.split('/').filter(Boolean) : [];
  return (
    <nav className={`flex items-center gap-0 text-sm text-muted-foreground ${className || ''}`} style={{ minWidth: 0 }}>
      <button className="hover:underline" onClick={() => onNavigate('')}>/</button>
      {parts.map((crumb, idx) => {
        const fullPath = parts.slice(0, idx + 1).join('/') + '/';
        const isLast = idx === parts.length - 1;
        return (
          <span key={idx} className="flex items-center gap-0 min-w-0">
            {!isLast ? (
              <button
                className="hover:underline max-w-[120px] truncate"
                style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
                onClick={() => onNavigate(fullPath)}
                title={crumb}
              >
                {crumb}
              </button>
            ) : (
              <span className="font-semibold max-w-[120px] truncate" style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} title={crumb}>{crumb}</span>
            )}
            {idx < parts.length - 1 && <span>/</span>}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
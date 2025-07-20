import React, { useState, useEffect } from 'react';
import { StorageManager } from '../lib/storage';

export function DebugStorage() {
  const [storageData, setStorageData] = useState({});

  const refreshData = () => {
    setStorageData(StorageManager.getAllData());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 1000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#1a1a1a',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '300px',
      zIndex: 9999,
      border: '1px solid #333',
    }}>
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
        localStorage Debug
      </div>
      <div style={{ marginBottom: '3px' }}>
        <span style={{ color: storageData.hasUser ? '#4CAF50' : '#f44336' }}>
          ●
        </span> User: {storageData.hasUser ? '✓' : '✗'}
      </div>
      <div style={{ marginBottom: '3px' }}>
        <span style={{ color: storageData.hasToken ? '#4CAF50' : '#f44336' }}>
          ●
        </span> Token: {storageData.hasToken ? '✓' : '✗'}
      </div>
      <div style={{ marginBottom: '3px' }}>
        <span style={{ color: storageData.hasActiveBucket ? '#4CAF50' : '#f44336' }}>
          ●
        </span> Bucket: {storageData.hasActiveBucket ? '✓' : '✗'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <span style={{ color: storageData.isAuthenticated ? '#4CAF50' : '#f44336' }}>
          ●
        </span> Auth: {storageData.isAuthenticated ? '✓' : '✗'}
      </div>
      <button
        onClick={refreshData}
        style={{
          background: '#333',
          color: '#fff',
          border: 'none',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          cursor: 'pointer',
        }}
      >
        Refresh
      </button>
      <button
        onClick={() => {
          const storageData = {
            token: localStorage.getItem('token'),
            user: localStorage.getItem('user'),
            activeBucket: localStorage.getItem('activeBucket'),
            session: localStorage.getItem('session'),
          };

          // console.log('localStorage Debug Data:', storageData); // Debug - commented for production
          // console.log('Raw localStorage:', { // Debug - commented for production
          //   token: localStorage.getItem('token'),
          //   user: localStorage.getItem('user'),
          //   activeBucket: localStorage.getItem('activeBucket'),
          //   session: localStorage.getItem('session'),
          // }); // Debug - commented for production
        }}
        style={{
          background: '#333',
          color: '#fff',
          border: 'none',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          cursor: 'pointer',
          marginLeft: '5px',
        }}
      >
        Log
      </button>
    </div>
  );
}
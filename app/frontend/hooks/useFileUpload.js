import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export function useFileUpload(prefix, fetchFiles, clearCache) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [uploadSpeeds, setUploadSpeeds] = useState({});
  const [uploadStartTimes, setUploadStartTimes] = useState({});
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [allUploadingFiles, setAllUploadingFiles] = useState([]);

  // Drag & drop and file input handlers
  const handleFileSelect = (e, uploadFiles) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setShowUploadProgress(true);
    setAllUploadingFiles(prev => {
      const prevPaths = new Set(prev.map(f => f._relativePath || f.webkitRelativePath || f.name));
      const newFiles = selectedFiles.filter(f => !prevPaths.has(f._relativePath || f.webkitRelativePath || f.name));
      if (newFiles.length > 0) {
        setTimeout(() => uploadFiles(newFiles), 0);
      }
      return [...prev, ...newFiles];
    });
  };

  const handleFolderSelect = (e, uploadFiles) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setShowUploadProgress(true);
    setAllUploadingFiles(prev => {
      const prevPaths = new Set(prev.map(f => f._relativePath || f.webkitRelativePath || f.name));
      const newFiles = selectedFiles.filter(f => !prevPaths.has(f._relativePath || f.webkitRelativePath || f.name));
      if (newFiles.length > 0) {
        setTimeout(() => uploadFiles(newFiles), 0);
      }
      return [...prev, ...newFiles];
    });
  };

  // Main upload logic
  const uploadFiles = async (filesToUpload) => {
    let anyError = false;
    await Promise.all(filesToUpload.map(async (file) => {
      try {
        const relativePath = file._relativePath || file.webkitRelativePath || file.name;
        const key = (prefix || '') + relativePath;
        const res = await apiFetch('/api/storage/presign_upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, content_type: file.type || 'application/octet-stream' }),
        });
        if (!res.ok) {
          const err = await res.json();
          let errorMessage = 'Failed to get upload URL';
          if (err.error) errorMessage = err.error;
          setUploadErrors(prev => ({ ...prev, [relativePath]: errorMessage }));
          anyError = true;
          return;
        }
        const { presigned_url } = await res.json();
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          let lastLoaded = 0;
          let lastTime = Date.now();
          setUploadStartTimes(prev => ({ ...prev, [relativePath]: Date.now() }));
          xhr.open('PUT', presigned_url);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress(prev => ({ ...prev, [relativePath]: Math.round((event.loaded / event.total) * 100) }));
              const now = Date.now();
              const deltaBytes = event.loaded - lastLoaded;
              const deltaTime = (now - lastTime) / 1000;
              if (deltaTime > 0.5) {
                const speed = deltaBytes / deltaTime;
                setUploadSpeeds(prev => ({ ...prev, [relativePath]: speed }));
                lastLoaded = event.loaded;
                lastTime = now;
              }
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadProgress(prev => ({ ...prev, [relativePath]: 100 }));
              setUploadSpeeds(prev => ({ ...prev, [relativePath]: null }));
              resolve();
            } else {
              setUploadErrors(prev => ({ ...prev, [relativePath]: 'Upload failed' }));
              anyError = true;
              reject();
            }
          };
          xhr.onerror = () => {
            setUploadErrors(prev => ({ ...prev, [relativePath]: 'Network error' }));
            anyError = true;
            reject();
          };
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.send(file);
        });
      } catch (err) {
        const relativePath = file._relativePath || file.webkitRelativePath || file.name;
        setUploadErrors(prev => ({ ...prev, [relativePath]: err.message || 'Unknown error' }));
        anyError = true;
      }
    }));
    setUploading(false);
    setTimeout(() => {
      setAllUploadingFiles([]);
      setUploadProgress({});
      setUploadErrors({});
      setUploadSpeeds({});
      setUploadStartTimes({});
      setShowUploadProgress(false);
      if (!anyError) {
        if (clearCache) clearCache();
        if (fetchFiles) fetchFiles();
      }
    }, 2000);
  };

  return {
    uploading,
    uploadProgress,
    uploadErrors,
    uploadSpeeds,
    uploadStartTimes,
    showUploadProgress,
    allUploadingFiles,
    setShowUploadProgress,
    setAllUploadingFiles,
    handleFileSelect,
    handleFolderSelect,
    uploadFiles,
  };
} 
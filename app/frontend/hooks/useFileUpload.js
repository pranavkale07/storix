import { useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/components/utils/toast';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const CONCURRENCY = 4; // Number of parallel chunk uploads
const RETRY_LIMIT = 5; // Max retries per part

// Helper: Split file into chunks
function splitFileIntoChunks(file, chunkSize = CHUNK_SIZE) {
  const chunks = [];
  let partNumber = 1;
  for (let start = 0; start < file.size; start += chunkSize) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push({
      partNumber,
      start,
      end,
      blob: file.slice(start, end),
    });
    partNumber++;
  }
  return chunks;
}

// Helper: Initiate multipart upload
async function initiateMultipartUpload(key, contentType) {
  const res = await apiFetch('/api/storage/start_upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, content_type: contentType }),
  });
  if (!res.ok) throw new Error('Failed to initiate multipart upload');
  return await res.json(); // { upload_id, key }
}

// Helper: Get presigned URL for a chunk
async function getPresignedUrlForChunk(key, uploadId, partNumber) {
  const res = await apiFetch('/api/storage/presign_chunk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, upload_id: uploadId, part_number: partNumber }),
  });
  if (!res.ok) throw new Error('Failed to get presigned URL for chunk');
  return (await res.json()).presigned_url;
}

// Helper: Upload a chunk to S3, return ETag
function uploadChunkToS3(presignedUrl, chunk, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType || 'application/octet-stream');
    xhr.upload.onprogress = onProgress;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // ETag is in response header (may be quoted)
        const etag = xhr.getResponseHeader('ETag')?.replaceAll('"', '');
        resolve(etag);
      } else {
        reject(new Error('Chunk upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during chunk upload'));
    xhr.send(chunk);
  });
}

// Helper: Complete multipart upload
async function completeMultipartUpload(key, uploadId, parts) {
  const res = await apiFetch('/api/storage/complete_upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, upload_id: uploadId, parts }),
  });
  if (!res.ok) throw new Error('Failed to complete multipart upload');
  return await res.json();
}

export function useFileUpload(prefix, fetchFiles, clearCache) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [uploadSpeeds, setUploadSpeeds] = useState({});
  const [uploadStartTimes, setUploadStartTimes] = useState({});
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [allUploadingFiles, setAllUploadingFiles] = useState([]);
  // Persist per-file upload stats (lastLoaded, lastTime, chunkProgress for multi)
  const uploadStatsRef = useRef({});

  // Drag & drop and file input handlers
  const handleFileSelect = (e, uploadFiles) => {
    let selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    // Wrap in { file, relativePath }
    selectedFiles = selectedFiles.map(file => ({ file, relativePath: file.webkitRelativePath || file.name }));
    setUploading(true);
    setShowUploadProgress(true);
    setAllUploadingFiles(prev => {
      const prevPaths = new Set(prev.map(f => f.relativePath || f.file.webkitRelativePath || f.file.name));
      const newFiles = selectedFiles.filter(f => !prevPaths.has(f.relativePath));
      if (newFiles.length > 0) {
        setTimeout(() => uploadFiles(newFiles), 0);
      }
      return [...prev, ...newFiles];
    });
  };

  const handleFolderSelect = (e, uploadFiles) => {
    let selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    // Wrap in { file, relativePath }
    selectedFiles = selectedFiles.map(file => ({ file, relativePath: file.webkitRelativePath || file.name }));
    setUploading(true);
    setShowUploadProgress(true);
    setAllUploadingFiles(prev => {
      const prevPaths = new Set(prev.map(f => f.relativePath || f.file.webkitRelativePath || f.file.name));
      const newFiles = selectedFiles.filter(f => !prevPaths.has(f.relativePath));
      if (newFiles.length > 0) {
        setTimeout(() => uploadFiles(newFiles), 0);
      }
      return [...prev, ...newFiles];
    });
  };

  // Multipart upload orchestrator (parallelized, with retry)
  const multipartUploadFile = async (file, key, relativePath) => {
    // 1. Initiate
    let uploadId;
    try {
      const { upload_id } = await initiateMultipartUpload(key, file.type || 'application/octet-stream');
      uploadId = upload_id;
    } catch (err) {
      setUploadErrors(prev => ({ ...prev, [relativePath]: err.message || 'Failed to start multipart upload' }));
      return;
    }
    // 2. Split into chunks
    const chunks = splitFileIntoChunks(file, CHUNK_SIZE);
    const parts = new Array(chunks.length); // To preserve order
    let anyError = false;
    setUploadStartTimes(prev => ({ ...prev, [relativePath]: Date.now() }));
    // Track per-chunk progress for speed/ETA
    if (!uploadStatsRef.current[relativePath]) uploadStatsRef.current[relativePath] = {};
    uploadStatsRef.current[relativePath].chunkProgress = {};
    uploadStatsRef.current[relativePath].startTime = Date.now();
    // Helper to upload a single chunk with retry
    const uploadChunkWithRetry = async (chunkObj, idx, attempt = 1) => {
      const { partNumber, blob } = chunkObj;
      let presignedUrl;
      try {
        presignedUrl = await getPresignedUrlForChunk(key, uploadId, partNumber);
      } catch (err) {
        if (attempt < RETRY_LIMIT) {
          return await uploadChunkWithRetry(chunkObj, idx, attempt + 1);
        } else {
          setUploadErrors(prev => ({ ...prev, [relativePath]: `Failed to get presigned URL for part ${partNumber} after ${RETRY_LIMIT} attempts` }));
          anyError = true;
          return;
        }
      }
      try {
        const onProgress = (event) => {
          if (event.lengthComputable) {
            // Track per-chunk progress
            uploadStatsRef.current[relativePath].chunkProgress[idx] = event.loaded;
            // Aggregate total uploaded
            const totalUploaded = Object.values(uploadStatsRef.current[relativePath].chunkProgress).reduce((a, b) => a + b, 0);
            const percent = Math.min(100, Math.round((totalUploaded / file.size) * 100));
            setUploadProgress(prev => ({ ...prev, [relativePath]: percent }));
            // Speed calculation
            const now = Date.now();
            const stats = uploadStatsRef.current[relativePath];
            if (!stats.lastTime) {
              stats.lastTime = now;
              stats.lastLoaded = totalUploaded;
            }
            const deltaBytes = totalUploaded - (stats.lastLoaded || 0);
            const deltaTime = (now - (stats.lastTime || now)) / 1000;
            if (deltaTime > 0.5) {
              const speed = deltaBytes / deltaTime;
              setUploadSpeeds(prev => ({ ...prev, [relativePath]: speed }));
              stats.lastLoaded = totalUploaded;
              stats.lastTime = now;
            }
          }
        };
        const etag = await uploadChunkToS3(presignedUrl, blob, file.type || 'application/octet-stream', onProgress);
        parts[idx] = { part_number: partNumber, etag };
      } catch (err) {
        if (attempt < RETRY_LIMIT) {
          return await uploadChunkWithRetry(chunkObj, idx, attempt + 1);
        } else {
          setUploadErrors(prev => ({ ...prev, [relativePath]: `Failed to upload part ${partNumber} after ${RETRY_LIMIT} attempts` }));
          anyError = true;
        }
      }
    };
    // Parallel upload queue
    const queue = chunks.map((chunk, idx) => () => uploadChunkWithRetry(chunk, idx));
    // Run up to CONCURRENCY at a time
    const runQueue = async (queue, concurrency) => {
      let index = 0;
      let running = 0;
      return new Promise((resolve) => {
        const next = () => {
          if (index === queue.length && running === 0) return resolve();
          while (running < concurrency && index < queue.length) {
            running++;
            queue[index++]().then(() => {
              running--;
              next();
            });
          }
        };
        next();
      });
    };
    await runQueue(queue, CONCURRENCY);
    // 4. Complete upload
    if (!anyError && parts.filter(Boolean).length === chunks.length) {
      try {
        await completeMultipartUpload(key, uploadId, parts);
        setUploadProgress(prev => ({ ...prev, [relativePath]: 100 }));
        setUploadSpeeds(prev => ({ ...prev, [relativePath]: null }));
        if (uploadStatsRef.current[relativePath]) {
          delete uploadStatsRef.current[relativePath];
        }
      } catch (err) {
        setUploadErrors(prev => ({ ...prev, [relativePath]: 'Failed to complete multipart upload' }));
      }
    } else if (anyError) {
      setUploadErrors(prev => ({ ...prev, [relativePath]: `Upload failed: one or more parts could not be uploaded after ${RETRY_LIMIT} attempts.` }));
    }
  };

  // Main upload logic
  const uploadFiles = async (filesToUpload) => {
    let anyError = false;
    await Promise.all(filesToUpload.map(async (fileObj) => {
      try {
        // fileObj: { file, relativePath }
        const file = fileObj.file || fileObj;
        const relativePath = fileObj.relativePath || file.webkitRelativePath || file.name;
        if (!relativePath) throw new Error('Missing relative path for upload.');
        const key = (prefix || '') + relativePath;
        if (file.size > CHUNK_SIZE) {
          // Multipart upload
          await multipartUploadFile(file, key, relativePath);
          if (uploadErrors[relativePath]) anyError = true;
        } else {
          // Single PUT upload (existing logic)
          const res = await apiFetch('/api/storage/presign_upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, content_type: file.type || 'application/octet-stream' }),
          });
          if (!res.ok) {
            const err = await res.json();
            let errorMessage = 'Failed to get upload URL';
            if (err && err.error) {
              errorMessage = err.error;
              if (err.type === 'bucket_usage_limit_exceeded') {
                errorMessage = err.message || 'Upload limit exceeded for this bucket.';
                showToast.warning(errorMessage, 'You have reached your monthly upload limit for this bucket.');
              }
            }
            setUploadErrors(prev => ({ ...prev, [relativePath]: errorMessage }));
            anyError = true;
            return;
          }
          const { presigned_url } = await res.json();
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            if (!uploadStatsRef.current[relativePath]) uploadStatsRef.current[relativePath] = {};
            uploadStatsRef.current[relativePath].startTime = Date.now();
            uploadStatsRef.current[relativePath].lastLoaded = 0;
            uploadStatsRef.current[relativePath].lastTime = Date.now();
            setUploadStartTimes(prev => ({ ...prev, [relativePath]: Date.now() }));
            xhr.open('PUT', presigned_url);
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                setUploadProgress(prev => ({ ...prev, [relativePath]: Math.round((event.loaded / event.total) * 100) }));
                const now = Date.now();
                const stats = uploadStatsRef.current[relativePath];
                const deltaBytes = event.loaded - (stats.lastLoaded || 0);
                const deltaTime = (now - (stats.lastTime || now)) / 1000;
                if (deltaTime > 0.5) {
                  const speed = deltaBytes / deltaTime;
                  setUploadSpeeds(prev => ({ ...prev, [relativePath]: speed }));
                  stats.lastLoaded = event.loaded;
                  stats.lastTime = now;
                }
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploadProgress(prev => ({ ...prev, [relativePath]: 100 }));
                setUploadSpeeds(prev => ({ ...prev, [relativePath]: null }));
                if (uploadStatsRef.current[relativePath]) {
                  delete uploadStatsRef.current[relativePath];
                }
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
        }
      } catch (err) {
        const relativePath = (fileObj && fileObj.relativePath) || (fileObj && fileObj.file && fileObj.file.webkitRelativePath) || (fileObj && fileObj.file && fileObj.file.name) || 'unknown';
        setUploadErrors(prev => ({ ...prev, [relativePath]: (err && err.message) || 'Unknown error' }));
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
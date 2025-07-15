import { useState, useCallback } from 'react';

export function useFileDrop({ uploadFiles, setShowUploadProgress, setAllUploadingFiles }) {
  const [dragActive, setDragActive] = useState(false);

  // Collect files from DataTransferItemList (for folders)
  const collectFilesFromItems = useCallback(async (items) => {
    const files = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        try {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await collectFilesFromEntry(entry, '', files);
          }
        } catch (error) {
          // Ignore
        }
      }
    }
    return files;
  }, []);

  // Recursively collect files from a FileSystemEntry
  const collectFilesFromEntry = useCallback(async (entry, path, files) => {
    try {
      if (entry.isFile) {
        const file = await new Promise((resolve, reject) => {
          entry.file(resolve, reject);
        });
        const relativePath = path + file.name;
        const fileWithPath = new File([file], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        });
        fileWithPath._relativePath = relativePath;
        files.push(fileWithPath);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
        for (const childEntry of entries) {
          await collectFilesFromEntry(childEntry, path + entry.name + '/', files);
        }
      }
    } catch (error) {
      // Ignore
    }
  }, []);

  // Drag event handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  // Drop handler
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    let filesToUpload = [];
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      filesToUpload = Array.from(e.dataTransfer.files);
    } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      filesToUpload = await collectFilesFromItems(e.dataTransfer.items);
    }
    if (filesToUpload.length > 0) {
      setShowUploadProgress(true);
      setAllUploadingFiles(prev => {
        const prevPaths = new Set(prev.map(f => f._relativePath || f.webkitRelativePath || f.name));
        const newFiles = filesToUpload.filter(f => !prevPaths.has(f._relativePath || f.webkitRelativePath || f.name));
        if (newFiles.length > 0) {
          setTimeout(() => uploadFiles(newFiles), 0);
        }
        return [...prev, ...newFiles];
      });
    }
  }, [collectFilesFromItems, setShowUploadProgress, setAllUploadingFiles, uploadFiles]);

  return {
    dragActive,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
} 
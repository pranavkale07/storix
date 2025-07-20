import { useState, useCallback } from 'react';

export function useFileDrop({ uploadFiles, setShowUploadProgress, setAllUploadingFiles, onDropError }) {
  const [dragActive, setDragActive] = useState(false);

  // Collect files from DataTransferItemList (for folders)
  const collectFilesFromItems = useCallback(async (items) => {
    const files = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // console.log('Drag item:', item); // Debug - commented for production
      if (item.kind === 'file') {
        try {
          const entry = item.webkitGetAsEntry && item.webkitGetAsEntry();
          // console.log('  entry:', entry); // Debug - commented for production
          // Defensive: Only process if entry is a file or directory, but never push directories
          if (entry && entry.isFile) {
            await collectFilesFromEntry(entry, '', files);
          } else if (entry && entry.isDirectory) {
            // For directories, include the root folder name in the path
            await collectFilesFromEntry(entry, entry.name + '/', files);
          } else {
            // console.log('  Skipped: not a file or directory entry', entry); // Debug - commented for production
          }
        } catch (error) {
          // console.error('Error processing item:', error); // Debug - commented for production
        }
      } else {
        // console.log('  Skipped: not a file kind', item); // Debug - commented for production
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
        files.push({ file, relativePath });
      } else if (entry.isDirectory) {
        // Do NOT push the directory itself!
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
    // console.log('Drop event:'); // Debug - commented for production
    // console.log('  dataTransfer.items:', e.dataTransfer.items); // Debug - commented for production
    // console.log('  dataTransfer.files:', e.dataTransfer.files); // Debug - commented for production
    try {
      let filesToUpload = [];
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        filesToUpload = Array.from(e.dataTransfer.files)
          .filter(file => !(file.size === 0 && !file.webkitRelativePath && file.name && file.name.indexOf('.') === -1))
          .map(file => ({ file, relativePath: file.webkitRelativePath || file.name }));
        if (filesToUpload.length === 0) {
          if (onDropError) onDropError('Folder drag-and-drop upload is under development. Please use the Upload Folder button for now.');
          return;
        }
      } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        filesToUpload = await collectFilesFromItems(e.dataTransfer.items);
      }
      if (filesToUpload.length > 0) {
        setShowUploadProgress(true);
        setAllUploadingFiles(prev => {
          const prevPaths = new Set(prev.map(f => f.relativePath || f.file.webkitRelativePath || f.file.name));
          const newFiles = filesToUpload.filter(f => !prevPaths.has(f.relativePath));
          if (newFiles.length > 0) {
            setTimeout(() => uploadFiles(newFiles), 0);
          }
          return [...prev, ...newFiles];
        });
      } else {
        if (onDropError) onDropError('No files found in dropped folder.');
      }
    } catch (err) {
      // console.error('Error during drag-and-drop upload:', err); // Debug - commented for production
      if (onDropError) onDropError('Failed to process dropped folder. Please try again or use the Upload button.');
    }
  }, [collectFilesFromItems, setShowUploadProgress, setAllUploadingFiles, uploadFiles, onDropError]);

  return {
    dragActive,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
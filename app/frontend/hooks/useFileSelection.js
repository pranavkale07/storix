import { useState } from 'react';

export function useFileSelection(files, folders) {
  const [selectedFiles, setSelectedFiles] = useState([]); // array of file keys
  const [selectedFolders, setSelectedFolders] = useState([]); // array of folder prefixes

  // Select all handler
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedFiles(files.map(f => f.key));
      setSelectedFolders(folders.map(f => f.prefix));
    } else {
      setSelectedFiles([]);
      setSelectedFolders([]);
    }
  };

  // Individual file select/deselect
  const handleSelectFile = (key, checked) => {
    setSelectedFiles(prev => (checked ? [...prev, key] : prev.filter(k => k !== key)));
  };

  // Individual folder select/deselect
  const handleSelectFolder = (prefix, checked) => {
    setSelectedFolders(prev => (checked ? [...prev, prefix] : prev.filter(p => p !== prefix)));
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedFiles([]);
    setSelectedFolders([]);
  };

  // Utility: is all selected
  const isAllSelected = files.length + folders.length > 0 &&
    selectedFiles.length === files.length &&
    selectedFolders.length === folders.length;

  return {
    selectedFiles,
    selectedFolders,
    handleSelectAll,
    handleSelectFile,
    handleSelectFolder,
    handleClearSelection,
    isAllSelected,
    setSelectedFiles,
    setSelectedFolders,
  };
}
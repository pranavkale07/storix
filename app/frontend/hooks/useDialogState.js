import { useState, useCallback } from 'react';

export function useDialogState() {
  // Create Folder Modal
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Rename Folder/File
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renamingFile, setRenamingFile] = useState(null);

  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingFile, setSharingFile] = useState(null);

  // Delete Confirm Dialogs
  const [pendingDeleteFile, setPendingDeleteFile] = useState(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState(null);

  // Helpers
  const openCreateFolder = useCallback(() => setShowCreateFolder(true), []);
  const closeCreateFolder = useCallback(() => setShowCreateFolder(false), []);

  const openRenameFolder = useCallback((folder) => setRenamingFolder(folder), []);
  const closeRenameFolder = useCallback(() => setRenamingFolder(null), []);

  const openRenameFile = useCallback((file) => setRenamingFile(file), []);
  const closeRenameFile = useCallback(() => setRenamingFile(null), []);

  const openShareModal = useCallback((file) => { setSharingFile(file); setShowShareModal(true); }, []);
  const closeShareModal = useCallback(() => { setShowShareModal(false); setSharingFile(null); }, []);

  const openDeleteFile = useCallback((fileKey) => setPendingDeleteFile(fileKey), []);
  const closeDeleteFile = useCallback(() => setPendingDeleteFile(null), []);

  const openDeleteFolder = useCallback((folder) => setPendingDeleteFolder(folder), []);
  const closeDeleteFolder = useCallback(() => setPendingDeleteFolder(null), []);

  return {
    // State
    showCreateFolder,
    setShowCreateFolder,
    renamingFolder,
    setRenamingFolder,
    renamingFile,
    setRenamingFile,
    showShareModal,
    setShowShareModal,
    sharingFile,
    setSharingFile,
    pendingDeleteFile,
    setPendingDeleteFile,
    pendingDeleteFolder,
    setPendingDeleteFolder,
    // Helpers
    openCreateFolder,
    closeCreateFolder,
    openRenameFolder,
    closeRenameFolder,
    openRenameFile,
    closeRenameFile,
    openShareModal,
    closeShareModal,
    openDeleteFile,
    closeDeleteFile,
    openDeleteFolder,
    closeDeleteFolder,
  };
}
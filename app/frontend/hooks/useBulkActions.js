import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/components/utils/toast';

export function useBulkActions({ selectedFiles, selectedFolders, setSelectedFiles, setSelectedFolders, fetchFiles, showToast, clearCache }) {
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionProgress, setBulkActionProgress] = useState({});
  const [bulkActionError, setBulkActionError] = useState({});
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);

  // Bulk Delete
  const handleBulkDelete = () => {
    setPendingBulkDelete(true);
  };

  const confirmBulkDelete = async () => {
    setBulkActionLoading(true);
    setBulkActionProgress({});
    setBulkActionError({});
    // Delete files
    for (const key of selectedFiles) {
      try {
        setBulkActionProgress(prev => ({ ...prev, [key]: 'deleting' }));
        const res = await apiFetch('/api/storage/files', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        if (!res.ok) {
          const err = await res.json();
          setBulkActionError(prev => ({ ...prev, [key]: err.error || 'Failed to delete' }));
        } else {
          setBulkActionProgress(prev => ({ ...prev, [key]: 'deleted' }));
        }
      } catch (err) {
        setBulkActionError(prev => ({ ...prev, [key]: err.message || 'Error' }));
      }
    }
    // Delete folders
    for (const prefix of selectedFolders) {
      try {
        setBulkActionProgress(prev => ({ ...prev, [prefix]: 'deleting' }));
        const res = await apiFetch('/api/storage/delete_folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix }),
        });
        if (!res.ok) {
          const err = await res.json();
          setBulkActionError(prev => ({ ...prev, [prefix]: err.error || 'Failed to delete' }));
        } else {
          setBulkActionProgress(prev => ({ ...prev, [prefix]: 'deleted' }));
        }
      } catch (err) {
        setBulkActionError(prev => ({ ...prev, [prefix]: err.message || 'Error' }));
      }
    }
    setBulkActionLoading(false);
    setSelectedFiles([]);
    setSelectedFolders([]);
    setPendingBulkDelete(false);
    if (clearCache) clearCache();
    fetchFiles();
    // Show bulk operation result
    const totalItems = selectedFiles.length + selectedFolders.length;
    const errorCount = Object.keys(bulkActionError).length;
    if (errorCount === 0) {
      showToast.success(`Successfully deleted ${totalItems} items`);
    } else if (errorCount === totalItems) {
      showToast.error('Failed to delete items', 'All items failed to delete');
    } else {
      showToast.warning('Partially completed', `${totalItems - errorCount} items deleted, ${errorCount} failed`);
    }
  };

  // Bulk Download
  const handleBulkDownload = async () => {
    setBulkActionLoading(true);
    setBulkActionProgress({});
    setBulkActionError({});
    for (const key of selectedFiles) {
      try {
        setBulkActionProgress(prev => ({ ...prev, [key]: 'downloading' }));
        const response = await apiFetch('/api/storage/presign_download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          let errorMessage = errorData.error || 'Failed to get download link';

          // Handle bucket usage limit errors
          if (errorData.type === 'bucket_usage_limit_exceeded') {
            errorMessage = errorData.message || 'Download limit exceeded for this bucket.';
            showToast.warning(errorMessage, 'You have reached your monthly download limit for this bucket.');
          }

          setBulkActionError(prev => ({ ...prev, [key]: errorMessage }));
          continue;
        }
        const { presigned_url } = await response.json();
        const link = document.createElement('a');
        link.href = presigned_url;
        link.download = key.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setBulkActionProgress(prev => ({ ...prev, [key]: 'downloaded' }));
        // Add a 500ms delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        setBulkActionError(prev => ({ ...prev, [key]: err.message || 'Download error' }));
      }
    }
    setBulkActionLoading(false);
    setSelectedFiles([]);
    setSelectedFolders([]);
  };

  return {
    bulkActionLoading,
    bulkActionProgress,
    bulkActionError,
    pendingBulkDelete,
    setPendingBulkDelete,
    handleBulkDelete,
    confirmBulkDelete,
    handleBulkDownload,
  };
}
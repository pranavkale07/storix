import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/components/utils/toast';

function FolderRenameInput({ folder, onRename, onCancel, clearCache }) {
  const [newName, setNewName] = useState(folder.name);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === folder.name) {
      onCancel();
      return;
    }

    setLoading(true);
    try {
      const oldPrefix = folder.prefix;
      const newPrefix = folder.prefix.replace(folder.name + '/', newName.trim() + '/');

      const response = await apiFetch('/api/storage/move_folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folders: [{
            source_prefix: oldPrefix,
            destination_prefix: newPrefix,
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Failed to rename folder';
        if (errorMessage.includes('already exists')) {
          showToast.error('Failed to rename folder', 'A folder with this name already exists.');
        } else {
          showToast.error('Failed to rename folder', errorMessage);
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      const hasErrors = result.results && result.results.some(r => r.status === 'error');

      if (hasErrors) {
        const errors = result.results.filter(r => r.status === 'error').map(r => r.error).join(', ');
        if (errors.includes('already exists')) {
          showToast.error('Failed to rename folder', 'A folder with this name already exists.');
        } else {
          showToast.error('Failed to rename folder', errors);
        }
        setLoading(false);
        return;
      }

      if (clearCache) clearCache();
      onRename();
      showToast.success('Folder renamed successfully');
    } catch (err) {
      let errorMessage = err.message;
      if (err.message.includes('permission') || err.message.includes('denied')) {
        errorMessage = 'Permission denied. Cannot rename this folder.';
      } else if (err.message.includes('already exists')) {
        errorMessage = 'A folder with this name already exists.';
      }
      showToast.error('Failed to rename folder', errorMessage);
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className="flex-1 p-1 border border-border rounded bg-background text-foreground text-sm"
        autoFocus
        onBlur={handleSubmit}
        disabled={loading}
      />
      {loading && <span className="text-xs text-muted-foreground">Renaming...</span>}
    </form>
  );
}

export default FolderRenameInput; 
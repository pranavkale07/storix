import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/components/utils/toast';

function FileRenameInput({ file, onRename, onCancel, clearCache }) {
  const [newName, setNewName] = useState(file.key.split('/').pop());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === file.key.split('/').pop()) {
      onCancel();
      return;
    }

    setLoading(true);
    try {
      const oldKey = file.key;
      const pathParts = file.key.split('/');
      pathParts[pathParts.length - 1] = newName.trim();
      const newKey = pathParts.join('/');

      const response = await apiFetch('/api/storage/rename_file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: oldKey,
          new_key: newKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename file');
      }

      if (clearCache) clearCache();
      onRename();
      showToast.success('File renamed successfully');
    } catch (err) {
      let errorMessage = err.message;
      if (err.message.includes('permission') || err.message.includes('denied')) {
        errorMessage = 'Permission denied. Cannot rename this file.';
      } else if (err.message.includes('already exists')) {
        errorMessage = 'A file with this name already exists.';
      }
      showToast.error('Failed to rename file', errorMessage);
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

export default FileRenameInput; 
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { apiFetch } from '@/lib/api';
import { Download, Trash2, Share2, X, Search, Filter as FilterIcon } from 'lucide-react';
import ShareModal from './ShareModal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Input } from './ui/input';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/alert-dialog';
import ConfirmDialog from './ConfirmDialog';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function isViewableFile(filename) {
  const viewableExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', // Images
    '.pdf', // PDFs
    '.txt', '.md', '.json', '.xml', '.csv', '.log', // Text files
    '.html', '.htm', // Web files
    '.mp4', '.webm', '.ogg', // Videos
    '.mp3', '.wav', '.ogg', // Audio
  ];

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return viewableExtensions.includes(extension);
}

function Breadcrumbs({ path, onNavigate, className }) {
  const parts = path ? path.split('/').filter(Boolean) : [];
  return (
    <nav className={`flex items-center gap-0 text-sm text-muted-foreground ${className || ''}`}>
      <button className="hover:underline" onClick={() => onNavigate('')}>/</button>
      {parts.map((crumb, idx) => {
        const fullPath = parts.slice(0, idx + 1).join('/') + '/';
        const isLast = idx === parts.length - 1;
        return (
          <span key={idx} className="flex items-center gap-0">
            {!isLast ? (
              <button className="hover:underline" onClick={() => onNavigate(fullPath)}>{crumb}</button>
            ) : (
              <span className="font-semibold">{crumb}</span>
            )}
            {idx < parts.length - 1 && <span>/</span>}
          </span>
        );
      })}
    </nav>
  );
}

// Create Folder Modal Component
function CreateFolderModal({ isOpen, onClose, onSuccess, currentPrefix }) {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const newFolderPrefix = currentPrefix + folderName.trim() + '/';
      const response = await apiFetch('/api/storage/create_folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix: newFolderPrefix }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }

      setFolderName('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full p-2 border border-border rounded bg-background text-foreground"
              placeholder="Enter folder name"
              autoFocus
            />
          </div>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !folderName.trim()}
            >
              {loading ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline Folder Rename Component
function FolderRenameInput({ folder, onRename, onCancel }) {
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
        throw new Error(errorData.error || 'Failed to rename folder');
      }

      const result = await response.json();
      const hasErrors = result.results && result.results.some(r => r.status === 'error');

      if (hasErrors) {
        const errors = result.results.filter(r => r.status === 'error').map(r => r.error).join(', ');
        throw new Error(`Some files failed to move: ${errors}`);
      }

      onRename();
    } catch (err) {
      alert(`Rename failed: ${err.message}`);
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

// Inline File Rename Component
function FileRenameInput({ file, onRename, onCancel }) {
  const [newName, setNewName] = useState(file.key.split('/').pop()); // Get just the filename
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
      pathParts[pathParts.length - 1] = newName.trim(); // Replace just the filename
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

      onRename();
    } catch (err) {
      alert(`Rename failed: ${err.message}`);
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

// Shadcn-themed ProgressBar component
function ProgressBar({ value, error }) {
  return (
    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-3 transition-all ${error ? 'bg-destructive' : 'bg-primary'} rounded-full`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function FileList({ folders, files, onOpenFolder, onDownload, onDelete, downloading, deleting, onDeleteFolder, deletingFolders, onRenameFolder, renamingFolder, onRenameFile, renamingFile, selectedFiles, selectedFolders, onSelectFile, onSelectFolder, isAllSelected, onSelectAll, onShareFile }) {
  console.log('FileList received:', { folders, files, foldersLength: folders?.length, filesLength: files?.length });
  if (!folders.length && !files.length) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <div className="text-4xl mb-2">📁</div>
        <div className="text-lg font-medium">No files or folders yet</div>
        <div className="text-sm">Upload your first file or create a folder to get started.</div>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-8 px-2">
              <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} aria-label="Select all" />
            </th>
            <th className="text-left py-2 px-3 font-semibold">Name</th>
            <th className="text-left py-2 px-3 font-semibold">Size</th>
            <th className="text-left py-2 px-3 font-semibold">Last Modified</th>
            <th className="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {/* Folders */}
          {folders.map(folder => {
            const isSelected = selectedFolders.includes(folder.prefix);
            return (
              <tr key={folder.prefix} className={`border-b border-border group transition ${isSelected ? 'bg-orange-500/90 text-white' : 'hover:bg-accent/30'}`}>
                <td className="w-8 px-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={checked => onSelectFolder(folder.prefix, checked)}
                    onClick={e => e.stopPropagation()}
                    aria-label="Select folder"
                  />
                </td>
                <td className="py-2 px-3 flex items-center gap-2 font-semibold cursor-pointer hover:underline" onClick={() => onOpenFolder(folder.prefix)}>
                  <span className="text-lg">📁</span>
                  {renamingFolder === folder.prefix ? (
                    <FolderRenameInput
                      folder={folder}
                      onRename={() => {
                        onRenameFolder(null);
                        setTimeout(() => {
                          const event = new CustomEvent('refreshFileList');
                          window.dispatchEvent(event);
                        }, 500);
                      }}
                      onCancel={() => onRenameFolder(null)}
                    />
                  ) : (
                    <span>{folder.name}</span>
                  )}
                </td>
                <td className="py-2 px-3 text-muted-foreground">—</td>
                <td className="py-2 px-3 text-muted-foreground">—</td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" title="Rename" onClick={e => { e.stopPropagation(); onRenameFolder(folder.prefix); }}>
                        ✏️
                      </Button>
                      <Button size="icon" variant="ghost" title="Delete" onClick={e => { e.stopPropagation(); onDeleteFolder(folder.prefix, folder.name); }} disabled={deletingFolders.has(folder.prefix)}>
                        {deletingFolders.has(folder.prefix) ? '⏳' : '🗑️'}
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
          {/* Files */}
          {files.map(file => {
            const isSelected = selectedFiles.includes(file.key);
            return (
              <tr key={file.key} className={`border-b border-border group transition ${isSelected ? 'bg-orange-500/90 text-white' : 'hover:bg-accent/30'}`}>
                <td className="w-8 px-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={checked => onSelectFile(file.key, checked)}
                    onClick={e => e.stopPropagation()}
                    aria-label="Select file"
                  />
                </td>
                <td className="py-2 px-3 flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  {renamingFile === file.key ? (
                    <FileRenameInput
                      file={file}
                      onRename={() => {
                        onRenameFile(null);
                        setTimeout(() => {
                          const event = new CustomEvent('refreshFileList');
                          window.dispatchEvent(event);
                        }, 500);
                      }}
                      onCancel={() => onRenameFile(null)}
                    />
                  ) : (
                    <span
                      className={isViewableFile(file.key) ? 'cursor-pointer hover:underline' : ''}
                      onClick={isViewableFile(file.key) ? () => onDownload(file.key, true) : undefined}
                      title={isViewableFile(file.key) ? 'Click to view' : undefined}
                    >
                      {file.key}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3">{formatSize(file.size)}</td>
                <td className="py-2 px-3">{formatDate(file.last_modified)}</td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" title="Share" onClick={e => { e.stopPropagation(); onShareFile(file); }}>
                        🔗
                      </Button>
                      <Button size="icon" variant="ghost" title="Rename" onClick={e => { e.stopPropagation(); onRenameFile(file.key); }}>
                        ✏️
                      </Button>
                      <Button size="icon" variant="ghost" title="Delete" onClick={e => { e.stopPropagation(); onDelete(file.key); }} disabled={deleting.has(file.key)}>
                        {deleting.has(file.key) ? '⏳' : '🗑️'}
                      </Button>
                    </div>
                    <Button size="icon" variant="ghost" title="Download" onClick={e => { e.stopPropagation(); onDownload(file.key, false); }} disabled={downloading.has(file.key)}>
                      {downloading.has(file.key) ? '⏳' : '⬇️'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function FileManager({ activeBucket }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prefix, setPrefix] = useState(''); // current folder path
  const [downloading, setDownloading] = useState(new Set());
  const [deleting, setDeleting] = useState(new Set());
  const [deletingFolders, setDeletingFolders] = useState(new Set());
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renamingFile, setRenamingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState([]);

  // For speed and ETA calculation
  const [uploadSpeeds, setUploadSpeeds] = useState({});
  const [uploadStartTimes, setUploadStartTimes] = useState({});

  // Bulk selection state
  const [selectedFiles, setSelectedFiles] = useState([]); // array of file keys
  const [selectedFolders, setSelectedFolders] = useState([]); // array of folder prefixes
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionProgress, setBulkActionProgress] = useState({});
  const [bulkActionError, setBulkActionError] = useState({});
  const fileListRef = useRef();
  const fileInputRef = useRef();
  const folderInputRef = useRef();
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingFile, setSharingFile] = useState(null);

  const [filterType, setFilterType] = useState('all');
  const [minSize, setMinSize] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const filterDebounceRef = useRef();

  const [search, setSearch] = useState('');

  const [allUploadingFiles, setAllUploadingFiles] = useState([]);

  const [pendingDeleteFile, setPendingDeleteFile] = useState(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      let url = prefix ? `/api/storage/files?prefix=${encodeURIComponent(prefix)}` : '/api/storage/files';
      const params = [];
      if (filterType && filterType !== 'all') params.push(`filter_type=${encodeURIComponent(filterType)}`);
      if (minSize) params.push(`min_size=${parseInt(minSize * 1024 * 1024)}`); // MB to bytes
      if (maxSize) params.push(`max_size=${parseInt(maxSize * 1024 * 1024)}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (params.length) url += (url.includes('?') ? '&' : '?') + params.join('&');
      console.log('Fetching files from:', url);
      const res = await apiFetch(url);
      const data = await res.json();
      console.log('API Response:', { status: res.status, ok: res.ok, data });
      if (!res.ok) {
        setError(data.error || 'Failed to fetch files');
        setFolders([]);
        setFiles([]);
      } else {
        console.log('Setting folders:', data.folders);
        console.log('Setting files:', data.files);
        setFolders(data.folders || []);
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Network error');
      setFolders([]);
      setFiles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [activeBucket, prefix]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchFiles();
    };

    window.addEventListener('refreshFileList', handleRefresh);
    return () => {
      window.removeEventListener('refreshFileList', handleRefresh);
    };
  }, []);

  const handleOpenFolder = (newPrefix) => {
    setPrefix(newPrefix);
  };

  const handleBreadcrumbNavigate = (newPrefix) => {
    setPrefix(newPrefix);
  };

  // Back button logic
  const canGoBack = !!prefix;
  const handleBack = () => {
    if (!prefix) return;
    const parts = prefix.split('/').filter(Boolean);
    if (parts.length === 0) {
      setPrefix('');
    } else {
      const up = parts.slice(0, -1).join('/');
      setPrefix(up ? up + '/' : '');
    }
  };

  const handleDownload = async (fileKey, inline = false) => {
    if (downloading.has(fileKey)) return;

    setDownloading(prev => new Set(prev).add(fileKey));
    try {
      // Get presigned download URL
      const response = await apiFetch('/api/storage/presign_download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: fileKey,
          inline: inline.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate download link');
      }

      const { presigned_url } = await response.json();

      if (inline) {
        // Open in new tab for inline viewing
        window.open(presigned_url, '_blank');
      } else {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = presigned_url;
        link.download = fileKey.split('/').pop(); // Get filename from path
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (err) {
      console.error('Download failed:', err);
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  const handleDelete = async (fileKey) => {
    if (deleting.has(fileKey)) return;
    setPendingDeleteFile(fileKey);
  };

  const confirmDeleteFile = async () => {
    const fileKey = pendingDeleteFile;
    if (!fileKey) return;
    setDeleting(prev => new Set(prev).add(fileKey));
    try {
      const response = await apiFetch('/api/storage/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: fileKey }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
      await fetchFiles();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
      setPendingDeleteFile(null);
    }
  };

  const handleShareFile = (file) => {
    setSharingFile(file);
    setShowShareModal(true);
  };

  const handleDeleteFolder = async (folderPrefix, folderName) => {
    if (deletingFolders.has(folderPrefix)) return;
    setPendingDeleteFolder({ prefix: folderPrefix, name: folderName });
  };

  const confirmDeleteFolder = async () => {
    const folderPrefix = pendingDeleteFolder?.prefix;
    if (!folderPrefix) return;
    setDeletingFolders(prev => new Set(prev).add(folderPrefix));
    try {
      const response = await apiFetch('/api/storage/delete_folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix: folderPrefix }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete folder');
      }
      await fetchFiles();
    } catch (err) {
      console.error('Delete folder failed:', err);
      alert(`Delete folder failed: ${err.message}`);
    } finally {
      setDeletingFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderPrefix);
        return newSet;
      });
      setPendingDeleteFolder(null);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const collectFilesFromItems = async (items) => {
    const files = [];
    console.log('collectFilesFromItems: processing', items.length, 'items');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`Processing item ${i + 1}/${items.length}:`, item.kind, item.type);
      if (item.kind === 'file') {
        try {
          const entry = item.webkitGetAsEntry();
          console.log(`Got entry for item ${i + 1}:`, entry?.name, entry?.isFile, entry?.isDirectory);
          if (entry) {
            console.log(`Calling collectFilesFromEntry for item ${i + 1}`);
            await collectFilesFromEntry(entry, '', files);
            console.log(`After collectFilesFromEntry for item ${i + 1}, files array has ${files.length} items`);
          } else {
            console.warn(`No entry for item ${i + 1}:`, item);
          }
        } catch (error) {
          console.warn(`Error processing dropped item ${i + 1}:`, error);
        }
      } else {
        console.log(`Skipping non-file item ${i + 1}:`, item.kind);
      }
    }

    console.log('collectFilesFromItems: collected', files.length, 'files');
    console.log('Files collected:', files.map(f => f.name || f._relativePath));
    return files;
  };

  const collectFilesFromEntry = async (entry, path, files) => {
    try {
      console.log('collectFilesFromEntry:', entry.name, 'isFile:', entry.isFile, 'isDirectory:', entry.isDirectory);
      if (entry.isFile) {
        const file = await new Promise((resolve, reject) => {
          entry.file(resolve, reject);
        });
        // Create a new File object with the correct relative path
        const relativePath = path + file.name;
        const fileWithPath = new File([file], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        });
        // Add the relative path as a custom property
        fileWithPath._relativePath = relativePath;
        files.push(fileWithPath);
        console.log('Added file:', relativePath);
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
      console.warn('Error processing entry:', error);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    console.log('=== DRAG & DROP DEBUG ===');
    console.log('DataTransfer items:', e.dataTransfer.items?.length);
    console.log('DataTransfer files:', e.dataTransfer.files?.length);

    let filesToUpload = [];

    // If DataTransfer.files is available and has files, use it directly
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      filesToUpload = Array.from(e.dataTransfer.files);
      console.log('Using DataTransfer.files directly:', filesToUpload.length, 'files');
    }
    // Otherwise, try to collect files from items (this handles folders and complex structures)
    else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      try {
        filesToUpload = await collectFilesFromItems(e.dataTransfer.items);
        console.log('Files collected from items:', filesToUpload.length);
      } catch (error) {
        console.error('Error collecting files from items:', error);
      }
    }

    console.log('Total files to upload:', filesToUpload.length);
    console.log('File names:', filesToUpload.map(f => f.name || f._relativePath));

    if (filesToUpload.length > 0) {
      setUploading(true);
      // Use functional update to ensure we have the latest state
      setAllUploadingFiles(prev => {
        console.log('Previous uploading files:', prev.length);
        console.log('Previous file paths:', prev.map(f => f._relativePath || f.webkitRelativePath || f.name));

        const prevPaths = new Set(prev.map(f => f._relativePath || f.webkitRelativePath || f.name));
        const newFiles = filesToUpload.filter(f => !prevPaths.has(f._relativePath || f.webkitRelativePath || f.name));

        console.log('New files after filtering:', newFiles.length);
        console.log('New file names:', newFiles.map(f => f.name || f._relativePath));

        // Start upload for new files immediately
        if (newFiles.length > 0) {
          console.log('Starting upload for files:', newFiles.length);
          setTimeout(() => uploadFiles(newFiles), 0);
        }

        const result = [...prev, ...newFiles];
        console.log('Final allUploadingFiles count:', result.length);
        return result;
      });
    }
  };

  // Selection logic
  const isAllSelected = files.length + folders.length > 0 &&
    selectedFiles.length === files.length &&
    selectedFolders.length === folders.length;
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedFiles(files.map(f => f.key));
      setSelectedFolders(folders.map(f => f.prefix));
    } else {
      setSelectedFiles([]);
      setSelectedFolders([]);
    }
  };
  const handleSelectFile = (key, checked) => {
    setSelectedFiles(prev => (checked ? [...prev, key] : prev.filter(k => k !== key)));
  };
  const handleSelectFolder = (prefix, checked) => {
    setSelectedFolders(prev => (checked ? [...prev, prefix] : prev.filter(p => p !== prefix)));
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
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
    fetchFiles();
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
          setBulkActionError(prev => ({ ...prev, [key]: errorData.error || 'Failed to get download link' }));
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
      } catch (err) {
        setBulkActionError(prev => ({ ...prev, [key]: err.message || 'Download error' }));
      }
    }
    setBulkActionLoading(false);
    setSelectedFiles([]);
    setSelectedFolders([]);
  };

  // Add a clear selection handler
  const handleClearSelection = () => {
    setSelectedFiles([]);
    setSelectedFolders([]);
  };

  // Determine the single selected item (file or folder)
  const singleSelectedFile = selectedFiles.length === 1 ? files.find(f => f.key === selectedFiles[0]) : null;
  const singleSelectedFolder = selectedFolders.length === 1 ? folders.find(f => f.prefix === selectedFolders[0]) : null;
  const singleSelectedItem = singleSelectedFile || singleSelectedFolder ? {
    key: singleSelectedFile ? singleSelectedFile.key : singleSelectedFolder.prefix,
    name: singleSelectedFile ? singleSelectedFile.key.split('/').pop() : singleSelectedFolder.name,
  } : null;

  // Auto-apply filters with debounce
  useEffect(() => {
    if (!showFilterBar && !search) return;
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      fetchFiles();
    }, 300);
    return () => clearTimeout(filterDebounceRef.current);
    // eslint-disable-next-line
  }, [filterType, minSize, maxSize, search, showFilterBar]);

  const handleFileSelect = (e) => {
    console.log('=== FILE SELECT DEBUG ===');
    console.log('handleFileSelect called');
    const selectedFiles = Array.from(e.target.files);
    console.log('Selected files:', selectedFiles.length);
    console.log('File names:', selectedFiles.map(f => f.name));

    if (selectedFiles.length === 0) return;

    console.log('Setting uploading to true');
    setUploading(true);

    setAllUploadingFiles(prev => {
      console.log('Previous uploading files:', prev.length);
      const prevPaths = new Set(prev.map(f => f._relativePath || f.webkitRelativePath || f.name));
      const newFiles = selectedFiles.filter(f => !prevPaths.has(f._relativePath || f.webkitRelativePath || f.name));

      console.log('New files to upload:', newFiles.length);
      console.log('New file names:', newFiles.map(f => f.name));

      // Start upload for new files after state update
      if (newFiles.length > 0) {
        console.log('Scheduling uploadFiles call');
        setTimeout(() => {
          console.log('Calling uploadFiles with:', newFiles.length, 'files');
          uploadFiles(newFiles);
        }, 0);
      }

      const result = [...prev, ...newFiles];
      console.log('Final allUploadingFiles count:', result.length);
      return result;
    });
    setShowUploadMenu(false);
  };

  const handleFolderSelect = (e) => {
    console.log('=== FOLDER SELECT DEBUG ===');
    console.log('handleFolderSelect called');
    const selectedFiles = Array.from(e.target.files);
    console.log('Selected files:', selectedFiles.length);
    console.log('File names:', selectedFiles.map(f => f.name));

    if (selectedFiles.length === 0) return;

    console.log('Setting uploading to true');
    setUploading(true);

    setAllUploadingFiles(prev => {
      console.log('Previous uploading files:', prev.length);
      const prevPaths = new Set(prev.map(f => f._relativePath || f.webkitRelativePath || f.name));
      const newFiles = selectedFiles.filter(f => !prevPaths.has(f._relativePath || f.webkitRelativePath || f.name));

      console.log('New files to upload:', newFiles.length);
      console.log('New file names:', newFiles.map(f => f.name));

      // Start upload for new files after state update
      if (newFiles.length > 0) {
        console.log('Scheduling uploadFiles call');
        setTimeout(() => {
          console.log('Calling uploadFiles with:', newFiles.length, 'files');
          uploadFiles(newFiles);
        }, 0);
      }

      const result = [...prev, ...newFiles];
      console.log('Final allUploadingFiles count:', result.length);
      return result;
    });
    setShowUploadMenu(false);
  };

  const uploadFiles = async (filesToUpload) => {
    console.log('=== UPLOAD FILES DEBUG ===');
    console.log('uploadFiles called with:', filesToUpload.length, 'files');
    console.log('File names in uploadFiles:', filesToUpload.map(f => f.name || f._relativePath));

    let anyError = false;
    await Promise.all(filesToUpload.map(async (file) => {
      try {
        const relativePath = file._relativePath || file.webkitRelativePath || file.name;
        console.log('Processing file:', relativePath);
        const key = (prefix || '') + relativePath;
        const res = await apiFetch('/api/storage/presign_upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, content_type: file.type || 'application/octet-stream' }),
        });
        if (!res.ok) {
          const err = await res.json();
          setUploadErrors(prev => ({ ...prev, [relativePath]: err.error || 'Failed to get upload URL' }));
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
              console.log('Upload completed for:', relativePath);
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
    console.log('All uploads completed');
    setUploading(false);
    if (!anyError) {
      fetchFiles();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear all upload state when all uploads are complete
    setTimeout(() => {
      setAllUploadingFiles([]);
      setUploadProgress({});
      setUploadErrors({});
      setUploadSpeeds({});
      setUploadStartTimes({});
    }, 2000); // Wait 2 seconds after completion to show "Done" status
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-4xl">
        <Card
          className={`w-full transition-all duration-200 ${dragActive ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {dragActive && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center">
                <div className="text-2xl mb-2">📁</div>
                <div className="text-lg font-semibold">Drop files or folders here</div>
                <div className="text-sm text-muted-foreground">Release to upload</div>
              </div>
            </div>
          )}
          <CardHeader className="flex flex-col gap-2">
            {/* Top row: Back button (if not root), Breadcrumbs (left), New Folder and Upload (right) */}
            <div className="flex items-center justify-between w-full mb-1">
              <div className="flex items-center gap-2 min-h-[40px]">
                {prefix && (
                  <Button size="icon" variant="ghost" onClick={handleBack} title="Back to parent folder">
                    <span className="text-xl">‹</span>
                  </Button>
                )}
                <Breadcrumbs
                  path={prefix}
                  onNavigate={handleBreadcrumbNavigate}
                  className={!prefix ? 'ml-4' : ''}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2" onClick={() => setShowCreateFolder(true)}>
                  <span><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder"><path d="M3 7V5a2 2 0 0 1 2-2h2.17a2 2 0 0 1 1.41.59l1.83 1.82A2 2 0 0 0 12.83 6H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg></span>
                  New Folder
                </Button>
                <Popover open={showUploadMenu} onOpenChange={setShowUploadMenu}>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2"
                      onClick={() => setShowUploadMenu(v => !v)}
                      disabled={uploading}
                    >
                      <span><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg></span>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-2">
                    <button
                      className="w-full text-left px-3 py-2 rounded hover:bg-accent text-foreground"
                      onClick={() => { setShowUploadMenu(false); fileInputRef.current?.click(); }}
                      disabled={uploading}
                    >
                      Upload Files
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded hover:bg-accent text-foreground"
                      onClick={() => { setShowUploadMenu(false); folderInputRef.current?.click(); }}
                      disabled={uploading}
                    >
                      Upload Folder
                    </button>
                  </PopoverContent>
                </Popover>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  webkitdirectory=""
                  onChange={handleFolderSelect}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </div>
            </div>
            {/* Second row: Search (left, full width), Filter (right) */}
            <div className="flex items-center justify-between w-full mb-2 gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="w-4 h-4" />
                </span>
                <Input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search files and folders..."
                  className="w-full pl-10 pr-8 h-9 bg-muted rounded-md border-none focus:ring-2 focus:ring-primary"
                />
                {search && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch('')}
                    tabIndex={-1}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="ml-2 bg-muted text-muted-foreground hover:text-foreground rounded-md flex items-center gap-2 px-4 h-9"
                onClick={() => setShowFilterBar(true)}
              >
                <FilterIcon className="w-4 h-4" />
                Filter
              </Button>
            </div>
            {/* Filter Bar (only visible when toggled) */}
            {showFilterBar && (
              <div className="flex items-center gap-4 bg-accent border border-border rounded-lg px-6 py-3 mb-2 min-h-[48px] relative shadow-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">File Type</label>
                  <Select value={filterType} onValueChange={v => setFilterType(v)}>
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                      <SelectItem value="txt">TXT</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="mp3">MP3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Min Size (MB)</label>
                  <Input
                    type="number"
                    min="0"
                    value={minSize}
                    onChange={e => setMinSize(e.target.value)}
                    className="w-24 h-9"
                    placeholder="Any"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Max Size (MB)</label>
                  <Input
                    type="number"
                    min="0"
                    value={maxSize}
                    onChange={e => setMaxSize(e.target.value)}
                    className="w-24 h-9"
                    placeholder="Any"
                  />
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => { setFilterType('all'); setMinSize(''); setMaxSize(''); fetchFiles(); }} className="h-9">Clear</Button>
                </div>
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => setShowFilterBar(false)} title="Close filter bar">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Upload progress indicator */}
            {uploading && (
              <div className="mb-4 p-3 bg-muted border border-border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-foreground text-base">Upload Progress</h4>
                  <span className="text-xs text-muted-foreground">
                    {Object.values(uploadProgress).filter(p => p === 100).length} / {Object.keys(uploadProgress).length} completed
                  </span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {allUploadingFiles.map(file => {
                    const progress = uploadProgress[file._relativePath || file.webkitRelativePath || file.name] || 0;
                    const error = uploadErrors[file._relativePath || file.webkitRelativePath || file.name];
                    const speed = uploadSpeeds[file._relativePath || file.webkitRelativePath || file.name];
                    let eta = null;
                    if (speed && file.size && progress < 100) {
                      const remaining = file.size * (1 - progress / 100);
                      eta = speed > 0 ? Math.ceil(remaining / speed) : null;
                    }
                    return (
                      <div key={file._relativePath || file.webkitRelativePath || file.name} className="flex flex-col gap-0 px-0 py-1">
                        <div className="flex items-center justify-between text-xs mb-0.5 w-full">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="truncate font-semibold text-foreground max-w-[180px]">{file._relativePath || file.webkitRelativePath || file.name}</span>
                            {file.size && <span className="text-muted-foreground">{formatBytes(file.size)}</span>}
                            {speed && <span className="text-muted-foreground">{formatBytes(speed)}/s</span>}
                            {eta !== null && <span className="text-muted-foreground">{eta}s left</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-1 ml-2">
                            <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
                              <div
                                className="h-2 rounded-full bg-green-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="font-semibold text-foreground" style={{ minWidth: 28, textAlign: 'right' }}>{progress}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end mt-0.5 text-[11px] min-h-[16px]">
                          {error ? (
                            <span className="text-destructive">{error}</span>
                          ) : (
                            <span className="text-primary">{progress < 100 ? 'Uploading...' : 'Done'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(selectedFiles.length > 0 || selectedFolders.length > 0) && (
              <div className="flex items-center justify-between bg-muted border border-border rounded-lg px-4 py-2 mb-2 w-full">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {selectedFiles.length + selectedFolders.length} item{selectedFiles.length + selectedFolders.length > 1 ? 's' : ''} selected
                  </span>
                  <button onClick={handleClearSelection} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                    <X className="w-4 h-4" /> Clear
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1" onClick={handleBulkDownload} disabled={bulkActionLoading || selectedFiles.length === 0}>
                    <Download className="w-4 h-4" /> Download Selected
                  </Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1" onClick={handleBulkDelete} disabled={bulkActionLoading}>
                    <Trash2 className="w-4 h-4" /> Delete Selected
                  </Button>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1" onClick={() => setShowShareModal(true)} disabled={selectedFiles.length + selectedFolders.length !== 1}>
                    <Share2 className="w-4 h-4" /> Share Selected
                  </Button>
                </div>
              </div>
            )}
            <FileList
              folders={folders}
              files={files}
              onOpenFolder={handleOpenFolder}
              onDownload={handleDownload}
              onDelete={handleDelete}
              downloading={downloading}
              deleting={deleting}
              onDeleteFolder={handleDeleteFolder}
              deletingFolders={deletingFolders}
              onRenameFolder={setRenamingFolder}
              renamingFolder={renamingFolder}
              onRenameFile={setRenamingFile}
              renamingFile={renamingFile}
              selectedFiles={selectedFiles}
              selectedFolders={selectedFolders}
              onSelectFile={handleSelectFile}
              onSelectFolder={handleSelectFolder}
              isAllSelected={isAllSelected}
              onSelectAll={handleSelectAll}
              onShareFile={handleShareFile}
            />
          </CardContent>
          <CreateFolderModal
            isOpen={showCreateFolder}
            onClose={() => setShowCreateFolder(false)}
            onSuccess={fetchFiles}
            currentPrefix={prefix}
          />
          <ShareModal open={showShareModal} onClose={() => { setShowShareModal(false); setSharingFile(null); }} item={sharingFile} />
        </Card>
      </div>
      {/* ConfirmDialog for file delete */}
      <ConfirmDialog
        open={!!pendingDeleteFile}
        onOpenChange={open => { if (!open) setPendingDeleteFile(null); }}
        title="Delete File"
        description={`Are you sure you want to delete "${pendingDeleteFile}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDeleteFile}
        loading={deleting.has(pendingDeleteFile)}
      />
      {/* ConfirmDialog for folder delete */}
      <ConfirmDialog
        open={!!pendingDeleteFolder}
        onOpenChange={open => { if (!open) setPendingDeleteFolder(null); }}
        title="Delete Folder"
        description={`Are you sure you want to delete the folder "${pendingDeleteFolder?.name}" and all its contents? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDeleteFolder}
        loading={deletingFolders.has(pendingDeleteFolder?.prefix)}
      />
      {/* ConfirmDialog for bulk delete */}
      <ConfirmDialog
        open={pendingBulkDelete}
        onOpenChange={open => { if (!open) setPendingBulkDelete(false); }}
        title="Delete Selected Items"
        description={`Delete ${selectedFiles.length + selectedFolders.length} items? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmBulkDelete}
        loading={bulkActionLoading}
      />
    </div>
  );
}
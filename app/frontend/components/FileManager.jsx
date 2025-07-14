import React, { useEffect, useState, useRef, useCallback } from 'react';
import { format, formatDistanceToNow, subDays, isAfter, parseISO } from 'date-fns';
import { ArrowUp, ArrowDown, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { apiFetch } from '@/lib/api';
import { Download, Trash2, Share2, X, Search, Filter as FilterIcon, Pencil, FolderPlus, Upload, Folder, File as FileIcon, Image as ImageIcon, FileText, FileCode, FileArchive, FileSpreadsheet, FileAudio, FileVideo } from 'lucide-react';
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
import { showToast } from '@/lib/toast';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
  const sevenDaysAgo = subDays(new Date(), 7);
  if (isAfter(d, sevenDaysAgo)) {
    // Show relative time for files modified within the last 7 days
    let rel = formatDistanceToNow(d, { addSuffix: true });
    if (rel.startsWith('about ')) rel = rel.replace('about ', '');
    return rel;
  } else {
    // Show short absolute date for older files
    return format(d, 'd MMM yyyy, h:mm a');
  }
}

function isViewableFile(filename) {
  const viewableExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', // Images
    '.pdf', // PDFs
    '.txt', '.json', // Text files
    '.html', '.htm', // Web files
    '.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', // Videos
    '.mp3', '.wav', '.ogg', '.flac', '.aac', // Audio
  ];

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return viewableExtensions.includes(extension);
}

function Breadcrumbs({ path, onNavigate, className }) {
  const parts = path ? path.split('/').filter(Boolean) : [];
  return (
    <nav className={`flex items-center gap-0 text-sm text-muted-foreground ${className || ''}`} style={{ minWidth: 0 }}>
      <button className="hover:underline" onClick={() => onNavigate('')}>/</button>
      {parts.map((crumb, idx) => {
        const fullPath = parts.slice(0, idx + 1).join('/') + '/';
        const isLast = idx === parts.length - 1;
        return (
          <span key={idx} className="flex items-center gap-0 min-w-0">
            {!isLast ? (
              <button
                className="hover:underline max-w-[120px] truncate"
                style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
                onClick={() => onNavigate(fullPath)}
                title={crumb}
              >
                {crumb}
              </button>
            ) : (
              <span className="font-semibold max-w-[120px] truncate" style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} title={crumb}>{crumb}</span>
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
      showToast.success('Folder created successfully');
    } catch (err) {
      let errorMessage = err.message;
      if (err.message.includes('permission') || err.message.includes('denied')) {
        errorMessage = 'Permission denied. Cannot create folder in this location.';
      } else if (err.message.includes('already exists')) {
        errorMessage = 'A folder with this name already exists.';
      }
      setError(errorMessage);
      showToast.error('Failed to create folder', errorMessage);
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



// Map file extensions to Lucide icons and colors
const fileTypeIconMap = [
  { exts: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'], icon: ImageIcon, color: 'text-blue-400' },
  { exts: ['.pdf'], icon: FileText, color: 'text-red-500' },
  { exts: ['.txt', '.md', '.json', '.xml', '.log'], icon: FileText, color: 'text-gray-400' },
  { exts: ['.zip', '.rar', '.tar', '.gz', '.7z'], icon: FileArchive, color: 'text-yellow-600' },
  { exts: ['.xls', '.xlsx', '.ods', '.csv'], icon: FileSpreadsheet, color: 'text-green-500' },
  { exts: ['.mp3', '.wav', '.ogg'], icon: FileAudio, color: 'text-purple-500' },
  { exts: ['.mp4', '.webm', '.ogg', '.mov'], icon: FileVideo, color: 'text-indigo-500' },
  { exts: ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java', '.c', '.cpp', '.cs', '.sh'], icon: FileCode, color: 'text-pink-500' },
  { exts: ['.doc', '.docx'], icon: FileText, color: 'text-blue-600' },
  { exts: ['.exe'], icon: FileArchive, color: 'text-gray-500' },
];

function getFileIconByExtension(filename) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  for (const { exts, icon, color } of fileTypeIconMap) {
    if (exts.includes(ext)) {
      return { Icon: icon, color };
    }
  }
  return { Icon: FileIcon, color: 'text-muted-foreground' };
}

// Add these new components above FileList
function FolderRow({ folder, isSelected, onSelectFolder, onOpenFolder, renamingFolder, onRenameFolder, onDeleteFolder, deletingFolders, ...props }) {
  const folderNameRef = React.useRef(null);
  const [isFolderTruncated, setIsFolderTruncated] = React.useState(false);
  React.useEffect(() => {
    if (folderNameRef.current) {
      setIsFolderTruncated(folderNameRef.current.scrollWidth > folderNameRef.current.clientWidth);
    }
  }, [folder.name]);

  return (
    <tr key={folder.prefix} className={`border-b border-border group transition-all duration-150 ${isSelected ? 'bg-primary/10 border-primary/30 text-primary' : 'hover:bg-accent/40'} rounded-lg` }>
      <td className="w-8 px-2 h-[65px] align-middle">
        <Checkbox
          checked={isSelected}
          onCheckedChange={checked => onSelectFolder(folder.prefix, checked)}
          onClick={e => e.stopPropagation()}
          aria-label="Select folder"
        />
      </td>
      <td className="py-3 px-4 flex items-center gap-3 h-[65px] align-middle max-w-[60vw] sm:max-w-[40vw] md:max-w-[30vw] min-w-0 w-full cursor-pointer hover:underline font-semibold" onClick={() => onOpenFolder(folder.prefix)}>
        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          <Folder className="w-5 h-5 text-yellow-600 fill-yellow-400 group-hover:scale-110 transition-transform" />
        </span>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                ref={folderNameRef}
                className="truncate overflow-hidden whitespace-nowrap min-w-0 flex-1 cursor-pointer hover:underline font-semibold"
                onClick={() => onOpenFolder(folder.prefix)}
              >
                {folder.name}
              </span>
            </TooltipTrigger>
            {isFolderTruncated && (
              <TooltipContent>
                {folder.name}
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </td>
      <td className="py-3 px-4 text-muted-foreground h-[65px] align-middle">—</td>
      <td className="py-3 px-4 text-muted-foreground h-[65px] align-middle">—</td>
      <td className="py-3 px-4 text-right h-[65px] align-middle">
        <div className="flex items-center gap-1 justify-end">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Rename folder" onClick={e => { e.stopPropagation(); onRenameFolder(folder.prefix); }}>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Delete folder" onClick={e => { e.stopPropagation(); onDeleteFolder(folder.prefix, folder.name); }} disabled={deletingFolders.has(folder.prefix)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </td>
    </tr>
  );
}

function FileRow({ file, isSelected, onSelectFile, renamingFile, onRenameFile, downloading, onDownload, onShareFile, ...props }) {
  const fileNameRef = React.useRef(null);
  const [isFileTruncated, setIsFileTruncated] = React.useState(false);
  React.useEffect(() => {
    if (fileNameRef.current) {
      setIsFileTruncated(fileNameRef.current.scrollWidth > fileNameRef.current.clientWidth);
    }
  }, [file.key]);

  // ...copy the row rendering logic from FileList's files.map here, replacing hooks with the above
  // Use fileNameRef and isFileTruncated as needed
  // Pass through any other props as needed

  return (
    <tr key={file.key} className={`border-b border-border group transition-all duration-150 ${isSelected ? 'bg-primary/10 border-primary/30 text-primary' : 'hover:bg-accent/40'} rounded-lg`}>
      <td className="w-8 px-2 align-middle h-[65px]">
        <Checkbox
          checked={isSelected}
          onCheckedChange={checked => onSelectFile(file.key, checked)}
          onClick={e => e.stopPropagation()}
          aria-label="Select file"
        />
      </td>
      <td className="py-3 px-4 flex items-center gap-3 align-middle h-[65px] max-w-[60vw] sm:max-w-[40vw] md:max-w-[30vw] min-w-0 w-full">
        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {(() => {
            const { Icon, color } = getFileIconByExtension(file.key);
            return <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />;
          })()}
        </span>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <span 
                ref={fileNameRef} 
                className={`truncate font-semibold min-w-0 flex-1 ${isViewableFile(file.key) ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                onClick={() => {
                  if (isViewableFile(file.key)) {
                    onDownload(file.key, true); // Open in new tab for viewable files
                  }
                }}
              >
            {file.key.split('/').pop()}
          </span>
            </TooltipTrigger>
            {isFileTruncated && (
              <TooltipContent>
                {file.key.split('/').pop()}
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </td>
      <td className="py-3 px-4 align-middle h-[65px]">{formatSize(file.size)}</td>
      <td className="py-3 px-4 align-middle h-[65px]">{formatDate(file.last_modified)}</td>
      <td className="py-3 px-4 text-right align-middle h-[65px]">
        <div className="flex items-center gap-1 justify-end">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Share file" onClick={e => { e.stopPropagation(); onShareFile(file); }}>
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Rename file" onClick={e => { e.stopPropagation(); onRenameFile(file.key); }}>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Delete file" onClick={e => { e.stopPropagation(); onDownload(file.key, false); }} disabled={downloading.has(file.key)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Download file" onClick={e => { e.stopPropagation(); onDownload(file.key, false); }} disabled={downloading.has(file.key)}>
                <Download className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

function FileList({ folders, files, onOpenFolder, onDownload, onDelete, downloading, deleting, onDeleteFolder, deletingFolders, onRenameFolder, renamingFolder, onRenameFile, renamingFile, selectedFiles, selectedFolders, onSelectFile, onSelectFolder, isAllSelected, onSelectAll, onShareFile, onSort, sortBy, sortOrder, loading }) {
  const tableClass = "min-w-full text-sm rounded-lg overflow-hidden shadow-lg bg-card table-fixed";
  const colWidths = [
    "w-8 px-2 py-3", // Checkbox
    "w-[40%] text-left py-3 px-4 font-semibold", // Name
    "w-[15%] text-left py-3 px-4 font-semibold", // Size
    "w-[25%] text-left py-3 px-4 font-semibold", // Last Modified
    "w-[20%] py-3 px-4" // Actions
  ];
  if (loading) {
    // Render skeleton table
    return (
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead className="bg-muted/60">
            <tr className="border-b border-border">
              <th className={colWidths[0]}><Skeleton className="h-4 w-4 rounded" /></th>
              <th className={colWidths[1]}> <Skeleton className="h-4 w-24 rounded" /> </th>
              <th className={colWidths[2]}> <Skeleton className="h-4 w-16 rounded" /> </th>
              <th className={colWidths[3]}> <Skeleton className="h-4 w-24 rounded" /> </th>
              <th className={colWidths[4]}> <Skeleton className="h-4 w-8 rounded" /> </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className={colWidths[0]}> <Skeleton className="h-4 w-4 rounded" /> </td>
                <td className={colWidths[1]}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-4 w-40 rounded" />
                  </div>
                </td>
                <td className={colWidths[2]}> <Skeleton className="h-4 w-12 rounded" /> </td>
                <td className={colWidths[3]}> <Skeleton className="h-4 w-20 rounded" /> </td>
                <td className={colWidths[4]}>
                  <div className="flex items-center gap-1 justify-end">
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (!folders.length && !files.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Folder className="w-12 h-12 mb-3 text-muted-foreground/60" />
        <div className="text-base font-semibold mb-1">No files or folders</div>
        <div className="text-sm">Upload or create a folder to get started.</div>
      </div>
    );
  }
  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead className="bg-muted/60">
            <tr className="border-b border-border">
              <th className={colWidths[0]}>
                <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} aria-label="Select all" />
              </th>
              <th
                className={colWidths[1] + ` group transition-colors ${sortBy === 'name' ? 'text-primary font-bold' : ''}`}
                onClick={() => onSort('name')}
                title="Sort by Name"
              >
                <span className="inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                  Name
                  {sortBy === 'name' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-5 h-5 text-primary" />
                    ) : (
                      <ArrowDown className="w-5 h-5 text-primary" />
                    )
                  ) : (
                    <ArrowDown className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  )}
                </span>
              </th>
              <th
                className={colWidths[2] + ` group transition-colors ${sortBy === 'size' ? 'text-primary font-bold' : ''}`}
                onClick={() => onSort('size')}
                title="Sort by Size"
              >
                <span className="inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                  Size
                  {sortBy === 'size' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-5 h-5 text-primary" />
                    ) : (
                      <ArrowDown className="w-5 h-5 text-primary" />
                    )
                  ) : (
                    <ArrowDown className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  )}
                </span>
              </th>
              <th
                className={colWidths[3] + ` group transition-colors ${sortBy === 'last_modified' ? 'text-primary font-bold' : ''}`}
                onClick={() => onSort('last_modified')}
                title="Sort by Last Modified"
              >
                <span className="inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                  Last Modified
                  {sortBy === 'last_modified' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-5 h-5 text-primary" />
                    ) : (
                      <ArrowDown className="w-5 h-5 text-primary" />
                    )
                  ) : (
                    <ArrowDown className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  )}
                </span>
              </th>
              <th className={colWidths[4]}></th>
            </tr>
          </thead>
          <tbody>
            {/* Folders */}
            {folders.map(folder => (
              <FolderRow
                key={folder.prefix}
                        folder={folder}
                isSelected={selectedFolders.includes(folder.prefix)}
                onSelectFolder={onSelectFolder}
                onOpenFolder={onOpenFolder}
                renamingFolder={renamingFolder}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                deletingFolders={deletingFolders}
              />
            ))}
            {/* Files */}
            {files.map(file => (
              <FileRow
                key={file.key}
                file={file}
                isSelected={selectedFiles.includes(file.key)}
                onSelectFile={onSelectFile}
                renamingFile={renamingFile}
                onRenameFile={onRenameFile}
                downloading={downloading}
                onDownload={onDownload}
                onShareFile={onShareFile}
                // ...pass other needed props
              />
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

export default function FileManager({ activeBucket }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prefix, setPrefix] = useState(''); // current folder path
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
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

  const [showUploadProgress, setShowUploadProgress] = useState(false);

  const CATEGORY_OPTIONS = [
    { value: 'all', label: 'All Categories' },
    { value: 'documents', label: 'Documents' },
    { value: 'images', label: 'Images' },
    { value: 'videos', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'archives', label: 'Archives' },
    { value: 'code', label: 'Code' },
    { value: 'spreadsheets', label: 'Spreadsheets' },
    { value: 'presentations', label: 'Presentations' },
  ];
  const FILE_TYPE_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'DOCX' },
    { value: 'txt', label: 'TXT' },
    { value: 'jpg', label: 'JPG' },
    { value: 'png', label: 'PNG' },
    { value: 'csv', label: 'CSV' },
    { value: 'mp4', label: 'MP4' },
    { value: 'mp3', label: 'MP3' },
    { value: 'zip', label: 'ZIP' },
    { value: 'json', label: 'JSON' },
    { value: 'xlsx', label: 'XLSX' },
    { value: 'pptx', label: 'PPTX' },
  ];
  const [category, setCategory] = useState('all');
  const [fileType, setFileType] = useState('all');

  // Add a mapping from category to extensions
  const CATEGORY_EXTENSION_MAP = {
    documents: ['pdf', 'doc', 'docx', 'txt', 'md', 'odt', 'rtf'],
    images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
    videos: ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv'],
    audio: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'],
    archives: ['zip', 'rar', '7z', 'tar', 'gz'],
    code: ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'java', 'c', 'cpp', 'cs', 'sh', 'json'],
    spreadsheets: ['xls', 'xlsx', 'ods', 'csv'],
    presentations: ['ppt', 'pptx', 'odp'],
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = prefix ? `/api/storage/files?prefix=${encodeURIComponent(prefix)}` : '/api/storage/files';
      const params = [];
      if (filterType && filterType !== 'all' && category === 'all') params.push(`filter_type=${encodeURIComponent(fileType)}`);
      if (category && category !== 'all' && fileType === 'all') {
        // Send all extensions in this category as a comma-separated list
        const exts = CATEGORY_EXTENSION_MAP[category];
        if (exts && exts.length) params.push(`filter_category=${encodeURIComponent(exts.join(','))}`);
      }
      if (minSize) params.push(`min_size=${parseInt(minSize * 1024 * 1024)}`); // MB to bytes
      if (maxSize) params.push(`max_size=${parseInt(maxSize * 1024 * 1024)}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (sortBy) params.push(`sort_by=${encodeURIComponent(sortBy)}`);
      if (sortOrder) params.push(`sort_order=${encodeURIComponent(sortOrder)}`);
      if (params.length) url += (url.includes('?') ? '&' : '?') + params.join('&');
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch files');
        setFolders([]);
        setFiles([]);
        setLoading(false);
        return;
      }
      // Sort folders and files by selected column and direction
      const sortFn = (a, b) => {
        let aVal, bVal;
        if (sortBy === 'name') {
          aVal = (a.name || a.key || a.prefix || '').toLowerCase();
          bVal = (b.name || b.key || b.prefix || '').toLowerCase();
        } else if (sortBy === 'size') {
          aVal = a.size || 0;
          bVal = b.size || 0;
        } else if (sortBy === 'last_modified') {
          aVal = new Date(a.last_modified || 0).getTime();
          bVal = new Date(b.last_modified || 0).getTime();
        }
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      };
      const sortedFolders = (data.folders || []).slice().sort(sortFn);
      const sortedFiles = (data.files || []).slice().sort(sortFn);
      setFolders(sortedFolders);
      setFiles(sortedFiles);
    } catch (err) {
      setError('Network error');
      setFolders([]);
      setFiles([]);
    }
    setLoading(false);
  }, [prefix, filterType, fileType, category, minSize, maxSize, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchFiles();
  }, [category, fileType, minSize, maxSize, search, sortBy, sortOrder, prefix]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchFiles();
    };

    window.addEventListener('refreshFileList', handleRefresh);
    return () => {
      window.removeEventListener('refreshFileList', handleRefresh);
    };
  }, [fetchFiles]);

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
      showToast.error('Download failed', err.message);
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
      showToast.success('File deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast.error('Delete failed', err.message);
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
      showToast.success('Folder deleted successfully');
    } catch (err) {
      console.error('Delete folder failed:', err);
      showToast.error('Delete folder failed', err.message);
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
      setShowUploadProgress(true);
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
    
    // Show bulk operation result
    const totalItems = selectedFiles.length + selectedFolders.length;
    const errorCount = Object.keys(bulkActionError).length;
    if (errorCount === 0) {
      showToast.success(`Successfully deleted ${totalItems} items`);
    } else if (errorCount === totalItems) {
      showToast.error('Failed to delete items', 'All items failed to delete');
    } else {
      showToast.warning(`Partially completed`, `${totalItems - errorCount} items deleted, ${errorCount} failed`);
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
    setShowUploadProgress(true);

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
    setShowUploadProgress(true);

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
          let errorMessage = 'Failed to get upload URL';
          if (err.error) {
            if (err.error.includes('permission') || err.error.includes('denied')) {
              errorMessage = 'Permission denied. Cannot upload to this location.';
            } else if (err.error.includes('bucket') || err.error.includes('not found')) {
              errorMessage = 'Bucket not found or inaccessible.';
            } else if (err.error.includes('credentials')) {
              errorMessage = 'Invalid credentials. Please reconnect your bucket.';
            } else {
              errorMessage = err.error;
            }
          }
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
      if (filesToUpload.length === 1) {
        showToast.success('File uploaded successfully');
      } else {
        showToast.success('All files uploaded successfully');
      }
    }
    setTimeout(() => {
      setAllUploadingFiles([]);
      setUploadProgress({});
      setUploadErrors({});
      setUploadSpeeds({});
      setUploadStartTimes({});
      setShowUploadProgress(false);
    }, 2000); // Wait 2 seconds after completion to show "Done" status
  };

  // Sorting handler for column headers
  const onSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleRefresh = () => {
    fetchFiles();
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full">
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
            <div className="flex items-center gap-2 mb-4 w-full">
                {prefix && (
                <Button size="icon" variant="ghost" onClick={handleBack} title="Back to parent folder" className="flex-shrink-0 mr-1">
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                  </Button>
                )}
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                <Breadcrumbs path={prefix} onNavigate={handleBreadcrumbNavigate} className="whitespace-nowrap" />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Button size="sm" className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2" onClick={() => setShowCreateFolder(true)}>
                  <FolderPlus className="w-4 h-4 text-white" />
                  New Folder
                </Button>
                <Button size="sm" className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2" onClick={() => setShowUploadMenu(v => !v)} disabled={uploading}>
                      <Upload className="w-4 h-4 text-white" />
                  Upload
                    </Button>
                <Button size="icon" variant="ghost" onClick={handleRefresh} title="Refresh" className="flex-shrink-0">
                  <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                </Button>
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
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 bg-muted/80 border border-border rounded-lg px-6 py-4 mb-4 shadow-sm w-full">
                <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
                  <label className="text-xs text-muted-foreground font-medium mb-1" htmlFor="filter-category">Category</label>
                  <Select
                    value={category}
                    onValueChange={v => {
                      setCategory(v);
                      if (v !== 'all') {
                        setFileType('all');
                      }
                    }}
                    disabled={fileType !== 'all'}
                  >
                    <SelectTrigger id="filter-category" className="w-full h-9">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
                  <label className="text-xs text-muted-foreground font-medium mb-1" htmlFor="filter-type">File Type</label>
                  <Select
                    value={fileType}
                    onValueChange={v => {
                      setFileType(v);
                      if (v !== 'all') {
                        setCategory('all');
                      }
                    }}
                    disabled={category !== 'all'}
                  >
                    <SelectTrigger id="filter-type" className="w-full h-9">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILE_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-[100px]">
                  <label className="text-xs text-muted-foreground font-medium mb-1" htmlFor="min-size">Min Size (MB)</label>
                  <Input
                    id="min-size"
                    type="number"
                    min="0"
                    value={minSize}
                    onChange={e => setMinSize(e.target.value)}
                    className="w-full h-9"
                    placeholder="Any"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-[100px]">
                  <label className="text-xs text-muted-foreground font-medium mb-1" htmlFor="max-size">Max Size (MB)</label>
                  <Input
                    id="max-size"
                    type="number"
                    min="0"
                    value={maxSize}
                    onChange={e => setMaxSize(e.target.value)}
                    className="w-full h-9"
                    placeholder="Any"
                  />
                </div>
                <div className="flex flex-row gap-2 sm:ml-4 mt-2 sm:mt-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    onClick={() => {
                      setCategory('all');
                      setFileType('all');
                      setMinSize('');
                      setMaxSize('');
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    type="button"
                    className="h-9"
                    onClick={() => setShowFilterBar(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Upload progress indicator */}
            {showUploadProgress && (
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
                            <Progress value={progress} className={error ? 'bg-destructive/20' : ''}>
                              <div className={`h-2 rounded-full ${error ? 'bg-destructive' : 'bg-primary'} transition-all`} style={{ width: `${progress}%` }} />
                            </Progress>
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
              <div className="flex items-center justify-between bg-muted/80 border border-border rounded-lg px-4 py-2 mb-3 w-full animate-in fade-in-0 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {selectedFiles.length + selectedFolders.length} item{selectedFiles.length + selectedFolders.length > 1 ? 's' : ''} selected
                  </span>
                  <button onClick={handleClearSelection} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                    <X className="w-4 h-4" /> Clear
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1" onClick={handleBulkDownload} disabled={bulkActionLoading || selectedFiles.length === 0}>
                    <Download className="w-4 h-4" /> Download Selected
                  </Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1" onClick={handleBulkDelete} disabled={bulkActionLoading}>
                    <Trash2 className="w-4 h-4" /> Delete Selected
                  </Button>
                </div>
              </div>
            )}
            {error && !loading && (
              <div className="mb-4 w-full flex items-center justify-center">
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded text-sm">
                  {error}
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
              onSort={onSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
              loading={loading}
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
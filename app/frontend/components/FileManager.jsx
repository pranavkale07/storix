import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, RefreshCw, Download, Trash2, X, Search, Filter as FilterIcon, FolderPlus, Upload, Folder, ArrowUp, ArrowDown, Share2, Pencil, File as FileIcon, Image as ImageIcon, FileText, FileCode, FileArchive, FileSpreadsheet, FileAudio, FileVideo } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { apiFetch } from '@/lib/api';
import ConfirmDialog from './ConfirmDialog';
import { showToast } from '@/components/utils/toast';
import { useFileManagerState } from '@/hooks/useFileManagerState';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useFileSelection } from '@/hooks/useFileSelection';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useFileDrop } from '@/hooks/useFileDrop';
import { useDialogState } from '@/hooks/useDialogState';
import FileList from './filemanager/FileList';
import CreateFolderModal from './filemanager/CreateFolderModal';
import ShareModal from './ShareModal';
import { format, formatDistanceToNow, subDays, isAfter, parseISO } from 'date-fns';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Input } from './ui/input';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import Breadcrumbs from './filemanager/Breadcrumbs';
import { Progress } from './ui/progress';
import { CATEGORY_OPTIONS, FILE_TYPE_OPTIONS, CATEGORY_EXTENSION_MAP } from '@/lib/fileConstants';
import { formatBytes } from '@/lib/fileUtils';

export default function FileManager({ activeBucket }) {
  // Use the custom hook for all core state and logic
  const {
    folders,
    files,
    loading,
    error,
    prefix,
    sortBy,
    sortOrder,
    filterType,
    minSize,
    maxSize,
    search,
    category,
    fileType,
    setSortBy,
    setSortOrder,
    setFilterType,
    setMinSize,
    setMaxSize,
    setSearch,
    setCategory,
    setFileType,
    handleOpenFolder,
    handleBreadcrumbNavigate,
    handleBack,
    fetchFiles,
    setPrefix,
    clearCache,
  } = useFileManagerState(activeBucket);

  const handleRefresh = () => {
    clearCache();
    fetchFiles();
  };

  const {
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
  } = useFileUpload(prefix, fetchFiles, clearCache);

  const {
    selectedFiles,
    selectedFolders,
    handleSelectAll,
    handleSelectFile,
    handleSelectFolder,
    handleClearSelection,
    isAllSelected,
    setSelectedFiles,
    setSelectedFolders,
  } = useFileSelection(files, folders);

  // Remove all now-redundant state and logic for these from the component.
  // Keep upload, selection, and bulk action logic in the component for now.
  const [deleting, setDeleting] = useState(new Set());
  const [deletingFolders, setDeletingFolders] = useState(new Set());
  // Dialog/modal state (from useDialogState)
  const {
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
    // Optionally, helpers: open/close functions
  } = useDialogState();

  // Bulk actions state and handlers (from useBulkActions)
  const {
    bulkActionLoading,
    bulkActionProgress,
    bulkActionError,
    pendingBulkDelete,
    setPendingBulkDelete,
    handleBulkDelete,
    confirmBulkDelete,
    handleBulkDownload,
  } = useBulkActions({
    selectedFiles,
    selectedFolders,
    setSelectedFiles,
    setSelectedFolders,
    fetchFiles,
    showToast,
    clearCache,
  });

  const fileInputRef = useRef();
  const folderInputRef = useRef();
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const filterDebounceRef = useRef();

  useEffect(() => {
    fetchFiles();
  }, [category, fileType, minSize, maxSize, sortBy, sortOrder, prefix]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchFiles();
    };

    window.addEventListener('refreshFileList', handleRefresh);
    return () => {
      window.removeEventListener('refreshFileList', handleRefresh);
    };
  }, [fetchFiles]);

  // Memoized handlers
  const handleDownload = useCallback(async (fileKey, inline = false) => {
    if (deleting.has(fileKey)) return;
    setDeleting(prev => new Set(prev).add(fileKey));
    try {
      const response = await apiFetch('/api/storage/presign_download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: fileKey, inline: inline.toString() }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Failed to generate download link';
        
        // Handle bucket usage limit errors
        if (errorData.type === 'bucket_usage_limit_exceeded') {
          errorMessage = errorData.message || 'Download limit exceeded for this bucket.';
          showToast.warning(errorMessage, 'You have reached your monthly download limit for this bucket.');
        }
        
        throw new Error(errorMessage);
      }
      const { presigned_url } = await response.json();
      if (inline) {
        window.open(presigned_url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = presigned_url;
        link.download = fileKey.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download failed:', err);
      showToast.error('Download failed', err.message);
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  }, [deleting, showToast]);

  const handleDelete = useCallback(async (fileKey) => {
    if (deleting.has(fileKey)) return;
    setPendingDeleteFile(fileKey);
  }, [deleting]);

  const confirmDeleteFile = useCallback(async () => {
    const fileKey = pendingDeleteFile;
    if (!fileKey) return;
    setDeleting(prev => new Set(prev).add(fileKey));
    try {
      const response = await apiFetch('/api/storage/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: fileKey }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Failed to delete file';
        
        // Handle bucket usage limit errors
        if (errorData.type === 'bucket_usage_limit_exceeded') {
          errorMessage = errorData.message || 'Operation limit exceeded for this bucket.';
          showToast.warning(errorMessage, 'You have reached your monthly operation limit for this bucket.');
        }
        
        throw new Error(errorMessage);
      }
      clearCache();
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
  }, [pendingDeleteFile, fetchFiles, showToast]);

  const handleShareFile = useCallback((file) => {
    setSharingFile(file);
    setShowShareModal(true);
  }, []);

  const handleDeleteFolder = useCallback(async (folderPrefix, folderName) => {
    if (deletingFolders.has(folderPrefix)) return;
    setPendingDeleteFolder({ prefix: folderPrefix, name: folderName });
  }, [deletingFolders]);

  const confirmDeleteFolder = useCallback(async () => {
    const folderPrefix = pendingDeleteFolder?.prefix;
    if (!folderPrefix) return;
    setDeletingFolders(prev => new Set(prev).add(folderPrefix));
    try {
      const response = await apiFetch('/api/storage/delete_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: folderPrefix }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Failed to delete folder';
        
        // Handle bucket usage limit errors
        if (errorData.type === 'bucket_usage_limit_exceeded') {
          errorMessage = errorData.message || 'Operation limit exceeded for this bucket.';
          showToast.warning(errorMessage, 'You have reached your monthly operation limit for this bucket.');
        }
        
        throw new Error(errorMessage);
      }
      clearCache();
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
  }, [pendingDeleteFolder, fetchFiles, showToast]);

  // Drag-and-drop logic (from useFileDrop)
  const {
    dragActive,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useFileDrop({
    uploadFiles,
    setShowUploadProgress,
    setAllUploadingFiles,
    onDropError: (msg) => showToast.error('Upload Error', msg),
  });

  // Bulk Delete
  // const handleBulkDelete = async () => { setPendingBulkDelete(true); };
  // const confirmBulkDelete = async () => { ... };
  // Bulk Download
  // const handleBulkDownload = async () => { ... };

  // Determine the single selected item (file or folder)
  const singleSelectedFile = useMemo(() => (selectedFiles.length === 1 ? files.find(f => f.key === selectedFiles[0]) : null), [selectedFiles, files]);
  const singleSelectedFolder = useMemo(() => (selectedFolders.length === 1 ? folders.find(f => f.prefix === selectedFolders[0]) : null), [selectedFolders, folders]);
  const singleSelectedItem = useMemo(() => {
    if (singleSelectedFile || singleSelectedFolder) {
      return {
        key: singleSelectedFile ? singleSelectedFile.key : singleSelectedFolder.prefix,
        name: singleSelectedFile ? singleSelectedFile.key.split('/').pop() : singleSelectedFolder.name,
      };
    }
    return null;
  }, [singleSelectedFile, singleSelectedFolder]);

  // Auto-apply filters with debounce (search is now client-side, so no API call needed)
  useEffect(() => {
    if (!showFilterBar) return;
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      fetchFiles();
    }, 300);
    return () => clearTimeout(filterDebounceRef.current);
    // eslint-disable-next-line
  }, [filterType, minSize, maxSize, showFilterBar]);

  const onSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }, [sortBy, setSortBy, setSortOrder]);

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
                <Folder className="w-8 h-8 text-primary mb-2" />
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
                <Popover open={showUploadMenu} onOpenChange={setShowUploadMenu}>
                  <PopoverTrigger asChild>
                    <Button size="sm" className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2" disabled={uploading}>
                      <Upload className="w-4 h-4 text-white" />
                      Upload
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-0">
                    <div className="flex flex-col">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setShowUploadMenu(false);
                          fileInputRef.current?.click();
                        }}
                      >
                        Upload Files
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setShowUploadMenu(false);
                          folderInputRef.current?.click();
                        }}
                      >
                        Upload Folder
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={e => {
                    handleFileSelect(e, uploadFiles);
                    e.target.value = '';
                  }}
                />
                <input
                  type="file"
                  webkitdirectory="true"
                  ref={folderInputRef}
                  style={{ display: 'none' }}
                  onChange={e => {
                    handleFolderSelect(e, uploadFiles);
                    e.target.value = '';
                  }}
                />
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
              <div className="flex items-center gap-2">
                {search && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {folders.length + files.length} result{(folders.length + files.length) !== 1 ? 's' : ''}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className={`rounded-md flex items-center gap-2 px-4 h-9 ${
                    category !== 'all' || fileType !== 'all' || minSize || maxSize
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setShowFilterBar(true)}
                >
                  <FilterIcon className="w-4 h-4" />
                  Filter
                </Button>
              </div>
            </div>
            {/* Active filters indicator - below search bar */}
            {(category !== 'all' || fileType !== 'all' || minSize || maxSize) && (
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="text-muted-foreground font-medium">Active filters:</span>
                {category !== 'all' && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    {CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category}
                    <button
                      onClick={() => setCategory('all')}
                      className="text-primary hover:text-primary/70 ml-1"
                      title="Remove category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {fileType !== 'all' && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    {FILE_TYPE_OPTIONS.find(opt => opt.value === fileType)?.label || fileType}
                    <button
                      onClick={() => setFileType('all')}
                      className="text-primary hover:text-primary/70 ml-1"
                      title="Remove file type filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {minSize && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    ≥{minSize}MB
                    <button
                      onClick={() => setMinSize('')}
                      className="text-primary hover:text-primary/70 ml-1"
                      title="Remove minimum size filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {maxSize && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    ≤{maxSize}MB
                    <button
                      onClick={() => setMaxSize('')}
                      className="text-primary hover:text-primary/70 ml-1"
                      title="Remove maximum size filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setCategory('all');
                    setFileType('all');
                    setMinSize('');
                    setMaxSize('');
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs underline"
                  title="Clear all filters"
                >
                  Clear all
                </button>
              </div>
            )}
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
                  {allUploadingFiles.map(fileObj => {
                    const file = fileObj.file || fileObj;
                    const relativePath = fileObj.relativePath || file.webkitRelativePath || file.name;
                    const progress = uploadProgress[relativePath] || 0;
                    const error = uploadErrors[relativePath];
                    const speed = uploadSpeeds[relativePath];
                    let eta = null;
                    if (speed && file.size && progress < 100) {
                      const remaining = file.size * (1 - progress / 100);
                      eta = speed > 0 ? Math.ceil(remaining / speed) : null;
                    }
                    return (
                      <div key={relativePath} className="flex flex-col gap-0 px-0 py-1">
                        <div className="flex items-center justify-between text-xs mb-0.5 w-full">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="truncate font-semibold text-foreground max-w-[180px]">{relativePath}</span>
                            <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                            <span className="text-muted-foreground">{formatBytes(speed || 0)}/s</span>
                            <span className="text-muted-foreground">{eta !== null ? `${eta}s left` : '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 ml-2">
                            <Progress
                              value={progress}
                              className="bg-muted border border-border"
                              indicatorClassName={error ? 'bg-destructive' : 'bg-green-600'}
                            />
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
              downloading={deleting}
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
              clearCache={clearCache}
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
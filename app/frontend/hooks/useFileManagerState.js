import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';

export function useFileManagerState(activeBucket) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prefix, setPrefix] = useState(''); // current folder path
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterType, setFilterType] = useState('all');
  const [minSize, setMinSize] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [fileType, setFileType] = useState('all');
  const filterDebounceRef = useRef();

  // In-memory cache for folder contents
  const folderCache = useRef({});

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

  // Helper to build a cache key based on prefix and filters
  const getCacheKey = () => {
    return JSON.stringify({
      prefix,
      filterType,
      fileType,
      category,
      minSize,
      maxSize,
      search,
      sortBy,
      sortOrder,
    });
  };

  // Expose a method to clear the cache (should be called after upload, delete, or rename)
  const clearCache = useCallback(() => {
    folderCache.current = {};
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    const cacheKey = getCacheKey();
    // Check cache first
    if (folderCache.current[cacheKey]) {
      const { folders: cachedFolders, files: cachedFiles } = folderCache.current[cacheKey];
      setFolders(cachedFolders);
      setFiles(cachedFiles);
      setLoading(false);
      return;
    }
    try {
      let url = prefix ? `/api/storage/files?prefix=${encodeURIComponent(prefix)}` : '/api/storage/files';
      const params = [];
      if (filterType && filterType !== 'all' && category === 'all') params.push(`filter_type=${encodeURIComponent(fileType)}`);
      if (category && category !== 'all' && fileType === 'all') {
        const exts = CATEGORY_EXTENSION_MAP[category];
        if (exts && exts.length) params.push(`filter_category=${encodeURIComponent(exts.join(','))}`);
      }
      if (minSize) params.push(`min_size=${parseInt(minSize * 1024 * 1024)}`);
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
      // Store in cache
      folderCache.current[cacheKey] = {
        folders: sortedFolders,
        files: sortedFiles,
      };
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

  // Navigation handlers
  const handleOpenFolder = (newPrefix) => setPrefix(newPrefix);
  const handleBreadcrumbNavigate = (newPrefix) => setPrefix(newPrefix);
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

  return {
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
  };
} 
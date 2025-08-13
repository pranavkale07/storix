import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/components/utils/toast';

export function useFileManagerState(activeBucket) {
  const [rawFolders, setRawFolders] = useState([]);
  const [rawFiles, setRawFiles] = useState([]);
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

  // In-memory cache for folder contents
  const folderCache = useRef({});
  const previousBucketId = useRef(null);
  const isFetchingRef = useRef(false);

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

  // Helper to build a cache key based on prefix and backend filters only
  const getCacheKey = () => {
    return JSON.stringify({
      prefix,
      filterType,
      fileType,
      category,
      minSize,
      maxSize,
      // Note: search is excluded from cache key since we do frontend search
      sortBy,
      sortOrder,
    });
  };

  // Expose a method to clear the cache (should be called after upload, delete, or rename)
  const clearCache = useCallback(() => {
    folderCache.current = {};
  }, []);

  // Client-side filtering and search
  const filteredFolders = useMemo(() => {
    let filtered = [...rawFolders];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(folder =>
        folder.name.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [rawFolders, search]);

  const filteredFiles = useMemo(() => {
    let filtered = [...rawFiles];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(file =>
        file.key.toLowerCase().includes(searchLower),
      );
    }

    // Apply category filter
    if (category && category !== 'all') {
      const exts = CATEGORY_EXTENSION_MAP[category];
      if (exts && exts.length) {
        filtered = filtered.filter(file => {
          const ext = file.key.split('.').pop()?.toLowerCase();
          return exts.includes(ext);
        });
      }
    }

    // Apply file type filter
    if (fileType && fileType !== 'all') {
      filtered = filtered.filter(file => {
        const ext = file.key.split('.').pop()?.toLowerCase();
        return ext === fileType.toLowerCase();
      });
    }

    // Apply size filters
    if (minSize) {
      const minSizeBytes = parseInt(minSize * 1024 * 1024);
      filtered = filtered.filter(file => file.size >= minSizeBytes);
    }

    if (maxSize) {
      const maxSizeBytes = parseInt(maxSize * 1024 * 1024);
      filtered = filtered.filter(file => file.size <= maxSizeBytes);
    }

    return filtered;
  }, [rawFiles, search, category, fileType, minSize, maxSize]);

  // Sort the filtered results
  const sortedFolders = useMemo(() => {
    const sortFn = (a, b) => {
      let aVal, bVal;
      if (sortBy === 'name') {
        aVal = (a.name || a.prefix || '').toLowerCase();
        bVal = (b.name || b.prefix || '').toLowerCase();
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

    return [...filteredFolders].sort(sortFn);
  }, [filteredFolders, sortBy, sortOrder]);

  const sortedFiles = useMemo(() => {
    const sortFn = (a, b) => {
      let aVal, bVal;
      if (sortBy === 'name') {
        aVal = (a.key || '').toLowerCase();
        bVal = (b.key || '').toLowerCase();
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

    return [...filteredFiles].sort(sortFn);
  }, [filteredFiles, sortBy, sortOrder]);

  const fetchFiles = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) {
      console.log('fetchFiles: Already fetching, skipping duplicate call');
      return;
    }
    
    console.log('fetchFiles: Starting API call for prefix:', prefix);
    isFetchingRef.current = true;
    
    setLoading(true);
    // Don't clear error here, only clear on successful fetch

    const cacheKey = getCacheKey();

    // Check cache first
    if (folderCache.current[cacheKey]) {
      const { folders: cachedFolders, files: cachedFiles } = folderCache.current[cacheKey];
      setRawFolders(cachedFolders);
      setRawFiles(cachedFiles);
      setLoading(false);
      isFetchingRef.current = false;
      return;
    }

    try {
      let url = prefix ? `/api/storage/files?prefix=${encodeURIComponent(prefix)}` : '/api/storage/files';
      const params = [];

      // Only send backend filters, not search
      if (filterType && filterType !== 'all' && category === 'all') params.push(`filter_type=${encodeURIComponent(fileType)}`);
      if (category && category !== 'all' && fileType === 'all') {
        const exts = CATEGORY_EXTENSION_MAP[category];
        if (exts && exts.length) params.push(`filter_category=${encodeURIComponent(exts.join(','))}`);
      }
      if (minSize) params.push(`min_size=${parseInt(minSize * 1024 * 1024)}`);
      if (maxSize) params.push(`max_size=${parseInt(maxSize * 1024 * 1024)}`);
      if (sortBy) params.push(`sort_by=${encodeURIComponent(sortBy)}`);
      if (sortOrder) params.push(`sort_order=${encodeURIComponent(sortOrder)}`);

      if (params.length) url += (url.includes('?') ? '&' : '?') + params.join('&');
      const res = await apiFetch(url);
      const data = await res.json();

      if (!res.ok) {
        let errorMessage = data.error || 'Failed to fetch files';

        // Handle bucket usage limit errors
        if (data.type === 'bucket_usage_limit_exceeded') {
          errorMessage = data.message || 'Operation limit exceeded for this bucket.';
          showToast.warning(errorMessage, 'You have reached your monthly operation limit for this bucket.');
        }

        setError(errorMessage);
        setRawFolders([]);
        setRawFiles([]);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // Store raw data (without search filtering)
      setRawFolders(data.folders || []);
      setRawFiles(data.files || []);

      // Store in cache
      folderCache.current[cacheKey] = {
        folders: data.folders || [],
        files: data.files || [],
      };
      // Clear error on successful fetch
      setError('');
    } catch {
      setError('Network error');
      setRawFolders([]);
      setRawFiles([]);
    }
    setLoading(false);
    isFetchingRef.current = false;
  }, [prefix, filterType, fileType, category, minSize, maxSize, sortBy, sortOrder]);

  // Handle initial state when no active bucket
  useEffect(() => {
    if (!activeBucket?.id) {
      console.log('useFileManagerState: Initial state - no active bucket, setting loading to false');
      setLoading(false);
      setRawFolders([]);
      setRawFiles([]);
    }
  }, [activeBucket]);

  // Single consolidated useEffect: handle all file fetching scenarios
  useEffect(() => {
    if (!activeBucket?.id) {
      console.log('useFileManagerState: No active bucket, setting loading to false');
      setLoading(false);
      return;
    }

    const currentBucketId = activeBucket.id;
    const isNewBucket = previousBucketId.current !== currentBucketId;
    
    console.log('useFileManagerState useEffect triggered:', {
      currentBucketId,
      previousBucketId: previousBucketId.current,
      isNewBucket,
      prefix,
      reason: isNewBucket ? 'bucket_switch' : 'filter_change'
    });
    
    if (isNewBucket) {
      // Switching to a different bucket
      clearCache();
      setPrefix('');
      previousBucketId.current = currentBucketId;
      // Don't call fetchFiles here - wait for prefix to update
    } else {
      // Same bucket, but prefix or filters changed
      fetchFiles();
    }
  }, [activeBucket, prefix, filterType, fileType, category, minSize, maxSize, sortBy, sortOrder, fetchFiles, clearCache]);

  // Handle bucket switching - fetch files when prefix becomes empty after bucket switch
  useEffect(() => {
    if (activeBucket?.id && prefix === '' && previousBucketId.current === activeBucket.id) {
      console.log('Bucket switch detected, fetching files with empty prefix');
      fetchFiles();
    }
  }, [prefix, activeBucket, fetchFiles]);

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
    folders: sortedFolders,
    files: sortedFiles,
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

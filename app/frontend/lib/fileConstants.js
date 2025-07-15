export const CATEGORY_OPTIONS = [
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

export const FILE_TYPE_OPTIONS = [
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

export const CATEGORY_EXTENSION_MAP = {
  documents: ['pdf', 'doc', 'docx', 'txt', 'md', 'odt', 'rtf'],
  images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
  videos: ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz'],
  code: ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'java', 'c', 'cpp', 'cs', 'sh', 'json'],
  spreadsheets: ['xls', 'xlsx', 'ods', 'csv'],
  presentations: ['ppt', 'pptx', 'odp'],
}; 
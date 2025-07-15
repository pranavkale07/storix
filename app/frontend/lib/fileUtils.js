import { format, formatDistanceToNow, subDays, isAfter, parseISO } from 'date-fns';
import { FileIcon, ImageIcon, FileText, FileArchive, FileSpreadsheet, FileAudio, FileVideo, FileCode } from 'lucide-react';

export function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(dateStr) {
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

export function isViewableFile(filename) {
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

export const fileTypeIconMap = [
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

export function getFileIconByExtension(filename) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  for (const { exts, icon, color } of fileTypeIconMap) {
    if (exts.includes(ext)) {
      return { Icon: icon, color };
    }
  }
  return { Icon: FileIcon, color: 'text-muted-foreground' };
}
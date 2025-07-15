import React, { useRef, useEffect, useState } from 'react';
import { Download, Trash2, Share2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import FileRenameInput from './FileRenameInput';
import { isViewableFile, getFileIconByExtension, formatSize, formatDate } from '@/lib/fileUtils';

function FileRow({ file, isSelected, onSelectFile, renamingFile, onRenameFile, downloading, onDownload, onShareFile, onDelete, clearCache, ...props }) {
  const fileNameRef = useRef(null);
  const [isFileTruncated, setIsFileTruncated] = useState(false);
  useEffect(() => {
    if (fileNameRef.current) {
      setIsFileTruncated(fileNameRef.current.scrollWidth > fileNameRef.current.clientWidth);
    }
  }, [file.key]);

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
            clearCache={clearCache}
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
                <Button size="icon" variant="ghost" aria-label="Delete file" onClick={e => { e.stopPropagation(); onDelete(file.key); }} disabled={downloading.has(file.key)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Download file" onClick={e => { e.stopPropagation(); onDownload(file.key, false); }} disabled={downloading.has(file.key)}>
                <Download className="w-5 h-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

export default FileRow; 
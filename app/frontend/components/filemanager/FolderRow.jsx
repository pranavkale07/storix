import React, { useRef, useEffect, useState } from 'react';
import { Folder, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import FolderRenameInput from './FolderRenameInput';

function FolderRow({ folder, isSelected, onSelectFolder, onOpenFolder, renamingFolder, onRenameFolder, onDeleteFolder, deletingFolders, clearCache }) {
  const folderNameRef = useRef(null);
  const [isFolderTruncated, setIsFolderTruncated] = useState(false);
  useEffect(() => {
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
            clearCache={clearCache}
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

export default FolderRow;
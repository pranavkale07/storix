import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder } from 'lucide-react';
import FolderRow from './FolderRow';
import FileRow from './FileRow';
import { Checkbox } from '@/components/ui/checkbox';
import { TooltipProvider } from '@/components/ui/tooltip';

function FileList({ folders, files, onOpenFolder, onDownload, onDelete, downloading, deleting, onDeleteFolder, deletingFolders, onRenameFolder, renamingFolder, onRenameFile, renamingFile, selectedFiles, selectedFolders, onSelectFile, onSelectFolder, isAllSelected, onSelectAll, onShareFile, onSort, sortBy, sortOrder, loading, clearCache }) {
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
                      <span className="w-5 h-5 text-primary">↑</span>
                    ) : (
                      <span className="w-5 h-5 text-primary">↓</span>
                    )
                  ) : (
                    <span className="w-4 h-4 text-muted-foreground group-hover:text-primary">↓</span>
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
                      <span className="w-5 h-5 text-primary">↑</span>
                    ) : (
                      <span className="w-5 h-5 text-primary">↓</span>
                    )
                  ) : (
                    <span className="w-4 h-4 text-muted-foreground group-hover:text-primary">↓</span>
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
                      <span className="w-5 h-5 text-primary">↑</span>
                    ) : (
                      <span className="w-5 h-5 text-primary">↓</span>
                    )
                  ) : (
                    <span className="w-4 h-4 text-muted-foreground group-hover:text-primary">↓</span>
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
                clearCache={clearCache}
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
                onDelete={onDelete}
                clearCache={clearCache}
                // ...pass other needed props
              />
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

export default FileList; 
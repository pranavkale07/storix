import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { apiFetch } from "@/lib/api";

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function Breadcrumbs({ path, onNavigate }) {
  const parts = path ? path.split("/").filter(Boolean) : [];
  return (
    <nav className="flex items-center gap-0 text-sm text-muted-foreground">
      <button className="hover:underline" onClick={() => onNavigate("")}>/</button>
      {parts.map((crumb, idx) => {
        const fullPath = parts.slice(0, idx + 1).join("/") + "/";
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

function FileList({ folders, files, onOpenFolder }) {
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
            <th className="text-left py-2 px-3 font-semibold">Name</th>
            <th className="text-left py-2 px-3 font-semibold">Size</th>
            <th className="text-left py-2 px-3 font-semibold">Last Modified</th>
            <th className="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {/* Folders */}
          {folders.map(folder => (
            <tr key={folder.prefix} className="border-b border-border hover:bg-accent/30 transition">
              <td className="py-2 px-3 flex items-center gap-2 font-semibold cursor-pointer hover:underline" onClick={() => onOpenFolder(folder.prefix)}>
                <span className="text-lg">📁</span>
                {folder.name}
              </td>
              <td className="py-2 px-3 text-muted-foreground">—</td>
              <td className="py-2 px-3 text-muted-foreground">—</td>
              <td className="py-2 px-3 text-right"></td>
            </tr>
          ))}
          {/* Files */}
          {files.map(file => (
            <tr key={file.key} className="border-b border-border hover:bg-accent/30 transition">
              <td className="py-2 px-3 flex items-center gap-2">
                <span className="text-lg">📄</span>
                {file.key}
              </td>
              <td className="py-2 px-3">{formatSize(file.size)}</td>
              <td className="py-2 px-3">{formatDate(file.last_modified)}</td>
              <td className="py-2 px-3 text-right">
                <Button size="icon" variant="ghost" title="Download">
                  <span role="img" aria-label="Download">⬇️</span>
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FileManager({ activeBucket }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prefix, setPrefix] = useState(""); // current folder path

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      setError("");
      try {
        const url = prefix ? `/api/storage/files?prefix=${encodeURIComponent(prefix)}` : "/api/storage/files";
        const res = await apiFetch(url);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch files");
          setFolders([]);
          setFiles([]);
        } else {
          setFolders(data.folders || []);
          setFiles(data.files || []);
        }
      } catch (err) {
        setError("Network error");
        setFolders([]);
        setFiles([]);
      }
      setLoading(false);
    }
    fetchFiles();
  }, [activeBucket, prefix]);

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
    const parts = prefix.split("/").filter(Boolean);
    if (parts.length === 0) {
      setPrefix("");
    } else {
      const up = parts.slice(0, -1).join("/");
      setPrefix(up ? up + "/" : "");
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ width: 32, display: 'inline-flex', justifyContent: 'center' }}>
              {canGoBack ? (
                <Button size="icon" variant="ghost" onClick={handleBack} title="Back">
                  <span className="text-xl" aria-label="Back">‹</span>
                </Button>
              ) : (
                <span className="text-xl opacity-0">‹</span>
              )}
            </span>
            <Breadcrumbs path={prefix} onNavigate={handleBreadcrumbNavigate} />
          </div>
        </div>
        <Button size="sm" variant="default">Upload</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading files...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <FileList folders={folders} files={files} onOpenFolder={handleOpenFolder} />
        )}
      </CardContent>
    </Card>
  );
} 
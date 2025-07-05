import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { apiFetch } from "@/lib/api";
import { Copy, X, Link2, Trash2 } from "lucide-react";

export default function ShareModal({ open, onClose, item, onLinkCreated }) {
  const [expiresIn, setExpiresIn] = useState(24); // hours
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  if (!item) return null;

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/storage/share_link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: item.key, expires_in: expiresIn * 3600 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create share link");
      setShareLink(data.share_link);
      if (onLinkCreated) onLinkCreated(data.share_link);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareLink) return;
    const url = `${window.location.origin}/share_links/${shareLink.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRevoke = async () => {
    if (!shareLink) return;
    setRevoking(true);
    setError("");
    try {
      const res = await apiFetch("/api/storage/revoke_share_link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shareLink.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke link");
      setShareLink({ ...shareLink, revoked: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
    }
  };

  const url = shareLink ? `${window.location.origin}/share_links/${shareLink.token}` : "";
  const expired = shareLink && shareLink.expires_at && new Date(shareLink.expires_at) < new Date();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full p-6">
        <DialogHeader>
          <DialogTitle>Share {item.name || item.key}</DialogTitle>
        </DialogHeader>
        {!shareLink ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Expires in (hours)</label>
              <Input
                type="number"
                min={1}
                max={168}
                value={expiresIn}
                onChange={e => setExpiresIn(Number(e.target.value))}
                className="w-32"
              />
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleCreate} loading={loading} disabled={loading || !expiresIn}>Create Link</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 w-full">
              <Link2 className="w-5 h-5 text-primary shrink-0" />
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={url}
                  readOnly
                  className="pr-10 font-mono text-sm truncate bg-muted border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={e => e.target.select()}
                />
                <Button size="icon" variant="ghost" onClick={handleCopy} disabled={copied} title="Copy link" className="absolute right-1 top-1/2 -translate-y-1/2">
                  <Copy className="w-4 h-4" />
                </Button>
                {copied && <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-green-600">Copied!</span>}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span>Expires: {shareLink.expires_at ? new Date(shareLink.expires_at).toLocaleString() : "Never"}</span>
              <span>Status: {shareLink.revoked ? "Revoked" : expired ? "Expired" : "Active"}</span>
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button variant="destructive" onClick={handleRevoke} disabled={revoking || shareLink.revoked || expired}>
                <Trash2 className="w-4 h-4 mr-1" /> Revoke Link
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 
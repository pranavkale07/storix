import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import FileManager from "../components/FileManager";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function Home() {
  const { user, logout } = useAuth();
  const [activeBucket, setActiveBucket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("activeBucket");
    if (stored) setActiveBucket(JSON.parse(stored));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="text-xl font-bold tracking-tight">Storix</div>
        <div className="flex items-center gap-4">
          {activeBucket ? (
            <span className="text-sm text-primary-foreground bg-primary rounded px-2 py-1">Bucket: {activeBucket.bucket}</span>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => navigate("/connect-bucket")}>Connect Bucket</button>
          )}
          {user && <span className="text-sm text-muted-foreground">{user.email}</span>}
          {user && <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>}
        </div>
      </header>
      {/* Main content */}
      <main className="flex justify-center items-start min-h-[80vh] py-12">
        {activeBucket ? (
          <FileManager activeBucket={activeBucket} />
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No Bucket Connected</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground text-center">You need to connect a storage bucket to view and manage your files.</div>
              <Button onClick={() => navigate("/connect-bucket")}>Connect Bucket</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
} 
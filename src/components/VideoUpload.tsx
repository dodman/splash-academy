"use client";

import { useState } from "react";

interface VideoUploadProps {
  onUploadComplete: (url: string, duration: number) => void;
  currentUrl?: string;
}

export default function VideoUpload({ onUploadComplete, currentUrl }: VideoUploadProps) {
  const [manualUrl, setManualUrl] = useState(currentUrl || "");

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">Video URL</label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Paste YouTube, Vimeo, or direct video URL"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="button"
          onClick={() => {
            if (manualUrl.trim()) {
              onUploadComplete(manualUrl.trim(), 0);
            }
          }}
          className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          Set
        </button>
      </div>
      {currentUrl && (
        <p className="text-xs text-success">Video URL set</p>
      )}
    </div>
  );
}

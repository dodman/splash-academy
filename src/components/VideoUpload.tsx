"use client";

import { useState, useRef } from "react";

interface VideoUploadProps {
  onUploadComplete: (url: string, duration: number) => void;
  currentUrl?: string;
}

export default function VideoUpload({ onUploadComplete, currentUrl }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"upload" | "url">(currentUrl ? "url" : "upload");
  const [manualUrl, setManualUrl] = useState(currentUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError("File must be under 500MB");
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      // Get signature from our API
      const sigRes = await fetch("/api/upload/signature", { method: "POST" });

      if (!sigRes.ok) {
        const data = await sigRes.json();
        if (data.error === "Cloudinary not configured") {
          setError("Video upload not configured. Use URL mode instead.");
          setMode("url");
          setUploading(false);
          return;
        }
        throw new Error(data.error || "Failed to get upload signature");
      }

      const { signature, timestamp, folder, cloudName, apiKey } = await sigRes.json();

      // Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", folder);
      formData.append("api_key", apiKey);
      formData.append("resource_type", "video");

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      const uploadResult = await new Promise<{ secure_url: string; duration: number }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
        xhr.send(formData);
      });

      onUploadComplete(uploadResult.secure_url, Math.round(uploadResult.duration || 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-2 py-1 rounded ${mode === "upload" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-2 py-1 rounded ${mode === "url" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
        >
          Paste URL
        </button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Uploading video...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition"
            >
              <svg className="w-8 h-8 mx-auto text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-muted-foreground">
                Click to upload video (max 500MB)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, MOV, WebM, AVI
              </p>
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Video URL (YouTube, Vimeo, Cloudinary, etc.)"
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
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

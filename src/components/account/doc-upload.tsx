"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, FileCheck2, Camera } from "lucide-react";

/**
 * Document uploader with TWO ways to provide a file:
 *  - "Upload" — any image or PDF (existing scan on the device)
 *  - "Camera" — opens the device camera on mobile (accept=image + capture),
 *    so users can photograph their Emirates ID / trade license directly.
 * Both post to /api/upload-doc and return the stored URL via onChange.
 */
export function DocUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload-doc", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.urls[0]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (camRef.current) camRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-[#141414] mb-1">{label} *</label>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`flex flex-1 items-center gap-2 h-11 rounded-xl border px-3.5 text-sm transition-colors ${
            value
              ? "border-[#137A43]/30 bg-[#137A43]/5 text-[#137A43]"
              : "border-dashed border-[#D8D4C6] bg-[#F4F4F6] text-secondary hover:border-[#141414]/30"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files)}
          />
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : value ? (
            <FileCheck2 className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="truncate">
            {uploading ? "Uploading…" : value ? "Uploaded — tap to replace" : "Upload JPG, PNG, or PDF"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => camRef.current?.click()}
          title="Take a photo"
          aria-label="Take a photo"
          className="flex-shrink-0 grid place-items-center h-11 w-11 rounded-xl border border-[#E5E5EA] bg-white text-[#8136B2] hover:border-[#141414]/30 transition-colors"
        >
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files)}
          />
          <Camera className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

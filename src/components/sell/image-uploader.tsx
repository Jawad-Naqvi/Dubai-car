"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, X, Loader2, Star } from "lucide-react";

export function ImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.status === 401) {
        toast.error("Please sign in to upload photos.");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onChange([...value, ...(data.urls ?? [])]);
      if (data.stored) {
        toast.success("Photos uploaded");
      } else {
        toast.message("Photos added (temporary storage)", {
          description: "Connect the database or R2 to store photos permanently.",
        });
      }
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const makeHero = (i: number) => {
    if (i === 0) return;
    const next = [...value];
    const [pick] = next.splice(i, 1);
    next.unshift(pick);
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-2xl border border-dashed border-[#D8D4C6] bg-[#F3F1E9] hover:border-[#141414]/30 transition-colors p-8 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="h-6 w-6 text-[#F0941F] mx-auto animate-spin" />
        ) : (
          <Upload className="h-6 w-6 text-[#F0941F] mx-auto" />
        )}
        <p className="mt-3 text-xs text-secondary">
          Drag &amp; drop photos, or <span className="font-semibold text-[#141414] underline underline-offset-2">browse</span>
        </p>
        <p className="mt-1 text-[10px] text-muted">
          Add 6+ photos. First photo is the cover.
        </p>
      </div>

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#F3F1E9] border border-[#E7E4DA] group"
            >
              <Image src={src} alt="" fill sizes="160px" className="object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[#F0941F] text-white font-semibold">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeHero(i)}
                    title="Make cover"
                    className="h-6 w-6 rounded-full bg-black/70 grid place-items-center hover:bg-black"
                  >
                    <Star className="h-3 w-3 text-[#F0941F]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title="Remove"
                  className="h-6 w-6 rounded-full bg-black/70 grid place-items-center hover:bg-black"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

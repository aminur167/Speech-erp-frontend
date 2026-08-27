"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { MaterialThumb } from "@/components/materials/MaterialThumb";

const MAX_BYTES = 512 * 1024; // 512KB — keeps the mock in-memory store (and a future JSON payload) reasonable.

/**
 * Reads the chosen image into a data URL. A real backend would take a
 * multipart upload and hand back a hosted URL instead; the value this
 * produces is stored in exactly the same `imageUrl` field either way.
 */
export function MaterialImagePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (imageUrl: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 512KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError(undefined);
      onChange(reader.result as string);
    };
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <MaterialThumb src={value} alt="Material preview" size="md" />
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Upload className="h-3.5 w-3.5" />
              {value ? "Change photo" : "Upload photo"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
          <span className="text-[11px] text-text-secondary">PNG, JPG or SVG · max 512KB</span>
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}

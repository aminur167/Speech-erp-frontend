"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { StaffAvatar } from "@/components/staff/StaffAvatar";

// Same cap as MaterialImagePicker — keeps a data URL (there's no hosted
// file storage wired up yet) a reasonable size for a JSON payload and a DB row.
const MAX_BYTES = 512 * 1024;

/**
 * A staff member's avatar, editable in place: a small camera badge opens the
 * file picker, and — once a photo is set — a remove badge appears on hover.
 * Reads the chosen image into a data URL the same way MaterialImagePicker
 * does; a real backend would take a multipart upload and hand back a hosted
 * URL instead, stored in exactly the same `photoUrl` field either way.
 */
export function StaffPhotoPicker({
  name,
  value,
  onChange,
  disabled,
}: {
  name: string;
  value?: string;
  onChange: (photoUrl: string | undefined) => void;
  disabled?: boolean;
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
      setError("Photo must be under 512KB.");
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
    <div className="flex flex-col gap-1">
      <div className="group relative shrink-0">
        <StaffAvatar name={name} photoUrl={value} size="lg" />
        <button
          type="button"
          title={value ? "Change photo" : "Add photo"}
          aria-label={value ? "Change photo" : "Add photo"}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-primary text-white shadow-sm transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera className="h-3 w-3" />
        </button>
        {value && (
          <button
            type="button"
            title="Remove photo"
            aria-label="Remove photo"
            disabled={disabled}
            onClick={() => onChange(undefined)}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-danger text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {error && <p className="text-[10px] text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

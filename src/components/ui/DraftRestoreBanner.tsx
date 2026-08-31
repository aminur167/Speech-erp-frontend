"use client";

import { FileClock } from "lucide-react";
import { Button } from "@/components/ui/Button";

function timeAgoLabel(savedAt: number): string {
  const minutes = Math.round((Date.now() - savedAt) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

export function DraftRestoreBanner({
  savedAt,
  onRestore,
  onDiscard,
}: {
  savedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-info/30 bg-info/10 p-3 text-sm text-info">
      <div className="flex items-center gap-2">
        <FileClock className="h-4 w-4 shrink-0" />
        <p>You have an unsaved draft from {timeAgoLabel(savedAt)}.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5"
          onClick={onDiscard}
        >
          Discard
        </Button>
        <Button type="button" className="px-3 py-1.5" onClick={onRestore}>
          Restore
        </Button>
      </div>
    </div>
  );
}

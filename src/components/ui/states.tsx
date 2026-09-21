import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Uneven widths read as content rather than a grid of identical bars. */
const SKELETON_WIDTHS = ["92%", "76%", "84%", "58%", "70%", "64%"];

/**
 * What a section shows while its data loads.
 *
 * A skeleton by default: grey bars roughly where the content will be, so the
 * page keeps its shape and arriving data fills in place instead of pushing
 * the layout around. The label is still announced to screen readers.
 *
 * `variant="spinner"` is for a wait with nothing to sketch — checking the
 * session before any page exists.
 */
export function LoadingState({
  label = "Loading…",
  variant = "skeleton",
  rows = 4,
}: {
  label?: string;
  variant?: "skeleton" | "spinner";
  rows?: number;
}) {
  if (variant === "spinner") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 py-12 text-text-secondary"
        role="status"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">{label}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-text-secondary/10" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div
              className="h-3 animate-pulse rounded bg-text-secondary/10"
              style={{ width: SKELETON_WIDTHS[index % SKELETON_WIDTHS.length] }}
            />
            <div
              className="h-2.5 animate-pulse rounded bg-text-secondary/[0.07]"
              style={{ width: SKELETON_WIDTHS[(index + 3) % SKELETON_WIDTHS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-text-secondary">
      <Inbox className="h-6 w-6" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  label = "Something went wrong. Please try again.",
  onRetry,
}: {
  label?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-danger">
      <AlertTriangle className="h-6 w-6" />
      <p className="text-sm">{label}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

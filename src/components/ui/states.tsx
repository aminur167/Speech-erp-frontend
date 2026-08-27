import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-text-secondary">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
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

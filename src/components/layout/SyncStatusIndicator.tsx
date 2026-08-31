"use client";

import { useState } from "react";
import { WifiOff, RefreshCw, AlertTriangle, X } from "lucide-react";
import { clsx } from "clsx";
import { useIsOnline } from "@/hooks/offline/useIsOnline";
import { useOfflineQueueStatus } from "@/hooks/offline/useOfflineQueueStatus";

/**
 * The visible half of the offline outbox (docs/00 items 6-7): a small,
 * always-present indicator so staff always know whether something hasn't
 * synced yet, without a blocking dialog getting in the way of the next
 * patient at the counter.
 */
export function SyncStatusIndicator() {
  const isOnline = useIsOnline();
  const { queuedCount, syncingCount, failed, dismissFailed } = useOfflineQueueStatus();
  const [showFailedPanel, setShowFailedPanel] = useState(false);

  const hasAttention = !isOnline || queuedCount > 0 || syncingCount > 0 || failed.length > 0;
  if (!hasAttention) return null;

  return (
    <div className="relative flex items-center gap-2">
      {!isOnline && (
        <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
          <WifiOff className="h-3.5 w-3.5" />
          Offline
        </span>
      )}

      {(queuedCount > 0 || syncingCount > 0) && (
        <span className="flex items-center gap-1.5 rounded-full bg-info/10 px-2.5 py-1 text-xs font-medium text-info">
          <RefreshCw className={clsx("h-3.5 w-3.5", syncingCount > 0 && "animate-spin")} />
          {syncingCount > 0
            ? `Syncing ${syncingCount}…`
            : `${queuedCount} waiting to sync`}
        </span>
      )}

      {failed.length > 0 && (
        <button
          type="button"
          onClick={() => setShowFailedPanel((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/20"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {failed.length} failed to sync
        </button>
      )}

      {showFailedPanel && failed.length > 0 && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-border bg-surface p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-text-secondary">
            These didn&apos;t go through — nothing was lost, but they need a look.
          </p>
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {failed.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-lg bg-danger/5 p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary">{item.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissFailed(item.id)}
                  aria-label="Dismiss"
                  className="shrink-0 rounded p-0.5 text-text-secondary hover:bg-danger/10 hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

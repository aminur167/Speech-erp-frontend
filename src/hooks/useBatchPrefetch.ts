import { useEffect, useState } from "react";
import { prefetchBatch, type BatchPart } from "@/lib/api/batch";

/** A batch that hasn't answered by now is abandoned; the page fetches normally. */
const BATCH_TIMEOUT_MS = 12_000;

/**
 * Fetches a page's first reads in one round trip, then says the page may
 * render. Its hooks then find their answers already waiting (lib/api/batch.ts).
 *
 * `skip` when the data is already cached: the page shows it at once and
 * refreshes in the background as usual, so waiting on a batch would only
 * slow it down. A failed or slow batch never blocks the page — it renders and
 * each part is fetched on its own, exactly as before batching existed.
 */
export function useBatchPrefetch(parts: BatchPart[], skip: boolean): boolean {
  const [ready, setReady] = useState(skip);

  useEffect(() => {
    if (skip) return;
    const controller = new AbortController();
    // Unmounting cancels the batch too, but must not then declare the page
    // ready -- only an answer, a failure or the timeout does.
    let unmounted = false;
    const timer = window.setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);
    prefetchBatch(parts, controller.signal)
      .catch(() => {
        // Fall through: the page's own requests take over.
      })
      .finally(() => {
        window.clearTimeout(timer);
        if (!unmounted) setReady(true);
      });
    return () => {
      unmounted = true;
      window.clearTimeout(timer);
      controller.abort();
    };
    // The parts are the page's first load only; later changes (a new date)
    // are ordinary requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ready;
}

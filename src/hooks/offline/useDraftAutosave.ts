import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DeepPartialSkipArrayKey,
  FieldValues,
  UseFormReset,
  UseFormWatch,
} from "react-hook-form";

const DRAFT_TTL_MS = 1000 * 60 * 60 * 24; // A day-old draft is more likely stale than useful.
const DEBOUNCE_MS = 500;

interface StoredDraft<T extends FieldValues> {
  values: DeepPartialSkipArrayKey<T>;
  savedAt: number;
}

/**
 * Docs/00 offline-first item 2: "form input persists locally as it's typed,
 * so a drop mid-form loses nothing." Scoped to create-from-scratch forms
 * (patient registration, expense entry) rather than edit forms -- restoring
 * a stale draft over a record that may have changed server-side since is a
 * conflict risk edit forms don't need to take on.
 *
 * Never auto-fills silently: a saved draft is offered via `hasDraft` for the
 * caller to show a restore/discard prompt, so a fresh visit to the form
 * never surprises the user with someone else's half-typed patient.
 */
export function useDraftAutosave<T extends FieldValues>(
  key: string,
  watch: UseFormWatch<T>,
  reset: UseFormReset<T>,
) {
  const storageKey = `draft:${key}`;
  const [availableDraft, setAvailableDraft] = useState<StoredDraft<T> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredDraft<T>;
      if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
        window.localStorage.removeItem(storageKey);
        return;
      }
      setAvailableDraft(parsed);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    // Don't start autosaving over a draft that's still waiting on a
    // restore/discard decision -- that would silently overwrite it with
    // the form's blank initial state before the user ever sees the prompt.
    if (availableDraft) return;

    const subscription = watch((values) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try {
          window.localStorage.setItem(
            storageKey,
            JSON.stringify({ values, savedAt: Date.now() } satisfies StoredDraft<T>),
          );
        } catch {
          // Autosave is a convenience, not a requirement -- a full or
          // unavailable localStorage shouldn't interrupt data entry.
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watch, availableDraft, storageKey]);

  const restoreDraft = useCallback(() => {
    if (!availableDraft) return;
    // `watch()` captured this straight from the form's own values, so it's
    // really a `T` -- the deep-partial typing only exists because RHF can't
    // statically rule out an in-progress array/nested field being sparse.
    // Every form using this hook is flat strings/booleans, so that never
    // applies here.
    reset(availableDraft.values as T);
    setAvailableDraft(null);
  }, [availableDraft, reset]);

  const discardDraft = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    setAvailableDraft(null);
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    hasDraft: availableDraft !== null,
    draftSavedAt: availableDraft?.savedAt ?? null,
    restoreDraft,
    discardDraft,
    clearDraft,
  };
}

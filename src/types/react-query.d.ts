import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    /**
     * What a mutation tells the global toast handler in QueryProvider.
     *
     * **Plain strings and booleans only.** Mutations are persisted to
     * IndexedDB together with their `meta` (the offline outbox), and a
     * function cannot be structured-cloned — putting one here would break
     * every queued write, not just this one. A message that depends on the
     * result belongs in the call site's own `onSuccess` via `toast.success`.
     */
    mutationMeta: {
      /** Shown as a success toast when the mutation succeeds. */
      successMessage?: string;
      /** Replaces the error toast's heading, e.g. "Sign-in failed". */
      errorTitle?: string;
      /** `false` when the screen handles this mutation's errors itself. */
      errorToast?: boolean;
      /** Human name for the offline sync indicator. */
      label?: string;
    };
  }
}

import { create } from "zustand";
import { toApiError } from "@/lib/api/errors";
import type { ApiErrorKind } from "@/types/api";

/**
 * Every success and error message in the app, shown as a toast from the top.
 *
 * A store rather than a context so anything can raise one — a component, a
 * hook, the global mutation handler, even code with no React tree — through
 * the plain `toast` object at the bottom.
 */

export type ToastKind = "success" | "info" | ApiErrorKind;

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
  duration: number;
  /** How many times this exact message arrived while it was still showing. */
  repeat: number;
  /** Bumped on a repeat so the toast restarts its countdown. */
  updatedAt: number;
}

/** The type of problem, in words, so the heading alone says what happened. */
export const TOAST_TITLES: Record<ToastKind, string> = {
  success: "Success",
  info: "Notice",
  validation: "Please check the details",
  rule: "Action not allowed",
  permission: "Permission denied",
  auth: "Session expired",
  notFound: "Not found",
  network: "No connection",
  server: "Server error",
  unknown: "Something went wrong",
};

/**
 * Errors stay up longer than successes: a success only confirms what the
 * user just watched happen, while an error has to be read and understood.
 */
const DURATIONS: Record<ToastKind, number> = {
  success: 4000,
  info: 5000,
  validation: 6500,
  rule: 7000,
  permission: 6500,
  notFound: 6500,
  auth: 8000,
  network: 8000,
  server: 8000,
  unknown: 7000,
};

/** Enough to notice a pile-up; more would cover the page it is about. */
const MAX_VISIBLE = 4;

interface PushInput {
  kind: ToastKind;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (input: PushInput) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: ({ kind, message, title, duration }) => {
    const resolvedTitle = title ?? TOAST_TITLES[kind];

    // Three parallel requests failing for the same reason are one problem,
    // not three toasts. Count it on the one already showing instead.
    const existing = get().toasts.find(
      (toast) =>
        toast.kind === kind && toast.title === resolvedTitle && toast.message === message,
    );
    if (existing) {
      set((state) => ({
        toasts: state.toasts.map((toast) =>
          toast.id === existing.id
            ? { ...toast, repeat: toast.repeat + 1, updatedAt: Date.now() }
            : toast,
        ),
      }));
      return existing.id;
    }

    const id = nextId++;
    const item: ToastItem = {
      id,
      kind,
      title: resolvedTitle,
      message,
      duration: duration ?? DURATIONS[kind],
      repeat: 1,
      updatedAt: Date.now(),
    };
    set((state) => ({ toasts: [...state.toasts, item].slice(-MAX_VISIBLE) }));
    return id;
  },

  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

interface ToastOptions {
  /** Replaces the heading the kind would otherwise give it. */
  title?: string;
  duration?: number;
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    useToastStore.getState().push({ kind: "success", message, ...options }),

  info: (message: string, options?: ToastOptions) =>
    useToastStore.getState().push({ kind: "info", message, ...options }),

  /**
   * Accepts whatever was caught. An ApiError keeps its classification, so the
   * toast is coloured by what actually went wrong.
   */
  error: (error: unknown, options?: ToastOptions) => {
    const apiError = toApiError(error);
    return useToastStore.getState().push({
      kind: apiError.kind ?? "unknown",
      message: apiError.message,
      ...options,
    });
  },

  dismiss: (id: number) => useToastStore.getState().dismiss(id),
};

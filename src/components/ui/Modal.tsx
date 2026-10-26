"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

/**
 * How wide the dialog may grow.
 *
 * A prop rather than a `max-w-*` passed through `className`, because that
 * silently did not work: `clsx` concatenates, it does not resolve Tailwind
 * conflicts, so the default below and the caller's class both landed on the
 * element and the winner came down to which one Tailwind happened to emit
 * last. `max-w-xl` beat the default; `max-w-2xl` and `max-w-5xl` lost to it,
 * leaving those dialogs stuck at the default width with no sign anything was
 * wrong. One class, chosen here, removes the coin toss.
 */
const SIZE_CLASSES = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** `md` (default) for a form, `xl` for a dialog holding a table. */
  size?: keyof typeof SIZE_CLASSES;
  /** Set false for a modal guarding data the user shouldn't lose to a stray click — closable only via the X button or an explicit action inside it. */
  dismissible?: boolean;
}) {
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-16 backdrop-blur-[2px]"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        className={clsx(
          "w-full rounded-xl border border-border bg-surface p-6 shadow-xl",
          SIZE_CLASSES[size],
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-primary-light hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

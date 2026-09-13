"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Info,
  LockKeyhole,
  SearchX,
  ServerCrash,
  ShieldAlert,
  WifiOff,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useToastStore, type ToastItem, type ToastKind } from "@/store/toastStore";

/**
 * Colour and icon by the *type* of message, so it can be told apart at a
 * glance before it is read: amber is something to fix, orange is a rule
 * saying no, purple is permissions, grey is "couldn't reach it", red is a
 * genuine failure. Class names are written out in full because Tailwind only
 * generates classes it can find literally in the source.
 */
const VARIANTS: Record<
  ToastKind,
  { icon: LucideIcon; accent: string; iconWrap: string; text: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: "border-l-success",
    iconWrap: "bg-success/10 text-success",
    text: "text-success",
  },
  info: {
    icon: Info,
    accent: "border-l-info",
    iconWrap: "bg-info/10 text-info",
    text: "text-info",
  },
  validation: {
    icon: AlertTriangle,
    accent: "border-l-warning",
    iconWrap: "bg-warning/10 text-warning",
    text: "text-warning",
  },
  rule: {
    icon: Ban,
    accent: "border-l-accent",
    iconWrap: "bg-accent/10 text-accent",
    text: "text-accent",
  },
  permission: {
    icon: ShieldAlert,
    accent: "border-l-status-refunded",
    iconWrap: "bg-status-refunded/10 text-status-refunded",
    text: "text-status-refunded",
  },
  auth: {
    icon: LockKeyhole,
    accent: "border-l-cyan-600",
    iconWrap: "bg-cyan-600/10 text-cyan-600",
    text: "text-cyan-700",
  },
  notFound: {
    icon: SearchX,
    accent: "border-l-text-secondary",
    iconWrap: "bg-text-secondary/10 text-text-secondary",
    text: "text-text-secondary",
  },
  network: {
    icon: WifiOff,
    accent: "border-l-slate-700",
    iconWrap: "bg-slate-700/10 text-slate-700",
    text: "text-slate-700",
  },
  server: {
    icon: ServerCrash,
    accent: "border-l-danger",
    iconWrap: "bg-danger/10 text-danger",
    text: "text-danger",
  },
  unknown: {
    icon: XCircle,
    accent: "border-l-danger",
    iconWrap: "bg-danger/10 text-danger",
    text: "text-danger",
  },
};

/** Matches the `toast-leave` animation in globals.css. */
const EXIT_MS = 180;

function ToastView({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const [leaving, setLeaving] = useState(false);

  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // (Re)start the countdown — on arrival, and again whenever the same message
  // repeats, so a problem that keeps happening stays on screen.
  useEffect(() => {
    remaining.current = toast.duration;
    startedAt.current = Date.now();
    hideTimer.current = setTimeout(() => setLeaving(true), toast.duration);
    return () => clearTimeout(hideTimer.current);
  }, [toast.duration, toast.updatedAt]);

  // Removed from the store only after the exit animation has played.
  useEffect(() => {
    if (!leaving) return;
    const exitTimer = setTimeout(() => dismiss(toast.id), EXIT_MS);
    return () => clearTimeout(exitTimer);
  }, [leaving, dismiss, toast.id]);

  // Hovering or focusing holds the toast, so a long message is never pulled
  // away mid-sentence.
  const pause = () => {
    if (leaving) return;
    clearTimeout(hideTimer.current);
    remaining.current -= Date.now() - startedAt.current;
  };
  const resume = () => {
    if (leaving) return;
    clearTimeout(hideTimer.current);
    startedAt.current = Date.now();
    hideTimer.current = setTimeout(
      () => setLeaving(true),
      Math.max(remaining.current, 1500),
    );
  };

  const variant = VARIANTS[toast.kind];
  const Icon = variant.icon;
  const isProblem = toast.kind !== "success" && toast.kind !== "info";

  return (
    <div
      role={isProblem ? "alert" : "status"}
      aria-live={isProblem ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className={clsx(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border-l-4 bg-surface p-4 shadow-lg shadow-slate-900/10 ring-1 ring-border",
        variant.accent,
        leaving ? "toast-leave" : "toast-enter",
      )}
    >
      <span
        className={clsx(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          variant.iconWrap,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={clsx("flex items-center gap-2 text-sm font-semibold", variant.text)}>
          {toast.title}
          {toast.repeat > 1 && (
            <span className="rounded-full bg-background px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
              ×{toast.repeat}
            </span>
          )}
        </p>
        <p className="mt-0.5 break-words text-sm leading-relaxed text-text-primary">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setLeaving(true)}
        aria-label="Dismiss notification"
        className="-m-1 shrink-0 rounded-md p-1 text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Mounted once, in the root layout, above everything — including open modals,
 * which is where most errors are raised from.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <section
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4 sm:pt-6"
    >
      {/* Newest first, directly under the top edge it slides in from. */}
      {[...toasts].reverse().map((item) => (
        <div key={item.id} className="w-full max-w-md">
          <ToastView toast={item} />
        </div>
      ))}
    </section>
  );
}

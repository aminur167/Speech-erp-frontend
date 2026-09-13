"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { MoreVertical, type LucideIcon } from "lucide-react";

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  /** Destructive items are red and grouped below a divider. */
  tone?: "default" | "danger";
  disabled?: boolean;
  /** A line under the label — typically why the item is disabled. */
  hint?: string;
  /** Leave the item out entirely, e.g. when the role may not do it. */
  hidden?: boolean;
}

const MENU_WIDTH = 216;
const GAP = 4;

/**
 * The 3-dot menu that holds a record's actions: edit, (de)activate, delete,
 * and whatever else that record allows.
 *
 * Two details matter more than they look:
 *
 * - **Rendered in a portal, positioned from the trigger.** Every table here
 *   sits in an `overflow-x-auto` wrapper, which clips an ordinary absolutely
 *   positioned dropdown. The menu flips upward when there is no room below.
 * - **Every event stops at the menu.** React bubbles events through portals
 *   to the component tree, not the DOM tree, so a click on "Delete" would
 *   otherwise also open the row's detail drawer — or, on a branch card
 *   wrapped in a link, navigate away before the confirmation ever appears.
 */
export function ActionMenu({ items, label }: { items: ActionMenuItem[]; label: string }) {
  const visible = items.filter((item) => !item.hidden);
  const regular = visible.filter((item) => item.tone !== "danger");
  const danger = visible.filter((item) => item.tone === "danger");

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Place the menu against the trigger, before paint, by writing its style
  // directly — so there is no frame where it shows in the wrong place.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const rect = trigger.getBoundingClientRect();
      const height = menu.offsetHeight;
      const roomBelow = window.innerHeight - rect.bottom;
      const top =
        roomBelow < height + GAP * 2 && rect.top > height + GAP * 2
          ? rect.top - height - GAP
          : rect.bottom + GAP;
      const left = Math.min(
        Math.max(8, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8,
      );
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
      menu.style.visibility = "visible";
    };
    place();
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
      ?.focus();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // Close on a click anywhere else, or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (visible.length === 0) return null;

  const isolate = (event: SyntheticEvent) => event.stopPropagation();

  const onTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen((current) => !current);
  };

  const choose = (event: MouseEvent<HTMLButtonElement>, item: ActionMenuItem) => {
    event.preventDefault();
    event.stopPropagation();
    if (item.disabled) return;
    setOpen(false);
    item.onSelect();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const enabled = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ??
        [],
    );
    if (enabled.length === 0) return;
    const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
    const move = (next: number) => {
      event.preventDefault();
      enabled[(next + enabled.length) % enabled.length]?.focus();
    };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(enabled.length - 1);
    else if (event.key === "Tab") setOpen(false);
  };

  const renderItem = (item: ActionMenuItem) => {
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        type="button"
        role="menuitem"
        disabled={item.disabled}
        onClick={(event) => choose(event, item)}
        className={clsx(
          "flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm outline-none transition-colors",
          item.tone === "danger"
            ? "text-danger hover:bg-danger/10 focus:bg-danger/10"
            : "text-text-primary hover:bg-primary-light/50 focus:bg-primary-light/50",
          item.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
        )}
      >
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
        <span className="min-w-0">
          <span className="block">{item.label}</span>
          {item.hint && (
            <span className="block text-xs text-text-secondary">{item.hint}</span>
          )}
        </span>
      </button>
    );
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={onTriggerClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") event.stopPropagation();
        }}
        className={clsx(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors",
          "hover:bg-background hover:text-text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          open && "bg-background text-text-primary",
        )}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onClick={isolate}
            onPointerDown={isolate}
            onKeyDown={onMenuKeyDown}
            style={{ position: "fixed", top: 0, left: 0, width: MENU_WIDTH, visibility: "hidden" }}
            className="z-[90] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg shadow-slate-900/10"
          >
            {regular.map(renderItem)}
            {regular.length > 0 && danger.length > 0 && (
              <div role="separator" className="my-1 border-t border-border" />
            )}
            {danger.map(renderItem)}
          </div>,
          document.body,
        )}
    </>
  );
}

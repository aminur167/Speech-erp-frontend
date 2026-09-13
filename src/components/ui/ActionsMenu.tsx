"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";

export interface ActionsMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}

const ITEM_HEIGHT = 36;
const MENU_WIDTH = 160;

/**
 * A row's "⋮" overflow menu.
 *
 * Portalled to <body> with fixed positioning: the tables it lives in scroll
 * horizontally, and an `overflow-x-auto` wrapper clips an absolutely
 * positioned dropdown on the bottom rows. React still bubbles events through
 * the portal to the row, so every click is stopped here -- otherwise closing
 * the menu by clicking the backdrop would also open the row's details.
 */
export function ActionsMenu({
  items,
  label = "Actions",
}: {
  items: ActionsMenuItem[];
  label?: string;
}) {
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const open = position !== null;

  const close = () => {
    setPosition(null);
    triggerRef.current?.focus();
  };

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (open) {
      setPosition(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = items.length * ITEM_HEIGHT + 8;
    // Flip above the trigger when a bottom row would push the menu off-screen.
    const top =
      rect.bottom + 4 + menuHeight > window.innerHeight ? rect.top - 4 - menuHeight : rect.bottom + 4;
    setPosition({ top, left: Math.max(8, rect.right - MENU_WIDTH), width: MENU_WIDTH });
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPosition(null);
      triggerRef.current?.focus();
    };
    // Fixed coordinates go stale the moment anything scrolls underneath.
    const dismiss = () => setPosition(null);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          "rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-primary-light hover:text-text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          open && "bg-primary-light text-text-primary",
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div onClick={(event) => event.stopPropagation()}>
            <div className="fixed inset-0 z-40" onClick={close} />
            <div
              role="menu"
              style={position}
              className="fixed z-50 rounded-lg border border-border bg-surface p-1 shadow-lg"
            >
              {items.map(({ label: itemLabel, icon: Icon, onClick, danger }) => (
                <button
                  key={itemLabel}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPosition(null);
                    onClick();
                  }}
                  className={clsx(
                    "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors",
                    danger
                      ? "text-danger hover:bg-danger/10"
                      : "text-text-primary hover:bg-primary-light/60",
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {itemLabel}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

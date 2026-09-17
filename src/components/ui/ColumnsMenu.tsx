"use client";

import { useState } from "react";
import { Columns3 } from "lucide-react";

export interface ColumnOption {
  key: string;
  label: string;
}

export function ColumnsMenu({
  options,
  visible,
  onToggle,
}: {
  options: ColumnOption[];
  visible: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Columns"
        title="Columns"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary/40 hover:bg-primary-light/60 hover:text-text-primary"
      >
        <Columns3 className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-border bg-surface p-2 shadow-lg">
            {options.map((option) => (
              <label
                key={option.key}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-primary-light/50"
              >
                <input
                  type="checkbox"
                  checked={visible[option.key] ?? true}
                  onChange={() => onToggle(option.key)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
                />
                {option.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

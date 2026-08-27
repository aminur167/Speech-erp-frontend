import { type SelectHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  /** Width class for the wrapping div — defaults to "w-full". Pass "w-auto" for inline toolbar use. */
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, containerClassName = "w-full", children, ...props }, ref) => {
    return (
      <div className={containerClassName}>
        <select
          ref={ref}
          className={clsx(
            "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-all",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error ? "border-danger" : "border-border",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";

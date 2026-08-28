import { type InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  /** Width class for the wrapping div — defaults to "w-full". Pass "w-auto" for inline toolbar use. */
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, containerClassName = "w-full", ...props }, ref) => {
    return (
      <div className={containerClassName}>
        <input
          ref={ref}
          className={clsx(
            "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-all placeholder:text-text-secondary/70",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error ? "border-danger" : "border-border",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

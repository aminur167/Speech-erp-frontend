import { type InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={clsx(
            "w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors",
            "focus:border-primary focus:ring-1 focus:ring-primary",
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

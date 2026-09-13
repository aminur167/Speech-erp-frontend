import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { clsx } from "clsx";
import { FieldLabel } from "@/components/ui/FieldLabel";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  /** The field's visible title. Pair it with a placeholder — see FieldLabel. */
  label?: string;
  /**
   * Shows the red asterisk without setting native `required` — forms here
   * validate with zod, and the browser's own pop-up would pre-empt the
   * app's message.
   */
  requiredMark?: boolean;
  /** Width class for the wrapping div — defaults to "w-full". Pass "w-auto" for inline toolbar use. */
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, requiredMark, id, containerClassName = "w-full", ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className={containerClassName}>
        {label && (
          <FieldLabel htmlFor={inputId} required={props.required || requiredMark}>
            {label}
          </FieldLabel>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-all placeholder:text-text-secondary/70",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error ? "border-danger" : "border-border",
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

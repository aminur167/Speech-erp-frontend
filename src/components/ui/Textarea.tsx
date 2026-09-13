import { type TextareaHTMLAttributes, forwardRef, useId } from "react";
import { clsx } from "clsx";
import { FieldLabel } from "@/components/ui/FieldLabel";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  /** The field's visible title. Pair it with a placeholder — see FieldLabel. */
  label?: string;
  /**
   * Shows the red asterisk without setting native `required` — forms here
   * validate with zod, and the browser's own pop-up would pre-empt the
   * app's message.
   */
  requiredMark?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, requiredMark, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="w-full">
        {label && (
          <FieldLabel htmlFor={textareaId} required={props.required || requiredMark}>
            {label}
          </FieldLabel>
        )}
        <textarea
          ref={ref}
          id={textareaId}
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
Textarea.displayName = "Textarea";

import {
  Children,
  type SelectHTMLAttributes,
  forwardRef,
  isValidElement,
  useId,
} from "react";
import { clsx } from "clsx";
import { FieldLabel } from "@/components/ui/FieldLabel";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  /** The field's visible title. */
  label?: string;
  /**
   * Shows the red asterisk without setting native `required` — forms here
   * validate with zod, and the browser's own pop-up would pre-empt the
   * app's message.
   */
  requiredMark?: boolean;
  /**
   * Prompt shown as a disabled first option, e.g. "Select a designation".
   *
   * A native select has no placeholder, so this is the conventional stand-in.
   * It is skipped when the list already has an empty-value option such as
   * "All genders", which is that list's placeholder already — and because it
   * is disabled it can never be submitted, so a default value is unaffected.
   */
  placeholder?: string;
  /** Width class for the wrapping div — defaults to "w-full". Pass "w-auto" for inline toolbar use. */
  containerClassName?: string;
}

function hasEmptyOption(children: React.ReactNode): boolean {
  return Children.toArray(children).some(
    (child) =>
      isValidElement(child) &&
      child.type === "option" &&
      (child.props as { value?: unknown }).value === "",
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, error, label, requiredMark, placeholder, id, containerClassName = "w-full", children, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className={containerClassName}>
        {label && (
          <FieldLabel htmlFor={selectId} required={props.required || requiredMark}>
            {label}
          </FieldLabel>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-all",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error ? "border-danger" : "border-border",
            className,
          )}
          {...props}
        >
          {placeholder && !hasEmptyOption(children) && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {error && (
          <p id={errorId} className="mt-1 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";

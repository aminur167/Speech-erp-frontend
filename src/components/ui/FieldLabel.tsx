import type { ReactNode } from "react";

/**
 * The title above a form field.
 *
 * Every field gets one as well as a placeholder: a placeholder disappears the
 * moment someone starts typing, so on its own it leaves a half-filled form
 * with no way to tell which box was which.
 */
export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-text-secondary">
      {children}
      {required && (
        <span className="text-danger" aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </label>
  );
}

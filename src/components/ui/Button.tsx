import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-sm hover:bg-primary-hover",
  accent: "bg-accent text-white shadow-sm hover:bg-accent-hover",
  secondary:
    "bg-surface text-text-primary border border-border hover:border-primary/40 hover:bg-primary-light/60",
  ghost: "bg-transparent text-primary hover:bg-primary-light",
  danger: "bg-danger text-white shadow-sm hover:opacity-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {isLoading ? "Loading…" : children}
      </button>
    );
  },
);
Button.displayName = "Button";

import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

/**
 * The search box that leads every list page's toolbar.
 *
 * Takes ordinary input props, so each page keeps its own state and paging
 * logic exactly as it was; this only adds the icon and the accessible name.
 */
export const SearchField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, placeholder, ...props }, ref) => (
    <div className="relative w-full">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
      />
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        aria-label={props["aria-label"] ?? placeholder}
        className={clsx("pl-9", className)}
        {...props}
      />
    </div>
  ),
);
SearchField.displayName = "SearchField";

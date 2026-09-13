import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";
import { Search } from "lucide-react";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Input } from "@/components/ui/Input";

/**
 * The search box that leads every list page's toolbar.
 *
 * Takes ordinary input props, so each page keeps its own state and paging
 * logic exactly as it was; this only adds the icon, the title and the
 * accessible name. The title is rendered outside the icon's wrapper — inside
 * it, the icon would centre on title and box together and sit too high.
 */
export const SearchField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ className, placeholder, label = "Search", id, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="w-full">
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
        />
        <Input
          ref={ref}
          id={inputId}
          type="search"
          placeholder={placeholder}
          className={clsx("pl-9", className)}
          {...props}
        />
      </div>
    </div>
  );
});
SearchField.displayName = "SearchField";

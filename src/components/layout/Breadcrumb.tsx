import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export function Breadcrumb({ homeHref, items }: { homeHref: string; items: string[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-text-secondary">
      <Link href={homeHref} className="flex items-center hover:text-text-primary">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={index === items.length - 1 ? "font-medium text-text-primary" : ""}>
            {item}
          </span>
        </span>
      ))}
    </nav>
  );
}

import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export function PageHeader({
  homeHref,
  breadcrumb,
  title,
  subtitle,
  action,
}: {
  homeHref: string;
  breadcrumb: string[];
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5">
      <Breadcrumb homeHref={homeHref} items={breadcrumb} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

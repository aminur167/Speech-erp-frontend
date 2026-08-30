import type { ReactNode } from "react";
import { clsx } from "clsx";
import { Clock, CalendarDays, Layers, Globe, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/currency";
import type { Service, ServiceCategory } from "@/types/domain";

const CATEGORY_ICON: Record<ServiceCategory, LucideIcon> = {
  daily: Clock,
  monthly: CalendarDays,
  installment: Layers,
  online: Globe,
};

const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  daily: "Daily",
  monthly: "Monthly",
  installment: "Installment",
  online: "Online",
};

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary/70">
        {label}
      </span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

export function ServiceCard({
  service,
  selected,
  onSelect,
  actions,
  enrolledCount,
}: {
  service: Service;
  selected?: boolean;
  onSelect?: (service: Service) => void;
  actions?: ReactNode;
  enrolledCount?: number;
}) {
  const Icon = CATEGORY_ICON[service.category];
  const hasDiscount = Boolean(service.originalFee && service.originalFee > service.fee);

  const meta = [
    service.durationLabel && { label: "Duration", value: service.durationLabel },
    service.sessionsLabel && { label: "Sessions", value: service.sessionsLabel },
    service.expiryLabel && { label: "Expiry", value: service.expiryLabel },
  ].filter(Boolean) as { label: string; value: string }[];

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight text-text-primary">
              {service.name}
            </h3>
            <p className="font-mono text-[11px] text-text-secondary">{service.code}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone="info" label={CATEGORY_LABEL[service.category]} />
          {service.isActive ? (
            <Badge tone="success" label="Available" />
          ) : (
            <Badge tone="neutral" label="Inactive" />
          )}
        </div>
      </div>

      {service.description && (
        <p className="text-sm text-text-secondary">{service.description}</p>
      )}

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-xl font-semibold text-text-primary">
          {formatCurrency(service.fee)}
        </span>
        {hasDiscount && (
          <span className="text-sm text-text-secondary line-through">
            {formatCurrency(service.originalFee as number)}
          </span>
        )}
        <span className="text-xs text-text-secondary">
          / {service.durationLabel ?? (service.isOnline ? "Online" : "In-clinic")}
        </span>
      </div>

      {meta.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-background px-3 py-3">
          {meta.map((item) => (
            <MetaItem key={item.label} {...item} />
          ))}
        </div>
      )}

      {typeof enrolledCount === "number" && (
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Users className="h-3.5 w-3.5" />
          {enrolledCount} enrolled
        </div>
      )}
    </>
  );

  const className = clsx(
    "flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
    selected ? "border-primary bg-primary-light/50" : "border-border bg-surface",
    onSelect && "hover:border-primary/40",
  );

  if (!onSelect) {
    return (
      <div className={className}>
        {content}
        {actions && <div className="mt-1 flex gap-2 border-t border-border pt-3">{actions}</div>}
      </div>
    );
  }

  return (
    <button type="button" onClick={() => onSelect(service)} className={className}>
      {content}
    </button>
  );
}

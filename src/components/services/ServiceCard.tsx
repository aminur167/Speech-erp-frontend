import { clsx } from "clsx";
import { formatCurrency } from "@/utils/currency";
import type { Service } from "@/types/domain";

export function ServiceCard({
  service,
  selected,
  onSelect,
}: {
  service: Service;
  selected?: boolean;
  onSelect?: (service: Service) => void;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-text-primary">{service.name}</h3>
        <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark">
          {service.isOnline ? "Online" : "In-clinic"}
        </span>
      </div>
      <p className="font-mono text-xs text-text-secondary">{service.code}</p>
      {service.description && (
        <p className="text-sm text-text-secondary">{service.description}</p>
      )}
      <p className="mt-1 text-lg font-semibold text-text-primary">
        {formatCurrency(service.fee)}
      </p>
    </>
  );

  const className = clsx(
    "flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
    selected ? "border-primary bg-primary-light/50" : "border-border bg-surface",
    onSelect && "hover:border-primary/40",
  );

  if (!onSelect) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" onClick={() => onSelect(service)} className={className}>
      {content}
    </button>
  );
}

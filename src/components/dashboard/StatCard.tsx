import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="flex items-center gap-4">
      {Icon && (
        <div className="rounded-md bg-primary-light p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-xl font-semibold text-text-primary">{value}</p>
      </div>
    </Card>
  );
}

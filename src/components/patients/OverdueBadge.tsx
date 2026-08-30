import { Badge } from "@/components/ui/Badge";

/**
 * Flags a patient whose active enrollment/plan has an unpaid bill past its
 * due date (docs/05). Surfacing only — nothing about enrollment, booking, or
 * material sale is blocked by this status.
 */
export function OverdueBadge({ className }: { className?: string }) {
  return <Badge tone="danger" label="Overdue — সেবা বন্ধ" className={className} />;
}

import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function ReportsPage() {
  return (
    <PagePlaceholder
      homeHref="/admin/dashboard"
      roleLabel="Admin"
      title="Reports"
      subtitle="Revenue, service and payment-type reports across the organization."
    />
  );
}

import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function AdminServicesPage() {
  return (
    <PagePlaceholder
      homeHref="/admin/dashboard"
      roleLabel="Admin"
      title="Services"
      subtitle="Manage the service catalog offered across all branches."
    />
  );
}

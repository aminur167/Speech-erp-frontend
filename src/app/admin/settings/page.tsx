import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function AdminSettingsPage() {
  return (
    <PagePlaceholder
      homeHref="/admin/dashboard"
      roleLabel="Admin"
      title="Settings"
      subtitle="Manage system-wide configuration and preferences."
    />
  );
}

import { SettingsView } from "@/components/settings/SettingsView";

export default function AdminSettingsPage() {
  return <SettingsView homeHref="/admin/dashboard" roleLabel="Admin" />;
}

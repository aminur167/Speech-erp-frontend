import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function DailyClosingPage() {
  return (
    <PagePlaceholder
      homeHref="/manager/dashboard"
      roleLabel="Branch Manager"
      title="Daily Closing"
      subtitle="Review today's collection and submit the branch closing report."
    />
  );
}

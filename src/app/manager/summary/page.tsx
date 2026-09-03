import { BranchSummaryView } from "@/components/reports/BranchSummaryView";

export default function ManagerSummaryPage() {
  return (
    <BranchSummaryView
      homeHref="/manager/dashboard"
      breadcrumb={["Branch Manager", "Summary"]}
      subtitle="Everything your branch did over a date range you choose."
    />
  );
}

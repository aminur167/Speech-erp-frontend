import { BranchSummaryView } from "@/components/reports/BranchSummaryView";

export default function ManagerSummaryPage() {
  return (
    <BranchSummaryView
      homeHref="/manager/dashboard"
      breadcrumb={["Branch Manager", "Summary"]}
      subtitle="Every invoice, expense, refund and closing your branch recorded, line by line."
    />
  );
}

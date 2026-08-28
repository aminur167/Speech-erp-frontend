import { DailyClosingView } from "@/components/dailyClosing/DailyClosingView";

export default async function AdminBranchDailyClosingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DailyClosingView
      branchId={id}
      homeHref={`/admin/branches/${id}`}
      roleLabel="Admin"
      readOnly
    />
  );
}

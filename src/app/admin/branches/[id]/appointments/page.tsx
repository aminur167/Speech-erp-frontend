import { BookingCalendarView } from "@/components/enrollments/BookingCalendarView";

export default async function AdminBranchAppointmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <BookingCalendarView homeHref={`/admin/branches/${id}`} roleLabel="Admin" branchId={id} />
  );
}

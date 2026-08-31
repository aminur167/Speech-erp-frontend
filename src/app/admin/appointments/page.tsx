import { BookingCalendarView } from "@/components/enrollments/BookingCalendarView";

export default function AdminAppointmentsPage() {
  return <BookingCalendarView homeHref="/admin/dashboard" roleLabel="Admin" />;
}

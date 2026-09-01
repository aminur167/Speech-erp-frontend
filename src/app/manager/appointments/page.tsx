import { BookingCalendarView } from "@/components/enrollments/BookingCalendarView";

export default function ManagerAppointmentsPage() {
  return <BookingCalendarView homeHref="/manager/dashboard" roleLabel="Branch Manager" />;
}

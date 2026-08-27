import { PatientListView } from "@/components/patients/PatientListView";

export default function AdminPatientsPage() {
  return (
    <PatientListView basePath="/admin/patients" homeHref="/admin/dashboard" roleLabel="Admin" />
  );
}

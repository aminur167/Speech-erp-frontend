import { PatientListView } from "@/components/patients/PatientListView";

export default function ManagerPatientsPage() {
  return (
    <PatientListView
      basePath="/manager/patients"
      homeHref="/manager/dashboard"
      roleLabel="Branch Manager"
    />
  );
}

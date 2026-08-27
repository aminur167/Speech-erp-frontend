import { PatientListView } from "@/components/patients/PatientListView";

export default function ManagerPatientsPage() {
  return <PatientListView basePath="/manager/patients" canRegister />;
}

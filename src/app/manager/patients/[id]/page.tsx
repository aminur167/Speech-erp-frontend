import { PatientProfileView } from "@/components/patients/PatientProfileView";

export default async function ManagerPatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientProfileView patientId={id} />;
}

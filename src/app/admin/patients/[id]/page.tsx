import { PatientProfileView } from "@/components/patients/PatientProfileView";

export default async function AdminPatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientProfileView patientId={id} />;
}

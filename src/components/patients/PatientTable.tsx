import Link from "next/link";
import type { Patient } from "@/types/domain";

export function PatientTable({
  patients,
  basePath,
}: {
  patients: Patient[];
  basePath: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Patient ID</th>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Phone</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-b border-border last:border-0">
              <td className="py-2 pr-4 font-mono text-xs text-text-secondary">
                {patient.patientCode}
              </td>
              <td className="py-2 pr-4">
                <Link
                  href={`${basePath}/${patient.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {patient.name}
                </Link>
              </td>
              <td className="py-2 pr-4">{patient.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

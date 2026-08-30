import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { OverdueBadge } from "@/components/patients/OverdueBadge";
import type { PatientDirectoryItem } from "@/lib/api/patientDirectory";
import type { ServiceCategory } from "@/types/domain";

const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  daily: "Daily",
  monthly: "Monthly",
  installment: "Installment",
  online: "Online",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const statusTone: Record<string, "success" | "purple" | "warning"> = {
  "active-care": "success",
  "in-progress": "purple",
  "action-needed": "warning",
};

const statusLabel: Record<string, string> = {
  "active-care": "Active Care",
  "in-progress": "In Progress",
  "action-needed": "Action Needed",
};

export interface PatientTableColumns {
  [key: string]: boolean;
  age: boolean;
  gender: boolean;
  guardian: boolean;
  phone: boolean;
  therapyType: boolean;
  serviceType: boolean;
  paymentType: boolean;
  status: boolean;
  branch: boolean;
}

export function PatientTable({
  patients,
  basePath,
  columns,
}: {
  patients: PatientDirectoryItem[];
  basePath: string;
  columns: PatientTableColumns;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Patient ID</th>
            <th className="py-2 pr-4 font-medium">Patient Name</th>
            {columns.age && <th className="py-2 pr-4 font-medium">Age</th>}
            {columns.gender && <th className="py-2 pr-4 font-medium">Gender</th>}
            {columns.guardian && <th className="py-2 pr-4 font-medium">Guardian</th>}
            {columns.phone && <th className="py-2 pr-4 font-medium">Phone</th>}
            {columns.therapyType && <th className="py-2 pr-4 font-medium">Therapy Type</th>}
            {columns.serviceType && <th className="py-2 pr-4 font-medium">Service Type</th>}
            {columns.paymentType && <th className="py-2 pr-4 font-medium">Payment Type</th>}
            {columns.status && <th className="py-2 pr-4 font-medium">Status</th>}
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-b border-border last:border-0">
              <td className="py-2 pr-4 font-mono text-xs text-text-secondary">
                {patient.patientCode}
              </td>
              <td className="py-2 pr-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary-dark">
                    {getInitials(patient.name)}
                  </span>
                  <div>
                    <Link
                      href={`${basePath}/${patient.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {patient.name}
                    </Link>
                    {columns.branch && (
                      <p className="text-xs text-text-secondary">{patient.branchName}</p>
                    )}
                  </div>
                </div>
              </td>
              {columns.age && <td className="py-2 pr-4">{patient.age ?? "—"}</td>}
              {columns.gender && (
                <td className="py-2 pr-4 capitalize">{patient.gender ?? "—"}</td>
              )}
              {columns.guardian && (
                <td className="py-2 pr-4">
                  {patient.guardianName ? (
                    <>
                      <p>{patient.guardianName}</p>
                      {patient.guardianRelation && (
                        <p className="text-xs capitalize text-text-secondary">
                          {patient.guardianRelation}
                        </p>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              )}
              {columns.phone && <td className="py-2 pr-4">{patient.phone}</td>}
              {columns.therapyType && <td className="py-2 pr-4">{patient.therapyType}</td>}
              {columns.serviceType && (
                <td className="py-2 pr-4">
                  {patient.serviceCategories.length > 0
                    ? patient.serviceCategories
                        .map((category) => SERVICE_CATEGORY_LABELS[category])
                        .join(", ")
                    : "—"}
                </td>
              )}
              {columns.paymentType && <td className="py-2 pr-4">{patient.paymentType}</td>}
              {columns.status && (
                <td className="py-2 pr-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <Badge tone={statusTone[patient.status]} label={statusLabel[patient.status]} />
                    {patient.serviceStatus === "overdue" && <OverdueBadge />}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

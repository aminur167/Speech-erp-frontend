import { Phone, UserRound } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/states";
import type { Patient, Gender } from "@/types/domain";

const GENDER_LABEL: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export function PatientSearchResultList({
  results,
  isLoading,
  search,
  onSelect,
}: {
  results?: Patient[];
  isLoading: boolean;
  search: string;
  onSelect: (patient: Patient) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {isLoading && <LoadingState label="Searching…" />}
      {!isLoading && search && results?.length === 0 && (
        <EmptyState label="No matching patients." />
      )}
      {results?.map((patient) => (
        <button
          key={patient.id}
          type="button"
          onClick={() => onSelect(patient)}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-border px-4 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary-light/40"
        >
          <div className="flex min-w-0 flex-col">
            <span className="font-medium text-text-primary">{patient.name}</span>
            <span className="font-mono text-xs text-text-secondary">{patient.patientCode}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {patient.phone}
            </span>
            <span className="flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />
              {patient.gender ? GENDER_LABEL[patient.gender] : "—"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

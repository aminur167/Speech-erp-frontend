import { formatCurrency } from "@/utils/currency";
import type { Patient, Service } from "@/types/domain";

export function PaymentSummary({ patient, service }: { patient: Patient; service: Service }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-text-secondary">Patient</span>
        <span className="font-medium text-text-primary">
          {patient.name} ({patient.patientCode})
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Service</span>
        <span className="font-medium text-text-primary">{service.name}</span>
      </div>
      {service.category === "monthly" ? (
        // A monthly package's enrollment month is its admit fee; the monthly
        // fee only starts the month after.
        <>
          <div className="flex justify-between">
            <span className="text-text-secondary">Monthly fee (from next month)</span>
            <span className="font-medium text-text-primary">{formatCurrency(service.fee)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-text-secondary">Admit Fee (this month)</span>
            <span className="text-lg font-semibold text-primary-dark">
              {formatCurrency(service.admissionFee ?? service.fee)}
            </span>
          </div>
        </>
      ) : (
        <div className="flex justify-between border-t border-border pt-2">
          <span className="text-text-secondary">Amount Due</span>
          <span className="text-lg font-semibold text-primary-dark">
            {formatCurrency(service.fee)}
          </span>
        </div>
      )}
    </div>
  );
}

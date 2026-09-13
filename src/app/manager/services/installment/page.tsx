import { PageHeader } from "@/components/layout/PageHeader";
import { InstallmentServiceEnrollment } from "@/components/services/InstallmentServiceEnrollment";

export default function InstallmentServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Installment Services"
      />
      <InstallmentServiceEnrollment />
    </div>
  );
}

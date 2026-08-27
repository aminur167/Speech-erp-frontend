import { PageHeader } from "@/components/layout/PageHeader";
import { InstallmentServiceEnrollment } from "@/components/services/InstallmentServiceEnrollment";

export default function InstallmentServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Installment Services"]}
        title="Installment Services"
        subtitle="Set up an installment plan and collect scheduled payments."
      />
      <InstallmentServiceEnrollment />
    </div>
  );
}

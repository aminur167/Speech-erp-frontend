import { PageHeader } from "@/components/layout/PageHeader";
import { MonthlyServiceEnrollment } from "@/components/services/MonthlyServiceEnrollment";

export default function MonthlyServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Monthly Services"
      />
      <MonthlyServiceEnrollment />
    </div>
  );
}

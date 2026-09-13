import { PageHeader } from "@/components/layout/PageHeader";
import { DailyServiceEnrollment } from "@/components/services/DailyServiceEnrollment";

export default function DailyServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Daily Services"
      />
      <DailyServiceEnrollment />
    </div>
  );
}

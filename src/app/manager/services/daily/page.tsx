import { PageHeader } from "@/components/layout/PageHeader";
import { DailyServiceEnrollment } from "@/components/services/DailyServiceEnrollment";

export default function DailyServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Daily Services"]}
        title="Daily Services"
        subtitle="Enroll a patient into a single-visit service and collect payment."
      />
      <DailyServiceEnrollment />
    </div>
  );
}

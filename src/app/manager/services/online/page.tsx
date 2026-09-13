import { PageHeader } from "@/components/layout/PageHeader";
import { OnlineServiceEnrollment } from "@/components/services/OnlineServiceEnrollment";

export default function OnlineServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Online Services / Booking"
      />
      <OnlineServiceEnrollment />
    </div>
  );
}

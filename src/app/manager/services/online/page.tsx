import { PageHeader } from "@/components/layout/PageHeader";
import { OnlineServiceEnrollment } from "@/components/services/OnlineServiceEnrollment";

export default function OnlineServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref="/manager/dashboard"
        breadcrumb={["Branch Manager", "Online Services"]}
        title="Online Services / Booking"
        subtitle="Book an online session and collect the advance payment."
      />
      <OnlineServiceEnrollment />
    </div>
  );
}

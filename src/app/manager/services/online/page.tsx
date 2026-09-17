import { PageHeader } from "@/components/layout/PageHeader";
import { OnlineServicesView } from "@/components/services/OnlineServicesView";

export default function OnlineServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Online Services / Booking"
      />
      <OnlineServicesView />
    </div>
  );
}

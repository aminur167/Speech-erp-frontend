"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { EnquiryTable } from "@/components/enquiries/EnquiryTable";

/**
 * The Enquiries page — the same for both roles, bar the Branch column.
 *
 * A page rather than a modal: this is a daily working list (who do I ring
 * back today?), not something opened in passing from another screen.
 */
export function EnquiriesView({ showBranch = false }: { showBranch?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Enquiries" />
      <EnquiryTable showBranch={showBranch} />
    </div>
  );
}

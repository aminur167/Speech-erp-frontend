import { Badge } from "@/components/ui/Badge";
import type { PackageAction, PackageChangeRequest, Service } from "@/types/domain";

export const CHANGE_ACTION_LABEL: Record<PackageAction, string> = {
  edit: "Edit",
  delete: "Delete",
  deactivate: "Deactivate",
  activate: "Activate",
};

function requestLabel(request: PackageChangeRequest): string {
  const verb = CHANGE_ACTION_LABEL[request.action];
  return request.status === "pending" ? `${verb} requested` : `${verb} approved`;
}

/**
 * A package's status, the same in the table and on the card.
 *
 * A Manager's open request to change the package takes the place of
 * "Available": "Delete requested" (or Edit / Deactivate / Activate) while
 * Admin decides, "… approved" once the Manager may go ahead. Rejecting a
 * request clears it, and the package reads "Available" again.
 */
export function PackageStatusBadge({ service }: { service: Service }) {
  if (service.reviewStatus === "pending") return <Badge tone="warning" label="Pending Review" />;
  if (service.reviewStatus === "rejected") return <Badge tone="danger" label="Rejected" />;

  const requests = service.changeRequests ?? [];
  if (requests.length > 0) {
    return (
      <span className="inline-flex flex-wrap gap-1">
        {requests.map((request) => (
          <Badge
            key={request.id}
            tone={
              request.status === "pending"
                ? "warning"
                : request.action === "delete"
                  ? "danger"
                  : "info"
            }
            label={requestLabel(request)}
          />
        ))}
      </span>
    );
  }

  return service.isActive ? (
    <Badge tone="success" label="Available" />
  ) : (
    <Badge tone="neutral" label="Inactive" />
  );
}

/** One line per open request under the package name: who asked, and why. */
export function ChangeRequestNotes({
  service,
  className = "mt-0.5 text-[11px] text-warning",
}: {
  service: Service;
  className?: string;
}) {
  const requests = service.changeRequests ?? [];
  if (requests.length === 0) return null;
  return (
    <>
      {requests.map((request) => (
        <p key={request.id} className={className}>
          {requestLabel(request)}
          {request.requestedBy ? ` by ${request.requestedBy}` : ""}
          {request.reason ? `: ${request.reason}` : ""}
        </p>
      ))}
    </>
  );
}

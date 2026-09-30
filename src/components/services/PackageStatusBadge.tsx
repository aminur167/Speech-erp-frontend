import { Badge } from "@/components/ui/Badge";
import type { Service } from "@/types/domain";

/**
 * A package's status, the same in the table and on the card.
 *
 * A Manager's open request to delete the package takes the place of
 * "Available": "Delete requested" while Admin decides, "Delete approved"
 * once the Manager may delete it. Rejecting the request clears it, and the
 * package reads "Available" again.
 */
export function PackageStatusBadge({ service }: { service: Service }) {
  if (service.reviewStatus === "pending") return <Badge tone="warning" label="Pending Review" />;
  if (service.reviewStatus === "rejected") return <Badge tone="danger" label="Rejected" />;

  const request = service.deleteRequest;
  if (request?.status === "pending") return <Badge tone="warning" label="Delete requested" />;
  if (request?.status === "approved") return <Badge tone="danger" label="Delete approved" />;

  return service.isActive ? (
    <Badge tone="success" label="Available" />
  ) : (
    <Badge tone="neutral" label="Inactive" />
  );
}

/** One line under the package name saying who asked and why. */
export function DeleteRequestNote({ service }: { service: Service }) {
  const request = service.deleteRequest;
  if (!request) return null;
  return (
    <p className="mt-0.5 text-[11px] text-warning">
      {request.status === "pending" ? "Delete requested" : "Delete approved"}
      {request.requestedBy ? ` by ${request.requestedBy}` : ""}
      {request.reason ? `: ${request.reason}` : ""}
    </p>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";
import type { OutstandingDueItem } from "@/lib/api/monthlyEnrollments";
import type { EnrollmentEligibility } from "@/hooks/enrollments/useEnrollmentEligibility";

function DueList({ items }: { items: OutstandingDueItem[] }) {
  return (
    <ul className="flex flex-col gap-1 border-t border-current/20 pt-3 text-sm">
      {items.map((item) => (
        <li key={`${item.type}-${item.itemId}`} className="flex justify-between gap-3">
          <span className="text-text-secondary">
            {item.label}
            <span className="text-text-secondary/70"> · {item.serviceName}</span>
            {!item.serviceActive && (
              <span className="text-text-secondary/70"> (inactive service)</span>
            )}
          </span>
          <span className="tabular-nums text-text-primary">
            {formatCurrency(item.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * What stands between this patient and this service, and what does not.
 *
 * Three different things, deliberately looking different, because the manager
 * does something different about each:
 *
 * - **a live package for this service** — nothing to do but pick another
 *   service; enrolling twice would bill one course of therapy twice;
 * - **money owed on this service** — collect it first, so the Due Payments
 *   link is the action;
 * - **money owed on anything else** — nothing to do. This is the case the
 *   clinic asked to unblock (2026-10-27): it is shown in full and in a
 *   neutral colour, because refusing the sale never collected the debt, it
 *   only cost the clinic the next one.
 *
 * Plus the nudge that matters most for the money: if a **stopped** package
 * for this service exists, enrolling afresh charges the admit fee again,
 * while reactivating charges nothing. The manager may genuinely want either;
 * what they must not do is take a joining fee from someone who only needed
 * their old service switched back on.
 */
export function EnrollmentEligibilityNotice({
  eligibility,
  patientId,
  serviceName,
}: {
  eligibility: EnrollmentEligibility;
  patientId: string;
  serviceName: string;
}) {
  const router = useRouter();
  const {
    alreadyEnrolled,
    resumableRefId,
    serviceDues,
    serviceDuesTotal,
    allDues,
  } = eligibility;

  // Everything owed that is NOT on this service: shown, never blocking.
  const otherDues = allDues.filter(
    (item) => !serviceDues.some((owed) => owed.itemId === item.itemId),
  );
  const otherTotal = otherDues.reduce((sum, item) => sum + item.amount, 0);

  const toProfile = () => router.push(`/manager/patients/${patientId}`);

  return (
    <div className="flex flex-col gap-3">
      {alreadyEnrolled && (
        <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-text-primary">
                Already enrolled in {serviceName}
              </p>
              <p className="text-xs text-text-secondary">
                This patient has a running package for this service. Enrolling
                again would bill them twice for the same therapy.
              </p>
            </div>
          </div>
          <div className="border-t border-danger/20 pt-3">
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={toProfile}
            >
              View their services
            </Button>
          </div>
        </div>
      )}

      {serviceDuesTotal > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-text-primary">
                {serviceName} has unpaid dues
              </p>
              <p className="text-xs text-text-secondary">
                Clear these before enrolling in this service again — otherwise
                the old amount owed is buried under a new package.
              </p>
            </div>
          </div>
          <DueList items={serviceDues} />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-danger/20 pt-3">
            <span className="text-sm font-medium text-text-primary">
              Due on this service: {formatCurrency(serviceDuesTotal)}
            </span>
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={() => router.push("/manager/due-payments")}
            >
              Go to Due Payments
            </Button>
          </div>
        </div>
      )}

      {/* The stopped-package nudge. Only when enrolling is actually possible —
          with a due on this service the manager is being sent to collect it,
          and offering reactivation alongside would be two instructions. */}
      {!alreadyEnrolled && serviceDuesTotal <= 0 && resumableRefId && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex gap-3">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-text-primary">
                You can resume this service for this patient
              </p>
              <p className="text-xs text-text-secondary">
                They were enrolled in {serviceName} before and it was stopped.
                Resuming keeps that history and charges nothing; enrolling
                afresh starts a new package and takes the admit fee again.
              </p>
            </div>
          </div>
          <div className="border-t border-primary/20 pt-3">
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={toProfile}
            >
              Resume from their profile
            </Button>
          </div>
        </div>
      )}

      {otherTotal > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-text-primary">
                This patient owes money on other services
              </p>
              <p className="text-xs text-text-secondary">
                This does not stop the enrollment. It is here so you know the
                balance before taking payment.
              </p>
            </div>
          </div>
          <DueList items={otherDues} />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <span className="text-sm font-medium text-text-primary">
              Owed elsewhere: {formatCurrency(otherTotal)}
            </span>
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={() => router.push("/manager/due-payments")}
            >
              Go to Due Payments
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

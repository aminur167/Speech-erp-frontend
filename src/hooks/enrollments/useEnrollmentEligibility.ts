"use client";

import { usePatientOutstandingDues } from "@/hooks/patients/usePatientOutstandingDues";
import { usePatientActiveServices } from "@/hooks/patients/usePatientActiveServices";
import type { OutstandingDueItem } from "@/lib/api/monthlyEnrollments";

export interface EnrollmentEligibility {
  /** Everything the patient owes, across every service. Shown, never a blocker. */
  allDues: OutstandingDueItem[];
  allDuesTotal: number;
  /** The part of that owed on the service being sold. This one blocks. */
  serviceDues: OutstandingDueItem[];
  serviceDuesTotal: number;
  /** A live package for this service already exists — enrolling would double-bill. */
  alreadyEnrolled: boolean;
  /**
   * A stopped package for this service. Not a blocker: re-joining is allowed
   * and charges the admit fee again. Surfaced so the manager can reactivate
   * instead, which charges nothing.
   */
  resumableRefId?: string;
  /** False while anything above refuses the sale. */
  canEnroll: boolean;
}

/**
 * Whether this patient may be sold this service, and what to tell the manager
 * either way.
 *
 * Mirrors the server's three rules (backend `_assert_not_already_enrolled`,
 * `_assert_service_dues_clear`) so the screen explains the refusal *before*
 * the button rather than after the request:
 *
 * 1. a live package for this service blocks it — two would bill the patient
 *    twice for one course of therapy;
 * 2. money owed **on this service** blocks it — re-selling the package
 *    someone has not paid for buries the first due under a second;
 * 3. money owed on **anything else** does not. It is shown in full, because
 *    the manager should see the whole balance and decide — refusing the sale
 *    never collected the debt, it only cost the clinic the next one.
 *
 * Both reads are already made by the profile screen, so they are cached by
 * the time a patient is picked here.
 */
export function useEnrollmentEligibility(
  patientId: string | undefined,
  serviceId: string | undefined,
): EnrollmentEligibility {
  const { data: outstanding } = usePatientOutstandingDues(patientId);
  const { data: held } = usePatientActiveServices(patientId ?? "");

  const allDues = outstanding?.items ?? [];
  const serviceDues = serviceId
    ? allDues.filter((item) => item.serviceId === serviceId)
    : [];

  const forThisService = (held ?? []).filter((item) => {
    const itemServiceId =
      item.type === "monthly" ? item.enrollment.serviceId : item.plan.serviceId;
    return itemServiceId === serviceId;
  });

  const alreadyEnrolled = forThisService.some((item) => item.isActive);
  const resumable = forThisService.find((item) => !item.isActive);

  const serviceDuesTotal = serviceDues.reduce((sum, item) => sum + item.amount, 0);

  return {
    allDues,
    allDuesTotal: outstanding?.total ?? 0,
    serviceDues,
    serviceDuesTotal,
    alreadyEnrolled,
    resumableRefId: resumable?.id,
    canEnroll: Boolean(serviceId) && !alreadyEnrolled && serviceDuesTotal <= 0,
  };
}

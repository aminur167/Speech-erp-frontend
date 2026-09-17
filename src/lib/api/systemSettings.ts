/**
 * Clinic-wide settings, backed by apps/common's `SystemSettings` singleton.
 * Currently the one knob: how many days without a visit before the
 * attendance sheet flags a patient as having stopped coming.
 */
import { apiClient } from "@/lib/api/client";

export interface SystemSettings {
  stoppedComingAfterDays: number;
}

/** Any authenticated user may read this — a Manager's own attendance sheet is measured against it. */
export async function getSystemSettings(): Promise<SystemSettings> {
  const { data } = await apiClient.get<SystemSettings>("/settings/system/");
  return data;
}

/** Admin only — enforced server-side; the value applies across every branch. */
export async function updateSystemSettings(
  input: SystemSettings,
): Promise<SystemSettings> {
  const { data } = await apiClient.patch<SystemSettings>("/settings/system/", input);
  return data;
}

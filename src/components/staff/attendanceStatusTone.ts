import type { AttendanceStatus } from "@/types/domain";

/** Shared badge/calendar coloring for attendance status — present is green, absent and early leave read as warning/danger, on-leave is neutral-info. */
export const ATTENDANCE_STATUS_TONE: Record<AttendanceStatus, "success" | "warning" | "info" | "danger"> = {
  present: "success",
  early_leave: "warning",
  on_leave: "info",
  absent: "danger",
};

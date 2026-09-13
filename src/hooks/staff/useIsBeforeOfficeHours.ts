"use client";

import { useEffect, useState } from "react";

/** Must match `OFFICE_START_HOUR` in apps/staff/services.py — that's the actual rule; this only disables the button early so a rejection is never a surprise. */
const OFFICE_START_HOUR = 9;

function isBeforeOfficeHours(): boolean {
  return new Date().getHours() < OFFICE_START_HOUR;
}

/** True before the office opens for the day — checked every 30s so "Check In" enables itself right at 9am without a page reload. */
export function useIsBeforeOfficeHours(): boolean {
  const [isBefore, setIsBefore] = useState(isBeforeOfficeHours);

  useEffect(() => {
    const id = setInterval(() => setIsBefore(isBeforeOfficeHours()), 30_000);
    return () => clearInterval(id);
  }, []);

  return isBefore;
}

import type { EnquirySource, EnquiryStatus } from "@/types/domain";

/**
 * The labels for an enquiry's fixed choices, in one place.
 *
 * Written out rather than run through `humanizeField`, because several of
 * these read badly when derived: "visit_planned" is "Coming in" to a
 * receptionist, not "Visit planned", and the whole point of the source list
 * is that it matches what the client calls their own channels.
 */
export const SOURCE_LABELS: Record<EnquirySource, string> = {
  facebook: "Facebook",
  google: "Google",
  poster: "Poster / leaflet",
  referral: "Referred by someone",
  signboard: "Signboard / passing by",
  other: "Other",
};

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  visit_planned: "Coming in",
  visited: "Visited",
  converted: "Enrolled",
  not_interested: "Not interested",
  unreachable: "Unreachable",
};

export const RELATION_LABELS: Record<string, string> = {
  self: "The patient themselves",
  father: "Father",
  mother: "Mother",
  guardian: "Guardian",
  other: "Other",
};

/**
 * Follow-up is a different question from status: status says where someone
 * is in the funnel, this says whether today's work includes them. A manager
 * opening the page filters on this; an admin measuring an ad filters on
 * status.
 */
export const FOLLOW_UP_OPTIONS: { value: string; label: string }[] = [
  { value: "today", label: "Due today" },
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "none", label: "No date set" },
];

/** Statuses that stop an enquiry counting as outstanding work. */
export const CLOSED_STATUSES: EnquiryStatus[] = ["converted", "not_interested"];

export function statusTone(status: EnquiryStatus): "success" | "danger" | "neutral" {
  if (status === "converted") return "success";
  if (status === "not_interested" || status === "unreachable") return "danger";
  return "neutral";
}

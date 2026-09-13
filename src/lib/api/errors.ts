import type { AxiosError } from "axios";
import { fieldErrorsToCamelCase } from "@/lib/api/caseUtils";
import type { ApiError, ApiErrorKind, ApiFieldErrors } from "@/types/api";

/**
 * Turning a failed request into something a person at the desk can act on.
 *
 * Two jobs, both done once here rather than at every screen:
 *
 * - **Classify** the failure, because "fix the form", "you're not allowed",
 *   "the server broke" and "you're offline" call for different reactions, and
 *   the toast colours itself by it.
 * - **Say what went wrong in words.** DRF field validation arrives as
 *   `{ phone: ["Enter a valid phone number."] }` with no `detail` at all, so
 *   the old fallback showed "Something went wrong" for exactly the errors the
 *   user could most easily fix. The first field's message is lifted into the
 *   sentence instead.
 */

export function humanizeFieldName(field: string): string {
  const spaced = field.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** What to say when the server gave no words of its own. */
const FALLBACK_MESSAGES: Record<ApiErrorKind, string> = {
  validation: "Some details are missing or invalid. Please check the form and try again.",
  rule: "This action isn't allowed right now.",
  permission: "You don't have permission to do this.",
  auth: "Your session has expired. Please sign in again.",
  notFound: "This item could not be found. It may have been deleted.",
  network: "Can't reach the server. Check your internet connection and try again.",
  server: "The server ran into a problem. Please try again in a moment.",
  unknown: "Something went wrong. Please try again.",
};

export function classifyStatus(
  status: number | undefined,
  hasFieldErrors: boolean,
): ApiErrorKind {
  // No status at all means no response reached us.
  if (status === undefined) return "network";
  // A 400 is two different things: fields that need fixing, or a business
  // rule saying no ("clear the due first"). Only the first has field errors.
  if (status === 400 || status === 422) return hasFieldErrors ? "validation" : "rule";
  if (status === 401) return "auth";
  if (status === 403) return "permission";
  if (status === 404) return "notFound";
  if (status === 409 || status === 429) return "rule";
  if (status >= 500) return "server";
  return "unknown";
}

/** The first readable string anywhere in a DRF error value, however nested. */
function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item);
      if (found) return found;
    }
    return undefined;
  }
  if (value && typeof value === "object") {
    return firstString(Object.values(value as Record<string, unknown>));
  }
  return undefined;
}

/** DRF's `{ field: ["message", ...] }` validation shape. */
function isFieldErrorShape(data: unknown): data is ApiFieldErrors {
  return (
    typeof data === "object" &&
    data !== null &&
    !Array.isArray(data) &&
    Object.keys(data).length > 0 &&
    Object.values(data as Record<string, unknown>).every((value) => Array.isArray(value))
  );
}

function messageFrom(
  data: unknown,
  fieldErrors: ApiFieldErrors | undefined,
  kind: ApiErrorKind,
): string {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const body = data as Record<string, unknown>;
    if (typeof body.detail === "string" && body.detail.trim()) return body.detail;
    if (typeof body.message === "string" && body.message.trim()) return body.message;
  }

  // `raise ValidationError("...")` with no field serialises as a bare list.
  if (Array.isArray(data)) {
    const text = firstString(data);
    if (text) return text;
  }

  if (fieldErrors) {
    const general = firstString(fieldErrors.nonFieldErrors);
    if (general) return general;

    const entries = Object.entries(fieldErrors);
    const [field, messages] = entries[0] ?? [];
    const text = firstString(messages);
    if (field && text) {
      const rest = entries.length - 1;
      const more = rest > 0 ? ` (+${rest} more ${rest === 1 ? "field" : "fields"})` : "";
      return `${humanizeFieldName(field)}: ${text}${more}`;
    }
  }

  return FALLBACK_MESSAGES[kind];
}

/** An axios rejection, normalised into the one error shape the app uses. */
export function normalizeRequestError(error: unknown): ApiError {
  const axiosError = error as AxiosError<unknown> | undefined;
  const response = axiosError?.response;

  if (!response) {
    const timedOut = axiosError?.code === "ECONNABORTED" || axiosError?.code === "ETIMEDOUT";
    return {
      kind: "network",
      // `status` stays undefined on purpose: the retry policy reads that as
      // "worth one more try", which is right for a dropped connection.
      message: timedOut
        ? "The server took too long to respond. Please try again."
        : FALLBACK_MESSAGES.network,
    };
  }

  const data = response.data;
  const fieldErrors = isFieldErrorShape(data) ? fieldErrorsToCamelCase(data) : undefined;
  const kind = classifyStatus(response.status, Boolean(fieldErrors));
  const body =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : undefined;

  return {
    message: messageFrom(data, fieldErrors, kind),
    fieldErrors,
    status: response.status,
    kind,
    code: typeof body?.code === "string" ? body.code : undefined,
  };
}

/**
 * Anything thrown — an ApiError, a plain `Error`, a string — as an ApiError.
 * Used where the source is not guaranteed to be the API client.
 */
export function toApiError(error: unknown): ApiError {
  if (
    error &&
    typeof error === "object" &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const apiError = error as ApiError;
    return {
      ...apiError,
      message: apiError.message || FALLBACK_MESSAGES.unknown,
      kind:
        apiError.kind ??
        (apiError.status !== undefined
          ? classifyStatus(apiError.status, Boolean(apiError.fieldErrors))
          : "unknown"),
    };
  }
  if (typeof error === "string" && error.trim()) {
    return { message: error, kind: "unknown" };
  }
  return { message: FALLBACK_MESSAGES.unknown, kind: "unknown" };
}

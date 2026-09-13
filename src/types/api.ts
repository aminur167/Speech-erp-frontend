/** Mirrors Django REST Framework's default paginated list response. */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Mirrors DRF's default validation error shape: { field_name: ["message"] }. */
export type ApiFieldErrors = Record<string, string[]>;

/**
 * What kind of failure this was — decides the toast's colour and heading.
 * Set once, in `lib/api/errors.ts`, from the HTTP status and the body.
 */
export type ApiErrorKind =
  | "validation" // 400 with field errors: something in the form needs fixing
  | "rule" // 400/409/429 with a reason: a business rule said no
  | "permission" // 403
  | "auth" // 401
  | "notFound" // 404
  | "network" // no response at all
  | "server" // 5xx
  | "unknown";

export interface ApiError {
  /** Always a readable sentence — never the generic fallback when the server said why. */
  message: string;
  fieldErrors?: ApiFieldErrors;
  status?: number;
  kind?: ApiErrorKind;
  /** The backend's machine-readable reason, e.g. "outstanding_dues". */
  code?: string;
}

/** Mirrors Django REST Framework's default paginated list response. */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Mirrors DRF's default validation error shape: { field_name: ["message"] }. */
export type ApiFieldErrors = Record<string, string[]>;

export interface ApiError {
  message: string;
  fieldErrors?: ApiFieldErrors;
  status?: number;
}

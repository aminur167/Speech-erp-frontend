import { apiClient } from "@/lib/api/client";
import { cleanParams, park, type ParamValue } from "@/lib/api/parkedResponses";

/**
 * Several read requests in one round trip — the frontend half of the
 * backend's `POST /api/batch/` (apps/common/batch.py).
 *
 * `prefetchBatch` fetches a set of GETs together and parks each answer
 * (parkedResponses.ts). When the normal API function for one of them runs,
 * the client's request interceptor (client.ts) hands it the parked answer
 * instead of going to the network. So every existing API function,
 * normalizer and query key is used unchanged; only the transport differs.
 * Anything not parked — or already used, or too old — goes to the network as
 * before.
 */

export interface BatchPart {
  /** As the API functions write it, relative to the API base: "/transactions/summary/". */
  path: string;
  params?: Record<string, ParamValue>;
}

interface BatchResponse {
  responses: { status: number; data: unknown }[];
}

export async function prefetchBatch(parts: BatchPart[], signal?: AbortSignal): Promise<void> {
  const requests = parts.map((part) => ({ path: part.path, params: cleanParams(part.params) }));
  const { data } = await apiClient.post<BatchResponse>("/batch/", { requests }, { signal });
  data.responses.forEach((response, index) => {
    // A failed part is not parked: its own request then runs normally and
    // reports its error through the usual path.
    if (response.status >= 200 && response.status < 300) {
      park(parts[index].path, parts[index].params, response.data);
    }
  });
}

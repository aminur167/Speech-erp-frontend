/**
 * How often the "live" parts of the app re-check the server.
 *
 * There are no websockets in this stack (docs/00's polling decision), so
 * anything one user does reaches another user's screen on one of these
 * intervals. Both poll only while their tab is visible, and refetch as soon
 * as the tab regains focus.
 */

/**
 * The notification bell. Notifications come from many kinds of event, so the
 * bell asks for its own count.
 */
export const LIVE_POLL_INTERVAL_MS = 10_000;

/**
 * The approval pulse (hooks/useApprovalPulse.ts): one tiny version number,
 * so it can be asked often. A request raised or decided reaches the other
 * side within this long; the queues themselves are only refetched when it
 * moves, so a quiet afternoon costs one small request per tab per interval.
 */
export const APPROVAL_PULSE_INTERVAL_MS = 4_000;

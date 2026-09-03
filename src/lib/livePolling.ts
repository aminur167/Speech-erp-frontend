/**
 * How often the "live" badges re-check the server.
 *
 * There are no websockets in this stack (docs/00's polling decision), so
 * anything one user does reaches another user's screen on this interval.
 * Short enough that an approval lands while the manager is still looking at
 * the screen; long enough that a handful of open tabs isn't hammering a
 * free-tier backend. Only the small count endpoints poll at this rate.
 */
export const LIVE_POLL_INTERVAL_MS = 10_000;

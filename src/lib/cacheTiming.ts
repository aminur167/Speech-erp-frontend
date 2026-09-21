/**
 * How long fetched data is kept and trusted on this device.
 *
 * Two different clocks (TanStack Query terms):
 *
 * - **staleTime** — how long data counts as current. Within it, opening a
 *   page shows the cached data and asks the server nothing. After it, the
 *   cached data is still shown instantly while a fresh copy loads in the
 *   background.
 * - **gcTime** — how long unused data stays in memory at all. Once it lapses,
 *   the next visit starts from a spinner.
 *
 * Every write already refreshes the lists it affects, so a longer staleTime
 * only delays changes made by *other* people on *other* devices.
 */

/**
 * Keep data for seven days, in memory and in IndexedDB alike, so returning to
 * any page already seen shows its last data immediately — and offline, the
 * manager can still browse it.
 *
 * The two must match: data restored from IndexedDB is discarded as soon as
 * it is older than gcTime, so the old 5-minute default quietly cut the
 * offline cache down to 5 minutes as well.
 */
export const CACHE_GC_MS = 7 * 24 * 60 * 60 * 1000;

/** The default: a minute before a revisit also refreshes in the background. */
export const DEFAULT_STALE_MS = 60 * 1000;

/**
 * Data that changes a few times a month — branches, the package catalog,
 * the staff roster, system settings. Ten minutes means moving between pages
 * doesn't re-ask for it, while another user's edit still arrives soon.
 */
export const REFERENCE_DATA_STALE_MS = 10 * 60 * 1000;

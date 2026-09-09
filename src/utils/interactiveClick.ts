/** Anything the user can already act on (a link, button, form control) shouldn't also trigger a row/card's own click handler. */
const INTERACTIVE = "a, button, input, select, textarea, label, [role='button']";

/**
 * Did this event start on a control inside the element, rather than the element itself?
 *
 * `closest` walks up from the target, so it would happily match the element
 * itself if it carried one of these roles — the element must be excluded
 * explicitly or clicking it would always look like clicking a control.
 */
export function cameFromControl(event: { target: EventTarget | null; currentTarget: EventTarget }): boolean {
  const hit = (event.target as HTMLElement | null)?.closest(INTERACTIVE);
  return Boolean(hit) && hit !== event.currentTarget;
}

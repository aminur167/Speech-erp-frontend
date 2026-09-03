/**
 * Branch and manager code suggestions, derived from the branch name.
 *
 * These were free-text fields nobody could type consistently: the live data
 * ended up with a branch named "Netrakona" whose code was a line of Latin
 * filler, and codes that don't follow BR-XXX-NNN feed straight into every
 * per-branch code built from them (PT-, RCPT-, TXN-, BKG-).
 *
 * A suggestion, not a lock -- the fields stay editable, and the backend's
 * unique constraint on `code` remains the actual guarantee. This only has to
 * be right often enough that nobody types one by hand.
 */

/** "Gazipur" -> "GAZ", "Cox's Bazar" -> "COX", "গাজীপুর" -> "GEN". */
export function deriveBranchPrefix(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  // A name with no Latin letters at all (Bangla, say) still needs a prefix;
  // the trailing number is what keeps those unique from each other.
  return letters.slice(0, 3) || "GEN";
}

function nextSequence(prefix: string, existingCodes: string[]): number {
  const pattern = new RegExp(`^BR-${prefix}-(\\d+)$`, "i");
  const used = existingCodes
    .map((code) => pattern.exec(code.trim())?.[1])
    .filter((digits): digits is string => Boolean(digits))
    .map(Number);
  return used.length > 0 ? Math.max(...used) + 1 : 1;
}

export interface GeneratedBranchCodes {
  branchCode: string;
  managerCode: string;
}

/**
 * `BR-GAZ-001` + `MGR-GAZ-001`, numbered per prefix so a second Gazipur
 * branch is 002 rather than colliding. Both share one number so a branch and
 * its manager always read as a matched pair.
 */
export function buildBranchCodes(
  name: string,
  existingCodes: string[],
): GeneratedBranchCodes | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const prefix = deriveBranchPrefix(trimmed);
  const number = String(nextSequence(prefix, existingCodes)).padStart(3, "0");

  return {
    branchCode: `BR-${prefix}-${number}`,
    managerCode: `MGR-${prefix}-${number}`,
  };
}

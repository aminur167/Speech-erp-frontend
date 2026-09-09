/**
 * Placeholder rows while a table loads.
 *
 * Preferred to a spinner here because it keeps the page's shape: the
 * toolbar, the heading and the column widths stay where they are, so
 * arriving data doesn't shove the layout around under the reader's eyes.
 */
export function TableSkeleton({
  columns,
  rows = 6,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="overflow-hidden" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <table className="w-full text-left text-sm">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border last:border-0">
              {Array.from({ length: columns }).map((__, columnIndex) => (
                <td key={columnIndex} className="py-3 pr-4">
                  <div
                    className="h-3 animate-pulse rounded bg-text-secondary/10"
                    // Uneven widths read as content rather than as a grid of
                    // identical grey bars.
                    style={{ width: `${[70, 45, 60, 35, 50, 40][columnIndex % 6]}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

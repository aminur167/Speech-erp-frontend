/** Minimal inline trend line for a StatCard — hand-rolled SVG rather than a full chart lib, since it's rendered at a few dozen pixels tall. */
export function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padY = 4;
  const usable = 32 - padY * 2;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = padY + usable - ((value - min) / range) * usable;
      return `${x},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

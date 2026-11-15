// Decorative 1D barcode generated from a string (deterministic, not a scannable symbology).
export function Barcode({ value, height = 44, className = "" }: { value: string; height?: number; className?: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const push = (w: number, draw: boolean) => {
    if (draw) bars.push({ x, w });
    x += w;
  };
  push(2, true); push(1, false); push(1, true); push(1, false);
  for (const ch of value) {
    let c = ch.charCodeAt(0);
    for (let i = 0; i < 3; i++) {
      push(1 + (c % 3), true);
      c = Math.floor(c / 3);
      push(1 + (c % 2), false);
      c = Math.floor(c / 2);
    }
  }
  push(1, true); push(1, false); push(2, true);
  return (
    <svg viewBox={`0 0 ${x} ${height}`} preserveAspectRatio="none" className={className} style={{ height }} role="img" aria-label={`Barcode ${value}`}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="#000" />
      ))}
    </svg>
  );
}

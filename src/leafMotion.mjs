// A continuous, bounded path with zero lateral flutter at the branch handoff.
export function leafPosition(start, end, progress, variant = 0) {
  const p = Math.max(0, Math.min(1, progress));
  const flutter = Math.sin(p * Math.PI * (3 + variant % 2)) * Math.sin(p * Math.PI) * 26;
  const drift = p * p * (3 - 2 * p);
  return { x: start.x + (end.x - start.x) * drift + flutter,
    y: start.y + (end.y - start.y) * (p * .7 + p * p * .3) };
}

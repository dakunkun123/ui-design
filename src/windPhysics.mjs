export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// A shared, non-looping-looking wind signal. Seconds, not frame counts.
export function windAt(t) {
  return .48 + .44 * Math.sin(t * .61) + .23 * Math.sin(t * 1.37 + .8) + .1 * Math.sin(t * 2.83);
}
export function branchBend(u, t) {
  if (u >= 1) return 0;
  const free = (1 - u) ** 1.8;
  return free * (9 * windAt(t - (1 - u) * .8) + 2.4 * Math.sin(t * 2.1 - u * 3));
}
export function createLeaf(x, y, seed, wind) {
  return { x, y, vx: wind * 17, vy: 8, age: 0, seed, roll: seed * 31, phase: 'air', waterAge: 0 };
}
export function stepLeaf(s, dt, wind, water) {
  s.age += dt;
  if (s.phase === 'water') {
    s.waterAge += dt; s.x += wind * 3 * dt;
    return false;
  }
  // Linear drag limits terminal speed; changing projected area produces flutter.
  const flutter = Math.sin(s.age * (2.6 + s.seed * .09) + s.seed);
  const ax = (wind * 31 + flutter * 22 - s.vx) * 1.5;
  const ay = 48 - s.vy * (.72 + .35 * Math.abs(flutter));
  s.vx += ax * dt; s.vy += ay * dt;
  const previousY = s.y;
  s.x += s.vx * dt; s.y += s.vy * dt;
  s.roll += (s.vx * 1.15 + flutter * 35) * dt;
  if (water && previousY < water.y && s.y >= water.y && s.x >= water.left && s.x <= water.right) {
    s.y = water.y; s.phase = 'water'; s.waterAge = 0;
    return true;
  }
  return false;
}
export function makeChain(count = 24, length = 260) {
  return Array.from({length:count + 1}, (_, i) => ({x:150, y:15 + i * length / count, px:150, py:15 + i * length / count}));
}
export function stepChain(points, dt, wind, length = 260) {
  const segment = length / (points.length - 1);
  for (let i = 1; i < points.length; i++) {
    const p = points[i], vx = (p.x - p.px) * .985, vy = (p.y - p.py) * .985;
    p.px = p.x; p.py = p.y;
    p.x += vx + wind * (220 + i * 9) * dt * dt;
    p.y += vy + 450 * dt * dt;
  }
  for (let pass = 0; pass < 10; pass++) {
    points[0].x = 150; points[0].y = 15;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1, f = (d - segment) / d;
      if (i === 1) { b.x -= dx * f; b.y -= dy * f; }
      else { a.x += dx * f * .5; a.y += dy * f * .5; b.x -= dx * f * .5; b.y -= dy * f * .5; }
    }
  }
}

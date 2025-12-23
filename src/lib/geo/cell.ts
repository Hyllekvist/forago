// Privacy-first "cell id" generator.
// This is intentionally coarse. We store **no exact coordinates**.
//
// `level` controls precision:
// 0 = very coarse, 1 = coarse, 2 = default (approx 5km-ish), 3 = tighter.
// This is not a geohash; it's a simple grid key you can swap later.

export function cellIdFromLatLng(lat: number, lng: number, level: number) {
  const size = levelToDegrees(level);
  const x = Math.floor((lng + 180) / size);
  const y = Math.floor((lat + 90) / size);
  return `cell-${level}-${x}-${y}`;
}

function levelToDegrees(level: number) {
  // ~1 deg is ~111km. This is intentionally conservative.
  if (level <= 0) return 2.0;   // ~200km
  if (level === 1) return 0.5;  // ~55km
  if (level === 2) return 0.05; // ~5.5km
  return 0.02;                  // ~2.2km
}

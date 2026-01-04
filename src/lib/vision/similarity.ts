export function l2Normalize(v: Float32Array) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  const norm = Math.sqrt(sum) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

export function cosine(a: Float32Array, b: Float32Array) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

export function topK(
  query: Float32Array,
  items: { slug: string; vec: Float32Array }[],
  k = 3
) {
  const scored = items.map((it) => ({ slug: it.slug, score: cosine(query, it.vec) }));
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, k);
}

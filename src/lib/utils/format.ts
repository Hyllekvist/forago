export function titleCase(s: string) {
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
}

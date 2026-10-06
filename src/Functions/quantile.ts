/**
 * Calculates the q-quantile of ascending-sorted values by linear interpolation.
 * @param sorted - Values already sorted ascending.
 * @param q - The target quantile (0 <= q <= 1).
 * @returns The quantile, or undefined for empty input.
 */
export default function quantile(sorted: readonly number[], q: number): number | undefined {
  if (sorted.length === 0) return undefined;

  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

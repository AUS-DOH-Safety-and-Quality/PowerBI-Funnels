/**
 * Calculates the q-quantile of an array of numbers.
 * @param {number[]} values - The input array of data points.
 * @param {number} q - The target quantile (0 <= q <= 1).
 * @returns {number} The calculated quantile value.
 */
export default function quantile(values: number[], q: number): number | undefined {
  if (values.length === 0) return undefined;

  // 1. Create a shallow copy and sort ascending
  const sorted = [...values].sort((a, b) => a - b);

  // 2. Find the target position
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  // 3. Linearly interpolate if the position falls between indexes
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

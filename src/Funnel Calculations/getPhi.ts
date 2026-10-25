import { at } from "powerbi-visuals-core/util";
/** Dispersion ratio: mean squared winsorised z-score. */
export default function getPhi(z_adj: readonly number[]): number {
  let total: number = 0;
  for (let i: number = 0; i < z_adj.length; i++) {
    total += Math.pow(at(z_adj, i), 2);
  }
  return total / z_adj.length;
}

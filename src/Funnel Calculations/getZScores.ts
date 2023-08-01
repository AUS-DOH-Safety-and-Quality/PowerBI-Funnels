import { divide, subtract } from "../Functions";

/**
 * Generate (un-adjusted) z-scores using transformed
 * observations and standard errors
 *
 * @param y
 * @param SE
 * @param target
 * @returns
 */
export default function getZScores(y: number[], SE: number[], target: number): number[] {
  return divide(subtract(y, target), SE);
}

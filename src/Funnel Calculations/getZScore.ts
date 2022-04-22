import { divide, subtract } from "../Helper Functions/BinaryBroadcasting";

/**
 * Generate (un-adjusted) z-scores using transformed
 * observations and standard errors
 *
 * @param y
 * @param SE
 * @param target
 * @returns
 */
function getZScore(y: number[], SE: number[], target: number): number[] {
  return divide(subtract(y, target), SE);
}

export default getZScore;

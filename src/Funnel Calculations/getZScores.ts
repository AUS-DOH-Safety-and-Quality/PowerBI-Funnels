import { divide, subtract } from "../Functions/BinaryFunctions";

/**
 * Generate (un-adjusted) z-scores using transformed
 * observations and standard errors
 *
 * @param y
 * @param SE
 * @param target
 * @returns
 */
function getZScores(y: number[], SE: number[], target: number): number[] {
  return divide(subtract(y, target), SE);
}

export default getZScores;

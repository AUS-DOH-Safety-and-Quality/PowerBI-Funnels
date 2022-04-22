import { dataArray } from "../Interfaces"
import { divide, add } from "../Helper Functions/BinaryBroadcasting";
import { sqrt, asin, log } from "../Helper Functions/UnaryBroadcasting";

/**
 * Function to apply variance-stabilising transform to outcome
 *    prior to calculating z-scores. The following transforms are
 *    used:
 *      - Proportion: Inverse-sine
 *      - Standardised Ratio: Square-root
 *
 * @param numerator
 * @param denominator
 * @param data_type
 * @returns
 */
function getY(data_array: dataArray, data_type: string): number[] {
  let numerator: number[] = data_array.numerator;
  let denominator: number[] = data_array.denominator;
  if (data_type == "PR") {
    return asin(sqrt(divide(numerator, denominator)));
  } else if (data_type == "SR") {
    return sqrt(divide(numerator, denominator));
  } else if (data_type == "RC") {
    return log(divide(add(numerator, 0.5),
                      add(denominator, 0.5)));
  }
}

export default getY;

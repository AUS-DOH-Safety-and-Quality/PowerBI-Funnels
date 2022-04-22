import { dataArray } from "../Interfaces"
import { sqrt, inv, square } from "../Helper Functions/UnaryBroadcasting"
import { divide, multiply, add } from "../Helper Functions/BinaryBroadcasting"

/**
 * Function to generate standard errors needed for constructing
 *    funnel plot control limits by the normal approximation.
 *
 * If overdispersion-adjusted limits are required, then the
 *    standard error for both proportion and standardised ratio
 *    data is given by the inverse square-root of the denominator:
 *
 *      SE = \frac{1}{2\sqrt{D}}
 *
 * If unadjusted limits for proportion data are required, then the
 *    standard error is given by:
 *
 *      r = \frac{\sum N}{\sum D}
 *      SE = \sqrt{\frac{r*(1-r)}{D}}
 *
 * If unadjusted limits for standardised ratio data are required then
 *    an empty array is returned, as the quantiles of a chi-squared
 *    distribution are used for exact Poisson limits rather than normal
 *    approximation via SE.
 *
 * @param denominator  - Denominator value to calculate SE for
 * @param data_type    - Data type ("PR","SR")
 * @param adjusted     - Whether the SE is for OD-adjustment (bool)
 * Optional:
 * @param target       - If unadjusted PR limits are requested then
 *                          the target value is needed
 * @returns
 */
function getSE(data_array: dataArray, data_type: string,
               adjusted: boolean, target?: number): number[] {
  let denominator: number[] = data_array.denominator;
  let numerator: number[] = data_array.numerator;
  if (data_type == "PR") {
    if (adjusted) {
      return inv(multiply(2.0, sqrt(denominator)));
    } else {
      let se_num: number = target * (1 - target);
      return sqrt(divide(se_num, denominator));
    }
  } else if (data_type == "SR") {
    if (adjusted) {
      return inv(multiply(2.0, sqrt(denominator)));
    } else {
      return [];
    }
  } else if (data_type = "RC") {
    return sqrt(
      add(divide(numerator, square(add(numerator, 0.5))),
          divide(denominator, square(add(denominator, 0.5))))
    )
  }
}

export default getSE;

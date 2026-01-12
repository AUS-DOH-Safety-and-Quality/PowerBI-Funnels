import { LOG_TWO_PI } from "./Constants";
import ldexp from "./ldexp";

/**
 * Evaluates a rational polynomial P(x)/Q(x) using Horner's method.
 *
 * @param x The point at which to evaluate
 * @param q Multiplier for the result
 * @param num_coeffs Numerator polynomial coefficients (highest degree first)
 * @param den_coeffs Denominator polynomial coefficients (highest degree first)
 * @returns q * P(x) / Q(x)
 */
function polyEval(x: number, q: number, num_coeffs: readonly number[], den_coeffs: readonly number[]): number {
  let numerator = num_coeffs[0];
  let denominator = den_coeffs[0];
  for (let i = 1; i < num_coeffs.length; i++) {
    numerator = numerator * x + num_coeffs[i];
    denominator = denominator * x + den_coeffs[i];
  }
  return q * numerator / denominator;
}

/**
 * Calculates the quantile function (inverse CDF) of the normal distribution.
 *
 * The implementation is adapted from the qnorm function in R's source code.
 *
 * @param p Probability value
 * @param mu Mean of the normal distribution
 * @param sigma SD of the normal distribution
 * @param lower_tail If true, probabilities are P[X ≤ x], otherwise, P[X > x]
 * @param log_p If true, probabilities p are given as log(p)
 * @returns The quantile corresponding to the given probability for the normal distribution with specified parameters.
 */
export default function normalQuantile(p: number, mu: number, sigma: number, lower_tail: boolean, log_p: boolean) {
  let p_: number, q: number, r: number, val: number;

  // Handle NaN inputs
  if (Number.isNaN(p) || Number.isNaN(mu) || Number.isNaN(sigma)) {
    return p + mu + sigma;
  }

  // Validate probability bounds and handle edge cases
  if (log_p) {
    if (p > 0) {
      return Number.NaN;  // log(p) > 0 means p > 1
    }
    if (p == 0) {
      return lower_tail ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;  // p = 1
    }
    if (p == Number.NEGATIVE_INFINITY) {
      return lower_tail ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;  // p = 0
    }
  } else {
    if (p < 0 || p > 1) {
      return Number.NaN;
    }
    if (p == 0) {
      return lower_tail ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    }
    if (p == 1) {
      return lower_tail ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    }
  }

  // Validate sigma
  if (sigma < 0) {
    return Number.NaN;
  }

  // Degenerate case: point mass at mu
  if (sigma == 0) {
    return mu;
  }

  // Convert to standard form: compute p_ as lower-tail probability
  p_ = log_p ? (lower_tail ? Math.exp(p) : - Math.expm1(p))
              : (lower_tail ? p : (0.5 - p + 0.5));
  q = p_ - 0.5;  // Deviation from median  // Deviation from median

  // Rational approximation coefficients for central region |q| <= 0.425
  // Based on Wichura's AS 241 algorithm
  const coeffs_a: readonly number[] = [
    2509.0809287301226727,
    33430.575583588128105,
    67265.770927008700853,
    45921.953931549871457,
    13731.693765509461125,
    1971.5909503065514427,
    133.14166789178437745,
    3.387132872796366608
  ];
  const coeffs_b: readonly number[] = [
    5226.495278852854561,
    28729.085735721942674,
    39307.89580009271061,
    21213.794301586595867,
    5394.1960214247511077,
    687.1870074920579083,
    42.313330701600911252,
    1
  ];

  // Coefficients for intermediate tail region (r <= 5)
  const coeffs_c: readonly number[] = [
    7.7454501427834140764e-4,
    0.0227238449892691845833,
    0.24178072517745061177,
    1.27045825245236838258,
    3.64784832476320460504,
    5.7694972214606914055,
    4.6303378461565452959,
    1.42343711074968357734
  ];
  const coeffs_d: readonly number[] = [
    1.05075007164441684324e-9,
    5.475938084995344946e-4,
    0.0151986665636164571966,
    0.14810397642748007459,
    0.68976733498510000455,
    1.6763848301838038494,
    2.05319162663775882187,
    1
  ];

  // Coefficients for extreme tail region (r <= 27)
  const coeffs_e: readonly number[] = [
    2.01033439929228813265e-7,
    2.71155556874348757815e-5,
    0.0012426609473880784386,
    0.026532189526576123093,
    0.29656057182850489123,
    1.7848265399172913358,
    5.4637849111641143699,
    6.6579046435011037772
  ];
  const coeffs_f: readonly number[] = [
    2.04426310338993978564e-15,
    1.4215117583164458887e-7,
    1.8463183175100546818e-5,
    7.868691311456132591e-4,
    0.0148753612908506148525,
    0.13692988092273580531,
    0.59983220655588793769,
    1
  ];

  // Region 1: Central region |q| <= 0.425 (covers about 85% of distribution)
  // Use rational approximation in r = 0.180625 - q²
  if (Math.abs(q) <= 0.425) {
    r = 0.180625 - q * q;
    val = polyEval(r, q, coeffs_a, coeffs_b);
  } else {
    // Tail regions: work with r = sqrt(-log(p)) for numerical stability
    let lp: number;
    if (log_p && ((lower_tail && q <= 0) || (!lower_tail && q > 0))) {
      lp = p;
    } else {
      if (q > 0) {
        lp = log_p ? (lower_tail ? -Math.expm1(p) : Math.exp(p))
                    : (lower_tail ? (0.5 - p + 0.5) : p)
      } else {
        lp = p_;
      }
      lp = Math.log(lp);
    }
    r = Math.sqrt(-lp);

    // Region 2: Intermediate tail (r <= 5)
    if (r <= 5) {
      val = polyEval(r - 1.6, 1, coeffs_c, coeffs_d);
    } else if(r <= 27) {
      // Region 3: Far tail (r <= 27)
      val = polyEval(r - 5, 1, coeffs_e, coeffs_f);
    } else {
      // Region 4: Extreme tail - use asymptotic expansion
      // Based on inverting the Mills ratio approximation
      if (r >= 6.4e8) {
        val = r * Math.SQRT2;
      } else {
        // Iterative refinement using asymptotic formula
        // Phi^{-1}(p) ≈ sqrt(-2*log(p) - log(2*pi) - log(-2*log(p) - log(2*pi)))
        const s2: number = -ldexp(lp, 1);  // s2 = -2 * log(p)
        let x2: number = s2 - (Math.log(s2) + LOG_TWO_PI);
        if (r < 36000) {
          x2 = s2 - (LOG_TWO_PI + Math.log(x2)) - 2 / (2 + x2);
          if (r < 840) {
            x2 = s2 - (LOG_TWO_PI + Math.log(x2))
                    + 2 * Math.log1p(- (1 - 1/(4 + x2))/(2 + x2));
            if (r < 109) {
              x2 = s2 - (LOG_TWO_PI + Math.log(x2))
                      + 2 * Math.log1p(- (1 - (1 - 5/(6 + x2))/(4 + x2))/(2 + x2));
              if (r < 55) {
                x2 = s2 - (LOG_TWO_PI + Math.log(x2))
                        + 2 * Math.log1p(- (1 - (1 - (5 - 9/(8 + x2))/(6 + x2))/(4 + x2))/(2 + x2));
              }
            }
          }
        }
        val = Math.sqrt(x2);
      }
    }
    // Apply sign based on which tail
    if (q < 0.0) {
      val = -val;
    }
  }

  // Transform from standard normal to N(mu, sigma)
  return mu + sigma * val;
}

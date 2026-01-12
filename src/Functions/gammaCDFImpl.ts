import poissonDensity from "./poissonDensity";
import lgamma1p from "./lgamma1p";
import poissonDensityPrev from "./poissonDensityPrev";
import gammaContFrac from "./gammaContFrac";
import poissonCDFAsymp from "./poissonCDFAsymp";
import log1mExp from "./log1mExp";

/**
 * Calculates the cumulative distribution function (CDF) of the gamma distribution.
 *
 * The implementation is adapted from the pgamma_raw function in R's source code.
 *
 * @param x The quantile at which to evaluate the CDF.
 * @param alph The shape parameter of the gamma distribution.
 * @param lower_tail If true, probabilities are P[X ≤ x], otherwise, P[X > x].
 * @param log_p If true, probabilities p are given as log(p).
 * @returns The cumulative probability up to x for the gamma distribution with given parameters.
 */
export default function gammaCDFImpl(x: number, alph: number,
                                      lower_tail: boolean = true,
                                      log_p: boolean = false): number {
  let res: number;
  const zeroBoundLower: number = log_p ? Number.NEGATIVE_INFINITY : 0;
  const zeroBoundUpper: number = log_p ? 0 : 1;

  // Handle edge cases
  if (x <= 0) {
    return lower_tail ? zeroBoundLower : zeroBoundUpper;
  }

  if (x >= Number.POSITIVE_INFINITY) {
    return lower_tail ? zeroBoundUpper : zeroBoundLower;
  }

  // Case 1: Small x. Use series expansion.
  // This corresponds to the power series expansion of the lower incomplete gamma function:
  // gamma(alpha, x) = x^alpha * sum_{n=0}^{infinity} ((-1)^n * x^n) / (n! * (alpha + n))
  //                 = x^alpha * sum_{n=0}^{infinity} (c_n / (alpha + n))
  if (x < 1) {
    let sum: number = 0, c: number = alph, n: number = 0, term: number = 1;
    while (Math.abs(term) > Number.EPSILON * Math.abs(sum)) {
      n++;
      c *= -x / n;
      term = c / (alph + n);
      sum += term;
    };

    if (lower_tail) {
      const f1: number = log_p ? Math.log1p(sum) : 1 + sum;
      let f2: number;
      if (alph > 1) {
        f2 = poissonDensity(alph, x, log_p);
        f2 = log_p ? f2 + x : f2 * Math.exp(x);
      } else if (log_p) {
        f2 = alph * Math.log(x) - lgamma1p(alph);
      } else {
        f2 = Math.pow(x, alph) / Math.exp(lgamma1p(alph));
      }
      res = log_p ? f1 + f2 : f1 * f2;
    } else {
      const lf2: number = alph * Math.log(x) - lgamma1p(alph);

      if (log_p) {
        res = log1mExp(Math.log1p(sum) + lf2);
      } else {
        let f1m1: number = sum;
        let f2m1: number = Math.expm1(lf2);
        res =  -(f1m1 + f2m1 + f1m1 * f2m1);
      }
    }
  } else if (x <= alph - 1 && x < 0.8 * (alph + 50)) {
    // Case 2: x is smaller than mean (alpha). Use series approximation.
    // Computes lower tail using a series related to the Poisson distribution:
    // P(X <= x) = P(Y >= alpha) where Y ~ Poisson(x).
    // Uses the identity: integral_0^x t^(a-1) e^(-t) dt / Gamma(a) = sum_{k=0}^infinity e^(-x) x^(a+k) / Gamma(a+k+1)
    let y: number = alph;
    let term: number = x / y;
    let sum: number = term;

    while (term > Number.EPSILON * sum) {
      y++;
      term *= x / y;
      sum += term;
    }
    sum = log_p ? Math.log(sum) : sum;
    const d: number = poissonDensityPrev(alph, x, log_p);
    if (!lower_tail) {
      res = log_p ? log1mExp(d + sum) : 1 - d * sum;
    } else {
      res = log_p ? sum + d : sum * d;
    }
  } else if (alph - 1 < x && alph < 0.8 * (x + 50)) {
    // Case 3: x is larger than mean. Use continued fraction or finite sum.
    // Computes upper tail using reduction or continued fractions.
    // For integer alpha, summation is finite. Use Legendre's continued fraction for Gamma(alpha, x).
    let sum: number = 0;
    const d: number = poissonDensityPrev(alph, x, log_p);
    if (alph < 1) {
      if (x * Number.EPSILON > 1 - alph) {
        sum = log_p ? 0 : 1;
      } else {
        const f: number = gammaContFrac(alph, x - (alph - 1)) * x / alph;
        sum = log_p ? Math.log(f) : f;
      }
    } else {
      let term: number = 1;
      let y: number = alph - 1;

      while (y >= 1 && term > sum * Number.EPSILON) {
        term *= y / x;
        sum += term;
        y--;
      }

      if (y != Math.floor(y)) {
        sum += term * gammaContFrac(y, x + 1 - y);
      }

      sum = log_p ? Math.log1p(sum) : 1 + sum;
    }

    if (!lower_tail) {
      res = log_p ? sum + d : sum * d;
    } else {
      res = log_p ? log1mExp(d + sum) : 1 - d * sum;
    }
  } else {
    // Case 4: Asymptotic approximation for large parameters
    // Uses Peizer-Pratt approximation via Poisson CDF asymp.
    res = poissonCDFAsymp(alph - 1, x, !lower_tail, log_p);
  }

  // Final check for underflow in non-log case to improve precision by using log scale first
  if (!log_p && res < Number.MIN_VALUE / Number.EPSILON) {
    return Math.exp(gammaCDFImpl(x, alph, lower_tail, true));
  }

  return res;
}

import lgamma from "./lgamma";
import gammaCDFImpl from "./gammaCDFImpl";
import gammaNewtonIter from "./gammaNewtonIter";
import chisqQuantileApprox from "./chisqQuantileApprox";

/**
 * Computes the quantile function (inverse CDF) of the gamma distribution.
 *
 * Uses a combination of chi-squared approximation and Newton-Raphson refinement.
 * This implementation is adapted from R's qgamma function.
 *
 * @param p Probability value (or log(p) if log_p is true)
 * @param alpha Shape parameter of the gamma distribution
 * @param scale Scale parameter of the gamma distribution
 * @param lower_tail If true, returns quantile for P(X <= x) = p; otherwise P(X > x) = p
 * @param log_p If true, p is given as log(p)
 * @returns The quantile x such that P(X <= x) = p (or P(X > x) = p)
 */
export default function gammaQuantile(p: number, alpha: number, scale: number,
                                      lower_tail: boolean = true,
                                      log_p: boolean = false): number {
  // Handle NaN inputs
  if (Number.isNaN(p) || Number.isNaN(alpha) || Number.isNaN(scale)) {
    return p + alpha + scale;
  }

  // Validate probability bounds and handle edge cases
  if (log_p) {
    if (p > 0) {
      return Number.NaN;  // log(p) > 0 means p > 1, invalid
    }
    if (p === 0) {
      return lower_tail ? Number.POSITIVE_INFINITY : 0;  // p = 1
    }
    if (p === Number.NEGATIVE_INFINITY) {
      return lower_tail ? 0 : Number.POSITIVE_INFINITY;  // p = 0
    }
  } else {
    if (p < 0 || p > 1) {
      return Number.NaN;
    }
    if (p === 0) {
      return lower_tail ? 0 : Number.POSITIVE_INFINITY;
    }
    if (p === 1) {
      return lower_tail ? Number.POSITIVE_INFINITY : 0;
    }
  }

  // Validate shape and scale parameters
  if (alpha < 0 || scale <= 0) {
    return Number.NaN;
  }

  // Degenerate case: alpha = 0 means point mass at 0
  if (alpha === 0) {
    return 0;
  }

  // For very small alpha, use more Newton iterations for accuracy
  let max_it_Newton: number = 1;
  if (alpha < 1e-10) {
    max_it_Newton = 7;
  }

  // Use chi-squared approximation as initial estimate
  // Gamma(alpha, scale) relates to chi-squared: if X ~ Gamma(alpha, 2), then X ~ chi-squared(2*alpha)
  const g: number = lgamma(alpha);
  let ch: number = chisqQuantileApprox(p, 2 * alpha, g, lower_tail, log_p, 1e-2);

  // If chi-squared approximation failed, return scaled result directly
  if (!Number.isFinite(ch)) {
    return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, 0, 1e-15);
  }

  // Convert probability to standard form for iteration
  const p_: number = log_p ? (lower_tail ? Math.exp(p) : -Math.expm1(p))
                           : (lower_tail ? p : (0.5 - p + 0.5));

  // For extreme probabilities or small ch, use Newton refinement directly
  if (ch < 5e-7 || p_ > (1 - 1e-14) || p_ < 1e-100) {
    return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, 20, 1e-15);
  }

  // Precomputed constants for the Wilson-Hilferty-based iteration
  const i420: number = 1 / 420;
  const i2520: number = 1 / 2520;
  const i5040: number = 1 / 5040;

  const c: number = alpha - 1;
  const s6: number = (120 + c * (346 + 127 * c)) * i5040;
  const ch0: number = ch;  // Save initial estimate for fallback

  // Main iteration: refine chi-squared estimate using higher-order correction
  // This is a modified Cornish-Fisher expansion for improved convergence
  for (let i: number = 1; i <= 1000; i++) {
    const q: number = ch;  // Previous estimate
    const p1: number = 0.5 * ch;
    const p2: number = p_ - gammaCDFImpl(p1, alpha);  // Residual

    // If iteration becomes unstable, fall back to Newton method
    if (!Number.isFinite(p2) || ch <= 0) {
      return gammaNewtonIter(ch0, p, alpha, scale, lower_tail, log_p, 27, 1e-15);
    }

    // Compute correction term t
    const t: number = p2 * Math.exp(alpha * Math.LN2 + g + p1 - c * Math.log(ch));
    const b: number = t / ch;
    const a: number = 0.5 * t - b * c;

    // Polynomial coefficients for higher-order correction (Cornish-Fisher)
    const s1: number = (210 + a * (140 + a * (105 + a * (84 + a * (70 + 60 * a))))) * i420;
    const s2: number = (420 + a * (735 + a * (966 + a * (1141 + 1278 * a)))) * i2520;
    const s3: number = (210 + a * (462 + a * (707 + 932 * a))) * i2520;
    const s4: number = (252 + a * (672 + 1182 * a) + c * (294 + a * (889 + 1740 * a))) * i5040;
    const s5: number = (84 + 2264 * a + c * (1175 + 606 * a)) * i2520;

    // Apply correction with nested polynomial evaluation
    ch += t * (1 + 0.5 * t * s1 - b * c * (s1 - b * (s2 - b * (s3 - b * (s4 - b * (s5 - b * s6))))));

    // Check convergence
    if (Math.abs(q - ch) < (5e-7) * ch) {
      return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, max_it_Newton, 1e-15);
    }

    // Dampen large steps to maintain stability
    if (Math.abs(q - ch) > 0.1 * ch) {
      ch = q * (ch < q ? 0.9 : 1.1);
    }
  }

  // Return result after max iterations with final Newton polish
  return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, max_it_Newton, 1e-15);
}

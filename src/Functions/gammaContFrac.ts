/**
 * Continued fraction representation for incomplete gamma function
 * ~=  (y / d) * [1 +  (1-y)/d +  O( ((1-y)/d)^2 ) ]
 *
 * @param y First parameter
 * @param d Second parameter
 * @returns Continued fraction value
 */
export default function gammaContFrac(y: number, d: number): number {

  // Handle trivial case
  if (y == 0) {
    return 0;
  }

  // Initial approximation: f0 = y/d
  let f0: number = y / d;

  // If y is approximately 1, return the simple ratio
  if (Math.abs(y - 1) < Math.abs(d) * Number.EPSILON) {
    return f0;
  }

  // Clamp f0 to 1 for numerical stability
  if (f0 > 1) {
    f0 = 1;
  }

  // Initialize recurrence coefficients for continued fraction
  // The continued fraction is evaluated using the modified Lentz algorithm
  let c3: number;
  let c2: number = y;
  let c4: number = d;

  // a1/b1 and a2/b2 are successive convergents of the continued fraction
  let a1: number = 0;
  let b1: number = 1;
  let a2: number = y;
  let b2: number = d;

  // Scale factor to prevent overflow in intermediate calculations
  const scalefactor: number = 1.157921e+77;

  // Initial scaling if needed
  while (b2 > scalefactor) {
    a1 /= scalefactor;
    b1 /= scalefactor;
    a2 /= scalefactor;
    b2 /= scalefactor;
  }

  let i: number = 0;
  let of: number = -1;  // Previous value of f for convergence check
  let f: number = 0.0;  // Current convergent value

  // Main iteration loop: compute successive convergents
  // Each iteration computes two terms of the continued fraction
  while (i < 200000) {
    // First term of the pair
    i++;
    c2--;
    c3 = i * c2;
    c4 += 2;
    a1 = c4 * a2 + c3 * a1;
    b1 = c4 * b2 + c3 * b1;

    // Second term of the pair
    i++;
    c2--;
    c3 = i * c2;
    c4 += 2;
    a2 = c4 * a1 + c3 * a2;
    b2 = c4 * b1 + c3 * b2;

    // Rescale to prevent overflow
    if (b2 > scalefactor) {
      a1 /= scalefactor;
      b1 /= scalefactor;
      a2 /= scalefactor;
      b2 /= scalefactor;
    }

    // Check convergence: |f - f_prev| <= epsilon * max(f0, |f|)
    if (b2 !== 0) {
      f = a2 / b2;
      if (Math.abs(f - of) <= Number.EPSILON * Math.max(f0, Math.abs(f))) {
        return f;
      }
      of = f;
    }
  }

  return f; // Did not converge within iteration limit
}

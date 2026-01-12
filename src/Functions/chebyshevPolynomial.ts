/**
 * Computes the Chebyshev polynomial approximation at a given point x
 * using the provided coefficients a and degree n.
 *
 * This implementation is a TypeScript adaptation of the chebyshev_eval
 * function from the R programming language.
 *
 * @param x The point at which to evaluate the Chebyshev polynomial
 * @param a The coefficients of the Chebyshev polynomial
 * @param n The degree of the Chebyshev polynomial
 * @returns The value of the Chebyshev polynomial at point x
 */
export default function chebyshevPolynomial(x: number, a: readonly number[], n: number): number {
  // Validate input range: Chebyshev polynomials are defined on [-1, 1]
  // Allow slight tolerance for numerical errors
  if (x < -1.1 || x > 1.1) {
    throw new Error("chebyshevPolynomial: x must be in [-1,1]");
  }

  if (n < 1 || n > 1000) {
    throw new Error("chebyshevPolynomial: n must be in [1,1000]");
  }

  // Clenshaw recurrence algorithm for evaluating Chebyshev series
  // Given: S(x) = sum_{k=0}^{n-1} a_k * T_k(x)
  // where T_k(x) are Chebyshev polynomials of the first kind
  const twox: number = x * 2;
  let b0: number = 0;  // Current term
  let b1: number = 0;  // Previous term
  let b2: number = 0;  // Two terms back

  // Recurrence: b_k = 2x * b_{k+1} - b_{k+2} + a_k
  // Iterate from highest degree term down to constant term
  for (let i: number = 1; i <= n; i++) {
    b2 = b1;
    b1 = b0;
    b0 = twox * b1 - b2 + a[n - i];
  }

  // Final result: S(x) = (b0 - b2) / 2
  return (b0 - b2) * 0.5;
}

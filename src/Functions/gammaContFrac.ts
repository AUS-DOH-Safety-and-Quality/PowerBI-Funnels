/**
 * Continued fraction representation for incomplete gamma function
 * ~=  (y / d) * [1 +  (1-y)/d +  O( ((1-y)/d)^2 ) ]
 *
 * @param y First parameter
 * @param d Second parameter
 * @returns Continued fraction value
 */
export default function gammaContFrac(y: number, d: number): number {

  if (y == 0) {
    return 0;
  }

  let f0: number = y / d;

  if (Math.abs(y - 1) < Math.abs(d) * Number.EPSILON) {
    return f0;
  }

  if (f0 > 1) {
    f0 = 1;
  }

  let c3: number;
  let c2: number = y;
  let c4: number = d;

  let a1: number = 0;
  let b1: number = 1;
  let a2: number = y;
  let b2: number = d;

  const scalefactor: number = 1.157921e+77;

  while (b2 > scalefactor) {
    a1 /= scalefactor;
    b1 /= scalefactor;
    a2 /= scalefactor;
    b2 /= scalefactor;
  }

  let i: number = 0;
  let of: number = -1;
  let f: number = 0.0;

  while (i < 200000) {
    i++;
    c2--;
    c3 = i * c2;
    c4 += 2;
    a1 = c4 * a2 + c3 * a1;
    b1 = c4 * b2 + c3 * b1;

    i++;
    c2--;
    c3 = i * c2;
    c4 += 2;
    a2 = c4 * a1 + c3 * a2;
    b2 = c4 * b1 + c3 * b2;

    if (b2 > scalefactor) {
      a1 /= scalefactor;
      b1 /= scalefactor;
      a2 /= scalefactor;
      b2 /= scalefactor;
    }
    if (b2 !== 0) {
      f = a2 / b2;
      if (Math.abs(f - of) <= Number.EPSILON * Math.max(f0, Math.abs(f))) {
        return f;
      }
      of = f;
    }
  }

  return f; /* did not converge */
}

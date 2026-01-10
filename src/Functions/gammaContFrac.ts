/**
 * Continued fraction representation for incomplete gamma function
 * ~=  (y / d) * [1 +  (1-y)/d +  O( ((1-y)/d)^2 ) ]
 *
 * @param y First parameter
 * @param d Second parameter
 * @returns Continued fraction value
 */
export default function gammaContFrac(y: number, d: number): number {
  const scalefactor: number = 1.157921e+77;
  const max_it: number = 200000;

  let f: number = 0.0, of: number, f0: number;
  let i: number, c2: number, c3: number, c4: number, a1: number, b1: number, a2: number, b2: number;

  if (y == 0) {
    return 0;
  }
  f0 = y/d;
  if(Math.abs(y - 1) < Math.abs(d) * Number.EPSILON) {
    return f0;
  }

  if (f0 > 1) {
    f0 = 1;
  }
  c2 = y;
  c4 = d;

  a1 = 0;
  b1 = 1;
  a2 = y;
  b2 = d;

  while (b2 > scalefactor) {
    a1 /= scalefactor;
    b1 /= scalefactor;
    a2 /= scalefactor;
    b2 /= scalefactor;
  }

  i = 0;
  of = -1;
  while (i < max_it) {
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
    if (b2 != 0) {
      f = a2 / b2;
      if (Math.abs(f - of) <= Number.EPSILON * Math.max(f0, Math.abs(f))) {
        return f;
      }
      of = f;
    }
  }
  return f; /* did not converge */
}

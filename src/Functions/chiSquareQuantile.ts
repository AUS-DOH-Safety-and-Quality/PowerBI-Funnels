import lgamma from './lgamma'

// Lower incomplete gamma function using series expansion
function lowerIncompleteGamma(a, x) {
  if (x < 0) return 0;
  if (x === 0) return 0;

  // Use series expansion for small x or x < a+1
  if (x < a + 1) {
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-14 * Math.abs(sum)) break;
    }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * sum * Math.exp(lgamma(a));
  } else {
    // Use continued fraction for large x
    return Math.exp(lgamma(a)) - upperIncompleteGammaCF(a, x);
  }
}

// Upper incomplete gamma using continued fraction
function upperIncompleteGammaCF(a, x) {
  const fpmin = 1e-300;
  let b = x + 1 - a;
  let c = 1 / fpmin;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i < 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = b + an / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }

  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

// Regularized lower incomplete gamma function P(a, x) = γ(a,x) / Γ(a)
function regularizedGammaP(a, x) {
  if (x < 0) return 0;
  if (x === 0) return 0;
  return lowerIncompleteGamma(a, x) / Math.exp(lgamma(a));
}

// Chi-square CDF: P(X ≤ x) for X ~ χ²(df)
function chiSquareCDF(x, df) {
  if (x <= 0) return 0;
  return regularizedGammaP(df / 2, x / 2);
}

// Chi-square PDF for Newton-Raphson
function chiSquarePDF(x, df) {
  if (x <= 0) return 0;
  const k = df / 2;
  return Math.exp((k - 1) * Math.log(x / 2) - x / 2 - lgamma(k)) / 2;
}

// Initial estimate using Wilson-Hilferty approximation
function chiSquareInitialEstimate(p, df) {
  // Handle extreme probabilities
  if (p < 1e-10) return df * 0.001;
  if (p > 1 - 1e-10) return df * 10;

  // Wilson-Hilferty approximation
  const z = normalQuantile(p);
  const h = 2 / (9 * df);
  let x = df * Math.pow(1 - h + z * Math.sqrt(h), 3);

  // Ensure positive
  return Math.max(x, 0.001);
}

// Standard normal quantile (inverse CDF) using rational approximation
function normalQuantile(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Rational approximation coefficients
  const a = [
    -3.969683028665376e+01,
     2.209460984245205e+02,
    -2.759285104469687e+02,
     1.383577518672690e+02,
    -3.066479806614716e+01,
     2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,
     1.615858368580409e+02,
    -1.556989798598866e+02,
     6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
     4.374664141464968e+00,
     2.938163982698783e+00
  ];
  const d = [
     7.784695709041462e-03,
     3.224671290700398e-01,
     2.445134137142996e+00,
     3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
         ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r + a[1])*r + a[2])*r + a[3])*r + a[4])*r + a[5])*q /
         (((((b[0]*r + b[1])*r + b[2])*r + b[3])*r + b[4])*r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
        ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
  }
}

/**
 * Chi-Square Quantile Function (Inverse CDF)
 * Returns x such that P(X ≤ x) = p for X ~ χ²(df)
 *
 * @param {number} p - Probability (0 < p < 1)
 * @param {number} df - Degrees of freedom (positive integer)
 * @returns {number} - The quantile value
 */
export default function qchisq(p, df) {
  if (p <= 0 || p >= 1) {
    throw new Error("p must be between 0 and 1 (exclusive)");
  }
  if (df <= 0) {
    throw new Error("df must be positive");
  }

  // Initial estimate
  let x = chiSquareInitialEstimate(p, df);

  // Newton-Raphson iteration
  const tol = 1e-10;
  const maxIter = 100;

  for (let i = 0; i < maxIter; i++) {
    const cdf = chiSquareCDF(x, df);
    const pdf = chiSquarePDF(x, df);

    if (pdf < 1e-300) break;

    const dx = (cdf - p) / pdf;
    x = x - dx;

    // Keep x positive
    if (x <= 0) x = tol;

    if (Math.abs(dx) < tol * x) break;
  }

  return x;
}

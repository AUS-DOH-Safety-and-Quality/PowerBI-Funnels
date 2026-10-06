/**
 * Decomposes a floating-point number into its mantissa and exponent, such that:
 * value = mantissa * 2^exponent, with mantissa in the range [0.5, 1) or 0.
 *
 * @param value The floating-point number to decompose.
 * @returns An object containing the mantissa and exponent.
 */
export default function frexp(value: number): {mantissa: number, exponent: number} {
  // C frexp returns zero, infinities and NaN unchanged.
  if (value === 0 || !Number.isFinite(value)) {
    return {mantissa: value, exponent: 0};
  }

  // Float64 format: 1 sign bit | 11 exponent bits | 52 mantissa bits
  const data: DataView<ArrayBuffer> = new DataView(new ArrayBuffer(8));
  data.setFloat64(0, value);
  let bits: number = (data.getUint32(0) >>> 20) & 0x7FF;

  // Subnormals have a zero exponent field; normalise by scaling up 2^64.
  let adjust: number = 0;
  if (bits === 0) {
    data.setFloat64(0, value * Math.pow(2, 64));
    bits = (data.getUint32(0) >>> 20) & 0x7FF;
    adjust = 64;
  }
  const exponent: number = bits - 1022 - adjust;

  // Rewrite the exponent field to 1022 so the mantissa lands in [0.5, 1); dividing by
  // 2^exponent would overflow for exponent 1024.
  data.setUint32(0, (data.getUint32(0) & 0x800FFFFF) | (1022 << 20));
  return {mantissa: data.getFloat64(0), exponent: exponent};
}

/**
 * Decomposes a floating-point number into its mantissa and exponent, such that:
 * value = mantissa * 2^exponent, with mantissa in the range [0.5, 1) or 0.
 *
 * @param value The floating-point number to decompose.
 * @returns An object containing the mantissa and exponent.
 */
export default function frexp(value: number): {mantissa: number, exponent: number} {
  if (value === 0) {
    return {mantissa: 0, exponent: 0};
  }
  const data: DataView<ArrayBuffer> = new DataView(new ArrayBuffer(8));
  data.setFloat64(0, value);
  let bits = (data.getUint32(0) >>> 20) & 0x7FF;
  if (bits === 0) { // subnormal
    data.setFloat64(0, value * Math.pow(2, 64));
    bits = ((data.getUint32(0) >>> 20) & 0x7FF) - 64;
  }
  const exponent: number = bits - 1022;
  const mantissa: number = value / Math.pow(2, exponent);
  return {mantissa: mantissa, exponent: exponent};
}

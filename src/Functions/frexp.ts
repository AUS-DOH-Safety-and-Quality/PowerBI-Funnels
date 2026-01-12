/**
 * Decomposes a floating-point number into its mantissa and exponent, such that:
 * value = mantissa * 2^exponent, with mantissa in the range [0.5, 1) or 0.
 *
 * @param value The floating-point number to decompose.
 * @returns An object containing the mantissa and exponent.
 */
export default function frexp(value: number): {mantissa: number, exponent: number} {
  // Handle zero as a special case
  if (value === 0) {
    return {mantissa: 0, exponent: 0};
  }

  // Use DataView to access the raw IEEE 754 binary representation
  // Float64 format: 1 sign bit | 11 exponent bits | 52 mantissa bits
  const data: DataView<ArrayBuffer> = new DataView(new ArrayBuffer(8));
  data.setFloat64(0, value);

  // Extract the 11-bit exponent field from the high 32 bits
  // Bits 20-30 of the high word contain the exponent (after masking with 0x7FF)
  let bits = (data.getUint32(0) >>> 20) & 0x7FF;

  // Handle subnormal (denormalized) numbers
  // Subnormal numbers have exponent field = 0 and represent values very close to zero
  if (bits === 0) {
    // Scale up by 2^64 to normalize, then adjust exponent back
    data.setFloat64(0, value * Math.pow(2, 64));
    bits = ((data.getUint32(0) >>> 20) & 0x7FF) - 64;
  }

  // Convert biased exponent to actual exponent
  // IEEE 754 uses bias of 1023, but we want mantissa in [0.5, 1), so use 1022
  const exponent: number = bits - 1022;

  // Compute mantissa by dividing out the power of 2
  // Result will be in the range [0.5, 1) for positive numbers
  const mantissa: number = value / Math.pow(2, exponent);

  return {mantissa: mantissa, exponent: exponent};
}
